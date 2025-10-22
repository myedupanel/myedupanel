"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import styles from './reset-password.module.scss';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      // NOTE: Make sure this API route is correct for your backend setup
      const response = await axios.put(`/api/auth/reset-password/${token}`, { password });
      setMessage("Your password has been reset successfully! Redirecting to login...");
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.msg || "Invalid or expired token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formContainer}>
        {/* Step 1: Header ko naye design ke anusaar badla gaya */}
        <header className={styles.header}>
          <h2>
            Welcome To <span>My EduPanel</span>
          </h2>
          <h1>Set a New Password</h1>
          <p>Your new password must be secure and different from previous passwords.</p>
        </header>

        <main>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">New Password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <span onClick={() => setShowPassword(!showPassword)} className={styles.eyeIcon}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                 <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.eyeIcon}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            {message && <div className={styles.successMessage}>{message}</div>}
            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={isLoading || !!message}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </main>
        
        {/* Step 2: Footer ko naye design ke anusaar badla gaya */}
        <footer className={styles.footer}>
          <Link href="/login">
            <FiArrowLeft /> Back to Login
          </Link>
        </footer>
      </div>
    </div>
  );
}