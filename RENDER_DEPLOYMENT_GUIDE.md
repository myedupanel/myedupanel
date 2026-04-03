<<<<<<< HEAD
# Render Deployment Configuration

This project is configured for deployment on Render with the following setup:

## Backend Configuration
- **Root Directory**: `/Users/apple/Desktop/myedupanel/MyEduPanel`
- **Build Command**: `npm run predeploy`
- **Start Command**: `cd backend && npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `DATABASE_URL` (PostgreSQL/MySQL connection string)
  - `JWT_SECRET` (for authentication)
  - `FRONTEND_URL` (your frontend URL)
  - `EMAIL_*` variables for email service

## Frontend Configuration (Next.js)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: Process.env.PORT or 3000

## Deployment Steps for Render:

### 1. For Backend Service (Node.js)
```
Build Command: npm run predeploy
Start Command: cd backend && npm start
Environment:
- NODE_ENV=production
- DATABASE_URL=your_database_connection_string
- JWT_SECRET=your_jwt_secret
- FRONTEND_URL=https://your-frontend-url.onrender.com
```

### 2. For Frontend Service (Next.js)
```
Build Command: npm run build
Start Command: npm start
Environment:
- NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
```

## Important Notes:
1. Make sure to run `npx prisma generate` during the build process
2. The Prisma client is properly initialized in production mode
3. Database connection is established before the server starts
4. Health check endpoint available at `/health`
5. Graceful shutdown handlers are implemented

## Troubleshooting:
- If you encounter Prisma client errors, ensure `npx prisma generate` runs in the build process
- Check that your DATABASE_URL is properly formatted for your database provider
- Verify that JWT_SECRET is set in production environment
- Monitor logs for database connection issues

## Post-Deployment:
1. Verify the `/health` endpoint returns status OK
2. Test the parent dashboard functionality
3. Ensure automated onboarding works properly
4. Verify real-time features operate correctly
=======
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
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
