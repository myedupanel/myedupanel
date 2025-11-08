import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.scss'; // Assuming you have an SCSS file for styling
import { FiMail, FiPhone, FiLinkedin, FiTwitter } from 'react-icons/fi'; // Icons for contact

const Footer = () => {
    // We assume the main marketing pages are relative to the root '/'

    return (
        <footer className={styles.footerContainer}>
            <div className={styles.footerContent}>
                <div className={styles.logoSection}>
                    <h2>My EduPanel</h2>
                    <p>Transforming Education, One Click at a Time.</p>
                </div>

                {/* Company Links */}
                <div className={styles.footerColumn}>
                    <h3>Company</h3>
                    <ul className={styles.linkList}>
                        {/* === YEH HAI NAYE LINKS === */}
                        <li><Link href="/about" className={styles.footerLink}>About Us</Link></li>
                        <li><Link href="/careers" className={styles.footerLink}>Careers</Link></li>
                        <li><Link href="/impact" className={styles.footerLink}>Impact</Link></li>
                        <li><Link href="/contact" className={styles.footerLink}>Contact Us</Link></li>
                        {/* ========================== */}
                    </ul>
                </div>

                {/* Product Links */}
                <div className={styles.footerColumn}>
                    <h3>Product</h3>
                    <ul className={styles.linkList}>
                        <li><Link href="/#features" className={styles.footerLink}>Features</Link></li>
                        <li><Link href="/#pricing-section" className={styles.footerLink}>Pricing</Link></li>
                        <li><Link href="/book-demo" className={styles.footerLink}>Book a Demo</Link></li>
                        <li><Link href="/admin-login" className={styles.footerLink}>Admin Login</Link></li>
                    </ul>
                </div>

                {/* Resources Links */}
                <div className={styles.footerColumn}>
                    <h3>Resources</h3>
                    <ul className={styles.linkList}>
                        <li><Link href="/faqs" className={styles.footerLink}>FAQs</Link></li>
                        <li><Link href="/blog" className={styles.footerLink}>Blog</Link></li>
                        <li><Link href="/newsletter" className={styles.footerLink}>Newsletter</Link></li>
                    </ul>
                </div>

                {/* Get In Touch */}
                <div className={styles.footerColumn}>
                    <h3>Get In Touch</h3>
                    <p className={styles.contactItem}><FiMail /> myedupanel@gmail.com</p>
                    <p className={styles.contactItem}><FiPhone /> +91 7776041548</p>
                    <ul className={styles.socialLinks}>
                        <li><Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link></li>
                        <li><Link href="/terms" className={styles.footerLink}>Terms of Service</Link></li>
                    </ul>
                </div>
            </div>

            <div className={styles.copyrightBar}>
                <p>Copyright © {new Date().getFullYear()} All Right Reserved by My EduPanel.</p>
                <div className={styles.socialIcons}>
                    <FiLinkedin className={styles.socialIcon} />
                    <FiTwitter className={styles.socialIcon} />
                </div>
            </div>
        </footer>
    );
}

export default Footer;