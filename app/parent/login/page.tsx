// File: app/parent/login/page.tsx
// Parent Login Page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ParentLoginPage.module.scss';

export default function ParentLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('parent_token');
    if (token) {
      router.push('/parent/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/parent-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('parent_token', data.token);
        localStorage.setItem('parent_user', JSON.stringify(data.user));
        
        setSuccess('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/parent/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/parent/forgot-password');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#6366F1"/>
              <path d="M15 18L24 13L33 18V30L24 35L15 30V18Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="24" cy="24" r="3" fill="white"/>
            </svg>
          </div>
          <h1 className={styles.title}>Parent Portal</h1>
          <p className={styles.subtitle}>Access your child's academic information</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
              {success}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className={styles.spinner} width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="28.27 28.27" strokeDashoffset="28.27"></circle>
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <button 
            onClick={handleForgotPassword}
            className={styles.forgotPassword}
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>

        <div className={styles.infoSection}>
          <h3>Features Available</h3>
          <ul>
            <li>📊 Real-time attendance monitoring</li>
            <li>📈 Academic performance tracking</li>
            <li>💰 Fee payment history and dues</li>
            <li>📝 Assignment submissions and deadlines</li>
            <li>💬 Direct messaging with teachers/admin</li>
            <li>📅 School announcements and events</li>
          </ul>
        </div>
      </div>

      <div className={styles.backgroundPattern}>
        <div className={styles.patternElement}></div>
        <div className={styles.patternElement}></div>
        <div className={styles.patternElement}></div>
      </div>
    </div>
  );
}