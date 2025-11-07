// File: backend/controllers/paymentController.js

const prisma = require('../config/prisma');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Razorpay instance (Bina Badlaav)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("WARNING: Razorpay keys are not set. Payment API will not work.");
}

// HTML Receipt Template (Bina Badlaav)
const createReceiptHtml = (userName, planName, amount, orderId, paymentId, expiryDate) => {
  // ... (Aapka poora HTML code yahaan) ...
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #007bff; color: white; padding: 20px;">
      <h1 style="margin: 0; font-size: 24px;">MyEduPanel Payment Successful!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 18px;">Hi ${userName},</p>
      <p>Thank you for subscribing to MyEduPanel. Your payment was successful, and your plan is now active.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
        <caption style="font-size: 20px; font-weight: bold; text-align: left; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;">
          Receipt Details
        </caption>
        <tbody style="font-size: 16px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 15px 0; font-weight: bold;">Plan Activated:</td>
            <td style="padding: 15px 0; text-align: right;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 15px 0; font-weight: bold;">Amount Paid:</td>
            <td style="padding: 15px 0; text-align: right; font-weight: bold; color: #28a745;">${amount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 15px 0; font-weight: bold;">Plan Expires On:</td>
            <td style="padding: 15px 0; text-align: right;">${expiryDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 15px 0; font-weight: bold;">Payment ID:</td>
            <td style="padding: 15px 0; text-align: right; font-size: 14px;">${paymentId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 15px 0; font-weight: bold;">Order ID:</td>
            <td style="padding: 15px 0; text-align: right; font-size: 14px;">${orderId}</td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top: 30px;">You can now access all features of your plan. If you have any questions, feel free to contact our support.</p>
      <p>Thanks,<br/>The MyEduPanel Team</p>
    </div>
    <div style="background-color: #f8f9fa; color: #888; padding: 20px; text-align: center; font-size: 12px;">
      © ${new Date().getFullYear()} MyEduPanel. All rights reserved.
    </div>
  </div>
  `;
};
// === END HELPER FUNCTION ===


// === FUNCTION 1: CREATE ORDER (UPDATED WITH DYNAMIC PRICE) ===
exports.createSubscriptionOrder = async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ message: "Payment gateway is not configured." });
  }

  try {
    const { planName, couponCode } = req.body; 
    const schoolId = req.user.schoolId;
    const userId = req.user.id;

    if (planName !== 'STARTER') {
      return res.status(400).json({ message: "Invalid plan name. Only 'STARTER' is allowed." });
    }
    
    // --- YAHI HAI NAYA DYNAMIC PRICE LOGIC ---
    const planFromDb = await prisma.plan.findUnique({
      where: { id: planName } // "STARTER"
    });

    if (!planFromDb || !planFromDb.isActive) {
      return res.status(404).json({ message: "This plan is not available." });
    }
    
    const originalAmountInRupees = planFromDb.price; // Database se price (e.g., 4999)
    // --- END DYNAMIC PRICE LOGIC ---
    
    let finalAmountInRupees = originalAmountInRupees;
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: new Date() } }
          ],
          OR: [
            { maxUses: null },
            { timesUsed: { lt: prisma.coupon.fields.maxUses } } 
          ]
        }
      });

      if (!coupon) {
        return res.status(404).json({ message: "Invalid or expired coupon code." });
      }

      couponId = coupon.id;
      if (coupon.discountType === 'PERCENTAGE') {
        const discountAmount = (originalAmountInRupees * coupon.discountValue) / 100;
        finalAmountInRupees = originalAmountInRupees - discountAmount;
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        finalAmountInRupees = originalAmountInRupees - coupon.discountValue;
      }

      if (finalAmountInRupees < 0) {
        finalAmountInRupees = 0;
      }
    }

    const finalAmountInPaise = Math.round(finalAmountInRupees * 100);

    const options = {
      amount: finalAmountInPaise,
      currency: "INR",
      receipt: `receipt_school_${schoolId}_${Date.now()}`,
      notes: {
        schoolId: String(schoolId),
        userId: String(userId),
        planName: planName,
        type: "APP_SUBSCRIPTION",
        originalAmount: String(originalAmountInRupees),
        finalAmount: String(finalAmountInRupees),
        couponId: couponId ? String(couponId) : null
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({ ...order, key: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating payment order." });
  }
};

// === FUNCTION 2: VALIDATE COUPON (UPDATED WITH DYNAMIC PRICE) ===
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    // --- YAHI HAI NAYA DYNAMIC PRICE LOGIC ---
    const planFromDb = await prisma.plan.findUnique({
      where: { id: "STARTER" } // Abhi sirf starter ke liye
    });

    if (!planFromDb) {
      return res.status(404).json({ message: "Starter plan not found." });
    }
    const originalAmountInRupees = planFromDb.price;
    // --- END DYNAMIC PRICE LOGIC ---
    
    let finalAmountInRupees = originalAmountInRupees;

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        OR: [ { expiryDate: null }, { expiryDate: { gt: new Date() } } ],
        OR: [ { maxUses: null }, { timesUsed: { lt: prisma.coupon.fields.maxUses } } ]
      }
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon code." });
    }

    if (coupon.discountType === 'PERCENTAGE') {
      const discountAmount = (originalAmountInRupees * coupon.discountValue) / 100;
      finalAmountInRupees = originalAmountInRupees - discountAmount;
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      finalAmountInRupees = originalAmountInRupees - coupon.discountValue;
    }

    if (finalAmountInRupees < 0) {
      finalAmountInRupees = 0;
    }

    res.status(200).json({
      message: `Coupon "${coupon.code}" applied successfully!`,
      originalPrice: originalAmountInRupees,
      newPrice: Math.round(finalAmountInRupees),
      couponCode: coupon.code
    });

  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Error validating coupon." });
  }
};


// === FUNCTION 3: VERIFY WEBHOOK (Bina Badlaav) ===
// (Yeh function pehle se hi 'notes' se originalAmount le raha tha, isliye ismein badlaav ki zaroorat nahi hai)
exports.verifySubscriptionWebhook = async (req, res) => {
  
  // ... (Aapka poora verifySubscriptionWebhook function yahaan) ...
  
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("FATAL: RAZORPAY_WEBHOOK_SECRET is not set.");
    return res.status(400).json({ message: "Webhook secret not configured." });
  }

  // 1. Signature Verify Karein (Bina Badlaav)
  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      console.warn('Webhook Warning: Invalid signature received.');
      return res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (sigError) {
    console.error("Webhook Error: Signature verification failed:", sigError);
    return res.status(400).json({ message: 'Signature verification failed.' });
  }

  // 2. Payment Event ko Process Karein
  const event = req.body.event;
  const payment = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && payment && payment.status === 'captured') {
    console.log(`Webhook: Payment captured for Order ID: ${payment.order_id}`);
    
    const { schoolId, userId, planName, type, originalAmount, couponId } = payment.notes;
    
    if (type !== 'APP_SUBSCRIPTION') {
      console.log("Webhook: Ignoring event, not an app subscription.");
      return res.status(200).json({ message: 'Ignored: Not an app subscription.' });
    }

    const amountPaid = Number(payment.amount) / 100;
    const planStartDate = new Date(payment.created_at * 1000);
    const planEndDate = new Date();
    planEndDate.setFullYear(planEndDate.getFullYear() + 1);
    const durationDays = 365;

    try {
      let updatedSchool; 

      await prisma.$transaction(async (tx) => {
        
        // 1. School table ko update karein (Bina Badlaav)
        updatedSchool = await tx.school.update({
          where: { id: schoolId },
          data: {
            plan: planName.toUpperCase(),
            planStartDate: planStartDate,
            planExpiryDate: planEndDate
          }
        });

        // 2. Naya AppSubscription record banayein (Bina Badlaav)
        await tx.appSubscription.create({
          data: {
            planName: planName.toUpperCase(),
            originalAmount: Number(originalAmount) || amountPaid,
            finalAmount: amountPaid,
            durationInDays: durationDays,
            status: "SUCCESS",
            paymentId: payment.id,
            orderId: payment.order_id,
            createdAt: planStartDate,
            
            schoolId: schoolId,
            userId: Number(userId),
            couponId: couponId ? Number(couponId) : null
          }
        });

        // 3. Coupon ka 'timesUsed' count badhayein (Bina Badlaav)
        if (couponId) {
          await tx.coupon.update({
            where: { id: Number(couponId) },
            data: {
              timesUsed: {
                increment: 1
              }
            }
          });
        }

      }); // Transaction yahaan khatam

      console.log(`SUCCESS: School ${schoolId} plan updated to ${planName}.`);
      
      // === EMAIL LOGIC (Bina Badlaav) ===
      try {
        const user = await prisma.user.findUnique({
          where: { id: Number(userId) },
          select: { email: true, name: true }
        });

        if (user && user.email) {
          const amountPaidString = `₹${amountPaid.toLocaleString('en-IN')}`;
          const expiryDateString = updatedSchool.planExpiryDate.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          });

          const htmlReceipt = createReceiptHtml(
            user.name,
            planName.toUpperCase(),
            amountPaidString,
            payment.order_id,
            payment.id,
            expiryDateString
          );

          await sendEmail({
            to: user.email,
            subject: 'Your MyEduPanel Subscription Receipt (Order Confirmed)',
            html: htmlReceipt
          });
          
          console.log(`Payment receipt successfully sent to ${user.email}`);
        
        } else {
          console.log(`Receipt not sent: Admin user email not found for userId: ${userId}`);
        }

      } catch (emailError) {
        console.error('Webhook successful, but FAILED to send email:', emailError.message);
      }
      // === EMAIL LOGIC KHATAM ===
      
    } catch (dbError) {
      console.error(`Webhook DB Error: Failed to update plan for School ${schoolId}.`, dbError);
      return res.status(500).json({ message: "Database update failed." });
    }
  }

  // Razorpay ko batayein ki sab theek hai
  res.status(200).json({ status: 'ok' });
};