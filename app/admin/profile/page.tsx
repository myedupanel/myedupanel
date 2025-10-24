"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss';
// --- FIX 1: Import User type from AuthContext ---
import { useAuth, User } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import axios from 'axios';

// --- FIX 2: Remove the separate UserWithUpdateDate interface ---
// (Assuming 'User' type in AuthContext now includes 'schoolNameLastUpdated?')

const AdminProfilePage = () => {
  const router = useRouter();
  // --- FIX 3: Cast user directly to the imported User type ---
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

  const [formData, setFormData] = useState({
    name: '', // Changed from adminName
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
    // Access schoolNameLastUpdated directly from the User type
    if (user?.schoolNameLastUpdated) {
      const lastUpdate = new Date(user.schoolNameLastUpdated);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      if (lastUpdate > ninetyDaysAgo) {
        const diffTime = Math.abs(new Date().getTime() - lastUpdate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 90 - diffDays;
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
    // Dependency uses optional chaining which is fine
  }, [user?.schoolNameLastUpdated]);


  useEffect(() => {
    // Now user object will correctly have name, schoolName, email, _id properties
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`); // Use user._id
      let imageUrl = "";
      let savedName = "";

      if (savedProfile) {
        try {
          const parsedData = JSON.parse(savedProfile);
          imageUrl = parsedData.profileImageUrl || "";
          // Keep using adminName key from localStorage for consistency if needed
          savedName = parsedData.adminName || "";
        } catch (e) { console.error("Failed to parse saved profile data:", e); }
      }

      setFormData({
        name: savedName || user.name || '', // Use user.name
        schoolName: user.schoolName || '', // Use user.schoolName
        email: user.email || '', // Use user.email
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    try {
      // Save profile image and name to local storage
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({ // Use user._id
        profileImageUrl: formData.profileImageUrl,
        adminName: formData.name // Save form's name field
      }));

      // Send data to backend (backend expects adminName key)
      const response = await axios.put('/api/admin/profile', {
        adminName: formData.name, // Send form's name as adminName
        schoolName: formData.schoolName
      });

      // Update user state if new token received
      if (response.data.token) {
        await login(response.data.token);
      }

      alert('Profile saved successfully!');
      router.push('/admin/dashboard');

    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(message);
      console.error("Profile update error:", err.response?.data);
    }
  };

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