"use client";

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './modern-landing.scss';

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

      {/* Hero Section - Modern SaaS Design */}
      <section className="modern-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-text">AI-POWERED EDUCATION PLATFORM</span>
              </div>
              <h1 className="hero-title">
                Transform Your School Management with <span className="highlight">Smart Solutions</span>
              </h1>
              <p className="hero-description">
                Streamline admissions, academics, finance, and communication with our all-in-one platform designed for modern educational institutions.
              </p>
              <div className="hero-buttons">
                <Link href="/signup" className="btn btn-primary">Start Free Trial</Link>
                <Link href="#features" className="btn btn-secondary">Explore Features</Link>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Schools Trust Us</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Uptime</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">Support</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-logo">My EduPanel</div>
                  <div className="mockup-user">
                    <div className="user-avatar"></div>
                    <span className="user-name">Admin</span>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-sidebar">
                    <div className="sidebar-item active"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                    <div className="sidebar-item"></div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-stats">
                      <div className="stat-card">
                        <div className="stat-icon bg-blue"></div>
                        <div className="stat-info">
                          <span className="stat-value">1,248</span>
                          <span className="stat-name">Students</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon bg-green"></div>
                        <div className="stat-info">
                          <span className="stat-value">89%</span>
                          <span className="stat-name">Attendance</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon bg-purple"></div>
                        <div className="stat-info">
                          <span className="stat-value">₹4.2L</span>
                          <span className="stat-name">Collected</span>
                        </div>
                      </div>
                    </div>
                    <div className="mockup-chart">
                      <div className="chart-grid"></div>
                      <div className="chart-line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-by-section">
        <div className="container">
          <h2 className="section-title">Trusted by Educational Institutions Worldwide</h2>
          <div className="logos-container">
            <div className="logo-item">Kendriya Vidyalaya</div>
            <div className="logo-item">Podar International</div>
            <div className="logo-item">Delhi Public School</div>
            <div className="logo-item">Ryan International</div>
            <div className="logo-item">DAV Public School</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features for Modern Schools</h2>
            <p className="section-description">Everything you need to manage your educational institution efficiently</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon bg-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="feature-title">Student Management</h3>
              <p className="feature-description">Comprehensive student profiles, enrollment tracking, and academic records management.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon bg-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20v-6M6 20V10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v10M6 20h12"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 className="feature-title">Academic Management</h3>
              <p className="feature-description">Curriculum planning, exam scheduling, grade management, and report card generation.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon bg-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="feature-title">Financial Management</h3>
              <p className="feature-description">Fee collection, payment tracking, invoicing, and financial reporting with online payments.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon bg-orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="feature-title">Timetable Management</h3>
              <p className="feature-description">Smart scheduling for classes, exams, and events with conflict resolution.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon bg-pink">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="feature-title">Staff Management</h3>
              <p className="feature-description">Employee records, attendance tracking, payroll management, and performance evaluation.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon bg-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 className="feature-title">Analytics & Reports</h3>
              <p className="feature-description">Data-driven insights with customizable reports and real-time dashboards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple Implementation Process</h2>
            <p className="section-description">Get started in just a few easy steps</p>
          </div>
          
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3 className="step-title">Sign Up</h3>
              <p className="step-description">Create your account and set up your school profile in minutes.</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <h3 className="step-title">Import Data</h3>
              <p className="step-description">Easily import your existing student, staff, and academic data.</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <h3 className="step-title">Customize</h3>
              <p className="step-description">Tailor the system to match your school's unique requirements.</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">4</div>
              <h3 className="step-title">Go Live</h3>
              <p className="step-description">Start using My EduPanel with full support from our team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-description">One plan for your entire school. No per-student fees, no hidden costs.</p>
          </div>
          
          <div className="pricing-container">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-title">Complete School Plan</h3>
                <div className="pricing-price">
                  <span className="price-amount">₹4,999</span>
                  <span className="price-period">/year</span>
                </div>
                <p className="pricing-description">Everything you need to manage your school efficiently</p>
              </div>
              
              <ul className="pricing-features">
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Unlimited Students & Staff</span>
                </li>
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>All Core Features</span>
                </li>
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Online Fee Payments</span>
                </li>
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Mobile App Access</span>
                </li>
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>24/7 Email & Chat Support</span>
                </li>
                <li className="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Regular Updates & New Features</span>
                </li>
              </ul>
              
              <Link href="/signup" className="btn btn-primary btn-block">Get Started Now</Link>
              
              <div className="pricing-footer">
                <p className="money-back">30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-description">Hear from schools that transformed their operations with My EduPanel</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-rating">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <p className="testimonial-text">"My EduPanel has completely transformed how we manage our school. The student management and fee tracking features have saved us countless hours of manual work."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <h4 className="author-name">Principal Sharma</h4>
                  <p className="author-title">Kendriya Vidyalaya</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-rating">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <p className="testimonial-text">"The academic management module has streamlined our exam process completely. Report card generation is now just a click away, and parents love the real-time updates."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <h4 className="author-name">Dr. Mehta</h4>
                  <p className="author-title">Podar International School</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-rating">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <p className="testimonial-text">"As a parent, I love the real-time updates about my child's attendance and performance. The communication with teachers has never been easier thanks to My EduPanel."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar"></div>
                <div className="author-info">
                  <h4 className="author-name">Priya Desai</h4>
                  <p className="author-title">Parent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your School Management?</h2>
            <p className="cta-description">Join hundreds of schools already using My EduPanel to simplify their operations.</p>
            <div className="cta-buttons">
              <Link href="/signup" className="btn btn-primary">Start Free Trial</Link>
              <Link href="/contact" className="btn btn-secondary">Schedule a Demo</Link>
            </div>
          </div>
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