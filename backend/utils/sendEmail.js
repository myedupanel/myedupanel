// File: backend/utils/sendEmail.js (FINAL WORKING SMTP FIX - Brevo/SendGrid)

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('--- Email (SendGrid/Brevo SMTP) bhejne ki koshish... ---');

  // Environment variables fetch karein
  const EMAIL_HOST = process.env.EMAIL_HOST; 
  const EMAIL_PORT = process.env.EMAIL_PORT; 
  const EMAIL_USER = process.env.EMAIL_USER; 
  const EMAIL_PASS = process.env.EMAIL_PASS; 

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      console.error('--- EMAIL FAILED ---: SendGrid/Brevo credentials missing.');
      // Yahaan par code ko turant return karna chahiye taki Node ka event loop block na ho
      throw new Error('Email sending failed: Credentials incomplete.');
  }

  try {
    // Nodemailer Transporter set करें (SMTP का उपयोग)
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST, 
      port: Number(EMAIL_PORT),
      secure: false, // Port 587 ke liye sahi hai, yeh STARTTLS ka upyog karega
      auth: {
        user: EMAIL_USER, // Brevo/SendGrid mein yeh verified email hota hai ya 'apikey'
        pass: EMAIL_PASS, // API Key
      },
      // Timeout ko स्पष्ट रूप से set karein (Debugging ke liye zaroori)
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    // Email options taiyar करें
    const mailOptions = {
      from: `"${options.from || 'My EduPanel'}" <${EMAIL_USER}>`, 
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Email भेजनें के लिए प्रतीक्षा करें
    const info = await transporter.sendMail(mailOptions);

    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.response);
  
  } catch (error) {
    console.error('--- CRITICAL EMAIL FAILURE ---:', error.message);
    // Connection timeout ya authentication fail hone par
    throw new Error(`Email delivery failed: Connection/Auth failed. Please check HOST/PORT/KEY.`);
  }
};

module.exports = sendEmail;