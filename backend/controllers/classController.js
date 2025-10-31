// backend/controllers/classController.js

const prisma = require('../config/prisma');

// Helper function (Aapke code se)
const getFullName = (student) => {
  if (!student) return ''; // Safety check
  return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}

// GET Classes (No Change)
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
                // TODO: Is order ko numeric/custom banana hoga (e.g., Nursery, LKG, 1, 2... 12)
                class_name: 'asc'
            }
        });
        res.json(items);
    } catch (err) { 
        console.error("Error in getClasses:", err);
        res.status(500).send('Server Error'); 
    }
};

// POST Class (No Change)
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

// --- FIX: updateClass function ko update kiya ---
exports.updateClass = async (req, res) => {
    const { name } = req.body;
    const classIdInt = parseInt(req.params.id);
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
        // 1. Check karein ki naya naam pehle se toh nahi hai
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

        // 2. Class ko update karne ke liye updateMany use karein
        // Yeh check karega ki class ID aur school ID dono match ho
        const result = await prisma.classes.updateMany({
            where: {
                classid: classIdInt,  // <-- Primary key
                schoolId: schoolId    // <-- Security check
            },
            data: {
                class_name: trimmedName
            }
        });

        // 3. Check karein ki update hua ya nahi
        if (result.count === 0) {
            // Ya toh class mili nahi, ya woh is school ki nahi thi
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        
        // 4. Updated data ko wapas bhejein
        // updateMany poora object return nahi karta, isliye hum naya object bhej rahe hain
        const updatedClass = { classid: classIdInt, class_name: trimmedName, schoolId: schoolId }; 
        res.status(200).json(updatedClass);

    } catch (err) {
        console.error("Error in updateClass:", err);
        if (err.code === 'P2002') { // Unique constraint (just in case)
             return res.status(400).json({ msg: `A class with the name '${trimmedName}' already exists.` });
        }
        res.status(500).send('Server Error');
    }
};
// --- END FIX ---

// --- FIX: deleteClass function ko update kiya ---
exports.deleteClass = async (req, res) => {
    const classIdInt = parseInt(req.params.id);
    const schoolId = req.user.schoolId;

    // Validation
    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
    }

    try {
        // --- Pehle checks (Same as before) ---
        // 1. Check karein ki class ka naam kisi student ko assigned toh nahi hai
        const classInfo = await prisma.classes.findUnique({
            where: { 
                classid: classIdInt, 
                schoolId: schoolId 
            },
            select: { class_name: true }
        });

        if (!classInfo) {
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }

        // 2. Check Students (using class name string)
        const studentInClass = await prisma.students.findFirst({
            where: {
                class: classInfo.class_name,
                schoolId: schoolId
            }
        });

        if (studentInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Students are still assigned to this class name.' });
        }

        // 3. Check FeeRecords (using class ID)
        const feeRecordInClass = await prisma.feeRecord.findFirst({
            where: {
                classId: classIdInt,
                schoolId: schoolId
            }
        });

        if (feeRecordInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Fee records are linked to this class ID.' });
        }
        // --- End Checks ---

        // --- Delete karne ke liye deleteMany use karein ---
        const result = await prisma.classes.deleteMany({
            where: {
                classid: classIdInt,  // <-- Primary key
                schoolId: schoolId    // <-- Security check
            }
        });

        // Check karein ki delete hua ya nahi
        if (result.count === 0) {
            // Yeh nahi hona chahiye kyunki humne upar check kiya tha, but safety first
            return res.status(404).json({ msg: 'Class not found or access denied (deleteMany).' });
        }

        res.status(200).json({ msg: 'Class deleted successfully.' });

    } catch (err) {
        console.error("Error in deleteClass:", err);
        // P2025: Record not found (agar 'findUnique' ke baad 'deleteMany' fail ho)
        if (err.code === 'P2025') {
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        res.status(500).send('Server Error');
    }
};
// --- END FIX ---