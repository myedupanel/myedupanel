"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // --- UPDATE ---
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './ProfilePage.module.scss'; 
import { useAuth, User } from '../../context/AuthContext';
import DefaultAvatar from '../../../components/common/DefaultAvatar';
import api from '@/backend/utils/api';
// --- UPDATE ---
import { FiAlertCircle, FiCheckCircle, FiLoader, FiCalendar } from 'react-icons/fi'; 

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
  genRegNo: string; 
}

// --- NAYA ---
// Academic Year ke liye interface
interface academicYear {
  id: string;
  name: string;
}
// Form state naye saal ke liye
interface NewYearFormData {
  name: string; // "2025-26"
  startDate: string; // "2025-06-01"
  endDate: string; // "2026-03-31"
  templateYearId: string; // Puraane saal ki ID ya ""
}
// --- END NAYA ---

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

  // 90-day rule (No change)
  const [canUpdateSchoolName, setCanUpdateSchoolName] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // --- NAYA ---
  // Academic Year ke liye naya state
  const [academicYears, setacademicYears] = useState<academicYear[]>([]);
  const [newYearForm, setNewYearForm] = useState<NewYearFormData>({
    name: '',
    startDate: '',
    endDate: '',
    templateYearId: ''
  });
  const [yearError, setYearError] = useState('');
  const [yearSuccess, setYearSuccess] = useState('');
  const [isCreatingYear, setIsCreatingYear] = useState(false);
  // --- END NAYA ---

  useMemo(() => {
    // ... (Aapka 90-day logic yahaan same rahega) ...
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

  // --- NAYA ---
  // Alag function banaya academic years fetch karne ke liye
  const fetchacademicYears = useCallback(async () => {
    try {
      const res = await api.get('/api/school/academic-year');
      setacademicYears(res.data);
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
      setError("Failed to load academic years. Please refresh.");
    }
  }, []);
  // --- END NAYA ---

  // --- UPDATE ---
  // useEffect ab profile aur academic years dono fetch karega
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        // Step 1: Profile fetch karna (No change)
        const profileRes = await api.get('/api/school/profile');
        setFormData({
          name: profileRes.data.name || user.schoolName || '',
          name2: profileRes.data.name2 || '',
          address: profileRes.data.address || '',
          mobNo: profileRes.data.contactNumber || '', 
          email: profileRes.data.email || '',
          udiseNo: profileRes.data.udiseNo || '',
          govtReg: profileRes.data.recognitionNumber || '', 
          place: profileRes.data.place || '',
          logoUrl: profileRes.data.logoUrl || '',
          genRegNo: profileRes.data.genRegNo || '' 
        });
        if (profileRes.data.logoUrl) {
          setImagePreview(profileRes.data.logoUrl);
        }

        // Step 2: Academic Years fetch karna (NAYA)
        await fetchacademicYears();

      } catch (err: any) {
        console.error("Failed to fetch school data:", err);
        setError('Failed to load school data. Please try refreshing.');
        if (user.schoolName) {
           setFormData(prev => ({...prev, name: user.schoolName}));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolProfile();
  }, [user, fetchacademicYears]); // --- UPDATE ---

  // Input handlers (No change)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError('');
    setSuccessMessage('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Image change handler (No change)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // ... (Aapka image logic yahaan same rahega) ...
    setError('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("File is too large. Please select an image under 2MB.");
          setImageFile(null);
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

  // Input click handler (No change)
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).value = ''; };

  // Profile Form Submit (No change)
  const handleFormSubmit = async (e: React.FormEvent) => {
     // ... (Aapka profile submit logic yahaan same rahega) ...
    e.preventDefault();
    setError(''); 
    setSuccessMessage(''); 
    setIsSubmitting(true);

    // Validations
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
     if (!formData.genRegNo) {
        setError('General Register No. is required.');
        setIsSubmitting(false);
        return;
    }

    try {
      const data = new FormData();
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
  
  // Cancel button handler (No change)
  const handleCancel = () => {
    if (!isSubmitting) {
      router.back(); 
    }
  };

  // --- NAYA ---
  // Naye saal ke form ke liye handlers
  const handleYearFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setYearError('');
    setYearSuccess('');
    setNewYearForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCreateYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYearError('');
    setYearSuccess('');
    setIsCreatingYear(true);

    // Validation
    if (!newYearForm.name || !newYearForm.startDate || !newYearForm.endDate) {
      setYearError("Please fill in the new year's name, start date, and end date.");
      setIsCreatingYear(false);
      return;
    }

    try {
      const dataToSubmit = {
        name: newYearForm.name,
        startDate: newYearForm.startDate,
        endDate: newYearForm.endDate,
        // templateYearId ko tabhi bhejo jab woh select ho
        templateYearId: newYearForm.templateYearId || undefined 
      };

      // API call jo humne banayi thi
      const response = await api.post('/api/school/academic-year', dataToSubmit);

      setYearSuccess(`Successfully created new academic year: ${response.data.name}`);
      
      // Form ko reset karo
      setNewYearForm({ name: '', startDate: '', endDate: '', templateYearId: '' });
      
      // List ko refresh karo taaki naya saal template mein dikhe
      await fetchacademicYears();

    } catch (err: any) {
      // 300-din wala error dikhao
      const backendError = err.response?.data?.message || err.response?.data?.msg || 'Failed to create new year.';
      setYearError(backendError);
      console.error("Create year error:", err.response?.data || err);
    } finally {
      setIsCreatingYear(false);
    }
  };
  // --- END NAYA ---


  if (isLoading) {
    return <div className={styles.loadingScreen}><FiLoader /> Loading profile...</div>;
  }
  if (!user && !isLoading) {
      return <div className={styles.loadingScreen}>Error loading user data. Please try logging in again.</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.title}>Edit School Profile</h1>

      {/* --- School Profile Form Card (No change) --- */}
      <div className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={handleFormSubmit}>
          {/* ... (Aapka poora profile form JSX yahaan same rahega) ... */}
          
          <div className={styles.profileHeader}>
            {imagePreview ? (
              <Image src={imagePreview} alt="School Logo" width={100} height={100} className={styles.profileImage} />
            ) : (
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
          
          {/* ... (name2, address, place, loginEmail, grid, etc. sab same) ... */}

          {/* School Name 2 (Tagline) */}
          <div className={styles.formGroup}>
            <label htmlFor="name2">School Name Line 2 (For Certificates) *</label>
            <input type="text" id="name2" name="name2" value={formData.name2} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.x., MyEduPanel Sec. & Higher Sec. School" />
            <small>This will be the main name shown on certificates.</small>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label htmlFor="address">School Address *</label>
            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} required disabled={isSubmitting} placeholder="e.x., Pune, Pune, Dist. Pune" />
          </div>

          {/* Place (for Footer) */}
          <div className={styles.formGroup}>
            <label htmlFor="place">Place (For Certificate Footer) *</label>
            <input type="text" id="place" name="place" value={formData.place} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.x., Pune" />
          </div>

          {/* Login Email (Read-Only) */}
          <div className={styles.formGroup}>
            <label htmlFor="loginEmail">Login Email (Cannot be changed)</label>
            <input type="email" id="loginEmail" name="loginEmail" value={user?.email || 'Loading...'} disabled readOnly className={styles.disabledInput} />
          </div>

          {/* Form Grid for Contact / Public Email */}
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

          {/* Form Grid for Reg Numbers */}
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
          
          {/* General Register No. */}
          <div className={styles.formGroup}>
            <label htmlFor="genRegNo">General Register No. (For L.C. Footer) *</label>
            <input type="text" id="genRegNo" name="genRegNo" value={formData.genRegNo} onChange={handleInputChange} required disabled={isSubmitting} placeholder="e.g., 44434" />
            <small>This will auto-fill the 'General Register No.' on certificates.</small>
          </div>

          {/* Profile Save Buttons */}
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className={styles.saveButton} disabled={isSubmitting || isLoading}>
              {isSubmitting ? <><FiLoader className={styles.spinner}/> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* --- NAYA --- */}
      {/* Naya Card Academic Year Management ke liye */}
      <h2 className={styles.title} style={{marginTop: '40px'}}>
        <FiCalendar /> Academic Year Management
      </h2>
      <div className={styles.profileCard}>
        <form className={styles.profileForm} onSubmit={handleCreateYearSubmit}>
          <p className={styles.infoMessage}>
            Yahaan se naya academic saal (session) banayein. Aap 300 din mein ek baar hi naya saal bana sakte hain.
          </p>
          
          {/* Messages Area */}
          {yearError && <p className={styles.errorMessage}><FiAlertCircle /> {yearError}</p>}
          {yearSuccess && <p className={styles.successMessage}><FiCheckCircle /> {yearSuccess}</p>}

          {/* New Year Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name">New Academic Year Name *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={newYearForm.name} 
              onChange={handleYearFormChange} 
              required 
              disabled={isCreatingYear} 
              placeholder="e.g., 2025-26" 
            />
          </div>

          {/* Dates Grid */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="startDate">Start Date *</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate" 
                value={newYearForm.startDate} 
                onChange={handleYearFormChange} 
                required 
                disabled={isCreatingYear} 
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="endDate">End Date *</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate" 
                value={newYearForm.endDate} 
                onChange={handleYearFormChange} 
                required 
                disabled={isCreatingYear} 
              />
            </div>
          </div>

          {/* Template Selector */}
          <div className={styles.formGroup}>
            <label htmlFor="templateYearId">Copy Settings from (Optional)</label>
            <select 
              id="templateYearId" 
              name="templateYearId" 
              value={newYearForm.templateYearId} 
              onChange={handleYearFormChange} 
              disabled={isCreatingYear || academicYears.length === 0}
            >
              <option value="">Don't copy settings</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  Copy from {year.name}
                </option>
              ))}
            </select>
            <small>
              Yeh pichle saal ki Classes aur Fee Templates ko naye saal mein copy kar dega.
            </small>
          </div>

          {/* Submit Button */}
          <div className={styles.buttonGroup} style={{justifyContent: 'flex-end'}}>
            <button type="submit" className={styles.saveButton} disabled={isCreatingYear || isSubmitting}>
              {isCreatingYear ? <><FiLoader className={styles.spinner}/> Creating Year...</> : 'Create New Academic Year'}
            </button>
          </div>
        </form>
      </div>
      {/* --- END NAYA --- */}

    </div>
  );
};

export default SchoolProfilePage;