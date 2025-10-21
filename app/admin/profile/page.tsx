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
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    adminName: '',
    schoolName: '',
    email: '',
    profileImageUrl: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // We check if 'user' exists before doing anything
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      let imageUrl = "";
      if (savedProfile) {
        imageUrl = JSON.parse(savedProfile).profileImageUrl || "";
      }

      setFormData({
        // This now correctly uses 'adminName' and 'schoolName' from the user object
        adminName: user.adminName || '',
        schoolName: user.schoolName || '',
        email: user.email || '',
        profileImageUrl: imageUrl
      });

      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [user]);

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
  
  // This helps in re-uploading the same file if needed
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).value = '';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    try {
      // 1. Save profile image to local storage
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({ profileImageUrl: formData.profileImageUrl }));
      
      // 2. Send text data to the backend
      const response = await axios.put('http://localhost:5000/api/admin/profile', {
        adminName: formData.adminName,
        schoolName: formData.schoolName
      });

      // 3. If backend sends a new token, update the user state
      if (response.data.token) {
        await login(response.data.token);
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
            <DefaultAvatar />
          )}
          <div className={styles.imageUploadWrapper}>
            <label htmlFor="imageUpload">Change Photo</label>
            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} onClick={handleInputClick} />
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