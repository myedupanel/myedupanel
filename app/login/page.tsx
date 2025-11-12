"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiEye, FiEyeOff, FiArrowRight, FiHome, FiCheck, FiUser, FiShield } from 'react-icons/fi';
import styles from './login.module.scss';
import { Inter, Montserrat } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700'] });

const slideshowImages = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1560780552-ba54683cb263?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1170"
];

export default function LoginPage() {
  const router = useRouter();
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

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setLoginStep('authenticating');
    
    try {
      // First, login to get the token
      const response = await axios.post('/api/auth/login', formData);
      
      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Set the token in axios default headers for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setLoginStep('fetching');
        setSuccessMessage('Authentication successful!');
        
        // Small delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fetch user data
        const userResponse = await axios.get('/api/auth/me');
        const { role } = userResponse.data;
        
        setLoginStep('redirecting');
        setSuccessMessage('Redirecting to your dashboard...');
        
        // Small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect based on user role
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
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show login process animation
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
          
          {slideshowImages.map((src, index) => (
            <div
              key={index}
              className={`${styles.slide} ${index === currentImageIndex ? styles.active : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          
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

      {/* --- Right Side: Slideshow --- */}
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
          <div className={styles.tagline}>
            Your Complete School Management System
          </div>
          
          <div className={styles.navArrows}>
            <span onClick={() => setCurrentImageIndex((prev) => (prev - 1 + slideshowImages.length) % slideshowImages.length)}>❮</span>
            <span onClick={() => setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length)}>❯</span>
          </div>
        </div>
      </div>
    </div>
  );
}