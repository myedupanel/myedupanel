// File: app/superadmin/layout.tsx

"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext'; // !! Apna AuthContext ka path check karein
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Agar loading chal rahi hai, toh intezaar karein
    if (isLoading) {
      return;
    }

    // Agar user logged-in nahi hai, ya user 'SuperAdmin' nahi hai
    if (!user || user.role !== 'SuperAdmin') {
      // Use normal admin dashboard par bhej dein
      router.push('/admin/dashboard');
    }
    
  }, [user, isLoading, router]);

  // Jab tak loading ho rahi hai, ya user verify ho raha hai
  if (isLoading || !user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading & Verifying Access...
      </div>
    );
  }

  // Agar user SuperAdmin hai, toh page dikhayein
  if (user.role === 'SuperAdmin') {
    return <>{children}</>;
  }

  // Fallback (Jab redirect ho raha ho)
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting...
    </div>
  );
}