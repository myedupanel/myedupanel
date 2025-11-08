// File: backend/controllers/couponController.js (Poora updated code)

const prisma = require('../config/prisma');

// === 1. Naya Coupon Banane ka Function (Thoda update kiya) ===
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body; // isActive add kiya

    // Basic Validation
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, Discount Type, and Value are required.' });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'This coupon code already exists.' });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType,
        discountValue: parseFloat(discountValue),
        isActive: isActive || false, // Form se value lein
        timesUsed: 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
      }
    });

    res.status(201).json({ message: 'Coupon created successfully!', coupon: newCoupon });

  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error while creating coupon." });
  }
};

// === 2. Saare Coupons Dekhne ka Function (Ab 'createdAt' ke saath sort karega) ===
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc' // Sabse naya coupon upar
      }
    });
    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Server error while fetching coupons." });
  }
};

// === 3. NAYA: Coupon Update Function ===
exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body;

  try {
    const updatedCoupon = await prisma.coupon.update({
      where: { id: Number(id) },
      data: {
        code: code.toUpperCase(),
        discountType: discountType,
        discountValue: parseFloat(discountValue),
        isActive: isActive,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
      }
    });
    res.status(200).json(updatedCoupon);
  } catch (error) {
    console.error(`Error updating coupon ${id}:`, error);
    if (error.code === 'P2002') { // Unique constraint failed (code already exists)
      return res.status(400).json({ message: 'This coupon code already exists.' });
    }
    res.status(500).json({ message: "Server error while updating coupon." });
  }
};

// === 4. NAYA: Coupon Delete Function ===
exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.coupon.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting coupon ${id}:`, error);
     if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    // Check agar coupon pehle se use ho chuka hai
    if (error.code === 'P2003') { 
        return res.status(400).json({ message: 'Cannot delete coupon. It is already used in subscriptions.' });
    }
    res.status(500).json({ message: "Server error while deleting coupon." });
  }
};