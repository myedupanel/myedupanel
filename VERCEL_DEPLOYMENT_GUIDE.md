# Vercel Deployment Guide for MyEduPanel

## Overview
This guide will help you deploy both the frontend (Next.js) and backend (Node.js/Express) of your MyEduPanel application to Vercel.

## Prerequisites
1. Vercel account
2. GitHub account with the repository
3. All environment variables ready (see VERCEL_ENV_VARIABLES.md)

## Backend Deployment

### Step 1: Create Backend Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set the **Root Directory** to `backend`
5. Vercel should automatically detect it's a Node.js project

### Step 2: Configure Environment Variables
In the Vercel project settings, add all required environment variables:
- `DATABASE_URL` - Your MySQL database connection string
- `JWT_SECRET` - Your JWT secret key
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `GEMINI_API_KEY` - Your Google Gemini API key
- Email configuration (Gmail API or SMTP)
- Razorpay configuration

### Step 3: Deploy
Click "Deploy" and wait for the build to complete.

## Frontend Deployment

### Step 1: Create Frontend Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Set the **Root Directory** to `/` (root of repository)
5. Vercel should automatically detect it's a Next.js project

### Step 2: Configure Environment Variables
Add the following environment variable:
- `NEXT_PUBLIC_API_URL` - Set to your deployed backend URL (e.g., `https://myedupanel-backend.vercel.app`)

### Step 3: Deploy
Click "Deploy" and wait for the build to complete.

## Post-Deployment Verification

### Test Backend
1. Visit your backend URL in a browser: `https://your-backend-project.vercel.app/`
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
   - Check that your database is accessible from Vercel (may need to whitelist Vercel IPs)

3. **Environment Variables Not Found**
   - Double-check all environment variables are set in Vercel dashboard
   - Restart deployment after adding variables

4. **CORS Errors**
   - Check that `FRONTEND_URL` is set correctly in backend environment variables
   - Ensure your frontend domain is in the allowedOrigins array in server.js

### Checking Deployment Logs
1. In Vercel dashboard, go to your project
2. Click on the latest deployment
3. View logs to see any errors during build or runtime

## Environment Variables Summary

### Backend Required Variables
- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- Gmail API or SMTP configuration
- Razorpay configuration
- `NODE_ENV` (set to "production")

### Frontend Required Variables
- `NEXT_PUBLIC_API_URL` (set to your backend deployment URL)

## Need Help?
If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Ensure your database is accessible from Vercel
4. Confirm backend is deployed and running before testing frontend