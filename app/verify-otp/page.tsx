"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import styles from './VerifyOtpPage.module.scss';
import Link from 'next/link';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  // --- BADLAV 1: Dono buttons ke liye alag-alag loading states ---
  const [isVerifying, setIsVerifying] = useState(false); // Sirf 'Verify' button ke liye
  const [isResending, setIsResending] = useState(false); // Sirf 'Resend' button ke liye

  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { login } = useAuth();

  // Remove dark mode class from body when on verify OTP page
  useEffect(() => {
    document.body.classList.remove('dark-mode');
    
    // Cleanup function to restore dark mode on unmount if needed
    return () => {
      // We don't restore dark mode here as we want it to be controlled by Navbar
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
    if (!email) router.push('/signup');
  }, [email, router]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp]; newOtp[index] = element.value; setOtp(newOtp);
    if (element.value !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async () => {
    setError('');
    setResendStatus('');
    setIsVerifying(true); // --- BADLAV 2: Ab 'isVerifying' state use hoga ---
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      setIsVerifying(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email: email, otp: enteredOtp,
      });
      if (response.data.success) {
        setFinalMessage(response.data.message);
        setTimeout(() => { router.push('/login'); }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true); // --- BADLAV 3: Ab 'isResending' state use hoga ---
    setError('');
    setResendStatus('');
    
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      if (response.data.success) {
        setResendStatus(response.data.message);
        setCountdown(120);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyBox}>
        <h1 className={styles.title}>Verify Your Email</h1>
        
        {finalMessage ? (
          <div className={styles.successBox}>
            <p>{finalMessage}</p>
            <Link href="/login" className={styles.loginLink}>Go to Login</Link>
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>
              An OTP has been sent to <strong>{email}</strong>. Please enter it below.
            </p>

            {resendStatus && <p className={styles.resendSuccessText}>{resendStatus}</p>}
            {error && <p className={styles.errorText}>{error}</p>}
            
            <div className={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  // ===== YEH HAI AAPKA FIX (line 131) =====
                  // Humne function ke around curly braces {} add kiye hain
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  className={styles.otpInput}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  disabled={isVerifying || isResending}
                />
              ))}
            </div>

            {/* --- BADLAV 4: Button ab 'isVerifying' state use karega --- */}
            <button 
              className={styles.verifyButton} 
              onClick={handleVerify} 
              disabled={isVerifying || isResending}
            >
              {isVerifying ? 'Verifying...' : 'Verify Account'}
            </button>
            
            <p className={styles.resendText}>
              Didn't receive the code? 
              {/* --- BADLAV 5: Button ab 'isResending' state use karega --- */}
              <button 
                className={styles.resendButton} 
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
              >
                {isResending ? 'Sending...' : (countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOtpPage;