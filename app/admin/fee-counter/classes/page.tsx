// app/admin/academics/classes/page.tsx
"use client"; 

import React, { useState, useEffect, FormEvent } from 'react';
import api from '@/backend/utils/api'; 
import styles from './ClassesPage.module.scss'; // ✅ Import SCSS styles

// Interface for class data
interface SchoolClass {
    id: string; 
    name: string;
}

const ClassesPage = () => {
    // State variables
    const [classes, setClasses] = useState<SchoolClass[]>([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [fetchError, setFetchError] = useState<string | null>(null); 
    
    // ✅ State for the "Add Class" form
    const [newClassName, setNewClassName] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // Fetch existing classes on page load
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoading(true);
            setFetchError(null); 
            try {
                const res = await api.get('/api/classes'); 
                setClasses(res.data || []); 
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                setFetchError('Could not load classes. Please ensure the backend is running and the API route is correct.');
                setClasses([]); 
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []); // Run only once on mount

    // ✅ Function to handle adding a new class
    const handleAddClass = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent default form submission (page reload)
        
        const trimmedName = newClassName.trim();
        if (!trimmedName) {
            setAddError('Class name cannot be empty.');
            return;
        }
        
        setIsAdding(true);
        setAddError(null);

        try {
            // NOTE: Ensure your backend has a POST /api/classes route
            const res = await api.post('/api/classes', { name: trimmedName });
            
            // Add the new class to the list *optimistically* // (or you could refetch the entire list)
            setClasses(prevClasses => [...prevClasses, res.data]); 
            setNewClassName(''); // Clear the input field
            
        } catch (err: any) {
            console.error("Failed to add class:", err);
            setAddError(err.response?.data?.msg || 'Failed to add class. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1>Manage Classes</h1>
            </header>

            <div className={styles.contentArea}>
                {/* Section to Display Existing Classes */}
                <section className={styles.classListSection}>
                    <h2>Existing Classes</h2>
                    {isLoading && <p className={styles.loadingMessage}>Loading classes...</p>}
                    {fetchError && <p className={styles.errorMessage}>{fetchError}</p>}
                    
                    {!isLoading && !fetchError && classes.length > 0 && (
                        <ul className={styles.classList}>
                            {classes.map(cls => (
                                <li key={cls.id}>{cls.name}</li>
                                // TODO: Add Edit/Delete buttons here later if needed
                            ))}
                        </ul>
                    )}
                    
                    {!isLoading && !fetchError && classes.length === 0 && (
                         <p className={styles.noClassesMessage}>No classes have been added yet.</p>
                    )}
                </section>

                {/* Section to Add a New Class */}
                <section className={styles.addClassSection}>
                    <h2>Add New Class</h2>
                    <form onSubmit={handleAddClass}>
                        <div className={styles.formGroup}>
                            <label htmlFor="newClassName">Class Name</label>
                            <input 
                                type="text"
                                id="newClassName"
                                className={styles.inputField}
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g., Nursery, Class 10th A"
                                required 
                                disabled={isAdding} // Disable while submitting
                            />
                        </div>
                        
                        {addError && <p className={styles.errorMessage}>{addError}</p>}

                        <button 
                            type="submit" 
                            className={styles.addButton}
                            disabled={isAdding} // Disable while submitting
                        >
                            {isAdding ? 'Adding...' : '+ Add Class'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default ClassesPage;