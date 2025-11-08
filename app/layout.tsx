import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // Import next/script
import "./globals.scss";
import { AuthProvider } from './context/AuthContext';
// === FIX 1: ThemeProvider import karein ===
import { ThemeProvider } from './context/ThemeContext';


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
      {/* body tag ko chhod dein, kyunki ThemeContext khud hi class add kar dega */}
      <body className={inter.className}>
        {/* === FIX 2: ThemeProvider ko AuthProvider ke upar wrap karein === */}
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {/* === END FIX === */}
      </body>
    </html>
  );
}