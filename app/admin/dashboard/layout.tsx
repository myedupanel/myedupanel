// --- YEH LINE ADD KAREIN ---
"use client"; // Kynuki hum hooks (useState, useEffect, useAuth) use karenge

import React, { useEffect } from 'react'; // useEffect ko import karein
import { useRouter } from 'next/navigation'; // useRouter ko import karein
import Sidebar from '@/components/layout/Sidebar/Sidebar';
import styles from './layout.module.scss';
import { MdDashboard, MdSchool } from 'react-icons/md';
// --- YEH LINE ADD KAREIN ---
import { useAuth } from '@/app/context/AuthContext'; // AuthContext ko import karein

const mainMenuItems = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: <MdDashboard /> },
  { title: 'School', path: '/admin/school', icon: <MdSchool /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // --- YEH CODE ADD KIYA GAYA HAI ---
  const { isAuthenticated, isLoading, user } = useAuth(); // AuthContext se state nikaalein
  const router = useRouter();

  useEffect(() => {
    // Check karein jab loading poori ho jaaye
    if (!isLoading) {
      // Agar user authenticated nahi hai, toh login page par bhejein
      if (!isAuthenticated) {
        router.push('/login');
      } 
      // Optional Check: Agar user authenticated hai lekin role 'admin' nahi hai
      else if (user?.role !== 'admin') {
         // Agar role admin nahi hai, toh shayad unke specific dashboard par bhejna chahiye ya error dikhana chahiye
         // Abhi ke liye hum unhe login page par bhej dete hain
         console.warn("User is authenticated but not an admin. Redirecting to login.");
         router.push('/login'); 
      }
    }
  }, [isLoading, isAuthenticated, router, user]); // Dependency array ko update karein

  // Jab tak AuthContext load ho raha hai, kuch na dikhayein ya loading spinner dikhayein
  if (isLoading) {
    // Aap yahan ek accha sa loading component dikha sakte hain
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  // Agar user authenticated nahi hai (ya role galat hai), toh children ko render na karein
  // Yeh redirect hone tak ek blank screen dikhayega
  if (!isAuthenticated || user?.role !== 'admin') {
     return null; // Ya <div className={styles.loadingState}>Redirecting...</div>;
  }
  // --- END ADDED CODE ---

  // Agar loading poori ho gayi hai aur user authenticated hai (aur admin hai), toh layout dikhayein
  return (
    <div className={styles.container}>
      <Sidebar menuItems={mainMenuItems} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}