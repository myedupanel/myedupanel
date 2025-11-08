// File: backend/controllers/classController.js (SUPREME SECURE)

const prisma = require('../config/prisma');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===

// Helper function (No Change)
const getFullName = (student) => {
  if (!student) return ''; 
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
                class_name: 'asc'
            }
        });
        res.json(items);
    } catch (err) { 
        console.error("Error in getClasses:", err);
        res.status(500).send('Server Error'); 
    }
};

// POST Class (UPDATED with Sanitization)
exports.addClass = async (req, res) => {
    const { name } = req.body;
    const schoolId = req.user.schoolId;

    // === FIX 2: Sanitization ===
    const sanitizedName = removeHtmlTags(name);

    if (!sanitizedName || sanitizedName.length === 0) {
        return res.status(400).json({ msg: 'Class name is required.' });
    }
    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid or missing school ID. Cannot save class.' });
    }

    const trimmedName = sanitizedName;

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

// PUT/UPDATE Class (UPDATED with Sanitization)
exports.updateClass = async (req, res) => {
    const { name } = req.body;
    const classIdInt = parseInt(req.params.id);
    const schoolId = req.user.schoolId;

    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
    }
    
    // === FIX 3: Sanitization ===
    const sanitizedName = removeHtmlTags(name);
    const trimmedName = sanitizedName;

    if (!trimmedName) {
        return res.status(400).json({ msg: 'Class name cannot be empty.' });
    }
    // === END FIX 3 ===

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

        // 2. Class ko update karein (updateMany use karke)
        const result = await prisma.classes.updateMany({
            where: {
                classid: classIdInt,  // <-- Primary key
                schoolId: schoolId    // <-- Security check
            },
            data: {
                class_name: trimmedName
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        
        const updatedClass = { classid: classIdInt, class_name: trimmedName, schoolId: schoolId }; 
        res.status(200).json(updatedClass);

    } catch (err) {
        console.error("Error in updateClass:", err);
        if (err.code === 'P2002') { 
             return res.status(400).json({ msg: `A class with the name '${trimmedName}' already exists.` });
        }
        res.status(500).send('Server Error');
    }
};

// DELETE Class (No Change in logic)
exports.deleteClass = async (req, res) => {
    const classIdInt = parseInt(req.params.id);
    const schoolId = req.user.schoolId;

    if (isNaN(classIdInt)) {
        return res.status(400).json({ msg: 'Invalid Class ID.' });
    }

    try {
        // 1. Check Students 
        const studentInClass = await prisma.students.findFirst({
            where: {
                classid: classIdInt, 
                schoolId: schoolId
            }
        });

        if (studentInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Students are still assigned to this class ID.' });
        }

        // 2. Check FeeRecords 
        const feeRecordInClass = await prisma.feeRecord.findFirst({
            where: {
                classId: classIdInt, 
                schoolId: schoolId
            }
        });

        if (feeRecordInClass) {
            return res.status(400).json({ msg: 'Cannot delete class. Fee records are linked to this class ID.' });
        }

        // 3. Delete karein 
        const result = await prisma.classes.deleteMany({
            where: {
                classid: classIdInt,
                schoolId: schoolId
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ msg: 'Class not found or access denied (deleteMany).' });
        }

        res.status(200).json({ msg: 'Class deleted successfully.' });

    } catch (err) {
        console.error("Error in deleteClass:", err);
        if (err.code === 'P2025') {
            return res.status(404).json({ msg: 'Class not found or access denied.' });
        }
        res.status(500).send('Server Error');
    }
};

// --- 7. Exports ---
module.exports = {
  getClasses,
  addClass,
  updateClass,
  deleteClass
};