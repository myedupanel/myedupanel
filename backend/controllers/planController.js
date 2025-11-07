// File: backend/controllers/planController.js
const prisma = require('../config/prisma');

// @desc    Sabhi active plans ko fetch karein (Public)
exports.getPublicPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' } // Saste se mehenga
    });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Server error while fetching plans." });
  }
};

// Yahaan hum baad mein (SuperAdmin ke liye) create/update/delete functions add kar sakte hain