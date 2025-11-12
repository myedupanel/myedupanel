// backend/utils/sendEmail.js
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// --- Helper function (Ise change nahi kiya) ---
function createEmailMessage(options, adminEmail) {
  const emailLines = [
    `From: "My EduPanel" <${adminEmail}>`, // Bhejne waale ka naam
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '', // Blank line zaroori hai
    options.html,
  ];
  const email = emailLines.join('\r\n');
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// --- Nodemailer transport setup ---
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// --- Main SendEmail Function (Updated with nodemailer fallback) ---
const sendEmail = async (options) => {
  console.log('--- Email bhejne ki koshish... ---');

  // --- Try Gmail API first ---
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  // If Gmail API credentials are available, try Gmail API first
  if (CLIENT_ID && CLIENT_SECRET && REDIRECT_URI && REFRESH_TOKEN && ADMIN_EMAIL) {
    console.log('--- Gmail API credentials available, trying Gmail API first... ---');
    try {
      // Client ko ab yahaan (function ke andar) banayein
      const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
      oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

      // 5. Naya "Access Token" haasil karein
      const { token: accessToken } = await oAuth2Client.getAccessToken();

      if (!accessToken) {
        throw new Error('Access Token nahi mila');
      }
      
      oAuth2Client.setCredentials({ access_token: accessToken });

      // 6. Gmail API client ko taiyaar karein
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

      // 7. Email message ko Base64 mein convert karein
      const rawMessage = createEmailMessage(options, ADMIN_EMAIL);

      // 8. Email Bhejein!
      const info = await gmail.users.messages.send({
        userId: 'me', // 'me' ka matlab hai ADMIN_EMAIL
        requestBody: {
          raw: rawMessage,
        },
      });

      console.log('--- Email safaltapoorvak Gmail API se bhej diya gaya! ---', info.data);
      return; // Success, no need to try nodemailer
    } catch (error) {
      // Error ko aache se log karein
      console.error('--- Gmail API se email bhejne mein error aaya ---:', error.response ? error.response.data : error.message);
      if (error.response?.data?.error === 'invalid_grant') {
           console.error(">>> FATAL: Google Refresh Token expire ho gaya hai. Please naya token generate karein. <<<");
      }
      // Continue to nodemailer fallback
    }
  } else {
    console.log('--- Gmail API credentials missing, skipping Gmail API... ---');
  }

  // --- Fallback to nodemailer if available ---
  if (transporter) {
    console.log('--- Nodemailer transport available, trying nodemailer... ---');
    try {
      const mailOptions = {
        from: `"My EduPanel" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('--- Email safaltapoorvak nodemailer se bhej diya gaya! ---', info.messageId);
      return; // Success
    } catch (error) {
      console.error('--- Nodemailer se email bhejne mein error aaya ---:', error.message);
    }
  } else {
    console.log('--- Nodemailer transport not configured ---');
  }

  // --- If both methods fail ---
  console.error('--- EMAIL BHEJNE MEIN ERROR AAYA: Dono tareeke fail ho gaye ---');
  throw new Error('Email sending failed: Both Gmail API and nodemailer failed');
};

module.exports = sendEmail;