const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// 1. Apni saari Google keys Environment se lein
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// 2. Google ka OAuth2 client set karein
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sendEmail = async (options) => {
  console.log('--- Email (Gmail API) bhejne ki koshish ho rahi hai... ---');
  
  try {
    // 3. Har baar email bhejne se pehle ek naya "Access Token" haasil karein
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // 4. Nodemailer ko batayein ki hum 'OAuth2' istemaal kar rahe hain
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: ADMIN_EMAIL, // Aapka email
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken, // Naya access token
      },
    });

    const mailOptions = {
      from: `MyEduPanel <${ADMIN_EMAIL}>`, // Bhejne wale ka naam aur email
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // 5. Email Bhejein!
    const info = await transporter.sendMail(mailOptions);
    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.response);
  } catch (error) {
    console.error('--- EMAIL BHEJNE MEIN ERROR AAYA ---:', error);
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;