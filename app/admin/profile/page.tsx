"use client";
import React, { useState, useEffect, useMemo } from 'react'; // useMemo ko import karna zaroori hai agar use kar rahe hain
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss';
// --- Import User type from AuthContext ---
import { useAuth, User } from '../../context/AuthContext'; // User type ko import karein
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import axios from 'axios';

// --- Remove the separate UserWithUpdateDate interface ---

const AdminProfilePage = () => {
  const router = useRouter();
  // --- Cast user directly to the imported User type ---
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

  const [formData, setFormData] = useState({
    // Form state abhi bhi adminName use kar sakta hai, kyunki form inputs aur backend API ise expect karte hain
    adminName: '',
    schoolName: '',
    email: '',
    profileImageUrl: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  // --- State aur logic 90-day rule ke liye (Yeh pehle se add ho chuka hai) ---
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
    } else {
      setCanUpdateSchoolName(true);
      setDaysRemaining(null);
    }
  }, [user?.schoolNameLastUpdated]);


  useEffect(() => {
    // Populate form data jab user object available ho
    if (user) {
      const savedProfile = localStorage.getItem(`adminProfile_${user._id}`);
      let imageUrl = "";
      let savedName = "";

      if (savedProfile) {
        try {
          const parsedData = JSON.parse(savedProfile);
          imageUrl = parsedData.profileImageUrl || "";
          savedName = parsedData.adminName || ""; // localStorage se adminName check karein
        } catch (e) { console.error("Failed to parse saved profile data:", e); }
      }

      // --- FIX IS HERE: Use user.name from context ---
      setFormData({
        adminName: savedName || user.name || '', // savedName ya phir user.name use karein
        schoolName: user.schoolName || '', // user.schoolName context se
        email: user.email || '',           // user.email context se
        profileImageUrl: imageUrl
      });
      // --- End FIX ---

      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [user]); // Yeh effect tab chalega jab user object change hoga

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Form state ko update karein (yeh adminName key use karta hai)
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

  // --- handleFormSubmit mein navigation fix pehle se hai ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;

    console.log("Submitting Profile Data:", {
      adminName: formData.adminName, // Backend ko adminName bhej rahe hain
      schoolName: formData.schoolName
    });

    try {
      localStorage.setItem(`adminProfile_${user._id}`, JSON.stringify({
        profileImageUrl: formData.profileImageUrl,
        adminName: formData.adminName // localStorage mein bhi adminName save karein
      }));

      const response = await axios.put('/api/admin/profile', {
        adminName: formData.adminName, // Backend ko adminName bhej rahe hain
        schoolName: formData.schoolName
      });

      if (response.data.token) {
        await login(response.data.token); // Wait karein context update ke liye
      }

      alert('Profile saved successfully!');
      router.push('/admin/dashboard'); // Baad mein navigate karein

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

  // Form inputs abhi bhi 'adminName' use kar sakte hain kyunki state wahi use kar raha hai
  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit Profile</h1>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          {imagePreview ? (
            <Image src={imagePreview} alt="Profile" width={100} height={100} className={styles.profileImage} />
          ) : (
            <DefaultAvatar name={formData.adminName} size={100} /> // Pass form state ka naam
          )}
          <div className={styles.imageUploadWrapper}>
            <label htmlFor="imageUpload" className={styles.uploadButton}>Change Photo</label>
            <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }}/>
          </div>
        </div>

        <form className={styles.profileForm} onSubmit={handleFormSubmit}>
          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="adminName">Full Name</label> {/* Label/id 'adminName' hi rahega */}
            <input type="text" id="adminName" name="adminName" value={formData.adminName} onChange={handleInputChange} required /> {/* name/value 'adminName' hi rahega */}
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
              disabled={!canUpdateSchoolName}
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