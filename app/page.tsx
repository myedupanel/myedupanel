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
  const [activeTab, setActiveTab] = useState('students');
  const [activeSection, setActiveSection] = useState('hero');

  const featuresData = {
    students: {
      title: "Student Management",
      description: "Comprehensive student information system for managing enrollments, profiles, and academic records with ease.",
      glowColor: "#FFD700", points: ["Digital student profiles with complete academic history", "Automated enrollment and registration process", "Parent portal access with real-time updates", "Student performance tracking and analytics", "Digital document management for student records", "Custom fields for additional student information", "Bulk student data import/export capabilities", "Student behavior and disciplinary record tracking"]
    },
    academics: {
      title: "Academic Management",
      description: "Streamline curriculum planning, examinations, grading, and report card generation in one unified system.",
      glowColor: "#00BFFF", points: ["Dynamic curriculum and syllabus management", "Automated grade calculation and GPA tracking", "Custom report card generation", "Assignment and homework management", "Online examination system with multiple question types", "Academic calendar management", "Course and class scheduling", "Learning resource distribution"]
    },
    finance: {
      title: "Financial Management",
      description: "Complete fee management system with online payments, invoicing, and comprehensive financial reporting.",
      glowColor: "#32CD32", points: ["Online fee payment gateway integration", "Automated invoice generation", "Payment reminder system", "Financial reporting and analytics", "Salary and payroll management", "Expense tracking and budgeting", "Scholarship management", "Multiple payment method support"]
    },
    analytics: {
      title: "Analytics & Reports",
      description: "Powerful analytics tools for data-driven decisions with customizable reporting and insights.",
      glowColor: "#FF4500", points: ["Customizable dashboard with key metrics", "Performance trend analysis", "Attendance and enrollment statistics", "Financial insights and projections", "Student progress tracking", "Staff performance analytics", "Custom report generation", "Advanced data filtering"]
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id], main[id], div[id]');
      let newActiveSection = '';

      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop - 150;
        if (window.scrollY >= sectionTop) {
          newActiveSection = section.id;
        }
      });
      
      if (window.scrollY < 400) {
        newActiveSection = 'hero';
      }

      if (activeSection !== newActiveSection && newActiveSection) {
        setActiveSection(newActiveSection);
        window.history.replaceState(null, '', `/#${newActiveSection}`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeSection]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { success: true, role: 'admin' };
    if (data.success) {
      if (data.role === 'admin') router.push('/admin/dashboard');
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

      <main id="hero" className="hero" style={{ position: 'relative' }}>
        <div className="miss-minutes-container">
          <NextImage
            src="/images/miss-minutes.gif"
            alt="Miss Minutes Animation"
            width={140}
            height={160}
            unoptimized={true}
          />
        </div>
        <p className="hero-subtitle">✨ Welcome to My EduPanel</p>
        <h1>Your Complete School<br />Management Solution</h1>
        <p className="hero-description">From admissions to academics, simplify every aspect of school administration with our comprehensive and user-friendly platform.</p>
        <div className="hero-buttons">
          <Link href="/signup" className="get-started-btn">Get Started</Link>
          <a href="#features-section" className="all-features-btn">See All features</a>
        </div>
      </main>

      <section className="trusted-by">
        <div className="container">
          <div className="trusted-by-header">
            <h3>Trusted by 9+ Leading Educational Institutions</h3>
            <p>Join Hundreds of schools already transforming their management systems</p>
          </div>
        </div>
        <div className="marquee-container">
          <div className="marquee-track">
            <span>Kem School</span><span>Eton College</span><span>Shreeram HighSchool</span><span>Podar Internatinaol School</span><span>Maharashtra School</span><span>Phillips Exeter Academy</span><span></span><span>Institut Le Rosey</span><span>Geelong Grammar School</span>
            <span>The Doon Schoo</span><span>Choate Rosemary Hall</span><span>Harrow School</span><span>Upper Canada College</span><span>Aiglon College</span><span>Raffles Institution</span><span>St. George's School</span><span>Phillips Academy Andover</span><span>Institut auf dem Rosenberg</span>
          </div>
        </div>
      </section>

      <section id="impact-section" className="impact-numbers">
        <div className="container">
          <div className="impact-header">
            <h2>Our Impact in Numbers</h2>
            <p>Trusted by educational institutions worldwide to streamline school management</p>
          </div>
          <div className="impact-cards">
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-building"></i></div><div className="card-number">9+</div><div className="card-title">Schools</div><p className="card-description">Institutions using our platform</p></div>
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-people"></i></div><div className="card-number">2548+</div><div className="card-title">Students</div><p className="card-description">Learning through our system</p></div>
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-person"></i></div><div className="card-number">499+</div><div className="card-title">Parents</div><p className="card-description">Engaged with their children's education</p></div>
          </div>
        </div>
      </section>
      
      <div id="features-section" className="main-features-container">
        <div className="features-header"><span className="features-tag">✨ Additional Features</span><h2>All-in-One School Management Platform</h2><p>Streamline your entire school operations with our comprehensive suite of integrated modules designed specifically for modern educational institutions.</p></div>
        <nav className="feature-tabs">
          <button className={`tab-button ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}><i className="bi bi-people-fill"></i> Students</button>
          <button className={`tab-button ${activeTab === 'academics' ? 'active' : ''}`} onClick={() => setActiveTab('academics')}><i className="bi bi-book"></i> Academics</button>
          <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}><i className="bi bi-wallet2"></i> Finance</button>
          <button className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><i className="bi bi-bar-chart-line"></i> Analytics</button>
        </nav>
      </div>

      <section className="feature-content-container">
        <div className="feature-content-card" style={{ '--glow-color': featuresData[activeTab as keyof typeof featuresData].glowColor } as React.CSSProperties}>
          <h3>{featuresData[activeTab as keyof typeof featuresData].title}</h3>
          <p className="description">{featuresData[activeTab as keyof typeof featuresData].description}</p>
          <div className="feature-points-grid">
            {featuresData[activeTab as keyof typeof featuresData].points.map((point, index) => (
              <div key={index} className="feature-point"><i className="bi bi-check-circle-fill"></i><p>{point}</p></div>
            ))}
          </div>
        </div>
      </section>
      
      {/* --- PRICING HERO SECTION (No Change) --- */}
      <section className="pricing-hero">
        <div className="container">
          <p className="pricing-tag">✨ Pricing</p>
          <h2>Simple, Transparent Pricing</h2>
          <p className="pricing-description">One plan for your entire school. No per-student fees, no hidden costs.</p>
        </div>
      </section>
      
      {/* --- PRICING CONTAINER SECTION --- */}
      <section className="pricing-container" id="pricing-section">
        <div className="container">
          
          <div className="pricing-box">
            {/* --- PRICING DETAILS (LEFT SIDE) (No Change) --- */}
            <div className="pricing-details">
              <h2>Starter School Plan</h2>
              <p>Get  access to our comprehensive school management system. One price, all Basic Features, unlimited users.</p>
              <h3>All features, unlimited users:</h3>
              <ul className="features-list">
                <li><span className="checkmark">✓</span> Admin Dashboard (Basic)</li>
                <li><span className="checkmark">✓</span> Unlimited Student Management</li>
                <li><span className="checkmark">✓</span> Unlimited Staff Management</li>
                <li><span className="checkmark">✓</span> Unlimited Teachers Management</li>
                <li><span className="checkmark">✓</span> Fee Counter</li>
                <li><span className="checkmark">✓</span> Bonafide Generator</li>
                <li><span className="checkmark">✓</span> LC Generator</li>
                <li><span className="checkmark">✓</span> Fee Receipt Generator</li>
              </ul>
            </div>
            
            {/* === PRICING CARD (RIGHT SIDE) UPDATED === */}
            <div className="pricing-card">
              <h4>Include All Basic Features</h4>
                            
              {/* Professional pricing display with enhanced styling */}
              <div className="price-container">
                <div className="price-wrapper">
                  <span className="currency">₹</span>
                  <span className="amount">4999</span>
                </div>
                <span className="price-unit">per year</span>
              </div>
                            
              {/* Enhanced Get Started button */}
              <Link href="/plans" className="cta-button professional">Get Started</Link>
                            
              {/* Value proposition */}
              <div className="value-prop">
                <span className="highlight">Complete Solution</span> • Unlimited Users
              </div>
            </div>
            {/* === END OF PRICING CARD UPDATES === */}

          </div>
        </div>
      </section>
      {/* --- END OF PRICING UPDATES --- */}
      
      
      {/* --- MODALS SECTION (No Changes) --- */}
      {isLoginModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            <h2>Login to School Pro</h2>
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

      {isSignupModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Sign Up for School Pro</h2><form><div className="form-group"><label htmlFor="school-name">School Name</label><input type="text" id="school-name" name="school-name" required /></div><div className="form-group"><label htmlFor="signup-email">Email</label><input type="email" id="signup-email" name="signup-email" required /></div><div className="form-group"><label htmlFor="signup-password">Password</label><input type="password" id="signup-password" name="signup-password" required /></div><button type="submit" className="submit-btn">Sign Up</button></form><p>Already have an account? <a href="#" onClick={switchToLogin}>Log in</a></p></div></div>)}
      {isForgotModalVisible && ( <div className="modal-overlay" onClick={hideOnOverlayClick}><div className="modal-content" onClick={(e) => e.stopPropagation()}><a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a><h2>Reset Your Password</h2><p style={{ textAlign: 'center', marginTop: '-20px', marginBottom: '30px', fontSize: '0.95rem' }}>Enter your email address and we will send you a verification code.</p><form><div className="form-group"><label htmlFor="reset-email">Email</label><input type="email" id="reset-email" name="reset-email" placeholder="you@example.com" required /></div><button type="submit" className="submit-btn">Send Verification Code</button></form></div></div>)}
      
      {isFeaturesModalVisible && ( 
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          <div className="features-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Features</h2>
              <a href="#" onClick={(e) => { e.preventDefault(); hideModals(); }} className="close-btn">&times;</a>
            </div>
            <div className="features-modal-grid">
              <div className="feature-modal-card"><h4>Student Management</h4><p>Manage enrollments, profiles, and academic records with ease.</p></div>
              <div className="feature-modal-card"><h4>Academic Management</h4><p>Streamline curriculum planning, examinations, and grading.</p></div>
              <div className="feature-modal-card"><h4>Communication Hub</h4><p>Integrated messaging for seamless school-wide communication.</p></div>
              <div className="feature-modal-card"><h4>Financial Management</h4><p>Complete fee management with online payments and invoicing.</p></div>
              <div className="feature-modal-card"><h4>Staff Management</h4><p>Tools for managing staff records, attendance, and payroll.</p></div>
              <div className="feature-modal-card"><h4>Transport Management</h4><p>Real-time transport tracking, route management, and notifications.</p></div>
              <div className="feature-modal-card"><h4>Analytics & Reports</h4><p>Powerful analytics for data-driven decisions and insights.</p></div>
              <div className="feature-modal-card"><h4>Resource Management</h4><p>Digital library, inventory tracking, and facility scheduling.</p></div>
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