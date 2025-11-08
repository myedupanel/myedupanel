// File: backend/controllers/paymentController.js (FINAL "Super Intelligent" UPDATE)

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
  // ... (Poora HTML code jaisa tha waisa hi) ...
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

// === FUNCTION 1: createSubscriptionOrder (Bina Badlaav) ===
exports.createSubscriptionOrder = async (req, res) => {
  // ... (Poora code jaisa pichli baar tha, waisa hi rahega) ...
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
  // ... (Poora code jaisa pichli baar tha, waisa hi rahega) ...
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
  // ... (Poora code jaisa pichli baar tha, waisa hi rahega) ...
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


// === FUNCTION 4: SYNC PAYMENTS (SUPER-SUPER-INTELLIGENT FIX) ===
exports.syncRazorpayPayments = async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ message: "Payment gateway is not configured." });
  }

  console.log('Starting Razorpay payment sync for SuperAdmin...');
  let paymentsFixed = 0;
  let paymentsSkipped = 0;
  let paymentsFailed = 0;

  try {
    const razorpayPayments = await razorpay.payments.all({ count: 100 });
    const capturedPayments = razorpayPayments.items.filter(
      (p) => p.status === 'captured' && p.notes.type === 'APP_SUBSCRIPTION'
    );

    console.log(`Found ${capturedPayments.length} captured app subscription payments in Razorpay.`);

    for (const payment of capturedPayments) {
      const paymentId = payment.id;
      const { schoolId, userId, planName, originalAmount, couponId: couponIdFromNotes } = payment.notes;

      // Safety check
      if (!schoolId || !userId || !planName) {
        console.error(`Payment ${paymentId} is missing critical notes (schoolId, userId, or planName). Skipping.`);
        paymentsFailed++;
        continue;
      }
      
      // Data extract
      const amountPaid = Number(payment.amount) / 100;
      const planStartDate = new Date(payment.created_at * 1000);
      const planEndDate = new Date(planStartDate); // Start date se copy karein
      planEndDate.setFullYear(planEndDate.getFullYear() + 1); // 1 saal add karein

      // --- YAHI HAI NAYA "SUPER-SUPER INTELLIGENT" LOGIC ---
      
      // 1. Check karein ki payment record hamare DB mein hai ya nahi
      const existingSubscription = await prisma.appSubscription.findUnique({
        where: { paymentId: paymentId }
      });

      if (existingSubscription) {
        // 2. PAYMENT RECORD MIL GAYA. Ab check karo ki School ka plan sahi hai ya nahi.
        const school = await prisma.school.findUnique({ where: { id: schoolId } });

        // Check karo ki plan 'TRIAL' par (ya galat date par) toh phansa nahi hai
        if (school && (school.plan !== planName.toUpperCase() || school.planExpiryDate.getTime() !== planEndDate.getTime())) {
          
          console.log(`MISMATCH FOUND for School ${schoolId}. Plan is '${school.plan}', but should be '${planName.toUpperCase()}'. Fixing...`);
          
          await prisma.school.update({
            where: { id: schoolId },
            data: {
              plan: planName.toUpperCase(),
              planStartDate: planStartDate,
              planExpiryDate: planEndDate
            }
          });
          paymentsFixed++; // Ise bhi 'fixed' mein gino
        } else {
          // School ka plan pehle se hi sahi hai. Skip karo.
          paymentsSkipped++;
        }
        
        continue; // Agle payment par jao
      }

      // 3. PAYMENT RECORD MILA HI NAHI. Yeh ek naya/missing payment hai.
      console.log(`NEW PAYMENT FOUND: ${paymentId}. Creating new record...`);
      
      try {
        await prisma.$transaction(async (tx) => {
          
          let validCouponId = null;

          // 4. (Foreign Key Fix) Check karein ki coupon delete toh nahi ho gaya
          if (couponIdFromNotes) {
            const couponExists = await tx.coupon.findUnique({
              where: { id: Number(couponIdFromNotes) }
            });
            
            if (couponExists) {
              validCouponId = Number(couponIdFromNotes);
            } else {
              console.warn(`Payment ${payment.id} had couponId ${couponIdFromNotes}, but it no longer exists. Saving without link.`);
              validCouponId = null; // 'null' save karein taaki crash na ho
            }
          }

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
              endDate: planEndDate, // <-- YEH ZAROORI HAI
              schoolId: schoolId,
              userId: Number(userId),
              couponId: validCouponId 
            }
          });

          // Coupon count update karein (agar valid hai)
          if (validCouponId) { 
            await tx.coupon.update({
              where: { id: validCouponId },
              data: { timesUsed: { increment: 1 } }
            });
          }
        });
        paymentsFixed++;
      } catch (dbError) {
        // Is specific payment ko sync karne mein error aaya
        console.error(`Failed to sync payment ${paymentId} for school ${schoolId}:`, dbError.message);
        paymentsFailed++;
      }
    } // Loop yahaan khatam

    console.log(`Sync complete. Fixed: ${paymentsFixed}, Skipped: ${paymentsSkipped}, Failed: ${paymentsFailed}`);
    res.status(200).json({ 
      message: `Sync complete! ${paymentsFixed} new/mismatched payments fixed, ${paymentsSkipped} payments already correct, ${paymentsFailed} payments failed.`,
      fixed: paymentsFixed,
      skipped: paymentsSkipped,
      failed: paymentsFailed
    });

  } catch (error) {
    console.error("Error syncing Razorpay payments:", error);
    const errorMessage = error.error?.description || "Error fetching payments from Razorpay.";
    res.status(500).json({ message: errorMessage });
  }
};