"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Yeh component user ko automatically Fee Dashboard par bhej dega
const FeeCounterRedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Jaise hi yeh page load ho, user ko '/admin/fee-counter/fee-dashboard' par redirect kar do
    router.replace('/admin/fee-counter/fee-dashboard');
  }, [router]);

  // Jab tak redirect ho raha hai, ek loading message dikhayein
  return <div>Loading Fee Counter...</div>;
};

export default FeeCounterRedirectPage;