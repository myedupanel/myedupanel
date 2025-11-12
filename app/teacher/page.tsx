// app/teacher/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const router = useRouter();

  useEffect(() => {
    // Teacher dashboard par redirect karein
    router.push('/teacher/dashboard');
  }, [router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Redirecting to your dashboard...
    </div>
  );
}