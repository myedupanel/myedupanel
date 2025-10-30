"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  // Slideshow effect (no change)
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

  // --- SIGNUP HANDLER MEIN BADLAV KIYA GAYA HAI ---
  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/signup', formData);
      
      // Backend se mile success message ko set karein
      setMessage(response.data.message || "OTP sent successfully!");

      // --- BADLAV: Ab hum login ke bajaye OTP page par redirect karenge ---
      if (response.data.success) {
        // 2 second ke baad user ko OTP page par bhej dein, email ke saath
        setTimeout(() => {
          router.push(`/verify-otp?email=${formData.email}`);
        }, 2000);
      }

    } catch (err: any) {
      // Backend se mile error message ko set karein
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.pageWrapper} ${inter.className}`}>
      <div className={styles.formContainer}>
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
                {isLoading ? 'Sending OTP...' : ( // Button text update
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