"use client";
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import styles from './SettingsPage.module.scss';
import { MdEdit, MdDelete, MdGridView } from 'react-icons/md';
import Link from 'next/link';
// --- API Import ---
import api from '@/backend/utils/api'; 
// --- End API Import ---

// Interface for TimeSlot
interface TimeSlot {
    id: number; // API ID is number now
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
}
// Interface for WorkingDay
interface WorkingDay {
    id: number; // API ID
    name: string;
    dayIndex: number;
}


const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SettingsPage = () => {
    // States for Time Slot form
    const [slotName, setSlotName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isBreak, setIsBreak] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [editingSlotId, setEditingSlotId] = useState<number | null>(null); // Changed to number
    
    // State for Working days
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);

    // --- 1. Fetch Data Function ---
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            // Assuming BE returns: { timeSlots: TimeSlot[], workingDays: string[] } (or { timeSlots: TimeSlot[], workingDays: WorkingDay[] })
            const res = await api.get('/timetable/settings'); 
            const fetchedDays = res.data.workingDays.map((d: any) => d.name || d); // Handle both string[] and WorkingDay[]
            
            setTimeSlots(res.data.timeSlots);
            setWorkingDays(fetchedDays);

        } catch (error) {
            console.error("Failed to fetch settings:", error);
            alert("Failed to load settings. Check backend connection.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Replace localStorage load with API call
        fetchSettings();
    }, [fetchSettings]);

    // --- 2. Handle Working Days Change (POST to API) ---
    const handleWorkingDaysChange = async (day: string) => {
        const isCurrentlySelected = workingDays.includes(day);
        const updatedDays = isCurrentlySelected
            ? workingDays.filter(d => d !== day)
            : [...workingDays, day];
        
        setWorkingDays(updatedDays); // Optimistic UI update

        try {
            // Assuming BE endpoint handles the full list or single day toggle
            // We send the full list to be safe
            await api.post('/timetable/settings/days', { workingDays: updatedDays }); 
            // If successful, data is already updated in state
        } catch (error) {
            console.error("Failed to update working days:", error);
            // Revert optimistic update if API fails
            setWorkingDays(workingDays);
            alert("Failed to save working days.");
        }
    };
    
    // --- 3. Handle Delete Slot (DELETE to API) ---
    const handleDeleteSlot = async (idToDelete: number) => {
        if (window.confirm('Are you sure you want to delete this time slot? This will affect existing timetables!')) {
            try {
                // Assuming DELETE endpoint: /api/timetable/settings/slot/123
                await api.delete(`/timetable/settings/slot/${idToDelete}`); 
                alert('Time Slot deleted successfully!');
                fetchSettings(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete slot:", error);
                alert("Failed to delete time slot. It might be in use.");
            }
        }
    };
    
    const handleStartEdit = (slotToEdit: TimeSlot) => {
        setEditingSlotId(slotToEdit.id);
        setSlotName(slotToEdit.name);
        setStartTime(slotToEdit.startTime);
        setEndTime(slotToEdit.endTime);
        setIsBreak(slotToEdit.isBreak);
    };

    const cancelEdit = () => {
        setEditingSlotId(null);
        setSlotName('');
        setStartTime('');
        setEndTime('');
        setIsBreak(false);
    };

    // --- 4. Handle Form Submit (POST to API for Add/Edit) ---
    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!slotName || !startTime || !endTime) {
            alert('Please fill all the fields.');
            return;
        }
        
        const payload = {
            name: slotName,
            startTime: startTime,
            endTime: endTime,
            isBreak: isBreak,
            id: editingSlotId // null for create, ID for update
        };

        try {
            if (editingSlotId) {
                // PUT/POST to update existing slot
                await api.put(`/timetable/settings/slot/${editingSlotId}`, payload); 
                alert('Time Slot updated successfully!');
            } else {
                // POST to create new slot
                await api.post('/timetable/settings/slot', payload);
                alert('Time Slot added successfully!');
            }
            
            fetchSettings(); // Refresh the list to show the new data
            cancelEdit();
        } catch (error: any) {
            console.error("Failed to save slot:", error);
            alert(`Failed to save time slot: ${error.response?.data?.message || 'Server Error'}`);
        }
    };
    
    if (isLoading) return <div className={styles.loadingState}>Loading Timetable Settings...</div>;


    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>Timetable Settings</h1>

            <div className={styles.settingsCard}>
                <h2 className={styles.cardTitle}>
                    {editingSlotId ? 'Edit Time Slot' : 'Add New Time Slot'}
                </h2>
                <form onSubmit={handleFormSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="slot-name">Period Name</label>
                        <input type="text" id="slot-name" value={slotName} onChange={(e) => setSlotName(e.target.value)} placeholder="e.g., Period 1, Lunch Break" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="start-time">Start Time</label>
                        <input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="end-time">End Time</label>
                        <input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                    <div className={`${styles.formGroup} ${styles.checkboxFormGroup}`}>
                         <div className={styles.checkboxWrapper}>
                            <input
                                type="checkbox"
                                id="is-break"
                                checked={isBreak}
                                onChange={(e) => setIsBreak(e.target.checked)}
                            />
                            <label htmlFor="is-break">Mark as Break</label>
                        </div>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button type="submit" className={styles.submitButton}>
                            {editingSlotId ? 'Update Slot' : 'Add Slot'}
                        </button>
                        {editingSlotId && (
                            <button type="button" onClick={cancelEdit} className={styles.cancelButton}> Cancel </button>
                        )}
                    </div>
                </form>
            </div>
            
            <div className={styles.settingsCard}>
                <h2 className={styles.cardTitle}>Set Working Days</h2>
                <div className={styles.checkboxContainer}>
                    {allDays.map(day => (
                        <div key={day} className={styles.checkboxWrapper}>
                            <input type="checkbox" id={`day-${day}`} checked={workingDays.includes(day)} onChange={() => handleWorkingDaysChange(day)} />
                            <label htmlFor={`day-${day}`}>{day}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.settingsCard}>
                <h2 className={styles.cardTitle}>Existing Time Slots</h2>
                {timeSlots.length > 0 ? (
                    <table className={styles.slotsTable}>
                        <thead>
                            <tr>
                                <th>Period Name</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(slot => (
                                <tr key={slot.id}>
                                    <td>{slot.name}</td>
                                    <td>{slot.startTime}</td>
                                    <td>{slot.endTime}</td>
                                    <td>{slot.isBreak ? <span className={styles.breakTag}>Break</span> : 'Period'}</td>
                                    <td className={styles.actionsCell}>
                                        <button onClick={() => handleStartEdit(slot)} className={styles.iconButton}><MdEdit /></button>
                                        <button onClick={() => handleDeleteSlot(slot.id)} className={`${styles.iconButton} ${styles.deleteButton}`}><MdDelete /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No time slots have been added yet.</p>
                )}
            </div>

            <Link href="/admin/school" className={styles.dashboardLinkButton}>
                <MdGridView />
                Go to Dashboard
            </Link>
        </div>
    );
};

export default SettingsPage;