// File: app/admin/dashboard/layout.tsx (FINAL FIX)

"use client";

import React, { useState, useEffect } from 'react'; 
import { useRouter, usePathname } from 'next/navigation'; 
import Sidebar from '@/components/layout/Sidebar/Sidebar'; 
import styles from './layout.module.scss';
import { useAuth } from '@/app/context/AuthContext';
import { AdminLayoutProvider } from '@/app/context/AdminLayoutContext'; 
import { FiMenu, FiX } from 'react-icons/fi'; // Mobile menu icons
// ... (Menu Icons - No Change) ...
import { MdGridView, MdSchool } from 'react-icons/md'; 
import { FaLandmark } from 'react-icons/fa'; 
import { GiReceiveMoney } from 'react-icons/gi'; 
import { FiTag, FiList } from 'react-icons/fi'; 

// --- MENU ITEMS ARRAY (Now Decorative Only, Removed as prop) ---
// Note: This array is now removed from the component signature below.
// ... (menuItems definition waisa hi rahega ya hata diya jaayega) ...


// === NAYI LOGIC: Responsive Menu Toggle Component (No Change) ===
const MobileMenuButton: React.FC<{isOpen: boolean, toggle: () => void}> = ({ isOpen, toggle }) => {
    return (
        <button onClick={toggle} className={styles.menuToggleBtn}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
    );
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 1. CONDITIONAL RENDERING LOGIC (No Change)
  const isSchoolOrFeeRoute = 
        pathname.startsWith('/admin/school') ||
        pathname.startsWith('/admin/students') || 
        pathname.startsWith('/admin/teachers') ||
        pathname.startsWith('/admin/parents') ||
        pathname.startsWith('/admin/staff') ||
        pathname.startsWith('/admin/settings') ||
        pathname.startsWith('/admin/attendance') ||
        pathname.startsWith('/admin/academics') ||
        pathname.startsWith('/admin/timetable') ||
        pathname.startsWith('/admin/fee-counter');
                        
  const shouldRenderMainSidebar = !isSchoolOrFeeRoute;

  // ... (useEffect for Auth Check - No Change) ...
  useEffect(() => {
    if (!isLoading) {
      const isAdminOrSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
      if (!isAuthenticated) { router.push('/login'); } 
      else if (!isAdminOrSuperAdmin) { router.push('/login'); }
    }
  }, [isLoading, isAuthenticated, router, user]);
  
  // FIX: Route change hone par mobile sidebar band ho jaye
  useEffect(() => {
     setIsSidebarOpen(false);
  }, [pathname]);


  if (isLoading || !user) {
    return <div className={styles.loadingState}>Loading Admin Area...</div>; 
  }
  // ... (Auth Fail Check) ...

  
  return (
    <AdminLayoutProvider>
      {/* 1. Mobile Toggle Button */}
      {shouldRenderMainSidebar && <MobileMenuButton isOpen={isSidebarOpen} toggle={toggleSidebar} />}
      
      <div className={styles.container}>
        
        {/* 2. SIDEBAR RENDERING: FIX - menuItems prop hata diya */}
        {shouldRenderMainSidebar && (
             <Sidebar 
                // menuItems={[...menuItems]} <-- YEH LINE HATA DI GAYI
                className={`${isSidebarOpen ? styles.activeOnMobile : styles.hiddenOnMobile}`} 
                toggleSidebar={toggleSidebar} 
             />
        )}
        
        {/* 3. CONTENT AREA */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
      
    </AdminLayoutProvider>
  );
}