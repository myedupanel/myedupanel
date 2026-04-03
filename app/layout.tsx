// File: app/layout.tsx (Updated)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.scss";
import { AuthProvider } from './context/AuthContext';
<<<<<<< HEAD
import AppWrapper from '@/components/AppWrapper';
=======
import { AcademicYearProvider } from './context/AcademicYearContext';
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyEduPanel",
  description: "Manage your school with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Add the Razorpay Checkout script.
          We set strategy="lazyOnload" so it doesn't block page loading.
        */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body className={inter.className}>
<<<<<<< HEAD
        <AuthProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
=======
        <AuthProvider> 
          <AcademicYearProvider>
            {children}
          </AcademicYearProvider>
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
        </AuthProvider>
      </body>
    </html>
  );
}