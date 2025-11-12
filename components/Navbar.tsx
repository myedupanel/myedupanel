"use client";

import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo'; // Assume Logo component exists
import Link from 'next/link';

type NavbarProps = {
  showLogin: () => void;
  showSignup: () => void; // हम इस prop का इस्तेमाल अब नहीं करेंगे, पर इसे रख सकते हैं
  showFeatures: () => void;
  activeSection: string;
};

function Navbar({ showLogin, showSignup, showFeatures, activeSection }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme to body for landing page specific styles
    // Only apply dark mode styles to the landing page
    if (typeof window !== 'undefined') {
      const isLandingPage = window.location.pathname === '/';
      
      if (isLandingPage) {
        if (theme === 'dark') {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      } else {
        // Remove dark mode class from body on other pages
        document.body.classList.remove('dark-mode');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current && !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (action: () => void) => {
    action();
    toggleMobileMenu();
  };

  return (
    <header>
      <nav>
        <a href="/" className="navbar-brand">
          <Logo />
          <span>My EduPanel</span>
        </a>
        
        <div className="nav-desktop">
          <ul>
            <li><Link href="/" className={activeSection === 'hero' ? 'active-link' : ''}>Home</Link></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); showFeatures(); }}>Features</a></li>
            <li><Link href="#pricing-section" className={activeSection === 'pricing' ? 'active-link' : ''}>Pricing</Link></li>
            <li><Link href="#impact-section" className={activeSection === 'impact' ? 'active-link' : ''}>Impact</Link></li>
          </ul>
          <div className="buttons">
            {/* Theme toggle button added here */}
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <i className="bi bi-moon-stars"></i>
              ) : (
                <i className="bi bi-sun"></i>
              )}
            </button>
            <Link href="/login" className="login-btn">Login</Link>
            {/* CHANGE HERE: 'Book Demo' button ab seedhe /signup page par le jayega */}
            <Link href="/signup" className="demo-btn">Book Demo</Link>
          </div>
        </div>

        <button ref={hamburgerRef} className="hamburger-menu" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <div className="line line1"></div>
          <div className="line line2"></div>
          <div className="line line3"></div>
        </button>

        <div ref={menuRef} className={`nav-mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link href="/" className={activeSection === 'hero' ? 'active-link' : ''} onClick={toggleMobileMenu}>Home</Link>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(showFeatures); }}>Features</a>
          <Link href="#pricing-section" className={activeSection === 'pricing' ? 'active-link' : ''} onClick={toggleMobileMenu}>Pricing</Link>
          <Link href="#impact-section" className={activeSection === 'impact' ? 'active-link' : ''} onClick={toggleMobileMenu}>Impact</Link>
          <hr />
          {/* Theme toggle in mobile menu */}
          <button className="theme-toggle-btn mobile" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <Link href="/login" className="login-btn" onClick={toggleMobileMenu}>Login</Link>
          {/* CHANGE HERE: Mobile menu mein bhi 'Book Demo' button ab seedhe /signup page par le jayega */}
          <Link href="/signup" className="demo-btn" onClick={toggleMobileMenu}>Book Demo</Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;