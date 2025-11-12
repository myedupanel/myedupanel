// File: app/layout.tsx (Updated)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.scss";
import { AuthProvider } from './context/AuthContext';
import { AcademicYearProvider } from './context/AcademicYearContext';

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
        <AuthProvider>
          <AcademicYearProvider>
            {children}
          </AcademicYearProvider>
        </AuthProvider>
      </body>
    </html>
  );
}