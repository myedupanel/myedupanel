"use client"; // Navbar aur Modals ke liye yeh zaroori hai

import React, { useState } from 'react'; // useState ko import kiya
import styles from './PlansPage.module.scss';
import { FiCheck } from 'react-icons/fi';
import Link from 'next/link'; // Link ko import kiya

// --- YEH DONO IMPORTS ADD KIYE HAIN ---
import Navbar from '@/components/Navbar'; // Aapke landing page se
import Footer from '@/components/Footer'; // Aapke landing page se

// Plan interface (No Change)
interface Plan {
  name: string;
  price: number;
  perks: string[];
  isPopular?: boolean;
}

// Dummy data (No Change)
const plansData: Plan[] = [
  {
    name: 'Starter',
    price: 0,
    perks: [
      'Manage up to 50 students',
      'Basic Fee Collection',
      'Attendance Tracking',
      'Limited Support',
    ],
  },
  {
    name: 'Plus',
    price: 4999,
    perks: [
      'Unlimited Student Management',
      'Complete Admin Dashboard',
      'Fee Management & Online Payment',
      'Attendance Tracking',
      'Parent & Student Login Portals',
    ],
    isPopular: true,
  },
  {
    name: 'Pro',
    price: 9999,
    perks: [
      'All features in Plus',
      'Advanced Timetable Management',
      'Custom Report Generation',
      '24/7 Customer Support',
      'Dedicated Account Manager',
    ],
  },
];

const PlansPage = () => {

  // --- NAVBAR KE LIYE MODAL STATE LOGIC ADD KIYA GAYA HAI ---
  // (Yeh code aapke Home page se liya gaya hai taaki Navbar sahi se kaam kare)
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [isFeaturesModalVisible, setIsFeaturesModalVisible] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  
  const hideModals = () => {
    setIsLoginModalVisible(false);
    setIsSignupModalVisible(false);
    setIsFeaturesModalVisible(false);
    setIsForgotModalVisible(false);
  };

  const hideOnOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      hideModals();
    }
  };

  const switchToSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginModalVisible(false);
    setIsSignupModalVisible(true);
  };

  const switchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignupModalVisible(false);
    setIsLoginModalVisible(true);
  };
  
  const switchToForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginModalVisible(false);
    setIsForgotModalVisible(true);
  };

  // Login form submit logic (agar zaroorat pade)
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     // Yahaan aap login logic daal sakte hain
     console.log("Login submitted");
     // Example: router.push('/admin');
  };
  // --- END MODAL LOGIC ---


  return (
    // Fragment ka istemaal taaki Navbar/Footer add kar sakein
    <> 
      {/* --- NAVBAR ADD KIYA GAYA HAI --- */}
      <Navbar
        showLogin={() => setIsLoginModalVisible(true)}
        showSignup={() => setIsSignupModalVisible(true)}
        showFeatures={() => setIsFeaturesModalVisible(true)}
        activeSection={'pricing-section'} // 'pricing' ko active dikha sakte hain
      />

      {/* Aapka original page content */}
      <div className={styles.plansPageContainer}>
        <header className={styles.header}>
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that's right for your school.</p>
        </header>

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
              
              <div className={styles.planPrice}>
                {plan.price === 0 ? (
                  'Free'
                ) : (
                  `₹${plan.price.toLocaleString('en-IN')}`
                )}
                <span>{plan.price > 0 ? '/ per year' : ''}</span>
              </div>
              
              <ul className={styles.perksList}>
                {plan.perks.map((perk, index) => (
                  <li key={index}>
                    <FiCheck className={styles.perkIcon} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              
              {/* Button (ab yeh Link component ho sakta hai agar signup page pe jaana ho) */}
              <Link href="/signup" className={styles.ctaButton}>
                {plan.price === 0 ? 'Get Started' : 'Grab Now Deal'}
              </Link>
            </div>
          ))}
        </main>
      </div>
      
      {/* --- FOOTER ADD KIYA GAYA HAI --- */}
      <Footer />

      {/* --- MODALS ADD KIYE GAYE HAIN (NAVBAR KE LIYE) --- */}
      {/* (Yeh code bhi aapke Home page se liya gaya hai) */}
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
      
      {/* Aapka Features modal bhi yahaan add kar sakte hain agar Navbar use dikhaata hai */}
    </>
  );
};

export default PlansPage;