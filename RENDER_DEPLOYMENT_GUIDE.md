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