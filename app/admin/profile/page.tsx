"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss';
// --- Import User type from AuthContext ---
import { useAuth, User } from '../../context/AuthContext'; // Import User type
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import axios from 'axios';

// --- Remove the separate UserWithUpdateDate interface ---

const AdminProfilePage = () => {
  const router = useRouter();
  // --- Cast user directly to the imported User type ---
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

  const [formData, setFormData] = useState({
    name: '', // Use 'name' for form state consistency
    schoolName: '',
    email: '',
    profileImageUrl: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  // State for 90-day rule
  const [canUpdateSchoolName, setCanUpdateSchoolName] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Calculate 90-day rule (no changes here)
  useMemo(() => {
    if (user?.schoolNameLastUpdated) {
      const lastUpdate = new Date(user.schoolNameLastUpdated);
      const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (lastUpdate > ninetyDaysAgo) {
        const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime()); const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)); const remaining = Math.max(0, 90 - daysPassed);
        setDaysRemaining(remaining); setCanUpdateSchoolName(false);
      } else { setCanUpdateSchoolName(true); setDaysRemaining(null); }
    } else { setCanUpdateSchoolName(true); setDaysRemaining(null); }
  }, [user?.schoolNameLastUpdated]);

  // Populate form (no changes here)
  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`); let imageUrl = ""; let savedName = "";
      if (savedProfile) { try { const d = JSON.parse(savedProfile); imageUrl = d.profileImageUrl || ""; savedName = d.adminName || ""; } catch (e) { console.error(e); } }
      setFormData({ name: savedName || user.name || '', schoolName: user.schoolName || '', email: user.email || '', profileImageUrl: imageUrl });
      if (imageUrl) { setImagePreview(imageUrl); }
    }
  }, [user]);

  // Input handlers (no changes here)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setImagePreview(base64String);
            setFormData(prevData => ({ ...prevData, profileImageUrl: base64String }));
          };
          reader.readAsDataURL(file);
        }
  };
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).value = ''; };

  // --- UPDATED handleFormSubmit with success message, loading state, and delayed redirect ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // Clear previous messages
    setIsLoading(true); // Start loading
    if (!user) {
        setIsLoading(false); // Stop loading if no user
        return;
    }

    console.log("Submitting Profile Data:", { adminName: formData.name, schoolName: formData.schoolName });

    try {
      // 1. Save locally (unchanged)
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({
        profileImageUrl: formData.profileImageUrl,
        adminName: formData.name
      }));

      // 2. Send to backend (backend expects adminName)
      const response = await axios.put('/api/admin/profile', {
        adminName: formData.name,
        schoolName: formData.schoolName
      });

      // 3. Update context (WAIT)
      if (response.data.token) {
        await login(response.data.token);
      }

      // 4. Show success message on page
      setSuccessMessage('Profile saved successfully!');

      // 5. Redirect after a delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000); // 2 seconds delay

    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(message);
      console.error("Profile update error:", err.response?.data);
      setIsLoading(false); // Stop loading on error
    }
    // No need to set isLoading false here if successful, as page will redirect
  };
  // --- End UPDATED handleFormSubmit ---

  const handleCancel = () => {
    // Prevent cancel if already submitting
    if (!isLoading) {
      router.push('/admin/dashboard');
    }
  };

  if (!user) { // Only show initial loading
    return <div>Loading profile...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit Profile</h1>
      <div className={styles.profileCard}>
        {/* Profile Header (unchanged) */}
        <div className={styles.profileHeader}>
          {imagePreview ? <Image src={imagePreview} alt="Profile" width={100} height={100} className={styles.profileImage} /> : <DefaultAvatar name={formData.name} size={100} />}
          <div className={styles.imageUploadWrapper}> <label htmlFor="imageUpload" className={styles.uploadButton}>Change Photo</label> <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }} disabled={isLoading}/> </div>
        </div>

        <form className={styles.profileForm} onSubmit={handleFormSubmit}>
          {/* --- Show Success or Error Message --- */}
          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          {/* --- End Update --- */}

          {/* Form Groups - Added disabled={isLoading} */}
          <div className={styles.formGroup}> <label htmlFor="name">Full Name</label> <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isLoading}/> </div>
          <div className={styles.formGroup}> <label htmlFor="schoolName">School Name</label> <input type="text" id="schoolName" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required disabled={!canUpdateSchoolName || isLoading} className={!canUpdateSchoolName ? styles.disabledInput : ''} /> {!canUpdateSchoolName && daysRemaining !== null && (<p className={styles.infoMessage}> You can change school name again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. </p> )} </div>
          <div className={styles.formGroup}> <label htmlFor="email">Email Address</label> <input type="email" id="email" name="email" value={formData.email} readOnly className={styles.readOnlyInput} /> </div>

          {/* --- Buttons Disabled while loading --- */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={isLoading}>Cancel</button>
            <button type="submit" className={styles.saveButton} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {/* --- End Update --- */}
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;