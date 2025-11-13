"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// FIX: Use our configured API instance instead of default axios
import api from '../../backend/utils/api';
import { FiEye, FiEyeOff, FiArrowRight, FiHome, FiUser, FiShield } from 'react-icons/fi';
import styles from './login.module.scss';
import { Inter, Montserrat } from 'next/font/google';

// =========================================================
// FIX 1: Global Auth Context Import करें
// =========================================================
import { useAuth } from '@/app/context/AuthContext'; 

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700'] });

const slideshowImages = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1560780552-ba54683cb263?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1170"
];

export default function LoginPage() {
  const router = useRouter();
  // FIX 2: useAuth hook से 'login' function को निकालें
  const { login } = useAuth(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'idle' | 'authenticating' | 'fetching' | 'redirecting'>('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Slideshow effect (No Change)
  useEffect(() => {
    startSlideShow();
    
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (carouselTrackRef.current) {
      carouselTrackRef.current.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    }
  }, [currentImageIndex]);

  const startSlideShow = () => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    
    slideIntervalRef.current = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % slideshowImages.length);
    }, 5000);
  };

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    startSlideShow();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setLoginStep('authenticating');
    
    try {
      // 1. First, login to get the token
      // FIX: Use our configured api instance instead of default axios
      const response = await api.post('/auth/login', formData);
      
      if (response.data.token) {
        const token = response.data.token;
        
        setLoginStep('fetching');
        setSuccessMessage('Authentication successful!');
        
        // Small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 2. FIX 3: Context के 'login' function को कॉल करें।
        // यह function अब token save करेगा, header सेट करेगा, और user data fetch करके 
        // global state (setUser) को अपडेट करेगा।
        const user = await login(token);
        
        if (!user) {
             // Handle case where login succeeded but user fetch failed inside context
             throw new Error('Could not retrieve user data after successful login.');
        }

        const { role } = user; // Use user data returned by context's login function
        
        setLoginStep('redirecting');
        setSuccessMessage('Redirecting to your dashboard...');
        
        // Small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 3. Redirect based on user role (using data returned from context)
        if (role === 'admin' || role === 'Admin') {
          router.push('/admin/dashboard');
        } else if (role === 'teacher' || role === 'Teacher') {
          router.push('/teacher');
        } else if (role === 'student' || role === 'Student') {
          router.push('/student');
        } else if (role === 'parent' || role === 'Parent') {
          router.push('/parent');
        } else {
          // Default to admin dashboard for any other role
          router.push('/admin/dashboard');
        }
      } else {
        setError(response.data.message || 'Login failed');
        setLoginStep('idle');
      }
    } catch (err: any) {
      setLoginStep('idle');
      console.error('Login error:', err);
      // Handle the error which might be a network error or a specific API error
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show login process animation (No Change)
  if (loginStep !== 'idle') {
    return (
      <div className={`${styles.pageWrapper} ${inter.className}`}>
        {/* --- Left Side: Login Process Animation --- */}
        <div className={styles.formContainer}>
          <div className={styles.formCard}>
            <div className={styles.processContainer}>
              <div className={styles.processAnimation}>
                <div className={`${styles.processIcon} ${loginStep === 'authenticating' ? styles.active : ''}`}>
                  <FiShield />
                </div>
                <div className={`${styles.processIcon} ${loginStep === 'fetching' ? styles.active : ''}`}>
                  <FiUser />
                </div>
                <div className={`${styles.processIcon} ${loginStep === 'redirecting' ? styles.active : ''}`}>
                  <FiArrowRight />
                </div>
                
                <div className={styles.progressBar}>
                  <div className={`${styles.progressFill} ${styles[loginStep]}`}></div>
                </div>
                
                <p className={styles.processMessage}>{successMessage || 'Processing...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Side: Slideshow (kept for consistency) --- */}
        <div className={`${styles.slideshowContainer} ${montserrat.className}`}>
          <div className={styles.overlay}></div>
          
          <div className={styles.carouselTrack} ref={carouselTrackRef}>
            {slideshowImages.map((src, index) => (
              <div
                key={index}
                className={`${styles.carouselSlide} ${index === currentImageIndex ? styles.active : ''}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
          
          <div className={styles.slideshowContent}>
            <div className={styles.tagline}>
              Your Complete School Management System
            </div>
            

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageWrapper} ${inter.className}`}>
      {/* --- Left Side: Login Form --- */}
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <header className={styles.header}>
            <h3 className={styles.welcomeText}>Welcome To</h3>
            <h1>
              <span className={styles.schoolText}>School</span>
              <span className={styles.proText}>Pro</span>
            </h1>
          </header>

          <main className={styles.formContent}>
            <h2>Sign in to your account</h2>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Eg. shauryaghadage@gmail.com"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange} 
                    required 
                    placeholder="Please Enter Your Password"
                  />
                  <span onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
                <div className={styles.forgotPasswordRow}>
                  <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
                </div>
              </div>
              
              {error && <div className={styles.errorMessage}>{error}</div>}

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Signing in...' : (
                  <><span>Signin</span><FiArrowRight /></>
                )}
              </button>
            </form>
          </main>

          <div className={styles.actionLinkContainer}>
            <Link href="/signup" className={styles.actionLink}>
              <span>Create a new account</span>
              <strong>Sign Up</strong>
            </Link>
          </div>

          <div className={styles.homeLinkContainer}>
            <Link href="/" className={styles.homeLink}>
              <FiHome />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- Right Side: Infinite Carousel Slideshow --- */}
      <div className={`${styles.slideshowContainer} ${montserrat.className}`}>
        <div className={styles.overlay}></div>
        
        <div className={styles.carouselTrack} ref={carouselTrackRef}>
          {slideshowImages.map((src, index) => (
            <div
              key={index}
              className={`${styles.carouselSlide}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        
        <div className={styles.slideshowContent}>
          <div className={styles.tagline}>
            Your Complete School Management System
          </div>
          
          
        </div>
      </div>
    </div>
  );
}