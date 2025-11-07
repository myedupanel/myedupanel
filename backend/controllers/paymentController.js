// File: backend/controllers/paymentController.js (UPDATED with Dynamic Price)

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

// createReceiptHtml function (Bina Badlaav)
const createReceiptHtml = (userName, planName, amount, orderId, paymentId, expiryDate) => {
  // ... (Poora HTML receipt code yahaan) ...
  return `
  <div style="font-family: Arial, sans-serif; ...">
    ... (Poora HTML Receipt) ...
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
    const { planName, couponCode } = req.body; // planName ab "STARTER" aayega
    const schoolId = req.user.schoolId;
    const userId = req.user.id; 

    // --- YAHI HAI NAYA DYNAMIC PRICE LOGIC ---
    // Ab hum price ko database se fetch karenge
    const planFromDb = await prisma.plan.findUnique({
      where: { id: planName.toUpperCase() } // e.g., "STARTER"
    });

    // Check karein ki plan database mein hai ya nahi
    if (!planFromDb || !planFromDb.isActive) {
      return res.status(404).json({ message: "This plan is not available." });
    }

    // Price ko hard-code karne ke bajaaye database se lein
    const originalAmountInRupees = planFromDb.price; // e.g., 4999 (database se)
    // --- DYNAMIC PRICE LOGIC ENDS HERE ---
    
    let finalAmountInRupees = originalAmountInRupees;
    let couponId = null;

    // --- (Coupon Logic - Bina Badlaav) ---
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
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
        return res.status(400).json({ message: "Invalid or expired coupon code." });
      }

      couponId = coupon.id;
      if (coupon.discountType === 'PERCENTAGE') {
        const discountAmount = (originalAmountInRupees * coupon.discountValue) / 100;
        finalAmountInRupees = originalAmountInRupees - discountAmount;
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        finalAmountInRupees = originalAmountInRupees - coupon.discountValue;
      }

      if (finalAmountInRupees < 0) finalAmountInRupees = 0;
    }
    // --- (Coupon Logic Ends) ---

    const finalAmountInPaise = Math.round(finalAmountInRupees * 100);
    const receiptId = `rec_u${userId}_${Date.now()}`; // Short receipt ID

    const options = {
      amount: finalAmountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        schoolId: String(schoolId),
        userId: String(userId),
        planName: planName,
        type: "APP_SUBSCRIPTION",
        originalAmount: String(originalAmountInRupees), // Sahi original price
        couponId: couponId ? String(couponId) : null
      }
    };

    // --- (Split Payment Logic - Bina Badlaav) ---
    const MY_LINKED_ACCOUNT_ID = process.env.MY_RAZORPAY_LINKED_ACCOUNT_ID;
    if (MY_LINKED_ACCOUNT_ID) {
      const myShareInPaise = Math.round(finalAmountInPaise * 0.50); // 50%
      options.transfers = [
        {
          account: MY_LINKED_ACCOUNT_ID,
          amount: myShareInPaise,
          currency: "INR",
          on_hold: 0,
        }
      ];
    }
    // --- (Split Logic Ends) ---

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({ ...order, key: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error.error?.description || "Error creating payment order.";
    res.status(500).json({ message: errorMessage });
  }
};


// === FUNCTION 2: VERIFY WEBHOOK (Bina Badlaav) ===
// (Yeh function pehle se hi 'notes' se originalAmount le raha tha,
// isliye ismein badlaav ki zaroorat nahi hai)
exports.verifySubscriptionWebhook = async (req, res) => {
  // ... (Aapka poora verifySubscriptionWebhook code yahaan) ...
  // ... (Yeh code bilkul sahi hai) ...

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("FATAL: RAZORPAY_WEBHOOK_SECRET is not set.");
    return res.status(400).json({ message: "Webhook secret not configured." });
  }

  // 1. Signature Verify Karein
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
    const { schoolId, userId, planName, type, originalAmount, couponId } = payment.notes;
    
    if (type !== 'APP_SUBSCRIPTION') {
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
        updatedSchool = await tx.school.update({
          where: { id: schoolId },
          data: {
            plan: planName.toUpperCase(), 
            planStartDate: planStartDate,
            planExpiryDate: planEndDate
          }
        });

        await tx.appSubscription.create({
          data: {
            planName: planName.toUpperCase(),
            originalAmount: Number(originalAmount) || amountPaid, // Notes se original price
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
      }); 

      console.log(`SUCCESS: School ${schoolId} plan updated to ${planName}.`);
      
      // === EMAIL LOGIC ===
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

  res.status(200).json({ status: 'ok' });
};