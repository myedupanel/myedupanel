// File: backend/controllers/couponController.js (FIXED: Coupon Default Active)

const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===


// === 1. Naya Coupon Banane ka Function (FIXED) ===
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body; 
    
    const sanitizedCode = removeHtmlTags(code);

    // Basic Validation
    if (!sanitizedCode || !discountType || !discountValue) {
      return res.status(400).json({ message: 'Code, Discount Type, and Value are required.' });
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: sanitizedCode.toUpperCase() }
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'This coupon code already exists.' });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: sanitizedCode.toUpperCase(),
        discountType: discountType,
        discountValue: parseFloat(discountValue),
        // === FIX 2: Default to TRUE अगर frontend से नहीं आता ===
        isActive: isActive === undefined ? true : isActive, 
        // === END FIX 2 ===
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

// === 2. Saare Coupons Dekhne ka Function (No Change) ===
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc' 
      }
    });
    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Server error while fetching coupons." });
  }
};

// === 3. NAYA: Coupon Update Function (Sanitized) ===
// हाँ, इसमें EDIT Logic है।
exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body;

  const sanitizedCode = removeHtmlTags(code);
  
  try {
    const updatedCoupon = await prisma.coupon.update({
      where: { id: Number(id) },
      data: {
        code: sanitizedCode.toUpperCase(),
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
    if (error.code === 'P2002') { 
      return res.status(400).json({ message: 'This coupon code already exists.' });
    }
    // P2025: Not Found error भी हैंडल करता है
    res.status(500).json({ message: "Server error while updating coupon." });
  }
};

// === 4. NAYA: Coupon Delete Function (No Change in Logic) ===
// हाँ, इसमें DELETE Logic है।
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
    // P2003: Foreign key constraint error भी हैंडल करता है
    if (error.code === 'P2003') { 
        return res.status(400).json({ message: 'Cannot delete coupon. It is already used in subscriptions.' });
    }
    res.status(500).json({ message: "Server error while deleting coupon." });
  }
};