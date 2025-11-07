// File: components/Footer.js (ya jahaan bhi aapki file hai)
// Ismein humne CSS Modules ka istemaal kiya hai
import React from 'react';
import styles from './Footer.module.scss'; // Hum yeh CSS file agle step mein banayenge
import Link from 'next/link';
import { FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';

function Footer() {
  return (
    <footer className={styles.footerWrapper}>
      <div className="container"> {/* Yeh 'container' class aapki global CSS se aani chahiye */}
        <div className={styles.footerGrid}>
          
          {/* Column 1: Company */}
          <div className={styles.footerColumn}>
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/impact">Impact</Link>
            <Link href="/contact">Contact Us</Link>
          </div>

          {/* Column 2: Product */}
          <div className={styles.footerColumn}>
            <h4>Product</h4>
            <Link href="/#features">Features</Link> {/* Landiing page ke features section par link karein */}
            <Link href="/plans">Pricing</Link> {/* Existing link */}
            <Link href="/book-demo">Book a Demo</Link> {/* Yeh ek SaaS ke liye zaroori hai */}
            <Link href="/login">Admin Login</Link> {/* Existing link */}
          </div>

          {/* Column 3: Resources */}
          <div className={styles.footerColumn}>
            <h4>Resources</h4>
            <Link href="/faqs">FAQs</Link> {/* Existing link */}
            <Link href="/blog">Blog</Link> {/* Professional look ke liye accha hai */}
            <Link href="/newsletter">Newsletter</Link> {/* Existing link */}
          </div>

          {/* Column 4: Legal & Support */}
          <div className={styles.footerColumn}>
            <h4>Get In Touch</h4>
            <a href="mailto:myedupanel@gmail.com" className={styles.contactLink}>myedupanel@gmail.com</a>
            <a href="tel:+917776041548" className={styles.contactLink}>+91 7776041548</a>
            <Link href="/privacy-policy">Privacy Policy</Link> {/* Trust ke liye zaroori */}
            <Link href="/terms-of-service">Terms of Service</Link> {/* Trust ke liye zaroori */}
          </div>

        </div>
        
        <div className={styles.footerBottom}>
          <p>Copyright © {new Date().getFullYear()} All Right Reserved by My EduPanel.</p>
          <div className={styles.socialIcons}>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;