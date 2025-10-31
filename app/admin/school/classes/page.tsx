// app/admin/academics/classes/page.tsx
"use client"; 

import React, { useState, useEffect, FormEvent } from 'react';
import api from '@/backend/utils/api'; 
import styles from './ClassesPage.module.scss';
import { FiEdit, FiTrash2 } from 'react-icons/fi'; // <-- 1. Icons Import kiye
import Modal from '@/components/common/Modal/Modal'; // <-- 1. Modal Import kiya

interface SchoolClass {
    classid: number;
    class_name: string;
}

const ClassesPage = () => {
    // Existing States
    const [classes, setClasses] = useState<SchoolClass[]>([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [fetchError, setFetchError] = useState<string | null>(null); 
    const [newClassName, setNewClassName] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // --- 2. Edit/Delete ke liye naye States ---
    const [isDeleting, setIsDeleting] = useState<{[key: number]: boolean}>({}); // Individual delete loading
    const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null); // Kaunsi class edit ho rahi hai
    const [editName, setEditName] = useState(''); // Edit form mein naya naam
    const [isEditing, setIsEditing] = useState(false); // Edit modal submit loading
    const [editError, setEditError] = useState<string | null>(null); // Edit modal error
    // ---

    // Fetch existing classes (No Change)
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
    }, []);

    // Handle Add Class (No Change)
    const handleAddClass = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); 
        const trimmedName = newClassName.trim();
        if (!trimmedName) { setAddError('Class name cannot be empty.'); return; }
        setIsAdding(true); setAddError(null);
        try {
            const res = await api.post('/api/classes', { name: trimmedName });
            setClasses(prevClasses => [...prevClasses, res.data]); 
            setNewClassName(''); 
        } catch (err: any) {
            console.error("Failed to add class:", err);
            setAddError(err.response?.data?.msg || 'Failed to add class. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    // --- 3. NAYA FUNCTION: Delete Class Handler ---
    const handleDeleteClass = async (classId: number, className: string) => {
        // Confirm karein
        if (!window.confirm(`Are you sure you want to delete class "${className}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(prev => ({ ...prev, [classId]: true })); // Set loading for this specific button
        setFetchError(null); // Clear main error

        try {
            // Backend DELETE /api/classes/:id ko call karega
            await api.delete(`/api/classes/${classId}`);
            
            // List se class ko remove karein
            setClasses(prevClasses => prevClasses.filter(cls => cls.classid !== classId));
            
        } catch (err: any) {
            console.error("Failed to delete class:", err);
            // Error ko list ke upar dikhayein
            setFetchError(err.response?.data?.msg || 'Failed to delete class. It might be in use by students or fee records.');
        } finally {
            setIsDeleting(prev => ({ ...prev, [classId]: false })); // Loading complete
        }
    };

    // --- 3. NAYE FUNCTIONS: Edit Modal Handlers ---
    const openEditModal = (cls: SchoolClass) => {
        setClassToEdit(cls); // Set karein kaunsi class edit ho rahi hai
        setEditName(cls.class_name); // Input field mein purana naam daalein
        setEditError(null); // Purana error clear karein
    };

    const closeEditModal = () => {
        setClassToEdit(null);
        setEditName('');
        setEditError(null);
        setIsEditing(false);
    };

    const handleUpdateClass = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!classToEdit || isEditing) return;

        const trimmedName = editName.trim();
        if (!trimmedName) {
            setEditError('Class name cannot be empty.');
            return;
        }
        if (trimmedName === classToEdit.class_name) {
            closeEditModal(); // Koi change nahi hua, bas band kar do
            return;
        }

        setIsEditing(true);
        setEditError(null);

        try {
            // Backend PUT /api/classes/:id ko call karega
            const res = await api.put(`/api/classes/${classToEdit.classid}`, { name: trimmedName });
            
            // List mein class ko update karein
            setClasses(prevClasses => 
                prevClasses.map(cls => 
                    cls.classid === classToEdit.classid ? res.data : cls // Purani class ko nayi se replace karein
                )
            );
            closeEditModal(); // Modal band karein
            
        } catch (err: any) {
            console.error("Failed to update class:", err);
            setEditError(err.response?.data?.msg || 'Failed to update class. Please try again.');
        } finally {
            setIsEditing(false);
        }
    };
    // ---

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
                            {/* --- 4. JSX UPDATE: Buttons add kiye --- */}
                            {classes.map(cls => (
                                <li key={cls.classid}>
                                    <span>{cls.class_name}</span>
                                    <div className={styles.classActions}>
                                        <button 
                                            onClick={() => openEditModal(cls)} 
                                            className={styles.actionButton} 
                                            title="Edit Class"
                                        >
                                            <FiEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClass(cls.classid, cls.class_name)} 
                                            className={`${styles.actionButton} ${styles.deleteButton}`} 
                                            title="Delete Class"
                                            disabled={isDeleting[cls.classid]} // Disable only this button
                                        >
                                            {isDeleting[cls.classid] ? '...' : <FiTrash2 />}
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {/* --- END JSX UPDATE --- */}
                        </ul>
                    )}
                    
                    {!isLoading && !fetchError && classes.length === 0 && (
                         <p className={styles.noClassesMessage}>No classes have been added yet.</p>
                    )}
                </section>

                {/* Section to Add a New Class (No Change) */}
                <section className={styles.addClassSection}>
                    <h2>Add New Class</h2>
                    <form onSubmit={handleAddClass}>
                        {/* ... (Existing Add Class Form - No Change) ... */}
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
                                disabled={isAdding}
                            />
                        </div>
                        {addError && <p className={styles.errorMessage}>{addError}</p>}
                        <button 
                            type="submit" 
                            className={styles.addButton}
                            disabled={isAdding}
                        >
                            {isAdding ? 'Adding...' : '+ Add Class'}
                        </button>
                    </form>
                </section>
            </div>

            {/* --- 4. JSX UPDATE: Edit Modal add kiya --- */}
            <Modal
                isOpen={!!classToEdit} // Modal tab khulega jab classToEdit null nahi hai
                onClose={closeEditModal}
                title={`Edit Class: ${classToEdit?.class_name}`}
            >
                <form onSubmit={handleUpdateClass} className={styles.editForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="editClassName">New Class Name</label>
                        <input
                            type="text"
                            id="editClassName"
                            className={styles.inputField}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            disabled={isEditing}
                        />
                    </div>

                    {editError && <p className={styles.errorMessage}>{editError}</p>}

                    <div className={styles.modalActions}>
                        <button 
                            type="button" 
                            className={styles.cancelButton} // Aapko in styles ko .scss file mein add karna hoga
                            onClick={closeEditModal}
                            disabled={isEditing}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className={styles.addButton} // Reuse add button style
                            disabled={isEditing}
                        >
                            {isEditing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
            {/* --- END JSX UPDATE --- */}

        </div>
    );
};

export default ClassesPage;