"use client";

import React, { useState, useEffect } from 'react';
import styles from './UpgradePage.module.scss';
import api from '@/backend/utils/api'; 
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

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const UpgradePage = () => {
  const { user } = useAuth(); 

  // States (Bina Badlaav)
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [couponMessage, setCouponMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Plan Details States (Bina Badlaav)
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  // === NAYA STATE: User ke expiration status ke liye ===
  const [isExpired, setIsExpired] = useState(false);
  // ====================================================

  // === NAYA useEffect: User ka status check karne ke liye ===
  useEffect(() => {
    // Check karein ki user hai aur uska planExpiryDate hai
    if (user && user.planExpiryDate) {
      const expiryDate = new Date(user.planExpiryDate);
      const today = new Date();
      
      // Agar expiry date aaj se pehle ki hai, toh user expired hai
      if (expiryDate < today) {
        setIsExpired(true);
      }
    }
    // Note: Agar user.planExpiryDate ka naam kuch aur hai, toh usey yahaan update karein.
  }, [user]); // Yeh tab run hoga jab 'user' ki details load hongi
  // =========================================================

  // === Plan details fetch karna (Bina Badlaav) ===
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const { data: plans } = await api.get('/plans');
        const starterPlan = plans.find((p: Plan) => p.id === 'STARTER');
        
        if (starterPlan) {
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

  // === JSX UPDATE (Loading aur Error state) ===
  if (isLoadingPlan) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Loading Payment Details...</div>
  }

  if (!planDetails) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Error: Could not load plan details. Please contact support.</div>
  }

  // === MUKHYA JSX (Smart Logic ke saath) ===
  return (
    <div className={styles.upgradeContainer}>
      <div className={styles.upgradeBox}>
        
        {/* === NAYA CONDITIONAL HEADER === */}
        {isExpired ? (
          <>
            <h2>Your Plan Has Expired</h2>
            <p>
              Please upgrade your plan to continue using all features of MyEduPanel.
            </p>
          </>
        ) : (
          <>
            <h2>Choose Your Plan</h2>
            <p>
              Select the plan that's right for your school.
            </p>
          </>
        )}
        {/* === END CONDITIONAL HEADER === */}

        {/* === NAYA PLAN GRID === */}
        <div className={styles.planGrid}>
        
          {/* === Box 1: Starter Plan (Yeh real data se link hai) === */}
          <div className={styles.planBox}>
            <h3>{planDetails.name}</h3>
            
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

            <ul>
              {planDetails.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            
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

            <button 
              className={styles.buyButton} 
              onClick={handlePayment}
              disabled={isPlacingOrder || isVerifyingCoupon} 
            >
              {isPlacingOrder ? 'Processing...' : `Buy Now & Activate`}
            </button>
          </div>
          {/* === END STARTER PLAN BOX === */}

          {/* === NAYA CONDITIONAL BLOCK: Sirf naye users ko dikhega === */}
          {!isExpired && (
            <>
              {/* === Box 2: Pro Plan (Dummy) === */}
              <div className={`${styles.planBox} ${styles.locked}`}>
                <h3>Pro Plan</h3>
                <div className={styles.priceContainer}>
                  <p className={styles.price}>₹9,999 <span>/ year</span></p>
                </div>
                <ul>
                  <li>✓ All Starter Features</li>
                  <li>✓ Advanced Analytics</li>
                  <li>✓ Staff Payroll</li>
                  <li>✓ Transport Management</li>
                  <li>✓ (and many more...)</li>
                </ul>
                <button className={styles.lockedButton} disabled>
                  Coming Soon
                </button>
              </div>

              {/* === Box 3: Plus Plan (Dummy) === */}
              <div className={`${styles.planBox} ${styles.locked}`}>
                <h3>Plus Plan</h3>
                <div className={styles.priceContainer}>
                  <p className={styles.price}>₹14,999 <span>/ year</span></p>
                </div>
                <ul>
                  <li>✓ All Pro Features</li>
                  <li>✓ Multi-Branch Support</li>
                  <li>✓ Dedicated Support Manager</li>
                  <li>✓ App Integrations</li>
                  <li>✓ (and many more...)</li>
                </ul>
                <button className={styles.lockedButton} disabled>
                  Coming Soon
                </button>
              </div>
            </>
          )}
          {/* === END CONDITIONAL BLOCK === */}

        </div>
        {/* === END PLAN GRID === */}
      </div>
    </div>
  );
};

export default UpgradePage;