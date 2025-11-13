# Vercel Deployment Checklist

## Pre-deployment Tasks

### Backend Preparation
- [ ] Created `vercel.json` configuration file in `/backend` directory
- [ ] Updated `next.config.js` to point to new Vercel backend URL
- [ ] Verified all required environment variables are documented in `VERCEL_ENV_VARIABLES.md`

### Environment Variables Setup
- [ ] `DATABASE_URL` - MySQL connection string
- [ ] `JWT_SECRET` - Secret key for JWT token generation
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `GOOGLE_REDIRECT_URI` - Google OAuth redirect URI
- [ ] `GOOGLE_REFRESH_TOKEN` - Google OAuth refresh token
- [ ] `ADMIN_EMAIL` - Admin email address for sending emails
- [ ] `SMTP_HOST` - SMTP server host
- [ ] `SMTP_PORT` - SMTP server port
- [ ] `SMTP_SECURE` - Whether to use SSL/TLS (true/false)
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password
- [ ] `RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay key secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret
- [ ] `MY_RAZORPAY_LINKED_ACCOUNT_ID` - Razorpay linked account ID (optional)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `FRONTEND_URL` - Frontend URL for CORS

## Vercel Deployment Steps

### Backend Deployment
- [ ] Create new project in Vercel
- [ ] Connect GitHub repository
- [ ] Set root directory to `/backend`
- [ ] Verify `vercel.json` is detected
- [ ] Add all environment variables from checklist above
- [ ] Deploy and monitor build logs
- [ ] Verify deployment URL works: `https://your-backend-project.vercel.app/`

### Frontend Deployment
- [ ] Create new project in Vercel (or use existing)
- [ ] Connect GitHub repository
- [ ] Set root directory to `/` (root of repository)
- [ ] Verify Next.js is detected automatically
- [ ] Update environment variables if needed
- [ ] Deploy and monitor build logs
- [ ] Verify deployment URL works

## Post-deployment Verification

### Backend Testing
- [ ] Visit backend URL in browser - should see "SchoolPro Backend is running (Prisma Version)!"
- [ ] Test API endpoints using Postman or curl
- [ ] Verify database connection works
- [ ] Test authentication endpoints
- [ ] Verify file upload functionality (Cloudinary)
- [ ] Test email functionality
- [ ] Verify payment integration (Razorpay)

### Frontend Testing
- [ ] Visit frontend URL in browser
- [ ] Test login functionality
- [ ] Verify API calls are reaching backend
- [ ] Test all major features (students, teachers, fees, etc.)
- [ ] Verify file uploads work
- [ ] Test email notifications
- [ ] Verify payment processing

## Troubleshooting

### Common Issues
1. **Environment Variables Not Set**: Check Vercel dashboard for missing variables
2. **Database Connection**: Ensure database is accessible from Vercel IPs
3. **CORS Errors**: Verify `FRONTEND_URL` is correctly set
4. **File Upload Issues**: Check Cloudinary configuration
5. **Email Not Sending**: Verify Gmail API or SMTP settings

### Vercel Specific Issues
1. **Build Failures**: Check build logs in Vercel dashboard
2. **Function Timeouts**: Optimize database queries or increase timeout settings
3. **Memory Issues**: Check for memory leaks in application code
4. **Cold Starts**: This is normal for serverless functions

## Rollback Plan

If issues are encountered:
1. Revert `next.config.js` changes to point back to Render backend
2. Document issues encountered
3. Fix issues and redeploy
4. Update DNS records if needed