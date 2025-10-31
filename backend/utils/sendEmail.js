// Naya utils/sendEmail.js (Bina Nodemailer ke)

const { google } = require('googleapis');

// 1. Apni saari Google keys Environment se lein
// --- YEH HAI AAPKA FIX (Line 7) ---
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // FIX: 'CLIENTid' ko 'CLIENT_ID' kiya
// --- END FIX ---
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // Yeh "From" email address hai

// 2. Google ka OAuth2 client set karein
// --- YEH HAI AAPKA FIX (Line 15) ---
// Ab 'CLIENT_ID' variable mein sahi value aayegi
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// --- END FIX ---
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// 3. YEH NAYA FUNCTION HAI: Email ko Base64 format mein convert karne ke liye
function createEmailMessage(options) {
  // Email ke headers
  const emailLines = [
    `From: "My EduPanel" <${ADMIN_EMAIL}>`, // Bhejne waale ka naam
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/html; charset=utf-8', // Hum HTML email bhej rahe hain
    'MIME-Version: 1.0',
    '', // Headers aur body ke beech ek blank line zaroori hai
    options.html, // Aapka HTML content
  ];

  const email = emailLines.join('\r\n');

  // Email ko Base64URL format mein encode karein jo API ko chahiye
  const base64EncodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64EncodedEmail;
}


// 4. YEH HAMARA MAIN FUNCTION HAI (UPDATE HO GAYA)
const sendEmail = async (options) => {
  console.log('--- Email (Seedha Gmail API se) bhejne ki koshish... ---');

  try {
    // 5. Har baar email bhejne se pehle ek naya "Access Token" haasil karein
    // Check karein ki keys maujood hain ya nahi
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error('Google API credentials missing from environment variables.');
    }
    
    const { token: accessToken } = await oAuth2Client.getAccessToken();

    if (!accessToken) {
      throw new Error('Access Token nahi mila');
    }
    
    // Auth object ko update karein naye token ke saath (best practice)
    oAuth2Client.setCredentials({ access_token: accessToken });

    // 6. Gmail API client ko taiyaar karein
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // 7. Email message ko Base64 mein convert karein
    const rawMessage = createEmailMessage(options);

    // 8. Email Bhejein! (Nodemailer ki jagah seedha API call)
    const info = await gmail.users.messages.send({
      userId: 'me', // 'me' ka matlab hai woh user jiska token hai (ADMIN_EMAIL)
      requestBody: {
        raw: rawMessage, // Yahaan hum apna Base64 email de rahe hain
      },
    });

    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.data);
  
  } catch (error) {
    // Error ko aache se log karein
    console.error('--- EMAIL BHEJNE MEIN ERROR AAYA ---:', error.response ? error.response.data : error.message);
    // Agar refresh token expire ho gaya hai toh specific error dein
    if (error.response?.data?.error === 'invalid_grant') {
         console.error(">>> FATAL: Google Refresh Token expire ho gaya hai. Please naya token generate karein. <<<");
         throw new Error('Email Refresh Token expired.');
    }
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;