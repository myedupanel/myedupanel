// File: backend/controllers/classController.js

const prisma = require('../config/prisma');

// GET Classes (Prisma Version)
exports.getClasses = async (req, res) => {
    try {
        // 1. School ID ko middleware se lein
        const schoolId = req.user.schoolId;

        // 2. Validation (Ab Mongoose ki zaroorat nahi)
        if (!schoolId) {
            return res.status(400).json({ msg: 'Invalid or missing school ID in user token.' });
        }

        // 3. Prisma se data find karein
        // Puraana: Class.find({ schoolId: ... }).select('name id')
        // Naya:
        const items = await prisma.classes.findMany({
            where: {
                schoolId: schoolId // Sirf uss school ki classes
            },
            select: {
                class_name: true, // `name` ke bajaye `class_name`
                classid: true    // `id` ke bajaye `classid`
            },
            orderBy: {
                class_name: 'asc' // Classes ko A-Z sort karein
            }
        });

        // 4. Frontend ko data wapas bhejein
        res.json(items);

    } catch (err) { 
        console.error("Error in getClasses:", err);
        res.status(500).send('Server Error'); 
    }
};

// POST Class (Prisma Version)
exports.addClass = async (req, res) => {
    const { name } = req.body; // Nayi class ka naam
    const schoolId = req.user.schoolId; // School ID

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ msg: 'Class name is required.' });
    }
    if (!schoolId) {
        return res.status(400).json({ msg: 'Invalid or missing school ID. Cannot save class.' });
    }

    const trimmedName = name.trim();

    try {
        // 2. Create and Save New Class
        // Puraana: new Class({ ... }).save()
        // Naya:
        // Humne schema mein `@@unique([schoolId, class_name])` lagaya hai.
        // Iska matlab agar class pehle se hai, toh Prisma khud error dega.
        
        const newClass = await prisma.classes.create({
            data: {
                class_name: trimmedName,
                schoolId: schoolId
            }
        });

        // 3. Send Success Response
        res.status(201).json(newClass); 

    } catch (err) {
        console.error("Error in addClass:", err);
        
        // P2002 code Prisma mein "Unique constraint failed" ka error hota hai
        // Yeh hamare `@@unique` rule ki vajah se aa raha hai
        if (err.code === 'P2002') {
            return res.status(400).json({ msg: `Class '${trimmedName}' already exists for this school.` });
        }
        
        res.status(500).send('Server Error');
    }
};

// Baaki functions (Update/Delete) hum baad mein add kar sakte hain