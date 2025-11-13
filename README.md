This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result. (Note: Port may vary if 3000/3001 is in use)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## New Features

### Admin Assistant ChatBot
We've added a professional AI-powered chatbot to the admin dashboard with the following features:
- Multilingual support - responds in the same language as user questions
- Voice input - speak questions using the microphone button
- Voice output - bot speaks responses using text-to-speech
- Step-by-step guidance for admin tasks
- Professional UI with animated robot interface
- Contextual previews for complex tasks

To access the chatbot, log in as an admin and navigate to the dashboard. Click the floating chat icon in the bottom-right corner.

## Deployment to Vercel

### Frontend Deployment
1. Create a new project in Vercel
2. Connect your GitHub repository
3. Set the root directory to `/` (root of the repository)
4. Vercel will automatically detect it's a Next.js application
5. Add the required environment variables from `VERCEL_ENV_VARIABLES.md`
6. Deploy the project

### Backend Deployment
1. Create a new project in Vercel
2. Connect your GitHub repository
3. Set the root directory to `/backend`
4. Vercel will use the `vercel.json` configuration file
5. Add the required environment variables from `VERCEL_ENV_VARIABLES.md`
6. Deploy the project

### Environment Variables
Refer to `VERCEL_ENV_VARIABLES.md` for a complete list of environment variables that need to be configured in the Vercel dashboard.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.