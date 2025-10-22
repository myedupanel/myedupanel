"use client";

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from './forgot-password.module.scss';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      setMessage("If an account with that email exists, a password reset link has been sent.");
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.msg || "An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        <header className={styles.header}>
          <h2>
            Welcome To <span>My EduPanel</span>
          </h2>
          <h1>Forgot Your Password?</h1>
          <p>Enter your email and we'll send you a reset link.</p>
        </header>

        <main>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Eg. shaurya@gmail.com"
                />
              </div>
            </div>

            {message && <div className={styles.successMessage}>{message}</div>}
            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={isLoading || !!message}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </main>

        {/* ▼▼▼ YEH SECTION AAPKE CODE MEIN GALAT THA ▼▼▼ */}
        <div className={styles.footer}>
  <p>
    Suddenly remembered it?
    <Link href="/login">Back to Login</Link>
  </p>
</div>
        {/* ▲▲▲ ISE AB THEEK KAR DIYA GAYA HAI ▲▲▲ */}

      </div>
    </div>
  );
}