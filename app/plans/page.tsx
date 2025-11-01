"use client"; 

import React, { useState } from 'react';
import styles from './PlansPage.module.scss';
// --- FIX: Naya Icon import kiya (Red 'X' ke liye) ---
import { FiCheck, FiXCircle } from 'react-icons/fi';
import Link from 'next/link'; 
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// --- FIX 1: Interface ko update kiya (Discount ke liye) ---
interface Plan {
  name: string;
  price: number;
  originalPrice?: number; // <-- Discount ke liye
  description: string;
  features: string[];
  plusFeatures?: string[];
  isPopular?: boolean;
}

// --- FIX 2: Naya 'Tiered Module' Blueprint Data (Discount ke saath) ---
const plansData: Plan[] = [
  {
    name: 'Starter (The Core)',
    price: 4999,
    // (Is par discount nahi hai)
    description: 'Basic digitalization aur record-keeping ke liye perfect.',
    features: [
      'Admin Dashboard (Basic)',
      'Unlimited Student Management',
      'Unlimited Staff Management',
      'Basic Attendance Tracking',
      'School Settings',
    ],
    plusFeatures: [ 
      'Fee Counter & Online Payment',
      'Parent & Student Login Portals',
      'Advanced Exams & Certificates',
      'Transport & Library Modules',
      'Premium Support'
    ]
  },
  {
    name: 'Plus (The Standard)',
    price: 9999,
    originalPrice: 12999, // <-- Discount
    description: 'Best for schools needing fee management and parent communication.',
    features: [
      'Everything in Starter',
      'Finance Module (Fee Counter, Online Payments, Receipts)',
      'Communication Module (Parent & Student Logins)',
      'Digital Noticeboard',
      'Basic SMS/Email Alerts',
    ],
    plusFeatures: [ 
      'Advanced Exams & Certificates',
      'Transport & Library Modules',
      'Premium Support'
    ],
    isPopular: true,
  },
  {
    name: 'Pro (The All-in-One)',
    price: 19999,
    originalPrice: 24999, // <-- Discount
    description: 'The complete all-in-one solution for large schools.',
    features: [
      'Everything in Plus',
      'Advanced Academics Module (Timetable, Exams, Report Cards)',
      'Certificate Generation (Leaving, Bonafide)',
      'Premium Resource Modules (Transport, Library, Hostel)',
      'Dedicated Account Manager (Premium Support)',
    ],
  },
];
// --- END FIX 2 ---

const PlansPage = () => {

  // --- Modal State Logic (No Change) ---
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

  return (
    <> 
      {/* Navbar (No Change) */}
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

        {/* --- FIX 3: Naya Card Layout (Discount aur 'X' icon ke saath) --- */}
        <main className={styles.plansGrid}>
          {plansData.map((plan) => (
            <div 
              key={plan.name} 
              className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}
            >
              {plan.isPopular && (
                <div className={styles.popularBadge}>POPULAR</div>
              )}
              
              <h3 className={styles.planName}>{plan.name}</h3>
              <p className={styles.planDescription}>{plan.description}</p>

              <div className={styles.planPrice}>
                {/* Discounted Price dikhane ke liye logic */}
                {plan.originalPrice && (
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
              
              {/* Included Features */}
              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.included}>
                    <FiCheck className={styles.perkIcon} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Excluded Features (Red 'X' icon ke saath) */}
              {plan.plusFeatures && plan.plusFeatures.length > 0 && (
                <ul className={styles.featuresList}>
                  {plan.plusFeatures.map((feature, index) => (
                    <li key={index} className={styles.excluded}>
                      {/* &times; ko FiXCircle se badal diya */}
                      <FiXCircle className={styles.perkIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Button (Text "Buy Now" kar diya) */}
              <Link href="/signup" className={`${styles.ctaButton} ${styles[plan.name.split(' ')[0].toLowerCase()]}`}>
                {plan.price === 0 ? 'Get Started' : 'Buy Now'}
              </Link>
            </div>
          ))}
        </main>
        {/* --- END FIX 3 --- */}
      </div>
      
      {/* Footer (No Change) */}
      <Footer />

      {/* Modals (No Change) */}
      {isLoginModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            <h2>Login to My EduPanel</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required /></div>
              <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" required /></div>
              <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}><a href="#" onClick={switchToForgot} style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>Forgot Password?</a></div>
              <button type="submit" className="submit-btn">Log In</button>
            </form>
            <p>New here? <a href="#" onClick={switchToSignup}>Create an account</a></p>
          </div>
        </div>
      )}
      {isSignupModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Sign Up for My EduPanel</h2><form><div className="form-group"><label htmlFor="school-name">School Name</label><input type="text" id="school-name" name="school-name" required /></div><div className="form-group"><label htmlFor="signup-email">Email</label><input type="email" id="signup-email" name="signup-email" required /></div><div className="form-group"><label htmlFor="signup-password">Password</label><input type="password" id="signup-password" name="signup-password" required /></div><button type="submit" className="submit-btn">Sign Up</button></form><p>Already have an account? <a href="#" onClick={switchToLogin}>Log in</a></p></div></div>)}
      {isForgotModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Reset Your Password</h2><p style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem' }}>Enter your email address and we will send you a verification code.</p><form><div className="form-group"><label htmlFor="reset-email">Email</label><input type="email" id="reset-email" name="reset-email" placeholder="you@example.com" required /></div><button type="submit" className="submit-btn">Send Verification Code</button></form></div></div>)}
    </>
  );
};

export default PlansPage;