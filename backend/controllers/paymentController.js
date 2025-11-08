// File: backend/controllers/paymentController.js (UPDATED)

const prisma = require('../config/prisma');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Razorpay instance
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("WARNING: Razorpay keys are not set. Payment API will not work.");
}

// createReceiptHtml (Bina Badlaav)
const createReceiptHtml = (userName, planName, amount, orderId, paymentId, expiryDate) => {
  // ... (Poora HTML code jaisa tha waisa hi) ...
  return `
  <div style="font-family: Arial, sans-serif; ...">
    ... (Poora HTML Receipt) ...
  </div>
  `;
};

// === FUNCTION 1: createSubscriptionOrder (Bina Badlaav) ===
exports.createSubscriptionOrder = async (req, res) => {
  // ... (Poora code jaisa tha waisa hi) ...
  // ... (Dynamic price fetch, coupon logic, receipt ID fix, split payment) ...

  if (!razorpay) {
    return res.status(500).json({ message: "Payment gateway is not configured." });
  }

  try {
    const { planName, couponCode } = req.body;
    const schoolId = req.user.schoolId;
    const userId = req.user.id; 

    const planFromDb = await prisma.plan.findUnique({
      where: { id: planName.toUpperCase() }
    });

    if (!planFromDb || !planFromDb.isActive) {
      return res.status(404).json({ message: "This plan is not available." });
    }

    const originalAmountInRupees = planFromDb.price;
    let finalAmountInRupees = originalAmountInRupees;
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          AND: [
            { OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] },
            { OR: [{ maxUses: null }, { timesUsed: { lt: prisma.coupon.fields.maxUses } }] }
          ]
        }
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid or expired coupon code." });
      }

      couponId = coupon.id;
      if (coupon.discountType === 'PERCENTAGE') {
        finalAmountInRupees = originalAmountInRupees - (originalAmountInRupees * coupon.discountValue) / 100;
      } else if (coupon.discountType === 'FIXED_AMOUNT') {
        finalAmountInRupees = originalAmountInRupees - coupon.discountValue;
      }
      if (finalAmountInRupees < 0) finalAmountInRupees = 0;
    }

    const finalAmountInPaise = Math.round(finalAmountInRupees * 100);
    const receiptId = `rec_u${userId}_${Date.now()}`;

    const options = {
      amount: finalAmountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        schoolId: String(schoolId),
        userId: String(userId),
        planName: planName,
        type: "APP_SUBSCRIPTION",
        originalAmount: String(originalAmountInRupees),
        couponId: couponId ? String(couponId) : null
      }
    };

    const MY_LINKED_ACCOUNT_ID = process.env.MY_RAZORPAY_LINKED_ACCOUNT_ID;
    if (MY_LINKED_ACCOUNT_ID) {
      const myShareInPaise = Math.round(finalAmountInPaise * 0.50);
      options.transfers = [
        {
          account: MY_LINKED_ACCOUNT_ID,
          amount: myShareInPaise,
          currency: "INR",
          on_hold: 0,
        }
      ];
    }

    const order = await razorpay.orders.create(options);
    res.status(200).json({ ...order, key: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error.error?.description || "Error creating payment order.";
    res.status(500).json({ message: errorMessage });
  }
};

// === FUNCTION 2: validateCoupon (Bina Badlaav) ===
exports.validateCoupon = async (req, res) => {
  // ... (Poora code jaisa tha waisa hi) ...
    try {
        const { couponCode } = req.body;
        const planFromDb = await prisma.plan.findUnique({ where: { id: 'STARTER' } });

        if (!planFromDb || !planFromDb.isActive) {
            return res.status(404).json({ message: "Starter plan details not found." });
        }
        
        const originalPrice = planFromDb.price; 

        if (!couponCode) {
            return res.status(400).json({ message: "Coupon code is required." });
        }

        const coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                AND: [
                    { OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }] },
                    { OR: [{ maxUses: null }, { timesUsed: { lt: prisma.coupon.fields.maxUses } }] }
                ]
            }
        });

        if (!coupon) {
            return res.status(400).json({ message: "Invalid, expired, or fully used coupon code." });
        }

        let newPrice = originalPrice;
        let discountAmount = 0;

        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (originalPrice * coupon.discountValue) / 100;
            newPrice = originalPrice - discountAmount;
        } else if (coupon.discountType === 'FIXED_AMOUNT') {
            discountAmount = coupon.discountValue;
            newPrice = originalPrice - discountAmount;
        }

        if (newPrice < 0) newPrice = 0;

        res.status(200).json({
            couponCode: coupon.code,
            originalPrice: originalPrice,
            newPrice: Math.round(newPrice),
            discountAmount: Math.round(discountAmount),
            message: `Coupon applied! You save ₹${Math.round(discountAmount).toLocaleString('en-IN')}.`
        });

    } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({ message: "Server error during coupon validation." });
    }
};

// === FUNCTION 3: verifySubscriptionWebhook (Bina Badlaav) ===
exports.verifySubscriptionWebhook = async (req, res) => {
  // ... (Poora code jaisa tha waisa hi) ...
  // ... (Signature check, $transaction, school update, appSubscription create, email logic) ...

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(400).json({ message: "Webhook secret not configured." });
  }

  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (sigError) {
    return res.status(400).json({ message: 'Signature verification failed.' });
  }

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

        if (couponId) {
          await tx.coupon.update({
            where: { id: Number(couponId) },
            data: { timesUsed: { increment: 1 } }
          });
        }
      }); 

      console.log(`SUCCESS: School ${schoolId} plan updated to ${planName}.`);
      
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
      
    } catch (dbError) {
      console.error(`Webhook DB Error: Failed to update plan for School ${schoolId}.`, dbError);
      return res.status(500).json({ message: "Database update failed." });
    }
  }

  res.status(200).json({ status: 'ok' });
};


// === NAYA FUNCTION (STEP 1) ===
// @desc    SuperAdmin ke liye Razorpay se payments sync karna
// @route   POST /api/payment/sync-payments
exports.syncRazorpayPayments = async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ message: "Payment gateway is not configured." });
  }

  console.log('Starting Razorpay payment sync for SuperAdmin...');
  let paymentsFixed = 0;
  let paymentsSkipped = 0;

  try {
    // 1. Razorpay se saare successful payments fetch karein
    // Hum 'count: 100' set kar rahe hain, aap isse badha sakte hain ya pagination add kar sakte hain
    const razorpayPayments = await razorpay.payments.all({ count: 100 });

    const capturedPayments = razorpayPayments.items.filter(
      (p) => p.status === 'captured' && p.notes.type === 'APP_SUBSCRIPTION'
    );

    console.log(`Found ${capturedPayments.length} captured app subscription payments in Razorpay.`);

    for (const payment of capturedPayments) {
      const paymentId = payment.id;

      // 2. Check karein ki yeh payment hamare database mein pehle se hai ya nahi
      const existingSubscription = await prisma.appSubscription.findUnique({
        where: { paymentId: paymentId }
      });

      if (existingSubscription) {
        paymentsSkipped++;
        continue; // Payment pehle se hai, kuch mat karo
      }

      // 3. NAYI PAYMENT MILI! Isse database mein add karo
      console.log(`NEW PAYMENT FOUND: ${paymentId}. Fixing database...`);
      const { schoolId, userId, planName, originalAmount, couponId } = payment.notes;
      const amountPaid = Number(payment.amount) / 100;
      const planStartDate = new Date(payment.created_at * 1000);
      const planEndDate = new Date();
      planEndDate.setFullYear(planEndDate.getFullYear() + 1);
      
      // Database transaction se update karein
      try {
        await prisma.$transaction(async (tx) => {
          // School update karein
          await tx.school.update({
            where: { id: schoolId },
            data: {
              plan: planName.toUpperCase(),
              planStartDate: planStartDate,
              planExpiryDate: planEndDate
            }
          });

          // Naya AppSubscription record banayein
          await tx.appSubscription.create({
            data: {
              planName: planName.toUpperCase(),
              originalAmount: Number(originalAmount) || amountPaid,
              finalAmount: amountPaid,
              durationInDays: 365,
              status: "SUCCESS",
              paymentId: payment.id,
              orderId: payment.order_id,
              createdAt: planStartDate,
              schoolId: schoolId,
              userId: Number(userId),
              couponId: couponId ? Number(couponId) : null
            }
          });

          // Coupon count update karein (agar use hua hai)
          if (couponId) {
            await tx.coupon.update({
              where: { id: Number(couponId) },
              data: { timesUsed: { increment: 1 } }
            });
          }
        });
        paymentsFixed++;
      } catch (dbError) {
        console.error(`Failed to sync payment ${paymentId} for school ${schoolId}:`, dbError);
      }
    }

    res.status(200).json({ 
      message: `Sync complete! ${paymentsFixed} new payments fixed, ${paymentsSkipped} payments already synced.`,
      fixed: paymentsFixed,
      skipped: paymentsSkipped
    });

  } catch (error) {
    console.error("Error syncing Razorpay payments:", error);
    const errorMessage = error.error?.description || "Error fetching payments from Razorpay.";
    res.status(500).json({ message: errorMessage });
  }
};
// === END NAYA FUNCTION ===