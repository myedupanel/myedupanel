"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss';
import { useAuth } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import axios from 'axios';

const AdminProfilePage = () => {
  const router = useRouter();
  const { user, login } = useAuth(); // 'user' now has 'name', not 'adminName'

  const [formData, setFormData] = useState({
    adminName: '', // This state field name is fine, it's what the form uses
    schoolName: '',
    email: '',
    profileImageUrl: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      let imageUrl = "";
      let savedName = ""; // Variable to hold name from localStorage

      if (savedProfile) {
        try {
          const parsedData = JSON.parse(savedProfile);
          imageUrl = parsedData.profileImageUrl || "";
          savedName = parsedData.adminName || ""; // Get saved name if exists
        } catch (e) {
            console.error("Failed to parse saved profile data:", e);
        }
      }

      // --- FIX IS HERE: Use user.name ---
      setFormData({
        // Use savedName if available, otherwise use name from AuthContext
        adminName: savedName || user.name || '',
        schoolName: user.schoolName || '', // schoolName comes directly from token via AuthContext
        email: user.email || '',
        profileImageUrl: imageUrl
      });
      // --- End of FIX ---

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
      // 1. Save profile (including name for consistency) to local storage
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({
          profileImageUrl: formData.profileImageUrl,
          adminName: formData.adminName // Save the current form name too
      }));

      // 2. Send text data (using adminName key as backend expects) to the backend
      const response = await axios.put('/api/admin/profile', {
        adminName: formData.adminName, // Send current form name
        schoolName: formData.schoolName
      });

      // 3. If backend sends a new token, update the user state in AuthContext
      if (response.data.token) {
        await login(response.data.token); // login updates the user object in AuthContext
      }

      alert('Profile saved successfully!');
      router.push('/admin/dashboard');

    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(message);
    }
  };

  const handleCancel = () => {
    router.push('/admin/dashboard');
  };

  // Show loading until user data is available
  if (!user) {
    return <div>Loading profile...</div>;
  }

  // Render the form
  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit Profile</h1>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          {imagePreview ? (
            <Image src={imagePreview} alt="Profile" width={100} height={100} className={styles.profileImage} />
          ) : (
            // Pass the current name from formData for initials
            <DefaultAvatar name={formData.adminName} size={100} />
          )}
          <div className={styles.imageUploadWrapper}>
            <label htmlFor="imageUpload" className={styles.uploadButton}>Change Photo</label>
            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }}/>
          </div>
        </div>

        <form className={styles.profileForm} onSubmit={handleFormSubmit}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="adminName">Full Name</label>
            <input type="text" id="adminName" name="adminName" value={formData.adminName} onChange={handleInputChange} required />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="schoolName">School Name</label>
            <input type="text" id="schoolName" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required />
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