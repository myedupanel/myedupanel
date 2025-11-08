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
  // ... (Aapka poora HTML receipt code jaisa tha waisa hi rahega) ...
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
          AND: [
            { 
              OR: [
                { expiryDate: null }, 
                { expiryDate: { gt: new Date() } }
              ] 
            },
            {
              OR: [
                 { maxUses: null },
                 { timesUsed: { lt: prisma.coupon.fields.maxUses } } 
              ]
            }
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

    // Receipt ID (Pehle se hi fix hai)
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


// --- FUNCTION 2: VALIDATE COUPON (Bina Badlaav) ---
// (Yeh function pehle se hi dynamic price ke liye taiyaar tha)
exports.validateCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        
        // 1. Fetch Plan Details
        const planFromDb = await prisma.plan.findUnique({
            where: { id: 'STARTER' } // Yeh sirf starter plan ke liye validate karta hai
        });

        if (!planFromDb || !planFromDb.isActive) {
            return res.status(404).json({ message: "Starter plan details not found." });
        }
        
        const originalPrice = planFromDb.price; 

        // 2. Coupon Check
        if (!couponCode) {
            return res.status(400).json({ message: "Coupon code is required." });
        }

        const coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                AND: [
                    { 
                        OR: [
                            { expiryDate: null }, 
                            { expiryDate: { gt: new Date() } }
                        ] 
                    },
                    {
                         OR: [
                            { maxUses: null },
                            { timesUsed: { lt: prisma.coupon.fields.maxUses } } 
                        ]
                    }
                ]
            }
        });

        if (!coupon) {
            return res.status(400).json({ message: "Invalid, expired, or fully used coupon code." });
        }

        // 3. Calculate New Price
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

        // 4. Send Response
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

// === FUNCTION 3: VERIFY WEBHOOK (Bina Badlaav) ===
// (Yeh function pehle se hi 'notes' se originalAmount le raha tha,
// isliye ismein badlaav ki zaroorat nahi hai)
exports.verifySubscriptionWebhook = async (req, res) => {
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
        // 1. School table update karein
        updatedSchool = await tx.school.update({
          where: { id: schoolId },
          data: {
            plan: planName.toUpperCase(), 
            planStartDate: planStartDate,
            planExpiryDate: planEndDate
          }
        });

        // 2. AppSubscription record banayein
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

        // 3. Coupon count update karein (agar use hua hai)
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