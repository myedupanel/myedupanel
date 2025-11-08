// File: backend/utils/sendEmail.js (FINAL DECODING FIX)

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
// Fix 1: Buffer Module को Import करें 
const { Buffer } = require('buffer'); 

const sendEmail = async (options) => {
  console.log('--- Email (Nodemailer Service Account) bhejne ki koshish... ---');

  // Environment variables fetch karein
  const SERVICE_ACCOUNT_EMAIL = process.env.G_SERVICE_ACCOUNT_EMAIL;
  const RAW_PRIVATE_KEY = process.env.G_PRIVATE_KEY; 
  const USER_EMAIL = process.env.G_USER_TO_IMPERSONATE; 
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!SERVICE_ACCOUNT_EMAIL || !RAW_PRIVATE_KEY || !USER_EMAIL || !CLIENT_ID || !CLIENT_SECRET) {
      console.error('--- EMAIL FAILED ---: Critical Service Account credentials missing.');
      throw new Error('Email sending failed: Server configuration incomplete.');
  }

  // === FIX 3: Base64 Decoding लॉजिक (यही वह लाइन है जिसकी Render को ज़रूरत है) ===
  const decodedPrivateKey = Buffer.from(RAW_PRIVATE_KEY, 'base64').toString('utf8');
  // === END FIX 3 ===

  try {
    // 1. JWT Client ka upyog
    const jwtClient = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: decodedPrivateKey, // <-- अब DECODED KEY का उपयोग होगा
      scopes: ['https://mail.google.com/'], 
      subject: USER_EMAIL, 
    });

    // 2. Access Token प्राप्त करें
    const tokens = await jwtClient.authorize();
    
    // 3. Nodemailer Transporter set करें
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID, 
        clientSecret: CLIENT_SECRET, 
        accessToken: tokens.access_token,
        expires: tokens.expiry_date,
      },
    });

    // 4. Email options taiyar karein
    const mailOptions = {
      from: `"${options.from || 'My EduPanel'}" <${USER_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // 5. Email bhejein
    const info = await transporter.sendMail(mailOptions);

    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.response);
  
  } catch (error) {
    console.error('--- CRITICAL EMAIL FAILURE ---:', error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;