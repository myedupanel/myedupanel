"use client";

// --- useEffect aur api import karein ---
import React, { useState, useEffect } from 'react';
import styles from './PlansPage.module.scss';
import { FiCheck, FiXCircle } from 'react-icons/fi';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import api from '@/backend/utils/api'; 

// --- Interface (Bina Change) ---
interface Plan {
  id: string; 
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[]; 
  plusFeatures?: string[];
  isPopular?: boolean;
}

const PlansPage = () => {
  // --- NAYA STATE Data fetch karne ke liye ---
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // ------------------------------------------

  // --- Modal State Logic (Bina Change) ---
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [isFeaturesModalVisible, setIsFeaturesModalVisible] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const hideModals = () => { setIsLoginModalVisible(false); setIsSignupModalVisible(false); setIsFeaturesModalVisible(false); setIsForgotModalVisible(false); };
  const hideOnOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => { if ((event.target as HTMLElement).classList.contains('modal-overlay')) { hideModals(); } };
  const switchToSignup = (e: React.MouseEvent) => { e.preventDefault(); setIsLoginModalVisible(false); setIsSignupModalVisible(true); };
  const switchToLogin = (e: React.MouseEvent) => { e.preventDefault(); setIsSignupModalVisible(false); setIsLoginModalVisible(true); };
  const switchToForgot = (e: React.MouseEvent) => { e.preventDefault(); setIsLoginModalVisible(false); setIsForgotModalVisible(true); };
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); console.log("Login submitted"); };
  // --- END MODAL LOGIC ---

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // --- NAYA useEffect API se plans fetch karne ke liye ---
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError('');
        const { data } = await api.get('/plans');
        
        // === YAHAN BADLAAV KIYA GAYA HAI ===
        // API se aaye plans ko parse karna zaroori hai
        const parsedPlans = data.map((plan: Plan) => ({
          ...plan,
          features: Array.isArray(plan.features) 
            ? plan.features 
            : JSON.parse(plan.features || '[]'),
          plusFeatures: Array.isArray(plan.plusFeatures)
            ? plan.plusFeatures
            : JSON.parse(plan.plusFeatures || '[]')
        }));
        setPlans(parsedPlans);
        // === END BADLAAV ===

      } catch (err) {
        console.error("Failed to fetch plans:", err);
        setError('Could not load pricing plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []); 
  // ----------------------------------------------------

  // --- handleBuyNowClick (Bina Change) ---
  const handleBuyNowClick = (planId: string) => {
    const planIdentifier = planId.toLowerCase(); 

    if (planIdentifier === 'starter') {
      if (isAuthenticated) {
        router.push('/upgrade');
      } else {
        router.push('/signup?plan=starter');
      }
    } else {
      // Yeh alert tab kaam karega jab hum locked button par click enable karenge
      alert('Only the Starter plan is available for now. Plus and Pro are coming soon!');
    }
  };
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Navbar (Bina Change) */}
      <Navbar
        showLogin={() => setIsLoginModalVisible(true)}
        showSignup={() => setIsSignupModalVisible(true)}
        showFeatures={() => setIsFeaturesModalVisible(true)}
        activeSection={'pricing-section'}
      />

      <div className={styles.plansPageContainer}>
        <header className={styles.header}>
          <h1>Our Pricing Plans</h1>
          <p>Choose the plan that's right for your school's needs.</p>
        </header>

        {/* --- NAYA LOADING aur ERROR STATE (Bina Change) --- */}
        {isLoading && <p style={{ textAlign: 'center', fontSize: '1.2rem', padding: '2rem' }}>Loading plans...</p>}
        {error && <p style={{ textAlign: 'center', color: 'red', fontSize: '1.2rem', padding: '2rem' }}>{error}</p>}
        {/* ------------------------------------ */}

        {/* Card Layout (Ab 'plans' state se map hoga) */}
        {!isLoading && !error && (
          <main className={styles.plansGrid}>
            
            {/* === YEH DYNAMICALLY "STARTER" PLAN RENDER KAREGA === */}
            {plans.map((plan) => (
              <div
                key={plan.id} 
                className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}
              >
                {plan.isPopular && (
                  <div className={styles.popularBadge}>POPULAR</div>
                )}
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.planPrice}>
                  {plan.originalPrice && plan.originalPrice > 0 && (
                    <span className={styles.originalPrice}>
                      ₹{plan.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {plan.price === 0 ? (
                    'Free'
                  ) : (
                    `₹${plan.price.toLocaleString('en-IN')}`
                  )}
                  <span>{plan.price > 0 ? '/ per year' : ''}</span>
                </div>
                <ul className={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.included}>
                      <FiCheck className={styles.perkIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.plusFeatures && plan.plusFeatures.length > 0 && (
                  <ul className={styles.featuresList}>
                    {plan.plusFeatures.map((feature, index) => (
                      <li key={index} className={styles.excluded}>
                        <FiXCircle className={styles.perkIcon} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <button
                  className={`${styles.ctaButton} ${styles[plan.id.toLowerCase()]}`}
                  onClick={() => handleBuyNowClick(plan.id)}
                >
                  {plan.price === 0 ? 'Get Started' : 'Buy Now'}
                </button>
              </div>
            ))}
            {/* === END DYNAMIC PLAN === */}


            {/* === NAYA CODE: Locked "Pro" Plan === */}
            <div className={`${styles.planCard} ${styles.locked}`}>
              <h3 className={styles.planName}>Pro Plan</h3>
              <p className={styles.planDescription}>For growing schools ready to scale their operations.</p>
              <div className={styles.planPrice}>
                ₹9,999
                <span>/ per year</span>
              </div>
              <ul className={styles.featuresList}>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>All Starter Features</span>
                </li>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>Advanced Analytics</span>
                </li>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>Staff Payroll</span>
                </li>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>Transport Management</span>
                </li>
              </ul>
              <button
                className={`${styles.ctaButton} ${styles.lockedButton}`}
                disabled
              >
                Coming Soon
              </button>
            </div>
            {/* === END "PRO" PLAN === */}

            {/* === NAYA CODE: Locked "Plus" Plan === */}
            <div className={`${styles.planCard} ${styles.locked}`}>
              <h3 className={styles.planName}>Plus Plan</h3>
              <p className={styles.planDescription}>For large institutions with multi-branch needs.</p>
              <div className={styles.planPrice}>
                ₹14,999
                <span>/ per year</span>
              </div>
              <ul className={styles.featuresList}>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>All Pro Features</span>
                </li>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>Multi-Branch Support</span>
                </li>
                <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>Dedicated Support Manager</span>
                </li>
                 <li className={styles.included}>
                  <FiCheck className={styles.perkIcon} />
                  <span>App Integrations</span>
                </li>
              </ul>
              <button
                className={`${styles.ctaButton} ${styles.lockedButton}`}
                disabled
              >
                Coming Soon
              </button>
            </div>
            {/* === END "PLUS" PLAN === */}

          </main>
        )}
      </div>

      {/* Footer (Bina Change) */}
      <Footer />

      {/* Modals (Bina Change) */}
      {isLoginModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Login to My EduPanel</h2><form onSubmit={handleLogin}><div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required /></div><div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" required /></div><div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}><a href="#" onClick={switchToForgot} style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>Forgot Password?</a></div><button type="submit" className="submit-btn">Log In</button></form><p>New here? <a href="#" onClick={switchToSignup}>Create an account</a></p></div></div>)}
      {isSignupModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Sign Up for My EduPanel</h2><form><div className="form-group"><label htmlFor="school-name">School Name</label><input type="text" id="school-name" name="school-name" required /></div><div className="form-group"><label htmlFor="signup-email">Email</label><input type="email" id="signup-email" name="signup-email" required /></div><div className="form-group"><label htmlFor="signup-password">Password</label><input type="password" id="signup-password" name="signup-password" required /></div><button type="submit" className="submit-btn">Sign Up</button></form><p>Already have an account? <a href="#" onClick={switchToLogin}>Log in</a></p></div></div>)}
      {isForgotModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Reset Your Password</h2><p style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem' }}>Enter your email address and we will send you a verification code.</p><form><div className="form-group"><label htmlFor="reset-email">Email</label><input type="email" id="reset-email" name="reset-email" placeholder="you@example.com" required /></div><button type="submit" className="submit-btn">Send Verification Code</button></form></div></div>)}
    </>
  );
};

export default PlansPage;