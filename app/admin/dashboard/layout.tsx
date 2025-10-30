// app/admin/layout.tsx

"use client"; // Kynuki hum hooks (useState, useEffect, useAuth) use karenge

import React, { useEffect } from 'react'; // useEffect ko import karein
import { useRouter } from 'next/navigation'; // useRouter ko import karein
import Sidebar from '@/components/layout/Sidebar/Sidebar';
import styles from './layout.module.scss';
import { MdDashboard, MdSchool } from 'react-icons/md';
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
  const { isAuthenticated, isLoading, user } = useAuth(); // AuthContext se state nikaalein
  const router = useRouter();

  useEffect(() => {
    // Check karein jab loading poori ho jaaye
    if (!isLoading) {
      // Agar user authenticated nahi hai, toh login page par bhejein
      if (!isAuthenticated) {
        router.push('/login');
      } 
      // FIX: Check ko 'admin' (lowercase) se 'Admin' (uppercase) kiya
      else if (user?.role !== 'Admin') { 
         console.warn(`User is authenticated but role is "${user?.role}", not "Admin". Redirecting.`);
         router.push('/login'); 
      }
      // Agar role 'Admin' hai, toh kuch nahi hoga aur user dashboard par rahega.
    }
  }, [isLoading, isAuthenticated, router, user]); // Dependency array ko update karein

  // Jab tak AuthContext load ho raha hai, loading spinner dikhayein
  if (isLoading) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }

  // Agar user authenticated nahi hai (ya role galat hai), toh children ko render na karein
  if (!isAuthenticated || user?.role !== 'Admin') { // FIX: Yahaan bhi check ko 'Admin' kiya
     return <div className={styles.loadingState}>Redirecting...</div>;
  }
  
  // Agar loading poori ho gayi hai aur user authenticated hai (aur Admin hai), toh layout dikhayein
  return (
    <div className={styles.container}>
      <Sidebar menuItems={mainMenuItems} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}