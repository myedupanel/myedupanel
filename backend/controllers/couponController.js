// File: backend/controllers/couponController.js (FIXED)

const prisma = require('../config/prisma');

// === 1. Naya Coupon Banane ka Function (Bina Badlaav) ===
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, maxUses } = req.body;

    // Basic Validation
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, Discount Type, and Value are required.' });
    }

    // Check karein ki code unique hai ya nahi
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'This coupon code already exists.' });
    }

    // Naya coupon banayein
    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType, // "PERCENTAGE" ya "FIXED_AMOUNT"
        discountValue: parseFloat(discountValue),
        isActive: true,
        timesUsed: 0,
        // Optional fields
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
      }
      // Note: Hum assume kar rahe hain ki 'createdAt' schema mein @default(now()) hai
    });

    res.status(201).json({ message: 'Coupon created successfully!', coupon: newCoupon });

  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error while creating coupon." });
  }
};

// === 2. Saare Coupons Dekhne ka Function (FIXED) ===
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      // === FIX: orderBy waali line ko hata diya ===
      // orderBy: {
      //   createdAt: 'desc' 
      // }
      // ==========================================
    });
    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Server error while fetching coupons." });
  }
};