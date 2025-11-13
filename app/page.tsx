"use client";

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSignupModalVisible, setIsSignupModalVisible] = useState(false);
  const [isFeaturesModalVisible, setIsFeaturesModalVisible] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { success: true, role: 'admin' };
    if (data.success) {
      if (data.role === 'admin') router.push('/admin');
      else if (data.role === 'student') router.push('/student');
      else if (data.role === 'teacher') router.push('/teacher');
      else if (data.role === 'parent') router.push('/parent');
    } else {
      alert('Invalid login credentials!');
    }
  };
  
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

  return (
    <>
      <Navbar
        showLogin={() => setIsLoginModalVisible(true)}
        showSignup={() => setIsSignupModalVisible(true)}
        showFeatures={() => setIsFeaturesModalVisible(true)}
        activeSection={activeSection}
      />

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-subtitle">✨ Welcome to My EduPanel</p>
            <h1>Your Complete School <br />Management Solution</h1>
            <p className="hero-description">From admissions to academics, simplify every aspect of school administration with our comprehensive and user-friendly platform.</p>
            <div className="hero-buttons">
              <Link href="/signup" className="get-started-btn">Get Started</Link>
              <a href="#features" className="all-features-btn">See All Features</a>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="illustration-container">
              <NextImage
                src="/images/miss-minutes.gif"
                alt="School Management Dashboard"
                width={500}
                height={400}
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✨ Features</span>
            <h2>All-in-One School Management Platform</h2>
            <p>Streamline your entire school operations with our comprehensive suite of integrated modules designed specifically for modern educational institutions.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-people"></i>
              </div>
              <h3>Student Management</h3>
              <p>Manage enrollments, profiles, and academic records with ease.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-book"></i>
              </div>
              <h3>Academic Management</h3>
              <p>Streamline curriculum planning, examinations, and grading.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <h3>Financial Management</h3>
              <p>Complete fee management with online payments and invoicing.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-graph-up"></i>
              </div>
              <h3>Analytics & Reports</h3>
              <p>Powerful analytics for data-driven decisions and insights.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-person"></i>
              </div>
              <h3>Staff Management</h3>
              <p>Tools for managing staff records, attendance, and payroll.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-calendar-event"></i>
              </div>
              <h3>Timetable Management</h3>
              <p>Smart scheduling for classes, exams, and events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✨ Pricing</span>
            <h2>Simple, Transparent Pricing</h2>
            <p>One plan for your entire school. No per-student fees, no hidden costs.</p>
          </div>
          
          <div className="pricing-box">
            <div className="pricing-card">
              <h3>Complete School Plan</h3>
              <div className="price">
                <span className="amount">₹4999</span>
                <span className="period">/year</span>
              </div>
              <p>Get complete access to our comprehensive school management system. One price, all features, unlimited users.</p>
              <Link href="/plans" className="pricing-btn">Get Started</Link>
              <ul className="pricing-features">
                <li>✓ Unlimited Student Management</li>
                <li>✓ Unlimited Teacher & Staff Accounts</li>
                <li>✓ Complete Admin Dashboard</li>
                <li>✓ Fee Management & Online Payment</li>
                <li>✓ Student Attendance Tracking</li>
                <li>✓ Timetable Management</li>
                <li>✓ Parent & Student Login Portals</li>
                <li>✓ 24/7 Customer Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✨ Testimonials</span>
            <h2>Trusted by Educational Institutions</h2>
            <p>Hear what schools are saying about My EduPanel</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"My EduPanel has transformed how we manage our school. The student management and fee tracking features have saved us countless hours."</p>
              </div>
              <div className="testimonial-author">
                <h4>Principal Sharma</h4>
                <p>Kendriya Vidyalaya</p>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The academic management module has streamlined our exam process completely. Report card generation is now just a click away."</p>
              </div>
              <div className="testimonial-author">
                <h4>Dr. Mehta</h4>
                <p>Podar International School</p>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a parent, I love the real-time updates about my child's attendance and performance. The communication with teachers has never been easier."</p>
              </div>
              <div className="testimonial-author">
                <h4>Priya Desai</h4>
                <p>Parent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your School Management?</h2>
          <p>Join hundreds of schools already using My EduPanel to simplify their operations.</p>
          <Link href="/signup" className="cta-button">Start Free Trial</Link>
        </div>
      </section>

      {/* Modals */}
      {isLoginModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            <h2>Login to My EduPanel</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" required />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 'var(--space-4)' }}>
                <a href="#" onClick={switchToForgot} style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  Forgot Password?
                </a>
              </div>
              <button type="submit" className="submit-btn">Log In</button>
            </form>
            <p>New here? <a href="#" onClick={switchToSignup}>Create an account</a></p>
          </div>
        </div>
      )}

      {isSignupModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            <h2>Sign Up for My EduPanel</h2>
            <form>
              <div className="form-group">
                <label htmlFor="school-name">School Name</label>
                <input type="text" id="school-name" name="school-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input type="email" id="signup-email" name="signup-email" required />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input type="password" id="signup-password" name="signup-password" required />
              </div>
              <button type="submit" className="submit-btn">Sign Up</button>
            </form>
            <p>Already have an account? <a href="#" onClick={switchToLogin}>Log in</a></p>
          </div>
        </div>
      )}

      {isForgotModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            <h2>Reset Your Password</h2>
            <p style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem' }}>
              Enter your email address and we will send you a verification code.
            </p>
            <form>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input type="email" id="reset-email" name="reset-email" placeholder="you@example.com" required />
              </div>
              <button type="submit" className="submit-btn">Send Verification Code</button>
            </form>
          </div>
        </div>
      )}
      
      {isFeaturesModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="features-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Features</h2>
              <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            </div>
            <div className="features-modal-grid">
              <div className="feature-modal-card">
                <h4>Student Management</h4>
                <p>Manage enrollments, profiles, and academic records with ease.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Academic Management</h4>
                <p>Streamline curriculum planning, examinations, and grading.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Communication Hub</h4>
                <p>Integrated messaging for seamless school-wide communication.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Financial Management</h4>
                <p>Complete fee management with online payments and invoicing.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Staff Management</h4>
                <p>Tools for managing staff records, attendance, and payroll.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Transport Management</h4>
                <p>Real-time transport tracking, route management, and notifications.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Analytics & Reports</h4>
                <p>Powerful analytics for data-driven decisions and insights.</p>
              </div>
              <div className="feature-modal-card">
                <h4>Resource Management</h4>
                <p>Digital library, inventory tracking, and facility scheduling.</p>
              </div>
            </div>
            <div className="features-modal-footer">
              <Link href="/signup" className="btn-get-started-modal" onClick={hideModals}>Get Started</Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}