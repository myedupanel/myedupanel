import type { Metadata } from "next";
// ===== BADLAV 1: 'Geist' ko 'Inter' se replace kiya gaya hai =====
import { Inter } from "next/font/google";
import "./globals.scss";
import { AuthProvider } from './context/AuthContext';

// ===== BADLAV 2: 'Inter' font ko setup kiya gaya hai =====
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
      {/* ===== BADLAV 3: Naya font `body` par apply kiya gaya hai ===== */}
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}