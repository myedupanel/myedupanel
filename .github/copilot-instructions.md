# Project Guidelines

## Code Style
- Use SCSS modules per component (e.g., `Component.tsx` + `Component.module.scss`)
- TypeScript interfaces for data models, see [components/types/fees.ts](components/types/fees.ts) for pattern with numeric IDs
- File path aliases: `@/backend/*` and `@/*` defined in [tsconfig.json](tsconfig.json)

## Architecture
- **Frontend-Backend Separation**: Direct API calls to backend (NOT Next.js rewrites) due to Vercel deployment requirements. Use configured `api` instance from [backend/utils/api.ts](backend/utils/api.ts) for auth-protected routes.
- **Database**: Prisma ORM with MySQL, schema in [prisma/schema.prisma](prisma/schema.prisma). Global client in dev, fresh instance in prod ([backend/config/prisma.js](backend/config/prisma.js)).
- **State Management**: Context API for user auth, academic year, and role-specific layouts.
- **Real-time**: Socket.IO for live updates (fees, attendance).
- **Authentication**: JWT-based with trial system (14-day free trial, then subscription required).

## Build and Test
- `npm run dev`: Start frontend (localhost:3000) + backend (5000) separately
- `npm run build`: Build Next.js for production
- `npm run build:backend`: Install backend deps + generate Prisma
- `npm run test:vercel-backend`: Verify backend deployed to Vercel
- `cd backend && npx prisma db push`: Sync schema to MySQL

## Conventions
- **API Calls**: Always use `import api from '@/backend/utils/api'` instead of direct axios (includes auth interceptors)
- **Environment Variables**: Frontend only `NEXT_PUBLIC_*`, backend any name. Critical vars: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, etc. (see [VERCEL_ENV_VARIABLES.md](VERCEL_ENV_VARIABLES.md))
- **Error Handling**: Interceptors redirect to /login on 401, /upgrade on 403
- **Prisma Operations**: Use transactions for multi-model changes (e.g., signup creates School + User + Plan)

See [FIX_SUMMARY.md](FIX_SUMMARY.md) for critical deployment issues and [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) for complete deployment steps.</content>
<parameter name="filePath">e:\SK WEB CREATAR\myedupanal\myedupanel\.github\copilot-instructions.md