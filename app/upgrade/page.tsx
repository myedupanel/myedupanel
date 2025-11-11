"use client";

import React, { useState, useEffect } from 'react';
import styles from './UpgradePage.module.scss';
import api from '@/backend/utils/api'; 
import { useAuth } from '@/app/context/AuthContext'; 

// === NAYA IMPORT: Navbar aur Footer ===
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation'; // Navbar ke links ke liye zaroori ho sakta hai
// ======================================

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
  const router = useRouter(); // Navbar ke links ke liye

  // States (Bina Badlaav)
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [couponMessage, setCouponMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Plan Details States (Bina Badlaav)
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  // Expiration State (Bina Badlaav)
  const [isExpired, setIsExpired] = useState(false);

  // === NAYA STATE (NAVBAR MODALS KE LIYE) ===
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const hideModals = () => { setIsLoginModalVisible(false); setIsSignupModalVisible(false); setIsForgotModalVisible(false); };
  const hideOnOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => { if ((event.target as HTMLElement).classList.contains('modal-overlay')) { hideModals(); } };
  const switchToSignup = (e: React.MouseEvent) => { e.preventDefault(); setIsLoginModalVisible(false); setIsSignupModalVisible(true); };
  const switchToLogin = (e: React.MouseEvent) => { e.preventDefault(); setIsSignupModalVisible(false); setIsLoginModalVisible(true); };
  const switchToForgot = (e: React.MouseEvent) => { e.preventDefault(); setIsLoginModalVisible(false); setIsForgotModalVisible(true); };
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); console.log("Login submitted"); };
  // ===========================================

  // useEffect: User ka status check karna (Bina Badlaav)
  useEffect(() => {
    if (user && user.planExpiryDate) {
      const expiryDate = new Date(user.planExpiryDate);
      const today = new Date();
      if (expiryDate < today) {
        setIsExpired(true);
      }
    }
  }, [user]); 

  // useEffect: Plan details fetch karna (Bina Badlaav)
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

  // handleApplyCoupon (Bina Badlaav)
  const handleApplyCoupon = async () => {
    // ... (poora function waisa hi)
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

  // handlePayment (Bina Badlaav)
  const handlePayment = async () => {
    // ... (poora function waisa hi)
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
    // Loading state ko bhi Navbar ke saath dikhayein
    return (
      <>
        <Navbar showLogin={() => setIsLoginModalVisible(true)} showSignup={() => setIsSignupModalVisible(true)} showFeatures={() => router.push('/#features')} activeSection={'pricing-section'} />
        <div style={{padding: '5rem 2rem', textAlign: 'center', minHeight: '60vh'}}>Loading Payment Details...</div>
        <Footer />
      </>
    );
  }

  if (!planDetails) {
     // Error state ko bhi Navbar ke saath dikhayein
    return (
      <>
        <Navbar showLogin={() => setIsLoginModalVisible(true)} showSignup={() => setIsSignupModalVisible(true)} showFeatures={() => router.push('/#features')} activeSection={'pricing-section'} />
        <div style={{padding: '5rem 2rem', textAlign: 'center', minHeight: '60vh'}}>Error: Could not load plan details. Please contact support.</div>
        <Footer />
      </>
    );
  }

  // === MUKHYA JSX (Smart Logic ke saath) ===
  return (
    <>
      {/* === NAYA NAVBAR === */}
      <Navbar
        showLogin={() => setIsLoginModalVisible(true)}
        showSignup={() => setIsSignupModalVisible(true)}
        showFeatures={() => router.push('/#features')} // Features section par bhejega
        activeSection={'pricing-section'} // 'Pricing' ko active dikhayega
      />
      {/* =================== */}

      <div className={styles.upgradeContainer}>
        <div className={styles.upgradeBox}>
          
          {/* === Conditional Header (Bina Badlaav) === */}
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
          {/* === END Conditional Header === */}

          {/* === Plan Grid (Bina Badlaav) === */}
          <div className={styles.planGrid}>
          
            {/* Box 1: Starter Plan (Bina Badlaav) */}
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
            {/* === END Starter Plan === */}

            {/* Conditional Block (Bina Badlaav) */}
            {!isExpired && (
              <>
                {/* Box 2: Pro Plan (Dummy) */}
                <div className={`${styles.planBox} ${styles.locked}`}>
                  <h3>Plus Plan</h3>
                  <div className={styles.priceContainer}>
                    <p className={styles.price}>Undefined <span>/ year</span></p>
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

                {/* Box 3: Plus Plan (Dummy) */}
                <div className={`${styles.planBox} ${styles.locked}`}>
                  <h3>Pro Plan</h3>
                  <div className={styles.priceContainer}>
                    <p className={styles.price}>Undefined <span>/ year</span></p>
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
            {/* === END Conditional Block === */}

          </div>
          {/* === END Plan Grid === */}
        </div>
      </div>

      {/* === NAYA FOOTER === */}
      <Footer />
      {/* =================== */}

      {/* === NAYE MODALS (LOGIN/SIGNUP KE LIYE) === */}
      {isLoginModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Login to My EduPanel</h2><form onSubmit={handleLogin}><div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required /></div><div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" required /></div><div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}><a href="#" onClick={switchToForgot} style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>Forgot Password?</a></div><button type="submit" className="submit-btn">Log In</button></form><p>New here? <a href="#" onClick={switchToSignup}>Create an account</a></p></div></div>)}
      {isSignupModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Sign Up for My EduPanel</h2><form><div className="form-group"><label htmlFor="school-name">School Name</label><input type="text" id="school-name" name="school-name" required /></div><div className="form-group"><label htmlFor="signup-email">Email</label><input type="email" id="signup-email" name="signup-email" required /></div><div className="form-group"><label htmlFor="signup-password">Password</label><input type="password" id="signup-password" name="signup-password" required /></div><button type="submit" className="submit-btn">Sign Up</button></form><p>Already have an account? <a href="#" onClick={switchToLogin}>Log in</a></p></div></div>)}
      {isForgotModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Reset Your Password</h2><p style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem' }}>Enter your email address and we will send you a verification code.</p><form><div className="form-group"><label htmlFor="reset-email">Email</label><input type="email" id="reset-email" name="reset-email" placeholder="you@example.com" required /></div><button type="submit" className="submit-btn">Send Verification Code</button></form></div></div>)}
      {/* ======================================= */}
    </>
  );
};

export default UpgradePage;