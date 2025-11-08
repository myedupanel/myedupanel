// File: backend/utils/sendEmail.js (PERMANENT FIX using Nodemailer & Service Account)

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
// (NOTE: Nodemailer installed hona chahiye)

// --- Helper function (Ab zaroorat nahi kyunki Nodemailer khud MIME types handle karta hai) ---
// function createEmailMessage(options, adminEmail) { ... } // YEH HATA DIYA GAYA

const sendEmail = async (options) => {
  console.log('--- Email (Nodemailer Service Account) bhejne ki koshish... ---');

  // Environment variables fetch karein
  // G_PRIVATE_KEY को \n के साथ handle करें
  const SERVICE_ACCOUNT_EMAIL = process.env.G_SERVICE_ACCOUNT_EMAIL;
  const PRIVATE_KEY = process.env.G_PRIVATE_KEY?.replace(/\\n/g, '\n'); 
  const USER_EMAIL = process.env.G_USER_TO_IMPERSONATE; 
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;


  // Ab hum sirf Service Account keys ko check karenge
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !USER_EMAIL || !CLIENT_ID || !CLIENT_SECRET) {
      console.error('--- EMAIL FAILED ---: Critical Service Account credentials missing in environment variables.');
      throw new Error('Email sending failed: Server configuration incomplete.');
  }

  try {
    // 1. JWT Client ka upyog (Refresh Token को permanent access token से बदलता है)
    const jwtClient = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY, 
      scopes: ['https://mail.google.com/'], 
      subject: USER_EMAIL, // Admin Email
    });

    // 2. Access Token प्राप्त करें (यह हर बार नया generate होगा, लेकिन Refresh Token की ज़रूरत नहीं पड़ेगी)
    const tokens = await jwtClient.authorize();
    
    // 3. Nodemailer Transporter set करें
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail service
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID, 
        clientSecret: CLIENT_SECRET, 
        accessToken: tokens.access_token, // नया एक्सेस टोकन
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
    // Error Logging ko saaf rakhein
    console.error('--- CRITICAL EMAIL FAILURE ---:', error.message);
    // इस पॉइंट पर fail होने पर, यह लगभग हमेशा Google API/Network issue होगी
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;