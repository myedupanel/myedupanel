// File: backend/controllers/couponController.js (SUPREME SECURE)

const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');

// === FIX 1: THE SANITIZER FUNCTION (XSS Prevention) ===
// यह फंक्शन किसी भी स्ट्रिंग से सभी HTML टैग्स को हटा देगा।
function removeHtmlTags(str) {
  if (!str || typeof str !== 'string') {
    return str;
  }
  return str.replace(/<[^>]*>/g, '').trim(); 
}
// === END FIX 1 ===


// === 1. Naya Coupon Banane ka Function (Sanitized) ===
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body; 
    
    // === FIX 2: Code को Sanitize करें ===
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
        isActive: isActive || false,
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
exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, expiryDate, maxUses, isActive } = req.body;

  // === FIX 3: Code को Sanitize करें ===
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
    res.status(500).json({ message: "Server error while updating coupon." });
  }
};

// === 4. NAYA: Coupon Delete Function (No Change in Logic) ===
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
    if (error.code === 'P2003') { 
        return res.status(400).json({ message: 'Cannot delete coupon. It is already used in subscriptions.' });
    }
    res.status(500).json({ message: "Server error while deleting coupon." });
  }
};