import React from 'react';

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-container">
          <div className="footer-column">
            <h4>Get In Touch</h4>
            <p>myedupanel@gmail.com</p>
            <p>+91 7776041548</p>
            <p>pune</p>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="#">Home</a>
            <a href="#">FAQs</a>
            <a href="#">Price Plan</a>
            <a href="#">Careers</a>
          </div>
          <div className="footer-column">
            <h4>Products</h4>
            <a href="#">Newsletter</a>
            <a href="#">Admin</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Copyright @ 2025 All Right Reserved by My EduPanel.</p>
        <div className="social-icons"></div>
      </div>
    </footer>
  );
}

export default Footer;