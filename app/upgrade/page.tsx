// File: app/upgrade/page.tsx (UPDATED)

"use client";

import React, { useState, useEffect } from 'react'; // useEffect add karein
import styles from './UpgradePage.module.scss';
import api from '@/backend/utils/api'; // Aapka path
import { useAuth } from '@/app/context/AuthContext'; 

declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

interface AppliedDiscount {
  newPrice: number;
  originalPrice: number;
  couponCode: string;
}

// === NAYA PLAN INTERFACE ===
interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const UpgradePage = () => {
  const { user } = useAuth(); 

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [couponMessage, setCouponMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // === NAYA STATE (PLAN KI DETAILS KE LIYE) ===
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  // ============================================

  // === NAYA useEffect (PLAN DETAILS FETCH KARNE KE LIYE) ===
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        // Hum poore plans nahi, sirf 'STARTER' plan ki details laayenge
        // Iske liye ek naya API route `/api/plans/:id` banana behtar hoga,
        // lekin abhi ke liye hum `/api/plans` se filter kar lete hain.
        const { data: plans } = await api.get('/plans');
        const starterPlan = plans.find((p: Plan) => p.id === 'STARTER');
        
        if (starterPlan) {
          // Features ko parse karein
          starterPlan.features = Array.isArray(starterPlan.features) 
            ? starterPlan.features 
            : JSON.parse(starterPlan.features || '[]');
          setPlanDetails(starterPlan);
        } else {
          throw new Error("Starter plan not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchPlanDetails();
  }, []);
  // ===============================================

  // === handleApplyCoupon (Bina Badlaav) ===
  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code.' });
      return;
    }
    setIsVerifyingCoupon(true);
    setCouponMessage(null);
    try {
      const { data } = await api.post('/payment/validate-coupon', {
        couponCode: couponCode
      });
      setAppliedDiscount(data);
      setCouponMessage({ type: 'success', text: data.message });
    } catch (error: any) {
      setAppliedDiscount(null);
      setCouponMessage({ 
        type: 'error', 
        text: error.response?.data?.message || "Coupon validation failed."
      });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  // === handlePayment (Bina Badlaav) ===
  const handlePayment = async () => {
    setIsPlacingOrder(true);
    try {
      const { data: order } = await api.post('/payment/create-order', {
        planName: 'STARTER',
        couponCode: appliedDiscount ? appliedDiscount.couponCode : undefined
      });

      const options = {
        key: order.key, 
        amount: order.amount, 
        currency: order.currency,
        name: "MyEduPanel",
        description: "Starter Plan - 1 Year Subscription",
        order_id: order.id,
        handler: function (response: any) {
          alert('Payment successful! We are verifying your payment and activating your plan.');
          window.location.href = '/admin/dashboard'; 
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        notes: {
          address: "MyEduPanel Corporate Office"
        },
        theme: {
          color: "#007bff"
        }
      };

      if (!window.Razorpay) {
        console.error("Razorpay script is not loaded");
        alert("Payment gateway is not available. Please refresh and try again.");
        setIsPlacingOrder(false); 
        return;
      }
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
          console.error('Payment Failed:', response.error.description);
          alert(`Payment Failed: ${response.error.description}`);
          setIsPlacingOrder(false); 
      });
      rzp.open();
      setIsPlacingOrder(false);

    } catch (error: any) {
      console.error("Payment failed:", error.response?.data?.message || error.message);
      alert(`Payment initiation failed: ${error.response?.data?.message || 'Please try again.'}`);
      setIsPlacingOrder(false);
    }
  };

  // === JSX UPDATE (DYNAMIC PRICE KE LIYE) ===
  if (isLoadingPlan) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Loading Payment Details...</div>
  }

  if (!planDetails) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Error: Could not load plan details. Please contact support.</div>
  }

  return (
    <div className={styles.upgradeContainer}>
      <div className={styles.upgradeBox}>
        <h2>Your Plan Has Expired</h2>
        <p>
          Please upgrade your plan to continue using all features of MyEduPanel.
        </p>
        <div className={styles.planDetails}>
          <h3>{planDetails.name}</h3>
          
          {/* === NAYA DYNAMIC PRICE === */}
          {appliedDiscount ? (
            <div className={styles.priceContainer}>
              <span className={styles.originalPrice}>
                ₹{appliedDiscount.originalPrice.toLocaleString('en-IN')}
              </span>
              <p className={styles.price}>
                ₹{appliedDiscount.newPrice.toLocaleString('en-IN')} <span>/ year</span>
              </p>
            </div>
          ) : (
            <div className={styles.priceContainer}>
              <p className={styles.price}>₹{planDetails.price.toLocaleString('en-IN')} <span>/ year</span></p>
            </div>
          )}
          {/* === END DYNAMIC PRICE === */}

          <ul>
            {/* Database se features dikhayein */}
            {planDetails.features.map((feature, index) => (
              <li key={index}>✓ {feature}</li>
            ))}
            {/* Aap aur bhi features hard-code kar sakte hain */}
          </ul>
        </div>
        
        {/* === COUPON SECTION (Bina Badlaav) === */}
        <div className={styles.couponSection}>
          <input 
            type="text" 
            placeholder="Have a coupon code?"
            className={styles.couponInput}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={isVerifyingCoupon || !!appliedDiscount} 
          />
          <button 
            className={styles.applyButton} 
            onClick={handleApplyCoupon}
            disabled={isVerifyingCoupon || !!appliedDiscount} 
          >
            {isVerifyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {couponMessage && (
          <div className={`${styles.couponMessage} ${couponMessage.type === 'success' ? styles.success : styles.error}`}>
            {couponMessage.text}
          </div>
        )}
        {/* === END COUPON SECTION === */}

        <button 
          className={styles.buyButton} 
          onClick={handlePayment}
          disabled={isPlacingOrder || isVerifyingCoupon} 
        >
          {isPlacingOrder ? 'Processing...' : `Buy Now & Activate`}
        </button>
      </div>
    </div>
  );
};

export default UpgradePage;