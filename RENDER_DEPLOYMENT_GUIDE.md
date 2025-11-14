# Render Deployment Guide

This guide explains how to deploy the MyEduPanel backend to Render.

## Prerequisites

1. A Render account
2. A MySQL database (you can use Render's database service or any external provider)
3. All required environment variables set in Render dashboard

## Deployment Steps

1. Fork this repository to your GitHub account (if not already done)
2. Go to Render Dashboard (https://dashboard.render.com)
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: `myedupanel-backend`
   - Region: `Oregon` (or your preferred region)
   - Branch: `main` (or your preferred branch)
   - Root Directory: `/` (important: keep root as `/`, not `/backend`)
   - Runtime: `Node`
   - Build Command: `cd backend && npm install && npx prisma generate && npx prisma db push --accept-data-loss`
   - Start Command: `cd backend && npm start`
   - Plan: `Starter` (or higher based on your needs)

## Environment Variables

Set the following environment variables in the Render dashboard:

- `NODE_ENV`: `production`
- `DATABASE_URL`: Your MySQL database connection string
- `JWT_SECRET`: Your JWT secret key
- `GOOGLE_CLIENT_ID`: (Optional) For Gmail integration
- `GOOGLE_CLIENT_SECRET`: (Optional) For Gmail integration
- `GOOGLE_REFRESH_TOKEN`: (Optional) For Gmail integration
- `SMTP_HOST`: (Optional) For SMTP email service
- `SMTP_PORT`: (Optional) For SMTP email service
- `SMTP_USER`: (Optional) For SMTP email service
- `SMTP_PASS`: (Optional) For SMTP email service
- `CLOUDINARY_CLOUD_NAME`: (Optional) For image storage
- `CLOUDINARY_API_KEY`: (Optional) For image storage
- `CLOUDINARY_API_SECRET`: (Optional) For image storage
- `GEMINI_API_KEY`: (Optional) For AI features
- `RAZORPAY_KEY_ID`: (Optional) For payment processing
- `RAZORPAY_KEY_SECRET`: (Optional) For payment processing
- `FRONTEND_URL`: Your frontend URL (e.g., https://myedupanel.com)

## Important Notes

1. The database schema will be automatically synchronized during deployment thanks to the `npx prisma db push --accept-data-loss` command in the build process.

2. Make sure your `DATABASE_URL` is correctly formatted:
   ```
   mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   ```

3. The application will run on the port specified by the `PORT` environment variable, defaulting to 10000 if not set.

4. If you're using Render's database service, make sure to use the external connection string, not the internal one.

## Troubleshooting

1. If the build fails, check that all environment variables are correctly set.

2. If the application fails to start, check the logs for database connection errors.

3. Make sure your database is accessible from Render (firewall settings, etc.).

4. If you encounter Prisma client issues, try restarting the service after a successful build.