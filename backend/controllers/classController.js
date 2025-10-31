// backend/controllers/classController.js

const prisma = require('../config/prisma');

// Helper function (Aapke code se)
const getFullName = (student) => {
  if (!student) return ''; // Safety check
  return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}

// GET Classes (Aapka existing function, no change)
exports.getClasses = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID in user token.' });
        }
        const items = await prisma.classes.findMany({
            where: {
                schoolId: schoolId
            },
            select: {
                class_name: true,
                classid: true
            },
            orderBy: {
                // class_name ko 'Nursery', 'LKG', 'UKG', '1', '2' ... '12' order mein sort karna tricky ho sakta hai
                // Abhi ke liye alphabetical sort rakhte hain
                class_name: 'asc'
            }
        });
        res.json(items);
    } catch (err) { 
        console.error("Error in getClasses:", err);
        res.status(500).send('Server Error'); 
    }
};

// POST Class (Aapka existing function, no change)
exports.addClass = async (req, res) => {
    const { name } = req.body;
    const schoolId = req.user.schoolId;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ msg: 'Class name is required.' });
    }
    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid or missing school ID. Cannot save class.' });
    }

    const trimmedName = name.trim();

    try {
        const newClass = await prisma.classes.create({
            data: {
                class_name: trimmedName,
                schoolId: schoolId
            }
        });
        res.status(201).json(newClass); 
    } catch (err) {
        console.error("Error in addClass:", err);
        if (err.code === 'P2002') { // Unique constraint failed
            return res.status(400).json({ msg: `Class '${trimmedName}' already exists for this school.` });
        }
        res.status(500).send('Server Error');
    }
};

// --- YEH NAYA FUNCTION ADD KIYA GAYA HAI (UPDATE/EDIT) ---
exports.updateClass = async (req, res) => {
    const { name } = req.body; // Naya naam
    const classIdInt = parseInt(req.params.id); // Class ki ID (URL se)
    const schoolId = req.user.schoolId;

    // Validation
    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
    }
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) {
        return res.status(400).json({ msg: 'Class name cannot be empty.' });
    }

    try {
        // Check karein ki naya naam pehle se toh nahi hai
        const existingClass = await prisma.classes.findFirst({
            where: {
                class_name: trimmedName,
                schoolId: schoolId,
                NOT: {
                    classid: classIdInt // Is class ke alawa
                }
            }
        });

        if (existingClass) {
            return res.status(400).json({ msg: `A class with the name '${trimmedName}' already exists.` });
        }

        // Class ko update karein
        const updatedClass = await prisma.classes.update({
            where: {
                classid_schoolId: { // Prisma schema ke @unique(classid, schoolId) ke hisaab se
                    classid: classIdInt,
                    schoolId: schoolId
                }
            },
            data: {
                class_name: trimmedName
            }
        });

        res.status(200).json(updatedClass);

    } catch (err) {
        console.error("Error in updateClass:", err);
        if (err.code === 'P2025') { // Record to update not found
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        if (err.code === 'P2002') { // Unique constraint (just in case)
             return res.status(400).json({ msg: `A class with the name '${trimmedName}' already exists.` });
        }
        res.status(500).send('Server Error');
    }
};

// --- YEH NAYA FUNCTION ADD KIYA GAYA HAI (DELETE) ---
exports.deleteClass = async (req, res) => {
    const classIdInt = parseInt(req.params.id); // Class ki ID (URL se)
    const schoolId = req.user.schoolId;

    // Validation
    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
    }

    try {
        // --- IMPORTANT: Delete karne se pehle check karein ---

        // 1. Check karein ki class ka naam kisi student ko assigned toh nahi hai
        // (Kyunki Student model 'class' ko string ki tarah save karta hai)
        const classInfo = await prisma.classes.findUnique({
            where: { classid: classIdInt, schoolId: schoolId },
            select: { class_name: true }
        });

        if (!classInfo) {
            return res.status(404).json({ msg: 'Class not found.' });
        }

        const studentInClass = await prisma.students.findFirst({
            where: {
                class: classInfo.class_name, // String name se check
                schoolId: schoolId
            }
        });

        if (studentInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Students are still assigned to this class name.' });
        }

        // 2. Check karein ki classId kisi FeeRecord se linked toh nahi hai
        const feeRecordInClass = await prisma.feeRecord.findFirst({
            where: {
                classId: classIdInt, // ID se check
                schoolId: schoolId
            }
        });

        if (feeRecordInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Fee records are linked to this class ID.' });
        }

        // --- Sab check ho gaya, ab delete karein ---
        await prisma.classes.delete({
            where: {
                classid_schoolId: { // Prisma schema ke @unique(classid, schoolId) ke hisaab se
                    classid: classIdInt,
                    schoolId: schoolId
                }
            }
        });

        res.status(200).json({ msg: 'Class deleted successfully.' });

    } catch (err) {
        console.error("Error in deleteClass:", err);
        if (err.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        res.status(500).send('Server Error');
    }
};