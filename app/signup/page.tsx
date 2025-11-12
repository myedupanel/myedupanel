"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// --- BADLAAV 1: 'useSearchParams' ko import karein ---
import { useRouter, useSearchParams } from 'next/navigation'; 
import axios from 'axios';
import { FiHome, FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './signup.module.scss';
import { Inter, Montserrat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700'] });

const slideshowImages = [
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1170"
];

export default function SignupPage() {
  const router = useRouter();
  // --- BADLAAV 2.1: Hook ko initialize karein ---
  const searchParams = useSearchParams(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Remove dark mode class from body when on signup page
  useEffect(() => {
    document.body.classList.remove('dark-mode');
    
    // Cleanup function to restore dark mode on unmount if needed
    return () => {
      // We don't restore dark mode here as we want it to be controlled by Navbar
    };
  }, []);

  // --- BADLAAV 2.2: Yeh naya useEffect add karein ---
  // Yeh effect page load hote hi URL check karega
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'starter') {
      // User ke "intent" ko localStorage mein save karein
      localStorage.setItem('signupIntent', 'starter');
    }
  }, [searchParams]); // Page load par run hoga

  // Slideshow effect (Bina Badlaav)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentImageIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- SIGNUP HANDLER (Bina Badlaav) ---
  // Ismein koi badlaav ki zaroorat nahi hai.
  // Yeh user ko OTP page par bhej dega, aur "intent" localStorage mein saved hai.
  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/signup', formData);
      setMessage(response.data.message || "OTP sent successfully!");

      if (response.data.success) {
        setTimeout(() => {
          router.push(`/verify-otp?email=${formData.email}`);
        }, 2000);
      }

    } catch (err: any) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX (Bina Badlaav) ---
  return (
    <div className={`${styles.pageWrapper} ${inter.className}`}>
      <div className={styles.formContainer}>
        {/* ... (Aapka saara JSX code yahaan hai) ... */}
        <div className={styles.formWrapper}>
          <header className={styles.header}>
            <h3 className={styles.welcomeText}>Welcome To</h3>
            <h1><span className={styles.schoolText}>My</span><span className={styles.proText}>EduPanel</span></h1>
          </header>

          <main className={styles.formContent}>
            <form onSubmit={handleSignup}>
              <div className={styles.inputGroup}><label htmlFor="schoolName">School Name</label><div className={styles.inputWrapper}><FiHome /><input type="text" id="schoolName" name="schoolName" value={formData.schoolName} onChange={handleChange} required placeholder="Your School's Name" /></div></div>
              <div className={styles.inputGroup}><label htmlFor="adminName">Admin Name</label><div className={styles.inputWrapper}><FiUser /><input type="text" id="adminName" name="adminName" value={formData.adminName} onChange={handleChange} required placeholder="Enter Your Name" /></div></div>
              <div className={styles.inputGroup}><label htmlFor="email">Email</label><div className={styles.inputWrapper}><FiMail /><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Eg. shauryaghadage@gmail.com" /></div></div>
              <div className={styles.inputGroup}><label htmlFor="password">Password</label><div className={styles.inputWrapper}><FiLock /><input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Create a strong password" /><span onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon}>{showPassword ? <FiEyeOff /> : <FiEye />}</span></div></div>
              
              {error && <div className={styles.errorMessage}>{error}</div>}
              {message && <div className={styles.successMessage}>{message}</div>}

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : (
                  <><span>Create Account</span><FiArrowRight /></>
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <Link href="/login" className={styles.loginLink}>
                <span>Already have an account?</span>
                <strong>Log In</strong>
              </Link>
            </div>
          </main>
          
          <div className={styles.homeLinkContainer}>
            <Link href="/" className={styles.homeLink}>
              <FiHome />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={`${styles.slideshowContainer} ${montserrat.className}`}>
        {/* ... (Aapka saara slideshow JSX) ... */}
        <div className={styles.overlay}></div>
        {slideshowImages.map((src, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === currentImageIndex ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.slideshowContent}>
          <div className={styles.topText}>Your Complete School Management System</div>
          <div className={styles.bottomText}>School Pro <span className={styles.bottomTextHighlight}>The Way Of Education</span></div>
        </div>
      </div>
    </div>
  );
}