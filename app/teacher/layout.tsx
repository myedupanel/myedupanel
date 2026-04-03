// app/teacher/layout.tsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TeacherLayout({
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

    // Agar user logged-in nahi hai, ya user 'Teacher' nahi hai
    if (!user || user.role !== 'Teacher') {
      // Login page par bhej dein
      router.push('/login');
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

  // Agar user Teacher hai, toh page dikhayein
  if (user.role === 'Teacher') {
    return <>{children}</>;
  }

  // Fallback (Jab redirect ho raha ho)
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting...
    </div>
  );
}