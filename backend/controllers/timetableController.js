// backend/controllers/timetableController.js
const prisma = require('../config/prisma');

// Helper: Day name को index से map करने के लिए (Sorting के लिए)
const dayIndexMap = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, 
    "Friday": 5, "Saturday": 6, "Sunday": 7 
};


// --- 1. GET /api/timetable/settings ---
const getSettings = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;

        // 1. Time Slots और Working Days fetch करें
        const timeSlots = await prisma.timeSlot.findMany({
            where: { schoolId },
            orderBy: { startTime: 'asc' }, // startTime के अनुसार क्रमबद्ध (sorted)
        });
        
        const workingDays = await prisma.workingDay.findMany({
            where: { schoolId },
            orderBy: { dayIndex: 'asc' }, // dayIndex के अनुसार क्रमबद्ध (sorted)
        });

        // 2. Classes और Teachers fetch करें (Dropdowns के लिए)
        // Note: Classes model का नाम 'Classes' है (plural)
        const classes = await prisma.classes.findMany({ 
            where: { schoolId },
            select: { class_name: true } 
        });
        
        const teachers = await prisma.user.findMany({ 
            where: { schoolId, role: 'Teacher' },
            select: { name: true } 
        });

        const classOptions = classes.map(c => c.class_name); // class_name का उपयोग
        const teacherOptions = teachers.map(t => t.name);

        const settingsData = {
            timeSlots,
            // WorkingDay objects भेजें (या केवल नाम)
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


// --- 2. GET /api/timetable/assignments ---
const getAssignments = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        
        const rawAssignments = await prisma.timetableAssignment.findMany({
            where: { schoolId },
            include: {
                class: { select: { class_name: true } }, // class_name का उपयोग
                teacher: { select: { name: true } },
                timeSlot: { select: { name: true } },
            },
        });
        
        const assignments = rawAssignments.map(a => ({
            id: a.id,
            day: a.day,
            timeSlotName: a.timeSlot.name, 
            className: a.class.class_name, // class_name का उपयोग
            teacherName: a.teacher.name,
            subject: a.subject,
        }));
        
        res.status(200).json(assignments);

    } catch (error) {
        console.error("Error fetching period assignments:", error);
        res.status(500).send("Server Error fetching assignments");
    }
};


// --- 3. POST /api/timetable/assign ---
const assignPeriod = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const { day, slotName, className, teacherName, subject } = req.body;

        if (!day || !slotName || !className || !teacherName || !subject) {
            return res.status(400).json({ message: 'Assignment के लिए आवश्यक फ़ील्ड (fields) गायब हैं।' });
        }
        
        // 1. आवश्यक IDs को उनके नाम से ढूँढना
        // Note: Classes model का नाम 'Classes' है और ID 'classid' है
        const classData = await prisma.classes.findFirst({ where: { schoolId, class_name: className } });
        const teacherData = await prisma.user.findFirst({ where: { schoolId, name: teacherName, role: 'Teacher' } });
        const timeSlotData = await prisma.timeSlot.findFirst({ where: { schoolId, name: slotName } });

        if (!classData || !teacherData || !timeSlotData) {
            return res.status(404).json({ message: 'Class, Teacher, या Time Slot नहीं मिला।' });
        }
        
        const classId = classData.classid; // 'classid' का उपयोग
        const teacherId = teacherData.id;
        const timeSlotId = timeSlotData.id;

        // Assignment की uniqueness को define करने वाली keys
        const uniqueKeys = {
            day_classId_timeSlotId: { // यह unique constraint का नाम है जो हमने schema में दिया
                day: day,
                classId: classId,
                timeSlotId: timeSlotId,
            }
        };

        // 2. Assignment को database में save/update (UPSERT) करना
        const newAssignment = await prisma.timetableAssignment.upsert({
            where: uniqueKeys,
            update: { 
                teacherId: teacherId, 
                subject: subject 
            },
            create: {
                day: day,
                subject: subject,
                schoolId: schoolId,
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
         // P2002 code teacher conflict या class conflict को दर्शाता है
        if (error.code === 'P2002') { 
            return res.status(409).json({ message: 'Conflict: इस slot पर पहले से ही एक period assigned है, या teacher उस समय कहीं और व्यस्त है।' });
        }
        res.status(500).send(`Server Error assigning period: ${error.message}`);
    }
};

// --- 4. Time Slot Create/Update (POST/PUT /settings/slot) ---
const createOrUpdateSlot = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const slotIdInt = parseInt(req.params.id); // For PUT (update)
        const { name, startTime, endTime, isBreak } = req.body;

        if (!name || !startTime || !endTime) {
            return res.status(400).json({ message: 'Period Name, Start Time, and End Time आवश्यक हैं।' });
        }

        const data = {
            name: name.trim(),
            startTime,
            endTime,
            isBreak: !!isBreak, 
            schoolId,
        };

        let result;
        
        if (slotIdInt) {
            // Update
            result = await prisma.timeSlot.update({
                where: { id: slotIdInt, schoolId },
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


// --- 5. Time Slot Delete (DELETE /settings/slot/:id) ---
const deleteSlot = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const slotIdInt = parseInt(req.params.id);

        if (isNaN(slotIdInt)) {
            return res.status(400).json({ message: 'Invalid Time Slot ID.' });
        }
        
        // This delete will cascade to TimetableAssignment table (assuming schema is set)
        await prisma.timeSlot.delete({
            where: { id: slotIdInt, schoolId },
        });

        res.status(200).json({ message: 'Time Slot and related assignments deleted successfully.' });
    } catch (error) {
        console.error("Error deleting time slot:", error);
         if (error.code === 'P2025') {
             return res.status(404).json({ message: 'Time Slot not found or access denied.' });
        }
        // P2003 Foreign Key Constraint on non-cascading relations can also happen here
        if (error.code === 'P2003') {
             return res.status(409).json({ message: 'Cannot delete time slot. It is currently in use in the Timetable.' });
        }
        res.status(500).send("Server Error deleting time slot");
    }
};

// --- 6. Working Days Update (POST /settings/days) ---
const updateWorkingDays = async (req, res) => {
    // Helper to map day name to its index (for sorting)
    const dayIndexMap = {
        "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, 
        "Friday": 5, "Saturday": 6, "Sunday": 7 
    };

    try {
        const schoolId = req.user.schoolId;
        const { workingDays: newDays } = req.body; // newDays is array of strings e.g., ["Monday", "Friday"]

        if (!Array.isArray(newDays)) {
            return res.status(400).json({ message: 'Invalid input. Expected an array of working day names.' });
        }
        
        // Prisma Transaction: Delete old, create new
        await prisma.$transaction([
            // 1. Delete all existing records for the school
            prisma.workingDay.deleteMany({
                where: { schoolId },
            }),
            
            // 2. Create new records for selected days
            ...newDays.map(dayName => {
                const dayIndex = dayIndexMap[dayName] || 0;
                return prisma.workingDay.create({
                    data: {
                        name: dayName,
                        dayIndex: dayIndex,
                        schoolId: schoolId,
                    },
                });
            }),
        ]);

        res.status(200).json({ message: 'Working days updated successfully!', workingDays: newDays });
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