"use client";
import React, { useState, useEffect } from 'react';
import styles from './AddStudentForm.module.scss';
import api from '@/backend/utils/api'; // Ensure correct path

// --- Interface FormData (UPDATED TO MATCH PRISMA SCHEMA) ---
interface FormData {
  roll_number: string; 
  first_name: string;
  last_name: string;
  class_name: string; // Yeh 'name' se match karega jo /api/classes se aa raha hai
  father_name: string; 
  guardian_contact: string; 
  
  // Optional fields
  dob?: string; 
  address?: string; 
  email?: string;
  mother_name?: string;
  uid_number?: string;
  nationality?: string;
  caste?: string;
  birth_place?: string;
  previous_school?: string;
  admission_date?: string;
}

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onUpdate?: (data: Partial<FormData>) => void;
  existingStudent?: {
    studentid: number; 
  } & Partial<FormData> | null;
}

// --- FIX 1: Add Interface for fetched classes ---
interface SchoolClass {
    classid: number;
    class_name: string;
}
// ---

// --- FIX 2: Hardcoded classOptions array ko DELETE kar diya ---
// const classOptions = [ ... ]; // <-- YEH DELETE HO GAYA

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess, onUpdate, existingStudent }) => {
  
  // === FIX 9: Email Lock Constant ===
  const IS_EMAIL_LOCKED = true; // Temporary lock while student dashboard is not ready
  // ==================================

  // --- FIX 3: Naya state add kiya classes fetch karne ke liye ---
  const [fetchedClasses, setFetchedClasses] = useState<SchoolClass[]>([]);
  const [isClassLoading, setIsClassLoading] = useState(true); // Classes ke liye alag loading state
  // ---

  // --- FIX 4: Initial state mein class_name ko empty string kiya ---
  const [formData, setFormData] = useState<FormData>({
    first_name: '', 
    last_name: '', 
    class_name: '', // Default empty rakha
    roll_number: '',
    dob: '', 
    address: '', 
    father_name: '', 
    guardian_contact: '', 
    email: '',
    mother_name: '',
    uid_number: '',
    nationality: '',
    caste: '',
    birth_place: '',
    previous_school: '',
    admission_date: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Yeh form submission ke liye hai

  // --- FIX 5: useEffect ko update kiya taaki hardcoded options use na kare ---
  useEffect(() => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toISOString().split('T')[0]; } catch (e) { return ''; }
    };

    if (existingStudent) {
      setFormData({
        roll_number: existingStudent.roll_number || '',
        first_name: existingStudent.first_name || '',
        last_name: existingStudent.last_name || '',
        class_name: existingStudent.class_name || '', // Sirf existing value set karein
        dob: formatDate(existingStudent.dob),
        address: existingStudent.address || '',
        father_name: existingStudent.father_name || '',
        guardian_contact: existingStudent.guardian_contact || '',
        email: existingStudent.email || '',
        mother_name: existingStudent.mother_name || '',
        uid_number: existingStudent.uid_number || '',
        nationality: existingStudent.nationality || '',
        caste: existingStudent.caste || '',
        birth_place: existingStudent.birth_place || '',
        previous_school: existingStudent.previous_school || '',
        admission_date: formatDate(existingStudent.admission_date),
      });
    } else {
      // Reset logic (class_name empty rahega, agle useEffect se set hoga)
      setFormData({
        first_name: '', last_name: '', class_name: '', roll_number: '',
        dob: '', address: '', father_name: '', guardian_contact: '', email: '',
        mother_name: '', uid_number: '', nationality: '', caste: '',
        birth_place: '', previous_school: '', admission_date: '',
      });
    }
  }, [existingStudent]);

  // --- FIX 6: Naya useEffect add kiya classes fetch karne ke liye ---
  useEffect(() => {
    const loadClasses = async () => {
        setIsClassLoading(true);
        try {
            const res = await api.get('/students/classes'); // Backend se classes fetch karein
            // The response is an array of strings, convert to SchoolClass format
            const classesData: SchoolClass[] = res.data.map((className: string, index: number) => ({
                classid: index + 1,
                class_name: className
            })) || [];
            setFetchedClasses(classesData);
            
            // Agar yeh naya student hai (existing nahi) aur class_name abhi set nahi hua hai,
            // toh list ki pehli class ko default set kar dein.
            if (!existingStudent && classesData.length > 0 && !formData.class_name) {
                setFormData(prev => ({
                    ...prev,
                    class_name: classesData[0].class_name 
                }));
            }
        } catch (err) {
            console.error("Failed to load classes", err);
            setError("Failed to load class list. Please try again."); // Error state set karein
        } finally {
            setIsClassLoading(false);
        }
    };
    loadClasses();
  }, [existingStudent]); // Yeh tab run hoga jab component load hoga (ya jab 'existingStudent' prop badlega)
  // ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const dataToSend: Partial<FormData> = { ...formData };
    
    // === FIX 10: Email data ko forcefully hata dein jab tak feature lock hai ===
    if (IS_EMAIL_LOCKED) {
        delete dataToSend.email;
    }
    // ======================================================================

    (Object.keys(dataToSend) as Array<keyof FormData>).forEach(key => {
        if (key !== 'first_name' && key !== 'last_name' && key !== 'class_name' && key !== 'roll_number' && key !== 'father_name' && key !== 'guardian_contact') {
            // Agar field empty hai, toh use delete kar do taaki backend mein null jaaye
            if (!dataToSend[key] || (typeof dataToSend[key] === 'string' && dataToSend[key] === '')) {
                delete dataToSend[key];
            }
        }
    });
    
    // --- FIX 7: Ensure class_name is not empty ---
    if (!dataToSend.class_name) {
        setError("Please select a class. If no classes are visible, add them in 'Manage Classes' first.");
        setIsLoading(false);
        return;
    }
    // ---

    try {
      if (existingStudent && onUpdate) {
        // onUpdate ke andar 'dataToSend' jaana chahiye
        await onUpdate(dataToSend);
        onClose();
      } else {
        await api.post('/students', dataToSend);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'An error occurred. Please check all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitButtonText = existingStudent ? 'Update Student' : 'Add Student';

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      
      {/* --- Required Fields --- */}
      <div className={styles.inputGroup}>
        <label htmlFor="roll_number">Student ID / Roll No.</label>
        <input type="text" id="roll_number" name="roll_number" value={formData.roll_number} onChange={handleChange} required disabled={isLoading} />
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="first_name">First Name</label>
        <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="last_name">Last Name</label>
        <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required disabled={isLoading} />
      </div>

       {/* --- FIX 8: Dropdown ko fetchedClasses se populate kiya --- */}
       <div className={styles.inputGroup}>
        <label htmlFor="class_name">Class</label>
        <select
          id="class_name"
          name="class_name"
          value={formData.class_name} // Yeh value database name (e.g., "Nursery", "7") se match hogi
          onChange={handleChange}
          required
          disabled={isClassLoading || isLoading} // Jab classes load ho rahi hon ya form submit ho raha ho
          className={styles.selectInput}
        >
          {isClassLoading ? (
            <option value="" disabled>Loading classes...</option>
          ) : fetchedClasses.length === 0 ? (
            <option value="" disabled>No classes found. Add classes in 'Manage Classes'.</option>
          ) : (
            // Fetched classes se options banayein
            <>
              <option value="">Select a class</option>
              {fetchedClasses.map(cls => (
                <option key={cls.classid} value={cls.class_name}>
                  {cls.class_name} 
                </option>
              ))}
            </>
          )}
        </select>
      </div>
      {/* --- END FIX --- */}

      <div className={styles.inputGroup}>
        <label htmlFor="father_name">Parent's / Father's Name</label>
        <input type="text" id="father_name" name="father_name" value={formData.father_name} onChange={handleChange} required disabled={isLoading} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="guardian_contact">Parent's Contact</label>
        <input type="tel" id="guardian_contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleChange} required disabled={isLoading} />
      </div>

      {/* --- Optional Fields --- */}
      <div className={styles.inputGroup}>
        <label htmlFor="mother_name">Mother's Name</label>
        <input type="text" id="mother_name" name="mother_name" value={formData.mother_name || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="dob">Date of Birth</label>
        <input type="date" id="dob" name="dob" value={formData.dob || ''} onChange={handleChange} disabled={isLoading} className={styles.dateInput} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="admission_date">Admission Date</label>
        <input type="date" id="admission_date" name="admission_date" value={formData.admission_date || ''} onChange={handleChange} disabled={isLoading} className={styles.dateInput} />
      </div>
      
      {/* === FIX 11: Student Email Field (Locked) === */}
      <div className={styles.inputGroup}>
        <label htmlFor="email">Student Email (Locked)</label>
        <input 
            type="email" 
            id="email" 
            name="email" 
            // Value ko clear rakhein taaki koi data na jaaye
            value={''} 
            onChange={handleChange} 
            disabled={IS_EMAIL_LOCKED || isLoading} 
            placeholder="Temporary Disabled."
        />
        <small style={{ color: IS_EMAIL_LOCKED ? '#dc3545' : 'inherit' }}>
            {IS_EMAIL_LOCKED 
                ? "Temporary Disabled: Email functionality is disabled until the Student Dashboard is Ready." 
                : "If provided, login details will be sent here."}
        </small>
      </div>
      {/* === END FIX 11 === */}

      <div className={styles.inputGroup}>
        <label htmlFor="uid_number">Aadhar / UID Number</label>
        <input type="text" id="uid_number" name="uid_number" value={formData.uid_number || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="nationality">Nationality</label>
        <input type="text" id="nationality" name="nationality" value={formData.nationality || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="caste">Caste</label>
        <input type="text" id="caste" name="caste" value={formData.caste || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="birth_place">Birth Place</label>
        <input type="text" id="birth_place" name="birth_place" value={formData.birth_place || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="previous_school">Previous School (Optional)</label>
        <input type="text" id="previous_school" name="previous_school" value={formData.previous_school || ''} onChange={handleChange} disabled={isLoading} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={3} disabled={isLoading} className={styles.textAreaInput} />
      </div>
      {/* --- End Optional Fields --- */}


      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose} disabled={isLoading}>Cancel</button>
        <button type="submit" className={`${styles.btn} ${styles.submitBtn}`} disabled={isLoading || isClassLoading}>
            {isLoading ? (existingStudent ? 'Updating...' : 'Adding...') : (isClassLoading ? 'Loading...' : submitButtonText)}
        </button>
      </div>
    </form>
  );
};

export default AddStudentForm;