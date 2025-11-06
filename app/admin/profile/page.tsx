"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss'; 
import { useAuth, User } from '../../context/AuthContext';
// === YAHAN FIX KIYA (1/2): DefaultAvatar ko 'Logo' se replace kiya ===
import Logo from '../../../components/Logo'; // DefaultAvatar ki jagah Logo import kiya
// === FIX ENDS HERE ===
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
  logoUrl: string;
  genRegNo: string; // General Register No.
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
    logoUrl: '',
    genRegNo: '' 
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null); 
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

  // useEffect fetches school profile (No Change)
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
          logoUrl: res.data.logoUrl || '',
          genRegNo: res.data.genRegNo || '' 
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

  // Input handlers (No Change)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          setImageFile(null); // File ko clear karein
          return;
      }
      
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
      };
      reader.onerror = () => {
          setError("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).value = ''; };

  // Form Submit (No Change)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 
    setSuccessMessage(''); 
    setIsSubmitting(true);

    // Validations
    if (!formData.name) {
        setError('School/Trust Name (Main) is required.');
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
     if (!formData.genRegNo) {
        setError('General Register No. is required.');
        setIsSubmitting(false);
        return;
    }

    try {
      const data = new FormData();

      // Saare text fields ko append karein
      data.append('name', formData.name);
      data.append('name2', formData.name2);
      data.append('address', formData.address);
      data.append('contactNumber', formData.mobNo); 
      data.append('email', formData.email);
      data.append('udiseNo', formData.udiseNo);
      data.append('recognitionNumber', formData.govtReg);
      data.append('place', formData.place);
      data.append('genRegNo', formData.genRegNo);
      
      if (imageFile) {
        data.append('logo', imageFile); 
      }
      
      const response = await api.put('/api/school/profile', data); 
      
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
            logoUrl: savedData.logoUrl || '',
            genRegNo: savedData.genRegNo || ''
        });
        if(savedData.logoUrl) {
            setImagePreview(savedData.logoUrl);
        }
        setImageFile(null); 
      } else {
          console.warn("Backend did not return updated school data in response.school");
      }

      setSuccessMessage('School profile updated successfully!');

      setTimeout(() => {
        router.push('/admin/dashboard'); 
      }, 1500);

    } catch (err: any) {
      const backendError = err.response?.data?.message || err.response?.data?.msg || 'Failed to update profile. Please check details and try again.';
      setError(backendError);
      console.error("Profile update error:", err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleCancel (No Change)
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

          {/* Profile Header (FIXED) */}
          <div className={styles.profileHeader}>
            {imagePreview ? (
              <Image src={imagePreview} alt="School Logo" width={100} height={100} className={styles.profileImage} />
            ) : (
              // === YAHAN FIX KIYA (2/2): <DefaultAvatar> ko <Logo> se replace kiya ===
              <div className={styles.profileImage}> {/* Ek wrapper div taaki styling same rahe */}
                <Logo />
              </div>
              // === FIX ENDS HERE ===
            )}
            <div className={styles.imageUploadWrapper}>
              <label htmlFor="imageUpload" className={styles.uploadButton}>Change Logo</label>
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} onClick={handleInputClick} style={{ display: 'none' }} disabled={isSubmitting} />
               <small className={styles.uploadHint}>Max 2MB (PNG, JPG, WEBP)</small>
            </div>
          </div>

          {/* Messages Area (No Change) */}
          {error && <p className={styles.errorMessage}><FiAlertCircle /> {error}</p>}
          {successMessage && <p className={styles.successMessage}><FiCheckCircle /> {successMessage}</p>}

          {/*
            ======================================================================
            === YEH HAI AAPKA FIX ===
            Maine 'name2' (Certificate Name) waale block ko upar
            aur 'name' (Trust Name) waale block ko neeche kar diya hai.
            ======================================================================
          */}
          
          {/* School Name 2 (For Certificates) - YEH AB PEHLE AAYEGA */}
          <div className={styles.formGroup}>
            <label htmlFor="name2">School Name (For Certificates) *</label>
            <input type="text" id="name2" name="name2" value={formData.name2} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.x., MyEduPanel Sec. & Higher Sec. School" />
            <small>This will be the main name shown on certificates.</small>
          </div>
          
          {/* School Name (Trust Name) - YEH AB DOOSRA AAYEGA */}
          <div className={styles.formGroup}>
            <label htmlFor="name">School/Trust Name (Main) *</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={!canUpdateSchoolName || isSubmitting} className={!canUpdateSchoolName ? styles.disabledInput : ''} />
            {!canUpdateSchoolName && daysRemaining !== null && (<p className={styles.infoMessage}> You can change school name again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. </p> )}
          </div>
          
          {/* === FIX ENDS HERE === */}


          {/* Address (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="address">School Address *</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} required disabled={isSubmitting} placeholder="e.x., Pune, Pune, Dist. Pune" />
          </div>

          {/* Place (for Footer) (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="place">Place (For Certificate Footer) *</label>
            <input type="text" id="place" name="place" value={formData.place} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.x., Pune" />
          </div>

          {/* Login Email (Read-Only) (No Change) */}
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

          {/* Form Grid for Contact / Public Email (No Change) */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="mobNo">Contact Number</label>
              <input type="tel" id="mobNo" name="mobNo" value={formData.mobNo} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.x. 9835356347, " />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Public Email (For Certificates)</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.x., contact@school.com" />
            </div>
          </div>

          {/* Form Grid for Reg Numbers (No Change) */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="udiseNo">UDISE No.</label>
              <input type="text" id="udiseNo" name="udiseNo" value={formData.udiseNo} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., 58483739466" />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="govtReg">Govt. Reg. No.</label>
              <input type="text" id="govtReg" name="govtReg" value={formData.govtReg} onChange={handleInputChange} disabled={isSubmitting} placeholder="e.g., GFH-1714/PN-49/SK-4" />
            </div>
          </div>
          
          {/* General Register No. (No Change) */}
          <div className={styles.formGroup}>
            <label htmlFor="genRegNo">General Register No. (For L.C. Footer) *</label>
            <input type="text" id="genRegNo" name="genRegNo" value={formData.genRegNo} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.g., 44434" />
            <small>This will auto-fill the 'General Register No.' on certificates.</small>
          </div>


          {/* Buttons (No Change) */}
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