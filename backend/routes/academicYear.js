// File: backend/routes/academicYear.js (FIXED)

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma'); // Aapka Prisma client
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/school/academic-year
 * @desc    School ke saare academic years fetch karna
 * @access  Private (Admin)
 */
router.get('/academic-year', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ msg: 'School information missing.' });
    }

    // Database se saare saal fetch karein, sabse naya upar
    // --- FIX: academicYear -> AcademicYear ---
    const academicYears = await prisma.AcademicYear.findMany({ // <--- FIXED LINE 21
      where: {
        schoolId: schoolId,
      },
      orderBy: {
        createdAt: 'desc', // Ya 'startDate' bhi use kar sakte hain
      },
    });

    res.json(academicYears);

  } catch (error) {
    console.error("[ACADEMIC_YEAR_GET]", error);
    res.status(500).send('Server Error');
  }
});


/**
 * @route   POST /api/school/academic-year
 * @desc    Ek naya academic saal create karna (cloning ke saath)
 * @access  Private (Admin)
 */
router.post('/academic-year', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ msg: 'School information missing.' });
    }

    const { name, startDate, endDate, templateYearId } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ msg: 'Name, Start Date, aur End Date zaroori hain' });
    }

    // --- Saara logic ek Transaction ke andar chalega ---
    const newAcademicYear = await prisma.$transaction(async (tx) => {
      
      // --- AAPKA BUSINESS RULE 1: 300-Din ka Limit ---
      // --- FIX: academicYear -> AcademicYear ---
      const latestYear = await tx.AcademicYear.findFirst({ // <--- FIXED LINE 49
        where: { schoolId: schoolId },
        orderBy: { createdAt: 'desc' }, 
      });

      if (latestYear) {
        const today = new Date();
        const latestYearDate = new Date(latestYear.createdAt);
        const diffTime = Math.abs(today.getTime() - latestYearDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 300) { 
          // Transaction se bahar nikalne ke liye 'throw' ka istemaal karte hain
          throw new Error(`300_DAY_LIMIT:Pichla saal ${diffDays} din pehle hi add kiya gaya tha.`);
        }
      }

      console.log("300-din ka check paas ho gaya.");

      // Naya saal banane se pehle, baaki saare saal ko 'isCurrent = false' set karein
      // --- FIX: academicYear -> AcademicYear ---
      await tx.AcademicYear.updateMany({ // <--- FIXED LINE 64
          where: { schoolId: schoolId },
          data: { isCurrent: false },
      });

      // Ab naya saal banayein
      // --- FIX: academicYear -> AcademicYear ---
      const year = await tx.AcademicYear.create({ // <--- FIXED LINE 71
        data: {
          name: name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: true, 
          school: { connect: { id: schoolId } },
        },
      });
      
      console.log("Naya academic saal ban gaya:", year.id);

      // --- AAPKA BUSINESS RULE 2: Template se Data Clone Karna (No changes needed here as only cloning logic is inside) ---
      if (templateYearId) {
        console.log(`Cloning shuru karni hai... template se: ${templateYearId}`);

        // 1. Classes ko Clone karna
        const oldClasses = await tx.classes.findMany({
          where: { academicYearId: templateYearId, schoolId: schoolId }
        });

        if (oldClasses.length > 0) {
          const classesToCreate = oldClasses.map(c => ({
            class_name: c.class_name,
            schoolId: schoolId,
            academicYearId: year.id 
          }));
          await tx.classes.createMany({ data: classesToCreate });
          console.log(`${classesToCreate.length} classes clone ho gayin.`);
        }

        // 2. Fee Templates ko Clone karna
        const oldFeeTemplates = await tx.feeTemplate.findMany({
          where: { academicYearId: templateYearId, schoolId: schoolId }
        });

        if (oldFeeTemplates.length > 0) {
          const templatesToCreate = oldFeeTemplates.map(t => ({
            name: t.name,
            description: t.description,
            items: t.items, 
            totalAmount: t.totalAmount,
            schoolId: schoolId,
            academicYearId: year.id 
          }));
          await tx.feeTemplate.createMany({ data: templatesToCreate });
          console.log(`${templatesToCreate.length} fee templates clone ho gaye.`);
        }
      }
      
      return year;
    });

    res.status(201).json(newAcademicYear); // 201 Created

  } catch (error) {
    console.error("[ACADEMIC_YEAR_POST]", error);
    if (error.message && error.message.startsWith("300_DAY_LIMIT:")) {
      const userMessage = error.message.split(":")[1]; 
      return res.status(403).json({ msg: userMessage }); // 403 Forbidden
    }
    // Check for unique constraint error (P2002) for schoolId_name
     if (error.code === 'P2002') {
         return res.status(400).json({ msg: 'A year with this name already exists for this school.' });
     }
    res.status(500).send('Server Error');
  }
});

module.exports = router;