// app/admin/profile/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss'; 
import { useAuth, User } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import api from '@/backend/utils/api';
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi'; 

interface SchoolFormData {
  name: string;
  name2: string; 
  address: string;
  mobNo: string; 
  email: string; 
  udiseNo: string;
  govtReg: string; 
  place: string; 
  logoUrl: string; // Yeh ab sirf existing URL ya Base64 preview ke liye hai
}

const SchoolProfilePage = () => {
  const router = useRouter();
  const { user, login } = useAuth() as { user: User | null; login: (token: string) => Promise<any> };

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

  // --- YEH HAI AAPKA FIX (KADAM 1) ---
  // Hum file ko preview ke liye Base64 (imagePreview) aur submit ke liye File object (imageFile) mein save karenge
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); // Naya state file object ke liye
  // --- FIX ENDS HERE ---

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 90-day rule logic (No change)
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

  // useEffect fetches school profile (No change)
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      if (!user) {
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
          mobNo: res.data.contactNumber || '', 
          email: res.data.email || '',
          udiseNo: res.data.udiseNo || '',
          govtReg: res.data.recognitionNumber || '', 
          place: res.data.place || '',
          logoUrl: res.data.logoUrl || ''
        });

        if (res.data.logoUrl) {
          setImagePreview(res.data.logoUrl);
        }

      } catch (err: any) {
        console.error("Failed to fetch school profile:", err);
        setError('Failed to load school profile. Please ensure you have completed setup or try refreshing.');
        if (user.schoolName) {
           setFormData(prev => ({...prev, name: user.schoolName}));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolProfile();
  }, [user]); 

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError('');
    setSuccessMessage('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- YEH HAI AAPKA FIX (KADAM 2) ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (file) {
      // --- YEH HAI AAPKI 800KB LIMIT ---
      if (file.size > 800 * 1024) { // 800KB limit
          setError("File is too large. Please select an image under 800KB.");
          setImageFile(null); // File ko clear karein
          return;
      }
      
      // Nayi file ko state mein save karein (submit ke liye)
      setImageFile(file);

      // File ka preview generate karein (UI ke liye)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        // Hum ab Base64 ko 'formData' mein save NAHI kar rahe hain
        // setFormData(prevData => ({ ...prevData, logoUrl: base64String })); // <-- YEH LINE HATA DI GAYI
      };
      reader.onerror = () => {
          setError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };
  // --- FIX ENDS HERE ---

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).value = ''; };

  // --- YEH HAI AAPKA FIX (KADAM 3) ---
  // handleFormSubmit ab Base64 ke bajaye 'FormData' bhejega
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setSuccessMessage(''); 
    setIsSubmitting(true);

    // Validations (No change)
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

    try {
      // JSON 'payload' ke bajaye, hum 'FormData' object banayenge
      const data = new FormData();

      // Saare text fields ko append karein
      data.append('name', formData.name);
      data.append('name2', formData.name2);
      data.append('address', formData.address);
      data.append('contactNumber', formData.mobNo); // Map mobNo to backend 'contactNumber'
      data.append('email', formData.email);
      data.append('udiseNo', formData.udiseNo);
      data.append('recognitionNumber', formData.govtReg); // Map govtReg to backend 'recognitionNumber'
      data.append('place', formData.place);
      
      // Sirf tabhi image append karein jab user ne nayi file select ki ho
      if (imageFile) {
        data.append('logo', imageFile); // 'logo' woh key hai jo backend (multer) expect karega
      }
      // Hum 'logoUrl' ko yahaan NAHI bhej rahe hain.

      console.log("Submitting school profile as FormData..."); // Naya log
      
      // Axios ko 'FormData' bhejein.
      // Axios automatically 'Content-Type' ko 'multipart/form-data' set kar dega.
      const response = await api.put('/api/school/profile', data); 
      
      console.log("API Response:", response.data); 

      if (response.data.token) {
        console.log("Received new token, updating context.");
        await login(response.data.token);
      }

      const savedData = response.data.school; 
      if (savedData) {
        setFormData({
            name: savedData.name || '',
            name2: savedData.name2 || '',
            address: savedData.address || '',
            mobNo: savedData.contactNumber || '', 
            email: savedData.email || '',
            udiseNo: savedData.udiseNo || '',
            govtReg: savedData.recognitionNumber || '', 
            place: savedData.place || '',
            logoUrl: savedData.logoUrl || ''
        });
        if(savedData.logoUrl) {
            setImagePreview(savedData.logoUrl);
        }
        setImageFile(null); // Nayi file ko reset karein
      } else {
          console.warn("Backend did not return updated school data in response.school");
      }

      setSuccessMessage('School profile updated successfully!');

      setTimeout(() => {
        router.push('/admin/dashboard'); 
      }, 1500);

    } catch (err: any) {
      // 'Payload Too Large' error ab nahi aana chahiye
      const backendError = err.response?.data?.message || err.response?.data?.msg || 'Failed to update profile. Please check details and try again.';
      setError(backendError);
      console.error("Profile update error:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- FIX ENDS HERE ---

  const handleCancel = () => {
    if (!isSubmitting) {
      router.back(); 
    }
  };

  if (isLoading) {
    return <div className={styles.loadingScreen}><FiLoader /> Loading profile...</div>;
  }

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
              <DefaultAvatar name={formData.name || user?.schoolName || 'S'} size={100} />
            )}
            <div className={styles.imageUploadWrapper}>
              <label htmlFor="imageUpload" className={styles.uploadButton}>Change Logo</label>
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }} disabled={isSubmitting} />
               <small className={styles.uploadHint}>Max 800KB (PNG, JPG, WEBP)</small> {/* <-- Limit update ki */}
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
              value={user?.email || 'Loading...'} 
              disabled
              readOnly 
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