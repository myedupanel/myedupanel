# Environment Variables for Vercel Deployment

## Database Configuration
- `DATABASE_URL` - MySQL connection string

## Authentication
- `JWT_SECRET` - Secret key for JWT token generation

## Cloud Services
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## AI Services
- `GEMINI_API_KEY` - Google Gemini API key

## Email Services (Gmail API - Primary)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI
- `GOOGLE_REFRESH_TOKEN` - Google OAuth refresh token
- `ADMIN_EMAIL` - Admin email address for sending emails

## Email Services (SMTP - Fallback)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_SECURE` - Whether to use SSL/TLS (true/false)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

## Payment Services (Razorpay)
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay key secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret
- `MY_RAZORPAY_LINKED_ACCOUNT_ID` - Razorpay linked account ID (optional)

## Application Settings
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (optional, Vercel will set automatically)
- `FRONTEND_URL` - Frontend URL for CORS

## Additional Notes
1. Make sure to set `NODE_ENV` to `production` in Vercel
2. The `DATABASE_URL` should point to your MySQL database
3. All sensitive information should be stored as environment variables in Vercel, not in code
4. After setting these variables, redeploy your application for changes to take effect