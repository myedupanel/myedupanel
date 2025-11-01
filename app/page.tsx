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

      {/* --- HERO SECTION UPDATE --- */}
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
        
        {/* Subtitle ko comment out kar diya hai eSkooly jaisa look dene ke liye, aap chahein toh ise waapas la sakte hain */}
        {/* <p className="hero-subtitle">✨ Welcome to My EduPanel</p> */}
        
        {/* Title ko eSkooly jaisa update kiya */}
        <h1>Free Online School<br />Management Software.</h1>
        
        {/* Description ko eSkooly jaisa update kiya */}
        <p className="hero-description">Now you can manage your school, college, or any educational center with My EduPanel. It's 100% free for a lifetime with no limitations.</p>
        
        {/* Buttons ko eSkooly jaisa update kiya */}
        <div className="hero-buttons">
          <Link href="/signup" className="get-started-btn">Sign Up Now, It's Free</Link>
          <a href="#features-section" className="all-features-btn">Learn More</a>
        </div>
        {/* --- END HERO UPDATE --- */}
      </main>

      <section className="trusted-by">
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
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
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
        <div className="container">
          <div className="impact-header">
            <h2>Our Impact in Numbers</h2>
            <p>Trusted by educational institutions worldwide to streamline school management</p>
          </div>
          <div className="impact-cards">
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-building"></i></div><div className="card-number">9+</div><div className="card-title">Schools</div><p className="card-description">Institutions using our platform</p></div>
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-people"></i></div><div className="card-number">90000+</div><div className="card-title">Students</div><p className="card-description">Learning through our system</p></div>
            <div className="impact-card"><div className="card-icon-background"><i className="bi bi-person"></i></div><div className="card-number">499+</div><div className="card-title">Parents</div><p className="card-description">Engaged with their children's education</p></div>
          </div>
        </div>
      </section>
      
      <div id="features-section" className="main-features-container">
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
        <div className="features-header"><span className="features-tag">✨ Additional Features</span><h2>All-in-One School Management Platform</h2><p>Streamline your entire school operations with our comprehensive suite of integrated modules designed specifically for modern educational institutions.</p></div>
        <nav className="feature-tabs">
          <button className={`tab-button ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}><i className="bi bi-people-fill"></i> Students</button>
          <button className={`tab-button ${activeTab === 'academics' ? 'active' : ''}`} onClick={() => setActiveTab('academics')}><i className="bi bi-book"></i> Academics</button>
          <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}><i className="bi bi-wallet2"></i> Finance</button>
          <button className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><i className="bi bi-bar-chart-line"></i> Analytics</button>
        </nav>
      </div>

      <section className="feature-content-container">
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
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
      
      <section className="pricing-hero">
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
        <div className="container">
          <p className="pricing-tag">✨ Pricing</p>
          <h2>Simple, Transparent Pricing</h2>
          <p className="pricing-description">One plan for your entire school. No per-student fees, no hidden costs.</p>
        </div>
      </section>
      
      <section className="pricing-container" id="pricing-section">
        {/* ... (baaki ka poora content waisa hi rahega) ... */}
        <div className="container">
          <div className="pricing-box">
            <div className="pricing-details">
              <h2>Complete School Plan</h2>
              <p>Get complete access to our comprehensive school management system. One price, all features, unlimited users.</p>
              <h3>All features, unlimited users:</h3>
              <ul className="features-list">
                <li><span className="checkmark">✓</span> Unlimited Student Management</li>
                <li><span className="checkmark">✓</span> Unlimited Teacher & Staff Accounts</li>
                <li><span className="checkmark">✓</span> Complete Admin Dashboard</li>
                <li><span className="checkmark">✓</span> Fee Management & Online Payment</li>
                <li><span className="checkmark">✓</span> Student Attendance Tracking</li>
                <li><span className="checkmark">✓</span> Timetable Management</li>
                <li><span className="checkmark">✓</span> Parent & Student Login Portals</li>
                <li><span className="checkmark">✓</span> 24/7 Customer Support</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h4>Include All Features</h4>
              <div 
                className="price" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'baseline', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  margin: '1.5rem 0',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '2.8rem', fontWeight: '700', color: '#111' }}>
                  ₹4999
                </span>
                <span className="price-unit" style={{ fontSize: '1rem', color: '#555', fontWeight: '500' }}>
                  /&nbsp;per&nbsp;year
                </span>
              </div>
              <Link href="/plans" className="cta-button">Grab Now Deal</Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* --- MODALS SECTION (No Changes) --- */}
      {isLoginModalVisible && (
        <div className="modal-overlay" onClick={hideOnOverlayClick}>
          {/* ... (modal content) ... */}
        </div>
      )}
      {/* ... (baaki saare modals) ... */}

      <Footer />
    </>
  );
}