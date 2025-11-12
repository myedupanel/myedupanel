// backend/services/AcademicYearService.js
const prisma = require('../config/prisma');

/**
 * Create a new Academic Year
 */
async function createAcademicYear({ yearName, startDate, endDate, schoolId, isCurrent = false }) {
  return prisma.$transaction(async (tx) => {
    // If this year is being set as current, deactivate all other current years
    if (isCurrent) {
      await tx.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    // Create the new year
    const newYear = await tx.academicYear.create({
      data: {
        yearName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent,
        schoolId,
      },
    });
    
    return newYear;
  });
}

/**
 * Get all academic years for a school
 */
async function getAllAcademicYears(schoolId) {
  const years = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          feeRecords: true,
          transactions: true,
          attendances: true,
        }
      }
    }
  });
  
  // If no years exist, create a default one
  if (years.length === 0) {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const defaultYearName = `${currentYear}-${nextYear}`;
    const startDate = new Date(currentYear, 5, 1); // June 1st
    const endDate = new Date(nextYear, 4, 31); // May 31st next year
    
    const defaultYear = await createAcademicYear({
      yearName: defaultYearName,
      startDate: startDate,
      endDate: endDate,
      schoolId: schoolId,
      isCurrent: true
    });
    
    return [defaultYear];
  }
  
  return years;
}

/**
 * Get a single academic year by ID
 */
async function getAcademicYearById(yearId, schoolId) {
  return prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          feeRecords: true,
          transactions: true,
        }
      }
    }
  });
}

/**
 * Get the current active year for a school
 */
async function getCurrentAcademicYear(schoolId) {
  let currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
  });
  
  // If no current year exists, get all years (which will create a default one if needed)
  if (!currentYear) {
    const years = await getAllAcademicYears(schoolId);
    currentYear = years.find(y => y.isCurrent) || years[0];
  }
  
  return currentYear;
}

/**
 * Set a specific year as current (active)
 */
async function setActiveYear(schoolId, academicYearId) {
  // Verify the year belongs to the school
  const yearToActivate = await prisma.academicYear.findFirst({
    where: { schoolId, id: academicYearId },
  });

  if (!yearToActivate) {
    throw new Error('Academic year not found or does not belong to this school.');
  }

  return prisma.$transaction(async (tx) => {
    // Deactivate all current years
    await tx.academicYear.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });

    // Activate the selected year
    const activatedYear = await tx.academicYear.update({
      where: { id: academicYearId },
      data: { isCurrent: true },
    });
    
    return activatedYear;
  });
}

/**
 * Update an academic year
 */
async function updateAcademicYear(yearId, schoolId, updateData) {
  // Verify the year belongs to the school
  const existingYear = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
  });

  if (!existingYear) {
    throw new Error('Academic year not found or access denied.');
  }

  return prisma.$transaction(async (tx) => {
    // If setting as current, deactivate others
    if (updateData.isCurrent === true) {
      await tx.academicYear.updateMany({
        where: { schoolId, isCurrent: true, id: { not: yearId } },
        data: { isCurrent: false },
      });
    }

    // Update the year
    return tx.academicYear.update({
      where: { id: yearId },
      data: {
        ...(updateData.yearName && { yearName: updateData.yearName }),
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
        ...(updateData.isCurrent !== undefined && { isCurrent: updateData.isCurrent }),
      },
    });
  });
}

/**
 * Delete an academic year (with safety checks)
 */
async function deleteAcademicYear(yearId, schoolId) {
  const year = await prisma.academicYear.findFirst({
    where: { id: yearId, schoolId },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          feeRecords: true,
        }
      }
    }
  });

  if (!year) {
    throw new Error('Academic year not found.');
  }

  // Don't allow deleting current year
  if (year.isCurrent) {
    throw new Error('Cannot delete the current active year. Please switch to another year first.');
  }

  // Warning if year has data
  const hasData = year._count.students > 0 || year._count.teachers > 0 || year._count.feeRecords > 0;
  if (hasData) {
    throw new Error(`This year has ${year._count.students} students, ${year._count.teachers} teachers, and ${year._count.feeRecords} fee records. Data will be lost.`);
  }

  return prisma.academicYear.delete({
    where: { id: yearId },
  });
}

/**
 * Clone data from one year to another (for year rollover)
 */
async function cloneYearData(sourceYearId, targetYearId, schoolId, options = {}) {
  const { cloneStudents = false, cloneTeachers = false, cloneFeeTemplates = false } = options;

  return prisma.$transaction(async (tx) => {
    const result = { students: 0, teachers: 0, templates: 0 };

    // Clone students
    if (cloneStudents) {
      const sourceStudents = await tx.students.findMany({
        where: { academicYearId: sourceYearId, schoolId },
      });

      for (const student of sourceStudents) {
        await tx.students.create({
          data: {
            ...student,
            studentid: undefined, // Let auto-increment handle it
            academicYearId: targetYearId,
          },
        });
        result.students++;
      }
    }

    // Clone teachers
    if (cloneTeachers) {
      const sourceTeachers = await tx.teachers.findMany({
        where: { academicYearId: sourceYearId, schoolId },
      });

      for (const teacher of sourceTeachers) {
        await tx.teachers.create({
          data: {
            ...teacher,
            teacher_dbid: undefined,
            academicYearId: targetYearId,
          },
        });
        result.teachers++;
      }
    }

    return result;
  });
}

module.exports = {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  getCurrentAcademicYear,
  setActiveYear,
  updateAcademicYear,
  deleteAcademicYear,
  cloneYearData,
};