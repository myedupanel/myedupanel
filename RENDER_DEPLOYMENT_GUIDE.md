# Render Deployment Guide for MyEduPanel

## Overview
This guide will help you deploy both the frontend (Next.js) and backend (Node.js/Express) of your MyEduPanel application to Render.

## Prerequisites
1. Render account
2. GitHub account with the repository
3. All environment variables ready

## Backend Deployment

### Step 1: Configure Render Services
The application uses a [render.yaml](file:///Users/apple/Documents/myedupanel/MyEduPanel/render.yaml) file that defines two services:
1. Frontend service (Next.js)
2. Backend service (Node.js/Express)

### Step 2: Environment Variables
In the Render dashboard, you'll need to set the following environment variables for the backend service:

#### Database Configuration
- `DATABASE_URL` - Your MySQL database connection string

#### Security
- `JWT_SECRET` - Your JWT secret key
- `FRONTEND_URL` - Your frontend URL (e.g., `https://myedupanel.onrender.com`)

#### Cloud Services
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `GEMINI_API_KEY` - Your Google Gemini API key

#### Email Configuration
Either Gmail API configuration:
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REDIRECT_URI`
- `GMAIL_REFRESH_TOKEN`

Or SMTP configuration:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

#### Payment Processing
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Frontend Deployment

### Environment Variables
For the frontend service, set:
- `NEXT_PUBLIC_API_URL` - Your deployed backend URL (e.g., `https://myedupanel-backend.onrender.com`)

## Deployment Process

### Automatic Deployment
1. Connect your GitHub repository to Render
2. Render will automatically detect the services from render.yaml
3. Environment variables need to be set manually in the Render dashboard
4. Deployments will automatically trigger on pushes to the main branch

### Manual Deployment
1. Push your code to GitHub
2. In Render dashboard, manually trigger a deployment

## Post-Deployment Verification

### Test Backend
1. Visit your backend URL in a browser: `https://your-backend-service.onrender.com/`
2. You should see: "SchoolPro Backend is running (Prisma Version)!"

### Test Frontend Login
1. Visit your frontend URL
2. Try to log in with valid credentials
3. Check browser console for any errors

## Troubleshooting

### Common Issues

1. **404 Errors on API Calls**
   - Ensure backend is deployed and running
   - Check that `NEXT_PUBLIC_API_URL` is set correctly in frontend environment variables
   - Verify backend URL is accessible

2. **Database Connection Issues**
   - Ensure `DATABASE_URL` is correctly set in backend environment variables
   - Check that your database is accessible from Render (may need to whitelist Render IPs)

3. **Environment Variables Not Found**
   - Double-check all environment variables are set in Render dashboard
   - Restart deployment after adding variables

4. **CORS Errors**
   - Check that `FRONTEND_URL` is set correctly in backend environment variables
   - Ensure your frontend domain is in the allowedOrigins array in server.js

### Checking Deployment Logs
1. In Render dashboard, go to your service
2. Click on the latest deployment
3. View logs to see any errors during build or runtime

## Environment Variables Summary

### Backend Required Variables
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- Email configuration (Gmail API or SMTP)
- Razorpay configuration
- `NODE_ENV` (automatically set to "production")

### Frontend Required Variables
- `NEXT_PUBLIC_API_URL` (set to your backend deployment URL)

## Need Help?
If you encounter issues:
1. Check Render deployment logs
2. Verify all environment variables are set
3. Ensure your database is accessible from Render
4. Confirm backend is deployed and running before testing frontend