"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FiEye, FiEyeOff, FiArrowRight, FiHome } from 'react-icons/fi';
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

  // Slideshow effect
  const nextSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
  };

  const prevSlide = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + slideshowImages.length) % slideshowImages.length);
  };

  // Auto slideshow
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
  //   }, 5000);
  //   return () => clearTimeout(timer);
  // }, [currentImageIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, login to get the token
      const response = await axios.post('/api/auth/login', formData);
      
      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Set the token in axios default headers for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Fetch user data
        const userResponse = await axios.get('/api/auth/me');
        const { role } = userResponse.data;
        
        // Redirect based on user role
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else if (role === 'teacher') {
          router.push('/teacher');
        } else if (role === 'student') {
          router.push('/student');
        } else if (role === 'parent') {
          router.push('/parent');
        } else {
          router.push('/admin'); // Default redirect
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
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
            <span onClick={prevSlide}>❮</span>
            <span onClick={nextSlide}>❯</span>
          </div>
        </div>
      </div>
    </div>
  );
}