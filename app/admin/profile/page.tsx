"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss';
// --- Import User type from AuthContext ---
import { useAuth, User } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import axios from 'axios';

// --- Remove the separate UserWithUpdateDate interface ---

const AdminProfilePage = () => {
  const router = useRouter();
  // --- Cast user directly to the imported User type ---
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

  const [formData, setFormData] = useState({
    name: '', // Use 'name' to match state and form input
    schoolName: '',
    email: '',
    profileImageUrl: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [canUpdateSchoolName, setCanUpdateSchoolName] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Calculate 90-day rule
  useMemo(() => {
    if (user?.schoolNameLastUpdated) {
      const lastUpdate = new Date(user.schoolNameLastUpdated);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      if (lastUpdate > ninetyDaysAgo) {
        const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
        // Calculate days passed since last update
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 90 - daysPassed;
        setDaysRemaining(remaining > 0 ? remaining : 0);
        setCanUpdateSchoolName(false);
      } else {
        setCanUpdateSchoolName(true);
        setDaysRemaining(null);
      }
    } else {
        setCanUpdateSchoolName(true);
        setDaysRemaining(null);
    }
  }, [user?.schoolNameLastUpdated]);


  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      let imageUrl = "";
      let savedName = "";

      if (savedProfile) {
        try {
          const parsedData = JSON.parse(savedProfile);
          imageUrl = parsedData.profileImageUrl || "";
          savedName = parsedData.adminName || ""; // Still check localStorage for adminName key
        } catch (e) { console.error("Failed to parse saved profile data:", e); }
      }

      setFormData({
        name: savedName || user.name || '', // Prioritize localStorage, then context 'name'
        schoolName: user.schoolName || '', // Use 'schoolName' from context/token
        email: user.email || '', // Use 'email' from context/token
        profileImageUrl: imageUrl
      });

      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [user]); // Rerun when user object updates

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

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

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).value = '';
  };

  // --- UPDATED handleFormSubmit ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    try {
      // 1. Save profile image and name to local storage
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({
        profileImageUrl: formData.profileImageUrl,
        adminName: formData.name // Save form's name field as adminName
      }));

      // 2. Send data to backend (backend expects adminName key)
      const response = await axios.put('/api/admin/profile', {
        adminName: formData.name, // Send form's name as adminName
        schoolName: formData.schoolName
      });

      // --- FIX: Wait for login update BEFORE showing alert & navigating ---
      // 3. Update user state if new token received
      if (response.data.token) {
        await login(response.data.token); // Wait for context update
      }
      // --- End FIX ---

      // 4. Show success and navigate AFTER context is updated
      alert('Profile saved successfully!');
      router.push('/admin/dashboard'); // Navigate now

    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(message);
      console.error("Profile update error:", err.response?.data);
    }
  };
  // --- End UPDATED handleFormSubmit ---


  const handleCancel = () => {
    router.push('/admin/dashboard');
  };

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit Profile</h1>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          {imagePreview ? (
            <Image src={imagePreview} alt="Profile" width={100} height={100} className={styles.profileImage} />
          ) : (
            <DefaultAvatar name={formData.name} size={100} /> // Use name from formData
          )}
          <div className={styles.imageUploadWrapper}>
            <label htmlFor="imageUpload" className={styles.uploadButton}>Change Photo</label>
            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }}/>
          </div>
        </div>

        <form className={styles.profileForm} onSubmit={handleFormSubmit}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label> {/* Use 'name' */}
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required /> {/* Use 'name' */}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="schoolName">School Name</label>
            <input
              type="text"
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              required
              disabled={!canUpdateSchoolName} // Disable based on 90-day rule
              className={!canUpdateSchoolName ? styles.disabledInput : ''}
            />
            {!canUpdateSchoolName && daysRemaining !== null && (
              <p className={styles.infoMessage}>
                You can change your school name again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} readOnly className={styles.readOnlyInput} />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
            <button type="submit" className={styles.saveButton}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;