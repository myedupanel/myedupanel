// File: backend/utils/sendEmail.js (FINAL PERMANENT SMTP FIX - Brevo/SendGrid)

const nodemailer = require('nodemailer');
// const { google } = require('googleapis'); // GOOGLE DEPENDENCIES HATA DIYA GAYA

// --- Helper function (यह अब Nodemailer खुद संभालता है, इसलिए इसकी ज़रूरत नहीं) ---
// function createEmailMessage(options, adminEmail) { ... } 

const sendEmail = async (options) => {
  console.log('--- Email (SendGrid/Brevo SMTP) bhejne ki koshish... ---');

  // Environment variables fetch karein
  const EMAIL_HOST = process.env.EMAIL_HOST; // e.g., smtp-relay.sendinblue.com
  const EMAIL_PORT = process.env.EMAIL_PORT; // 587
  const EMAIL_USER = process.env.EMAIL_USER; // Verified 'From' email address
  const EMAIL_PASS = process.env.EMAIL_PASS; // SendGrid/Brevo API Key

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      console.error('--- EMAIL FAILED ---: SendGrid/Brevo credentials (Host, User, Pass) missing.');
      throw new Error('Email sending failed: Credentials incomplete.');
  }

  try {
    // 1. Nodemailer Transporter set करें (SMTP का उपयोग)
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST, 
      port: Number(EMAIL_PORT),
      secure: false, // Port 587 के लिए
      auth: {
        // SendGrid/Brevo के लिए अक्सर user 'apikey' होता है
        user: "apikey", 
        pass: EMAIL_PASS, // SendGrid/Brevo API Key
      },
    });

    // 2. Email options taiyar करें
    const mailOptions = {
      from: `"${options.from || 'My EduPanel'}" <${EMAIL_USER}>`, // verified user से भेजें
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // 3. Email भेजें
    const info = await transporter.sendMail(mailOptions);

    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.response);
  
  } catch (error) {
    console.error('--- CRITICAL EMAIL FAILURE ---:', error.message);
    throw new Error(`Email delivery failed: ${error.message}. Please check SMTP host/key.`);
  }
};

module.exports = sendEmail;