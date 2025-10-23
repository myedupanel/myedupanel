const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('--- Email bhejne ki koshish ho rahi hai... ---'); // Message 1
  console.log('Bhejne wale ka Email:', process.env.SMTP_USER);
  console.log('Bhejne wale ka Pass:', process.env.SMTP_PASS ? 'Password Hai' : 'Password Nahi Hai');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT, // Yeh Render se '587' uthayega
    
    // --- YAHAN BADLAAV KIYA GAYA HAI ---
    secure: false, // Port 587 ke liye 'false' hona zaroori hai
    
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `SchoolPro <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.response); // Message 2
  } catch (error) {
    console.error('--- EMAIL BHEJNE MEIN ERROR AAYA ---:', error); // Message 3
    // Error ko aage bhi bhejein taaki main route ko pata chale
    throw new Error('Email sending failed'); 
  }
};

module.exports = sendEmail;