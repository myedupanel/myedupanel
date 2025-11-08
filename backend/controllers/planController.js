// File: backend/controllers/planController.js (Final Merged Code)

const prisma = require('../config/prisma');

// --- 1. Public Function ---

/**
 * @desc    Public ke liye sirf active plans fetch karna
 * @route   GET /api/plans
 */
exports.getPublicPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true, // Sirf active plans
      },
      orderBy: {
        price: 'asc', // Sabse sasta plan pehle
      },
    });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching public plans:", error);
    res.status(500).json({ message: "Server error fetching plans." });
  }
};


// --- 2. SuperAdmin Functions ---

/**
 * @desc    SuperAdmin ke liye saare plans fetch karna (active aur inactive)
 * @route   GET /api/plans/admin-all
 */
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        createdAt: 'desc', // Sabse naya plan pehle
      },
    });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error fetching all admin plans:", error);
    res.status(500).json({ message: "Server error fetching plans." });
  }
};

/**
 * @desc    Naya plan banana
 * @route   POST /api/plans/admin
 */
exports.createPlanAdmin = async (req, res) => {
  const { id, name, price, description, features, isActive } = req.body;

  try {
    // Check karein ki Plan ID unique hai (jaise "STARTER", "PRO")
    const existingPlan = await prisma.plan.findUnique({
      where: { id: id.toUpperCase() },
    });

    if (existingPlan) {
      return res.status(400).json({ message: 'Plan ID already exists. It must be unique (e.g., "STARTER").' });
    }

    const newPlan = await prisma.plan.create({
      data: {
        id: id.toUpperCase(),
        name,
        price: Number(price),
        description,
        features: features || [], // Frontend se array aana chahiye
        isActive: isActive || false,
        // originalPrice, etc. bhi yahaan add kar sakte hain
      },
    });

    res.status(201).json(newPlan);
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Server error while creating plan." });
  }
};

/**
 * @desc    Ek plan ko update karna
 * @route   PUT /api/plans/admin/:id
 */
exports.updatePlanAdmin = async (req, res) => {
  const { id } = req.params; // Yeh Plan ID hai (jaise "STARTER")
  const { name, price, description, features, isActive } = req.body;

  try {
    const updatedPlan = await prisma.plan.update({
      where: {
        id: id.toUpperCase(),
      },
      data: {
        name,
        price: Number(price),
        description,
        features, // Frontend se poora array bhejein
        isActive,
      },
    });

    res.status(200).json(updatedPlan);
  } catch (error) {
    console.error(`Error updating plan ${id}:`, error);
    // Agar plan maujood nahi hai
    if (error.code === 'P2025') { 
      return res.status(404).json({ message: 'Plan not found.' });
    }
    res.status(500).json({ message: "Server error while updating plan." });
  }
};

/**
 * @desc    Ek plan ko delete karna
 * @route   DELETE /api/plans/admin/:id
 */
exports.deletePlanAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.plan.delete({
      where: {
        id: id.toUpperCase(),
      },
    });

    res.status(200).json({ message: 'Plan deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting plan ${id}:`, error);
     // Agar plan maujood nahi hai
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Plan not found.' });
    }
    // Agar plan kisi school ko assigned hai (foreign key constraint)
    if (error.code === 'P2003') { 
        return res.status(400).json({ message: 'Cannot delete plan. It is still assigned to active schools.' });
    }
    res.status(500).json({ message: "Server error while deleting plan." });
  }
};