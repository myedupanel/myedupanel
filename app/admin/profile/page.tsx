// app/admin/profile/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss'; // Ensure this SCSS file exists and is styled
import { useAuth, User } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import api from '@/backend/utils/api';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi'; // Added FiLoader

// Interface includes name2 and place
interface SchoolFormData {
  name: string;
  name2: string; // School Name 2 (Main Name for Certificate)
  address: string;
  mobNo: string; // Contact Number (Frontend State)
  email: string; // School's PUBLIC email
  udiseNo: string;
  govtReg: string; // Government Registration No. (Frontend State)
  place: string; // Place for Certificate Footer
  logoUrl: string; // Base64 string or URL
}

const SchoolProfilePage = () => {
  const router = useRouter();
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

  // State includes name2 and place
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    name2: '',
    address: '',
    mobNo: '',
    email: '',
    udiseNo: '',
    govtReg: '',
    place: '',
    logoUrl: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 90-day rule logic
  const [canUpdateSchoolName, setCanUpdateSchoolName] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useMemo(() => {
    if (user?.schoolNameLastUpdated) {
      const lastUpdate = new Date(user.schoolNameLastUpdated);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (lastUpdate > ninetyDaysAgo) {
        const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, 90 - daysPassed);
        setDaysRemaining(remaining);
        setCanUpdateSchoolName(false);
      } else {
        setCanUpdateSchoolName(true);
        setDaysRemaining(null);
      }
    } else if (user) {
      setCanUpdateSchoolName(true);
      setDaysRemaining(null);
    }
  }, [user]);

  // useEffect fetches school profile
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      if (!user) {
        // If user is null after initial load, maybe redirect to login?
        // For now, just stop loading and show potential error later if needed.
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const res = await api.get('/api/school/profile');
        setFormData({
          name: res.data.name || user.schoolName || '',
          name2: res.data.name2 || '',
          address: res.data.address || '',
          // Use correct mapping from backend fields
          mobNo: res.data.contactNumber || '', // Assuming backend uses contactNumber
          email: res.data.email || '',
          udiseNo: res.data.udiseNo || '',
          govtReg: res.data.recognitionNumber || '', // Assuming backend uses recognitionNumber
          place: res.data.place || '',
          logoUrl: res.data.logoUrl || ''
        });

        if (res.data.logoUrl) {
          setImagePreview(res.data.logoUrl);
        }

      } catch (err: any) {
        console.error("Failed to fetch school profile:", err);
        setError('Failed to load school profile. Please ensure you have completed setup or try refreshing.');
        // Set name from context as fallback even on error
        if (user.schoolName) {
           setFormData(prev => ({...prev, name: user.schoolName}));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolProfile();
  }, [user]); // Re-run when user context is available

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Clear messages when user starts typing again
    setError('');
    setSuccessMessage('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("File is too large. Please select an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prevData => ({ ...prevData, logoUrl: base64String }));
      };
      reader.onerror = () => {
          setError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).value = ''; };

  // handleFormSubmit sends name2 and place
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success messages
    setIsSubmitting(true);

    // Basic Validations
    if (!formData.name) {
        setError('School Name (Main/Trust) is required.');
        setIsSubmitting(false);
        return;
    }
     if (!formData.name2) {
        setError('School Name Line 2 (For Certificates) is required.');
        setIsSubmitting(false);
        return;
    }
     if (!formData.address) {
        setError('School Address is required.');
        setIsSubmitting(false);
        return;
    }
     if (!formData.place) {
        setError('Place (For Certificate Footer) is required.');
        setIsSubmitting(false);
        return;
    }
     // Add more specific validations if needed (e.g., UDISE format)

    try {
      // Prepare payload mapping frontend state names to backend model names
      const payload = {
        name: formData.name,
        name2: formData.name2,
        address: formData.address,
        contactNumber: formData.mobNo, // Map mobNo to contactNumber
        email: formData.email,
        udiseNo: formData.udiseNo,
        recognitionNumber: formData.govtReg, // Map govtReg to recognitionNumber
        place: formData.place,
        logoUrl: formData.logoUrl // Send Base64 or existing URL
      };

      console.log("Submitting school profile:", payload); // Log payload before sending
      const response = await api.put('/api/school/profile', payload);
      console.log("API Response:", response.data); // Log API response

      // Update user context/token if backend sends a new one
      if (response.data.token) {
        console.log("Received new token, updating context.");
        await login(response.data.token);
      }

      // Update local state with the actual saved data returned by backend
      const savedData = response.data.school; // Assume backend returns updated school object
      if (savedData) {
        setFormData({
            name: savedData.name || '',
            name2: savedData.name2 || '',
            address: savedData.address || '',
            mobNo: savedData.contactNumber || '', // Update from contactNumber
            email: savedData.email || '',
            udiseNo: savedData.udiseNo || '',
            govtReg: savedData.recognitionNumber || '', // Update from recognitionNumber
            place: savedData.place || '',
            logoUrl: savedData.logoUrl || ''
        });
        if(savedData.logoUrl) {
            setImagePreview(savedData.logoUrl);
        }
      } else {
          // If backend doesn't return updated data, just show success
          console.warn("Backend did not return updated school data in response.school");
      }

      setSuccessMessage('School profile updated successfully!');

      // ✅ ADDED REDIRECTION LOGIC
      setTimeout(() => {
        router.push('/admin/dashboard'); // Redirect to dashboard after 1.5 seconds
      }, 1500);

    } catch (err: any) {
      const backendError = err.response?.data?.message || err.response?.data?.msg || 'Failed to update profile. Please check details and try again.';
      setError(backendError);
      console.error("Profile update error:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      router.back(); // Use router.back() to go to previous page
    }
  };

  // Loading state while fetching initial data
  if (isLoading) {
    return <div className={styles.loadingScreen}><FiLoader /> Loading profile...</div>;
  }

  // Handle case where user context is still null after loading attempt (rare)
  if (!user && !isLoading) {
      return <div className={styles.loadingScreen}>Error loading user data. Please try logging in again.</div>;
  }


  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit School Profile</h1>

      <div className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={handleFormSubmit}>

          <div className={styles.profileHeader}>
            {imagePreview ? (
              <Image src={imagePreview} alt="School Logo" width={100} height={100} className={styles.profileImage} />
            ) : (
              // Use formData.name or user.schoolName for DefaultAvatar
              <DefaultAvatar name={formData.name || user?.schoolName || 'S'} size={100} />
            )}
            <div className={styles.imageUploadWrapper}>
              <label htmlFor="imageUpload" className={styles.uploadButton}>Change Logo</label>
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }} disabled={isSubmitting} />
               <small className={styles.uploadHint}>Max 2MB (PNG, JPG, WEBP)</small>
            </div>
          </div>

          {/* Messages Area */}
          {error && <p className={styles.errorMessage}><FiAlertCircle /> {error}</p>}
          {successMessage && <p className={styles.successMessage}><FiCheckCircle /> {successMessage}</p>}

          {/* School Name (Trust Name) */}
          <div className={styles.formGroup}>
            <label htmlFor="name">School/Trust Name (Main) *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={!canUpdateSchoolName || isSubmitting} className={!canUpdateSchoolName ? styles.disabledInput : ''} />
            {!canUpdateSchoolName && daysRemaining !== null && (<p className={styles.infoMessage}> You can change school name again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. </p> )}
          </div>

          {/* School Name 2 (Tagline) */}
          <div className={styles.formGroup}>
            <label htmlFor="name2">School Name Line 2 (For Certificates) *</label>
            <input type="text" id="name2" name="name2" value={formData.name2} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.g., Khandeshwar Sec. & Higher Sec. School" />
            <small>This will be the main name shown on certificates.</small>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label htmlFor="address">School Address *</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} required disabled={isSubmitting} placeholder="e.g., Devgaon Road, Paranda, Dist. Dharashiv" />
          </div>

          {/* Place (for Footer) */}
          <div className={styles.formGroup}>
            <label htmlFor="place">Place (For Certificate Footer) *</label>
            <input type="text" id="place" name="place" value={formData.place} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.g., Paranda" />
          </div>

          {/* Login Email (Read-Only) */}
          <div className={styles.formGroup}>
            <label htmlFor="loginEmail">Login Email (Cannot be changed)</label>
            <input
              type="email"
              id="loginEmail"
              name="loginEmail"
              value={user?.email || 'Loading...'} // Use optional chaining
              disabled
              readOnly // Use readOnly for better semantics
              className={styles.disabledInput}
            />
          </div>

          {/* Form Grid for Contact / Public Email */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="mobNo">Contact Number</label>
              <input type="tel" id="mobNo" name="mobNo" value={formData.mobNo} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., 7030325343" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Public Email (For Certificates)</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., contact@school.com" />
            </div>
          </div>

          {/* Form Grid for Reg Numbers */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="udiseNo">UDISE No.</label>
              <input type="text" id="udiseNo" name="udiseNo" value={formData.udiseNo} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., 27290606424" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="govtReg">Govt. Reg. No.</label>
              <input type="text" id="govtReg" name="govtReg" value={formData.govtReg} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., SFS-1114/PK-40/SM-2" />
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className={styles.saveButton} disabled={isSubmitting || isLoading}>
              {isSubmitting ? <><FiLoader className={styles.spinner}/> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolProfilePage;