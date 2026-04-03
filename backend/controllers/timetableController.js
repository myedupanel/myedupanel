// File: backend/controllers/timetableController.js (SUPREME SECURE)
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

// Helper: Day name को index से map करने के लिए (Sorting के लिए)
const dayIndexMap = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, 
    "Friday": 5, "Saturday": 6, "Sunday": 7 
};

// Helper function student का नाम जोड़ने के लिए (No Change)
const getFullName = (student) => {
  if (!student) return ''; 
  return [student.first_name, student.father_name, student.last_name].filter(Boolean).join(' ');
}


// --- 1. GET /api/timetable/settings (UPDATED to filter by academic year) ---
const getSettings = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID in user token.' });
        }
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId, academicYearId },
            orderBy: { startTime: 'asc' }, 
        });
        const workingDays = await prisma.workingDay.findMany({
            where: { schoolId, academicYearId },
            orderBy: { dayIndex: 'asc' }, 
        });
        const classes = await prisma.classes.findMany({ 
            where: { schoolId },
            select: { class_name: true } 
        });
        const teachers = await prisma.user.findMany({ 
            where: { schoolId, role: 'Teacher' },
            select: { name: true } 
        });

        const classOptions = classes.map(c => c.class_name);
        const teacherOptions = teachers.map(t => t.name);

        const settingsData = {
            timeSlots,
            workingDays: workingDays, 
            classOptions,
            teacherOptions
        };
        
        res.status(200).json(settingsData);
        
    } catch (error) {
        console.error("Error fetching timetable settings:", error);
        res.status(500).send("Server Error fetching settings");
    }
};


// --- 2. GET /api/timetable/assignments (UPDATED to filter by academic year) ---
const getAssignments = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        
        const rawAssignments = await prisma.timetableAssignment.findMany({
            where: { schoolId, academicYearId },
            include: {
                class: { select: { class_name: true } },
                teacher: { select: { name: true } },
                timeSlot: { select: { name: true } },
            },
        });
        
        const assignments = rawAssignments.map(a => ({
            id: a.id,
            day: a.day,
            timeSlotName: a.timeSlot.name, 
            className: a.class.class_name, 
            teacherName: a.teacher.name,
            subject: a.subject,
        }));
        
        res.status(200).json(assignments);

    } catch (error) {
        console.error("Error fetching period assignments:", error);
        res.status(500).send("Server Error fetching assignments");
    }
};


// --- 3. POST /api/timetable/assign (UPDATED with Sanitization and academic year) ---
const assignPeriod = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        
        // === FIX 2: Sabhi inputs ko Sanitize karein ===
        const { day, slotName, className, teacherName, subject } = req.body;

        const sanitizedDay = removeHtmlTags(day);
        const sanitizedSlotName = removeHtmlTags(slotName);
        const sanitizedClassName = removeHtmlTags(className);
        const sanitizedTeacherName = removeHtmlTags(teacherName);
        const sanitizedSubject = removeHtmlTags(subject);
        // === END FIX 2 ===

        if (!sanitizedDay || !sanitizedSlotName || !sanitizedClassName || !sanitizedTeacherName || !sanitizedSubject) {
            return res.status(400).json({ message: 'Assignment के लिए आवश्यक फ़ील्ड (fields) गायब हैं।' });
        }
        
        // 1. आवश्यक IDs को उनके नाम से ढूँढना
        const classData = await prisma.classes.findFirst({ where: { schoolId, class_name: sanitizedClassName } });
        const teacherData = await prisma.user.findFirst({ where: { schoolId, name: sanitizedTeacherName, role: 'Teacher' } });
        const timeSlotData = await prisma.timeSlot.findFirst({ where: { schoolId, name: sanitizedSlotName, academicYearId } });

        if (!classData || !teacherData || !timeSlotData) {
            return res.status(404).json({ message: 'Class, Teacher, या Time Slot नहीं मिला।' });
        }
        
        const classId = classData.classid;
        const teacherId = teacherData.id;
        const timeSlotId = timeSlotData.id;

        // Assignment की uniqueness को define करने वाली keys
        const uniqueKeys = {
            day_classId_timeSlotId: { 
                day: sanitizedDay,
                classId: classId,
                timeSlotId: timeSlotId,
            }
        };

        // 2. Assignment को database में save/update (UPSERT) करना
        const newAssignment = await prisma.timetableAssignment.upsert({
            where: uniqueKeys,
            update: { 
                teacherId: teacherId, 
                subject: sanitizedSubject // Sanitized subject
            },
            create: {
                day: sanitizedDay, // Sanitized day
                subject: sanitizedSubject, // Sanitized subject
                schoolId: schoolId,
                academicYearId: academicYearId, // NAYA: Academic year ID
                classId: classId,
                teacherId: teacherId,
                timeSlotId: timeSlotId,
            },
        });
        
        res.status(201).json({ 
            message: `Period ${newAssignment.id ? 'updated' : 'assigned'} successfully.`, 
            assignment: newAssignment 
        });

    } catch (error) {
        console.error("Error assigning period:", error);
        if (error.code === 'P2002') { 
            return res.status(409).json({ message: 'Conflict: इस slot पर पहले से ही एक period assigned है, या teacher उस समय कहीं और व्यस्त है।' });
        }
        res.status(500).send(`Server Error assigning period: ${error.message}`);
    }
};

// --- 4. Time Slot Create/Update (POST/PUT /settings/slot) (UPDATED with Sanitization and academic year) ---
const createOrUpdateSlot = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        const slotIdInt = parseInt(req.params.id); // For PUT (update)
        const { name, startTime, endTime, isBreak } = req.body;

        // === FIX 3: Name को Sanitize करें ===
        const sanitizedName = removeHtmlTags(name);
        
        if (!sanitizedName || !startTime || !endTime) {
            return res.status(400).json({ message: 'Period Name, Start Time, and End Time आवश्यक हैं।' });
        }

        const data = {
            name: sanitizedName, // Sanitized name
            startTime,
            endTime,
            isBreak: !!isBreak, 
            schoolId,
            academicYearId, // NAYA: Academic year ID
        };

        let result;
        
        if (slotIdInt) {
            // Update
            result = await prisma.timeSlot.update({
                where: { id: slotIdInt, schoolId, academicYearId },
                data: data,
            });
            res.status(200).json({ message: 'Time Slot updated successfully!', slot: result });
        } else {
            // Create
            result = await prisma.timeSlot.create({ data });
            res.status(201).json({ message: 'Time Slot added successfully!', slot: result });
        }
    } catch (error) {
        console.error("Error creating/updating time slot:", error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'A time slot with this name already exists.' });
        }
        if (error.code === 'P2025') {
             return res.status(404).json({ message: 'Time Slot not found or access denied.' });
        }
        res.status(500).send("Server Error saving time slot");
    }
};


// --- 5. Time Slot Delete (UPDATED to filter by academic year) ---
const deleteSlot = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        const slotIdInt = parseInt(req.params.id);

        if (isNaN(slotIdInt)) {
            return res.status(400).json({ message: 'Invalid Time Slot ID.' });
        }
        
        await prisma.timeSlot.delete({
            where: { id: slotIdInt, schoolId, academicYearId },
        });

        res.status(200).json({ message: 'Time Slot and related assignments deleted successfully.' });
    } catch (error) {
        console.error("Error deleting time slot:", error);
         if (error.code === 'P2025') {
             return res.status(404).json({ message: 'Time Slot not found or access denied.' });
        }
        if (error.code === 'P2003') {
             return res.status(409).json({ message: 'Cannot delete time slot. It is currently in use in the Timetable.' });
        }
        res.status(500).send("Server Error deleting time slot");
    }
};

// --- 6. Working Days Update (POST /settings/days) (UPDATED with Sanitization and academic year) ---
const updateWorkingDays = async (req, res) => {
    const dayIndexMap = {
        "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, 
        "Friday": 5, "Saturday": 6, "Sunday": 7 
    };

    try {
        const schoolId = req.user.schoolId;
        const academicYearId = req.academicYearId;
        const { workingDays: newDays } = req.body; 

        if (!Array.isArray(newDays)) {
            return res.status(400).json({ message: 'Invalid input. Expected an array of working day names.' });
        }
        
        // === FIX 4: Array के अंदर के strings को Sanitize करें ===
        const sanitizedDays = newDays.map(day => removeHtmlTags(day));

        // Prisma Transaction: Delete old, create new
        await prisma.$transaction([
            // 1. Delete all existing records for the school and academic year
            prisma.workingDay.deleteMany({
                where: { schoolId, academicYearId },
            }),
            
            // 2. Create new records for selected days
            ...sanitizedDays.map(dayName => { // Sanitized array का उपयोग
                const dayIndex = dayIndexMap[dayName] || 0;
                return prisma.workingDay.create({
                    data: {
                        name: dayName,
                        dayIndex: dayIndex,
                        schoolId: schoolId,
                        academicYearId: academicYearId, // NAYA: Academic year ID
                    },
                });
            }),
        ]);

        res.status(200).json({ message: 'Working days updated successfully!', workingDays: sanitizedDays });
    } catch (error) {
        console.error("Error updating working days:", error);
        res.status(500).send("Server Error updating working days");
    }
};

module.exports = {
    getSettings,
    getAssignments,
    assignPeriod,
    createOrUpdateSlot,
    deleteSlot,
    updateWorkingDays,
};