// backend/utils/sendEmail.js
const { google } = require('googleapis');

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

// --- Main SendEmail Function (Updated) ---
const sendEmail = async (options) => {
  console.log('--- Email (Seedha Gmail API se) bhejne ki koshish... ---');

  // --- YEH HAI PERMANENT FIX ---
  // Saari keys aur OAuth client ko function ke ANDAR initialize karein
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  // Ab hum pehle check kar sakte hain ki keys load hui ya nahi
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN || !ADMIN_EMAIL) {
      console.error('--- EMAIL BHEJNE MEIN ERROR AAYA ---: Google API credentials (ID, Secret, Redirect URI, Refresh Token, ya Admin Email) environment variables mein missing hain.');
      throw new Error('Email sending failed: Server configuration incomplete.');
  }

  // Client ko ab yahaan (function ke andar) banayein
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  // --- END FIX ---

  try {
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

    console.log('--- Email safaltapoorvak bhej diya gaya! ---', info.data);
  
  } catch (error) {
    // Error ko aache se log karein
    console.error('--- EMAIL BHEJNE MEIN ERROR AAYA ---:', error.response ? error.response.data : error.message);
    if (error.response?.data?.error === 'invalid_grant') {
         console.error(">>> FATAL: Google Refresh Token expire ho gaya hai. Please naya token generate karein. <<<");
         throw new Error('Email Refresh Token expired.');
    }
    throw new Error('Email sending failed');
  }
};

module.exports = sendEmail;