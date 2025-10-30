"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiArrowRight, FiEye, FiEyeOff, FiHome } from 'react-icons/fi';
import styles from './login.module.scss';
import { Inter } from 'next/font/google';
// ===== BADLAV 1: AuthContext se 'useAuth' hook ko import karein =====
import { useAuth } from '@/app/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

const slideshowImages = [
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1560440021-33f9b867899d?auto=format&fit=crop&q=80&w=1974",
  "https://images.unsplash.com/photo-1590324153173-1959b867d268?auto=format&fit=crop&q=80&w=2070"
];

export default function LoginPage() {
  const router = useRouter();
  // ===== BADLAV 2: AuthContext se 'login' function nikalein =====
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentImageIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===== BADLAV 3: handleLogin function ko poori tarah update kiya gaya hai =====
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      const token = response.data.token;
      
      // Context ke login function ko call karein. Yeh token save karega aur state update karega.
      const user = await login(token);

      if (user) {
        // Role ke hisaab se sahi dashboard par bhejna
        switch (user.role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'teacher':
            router.push('/teacher/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
          case 'parent':
            router.push('/parent/dashboard');
            break;
          default:
            router.push('/');
        }
      } else {
        setError("Could not verify user role after login.");
      }
    } catch (err: any) {
      if (err.response && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Baaki saara JSX code bilkul waisa hi rahega
  return (
    <div className={`${styles.pageWrapper} ${inter.className}`}>
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          <header className={styles.header}>
            <p className={styles.welcomeText}>Welcome Back To</p>
            <h1>
              <span className={styles.schoolText}>My</span>
              <span className={styles.proText}>EduPanel</span>
            </h1>
          </header>

          <main className={styles.formContent}>
            <h2>Login to your Account</h2>
            <form onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Ex. shauryaghadage@gmail.com" />
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
            <Link href="/signup" className={styles.actionLink} replace>
              <span>Don't have an account?</span>
              <strong>Create now</strong>
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

      <div className={styles.slideshowContainer}>
        <div className={styles.overlay}></div>
        {slideshowImages.map((src, index) => (
          <div 
            key={src}
            className={`${styles.slide} ${index === currentImageIndex ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.slideshowContent}>
          <p className={styles.tagline}>Transform Education, One Click at a Time</p>
        </div>
      </div>
    </div>
  );
}