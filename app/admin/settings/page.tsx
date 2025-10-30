"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import styles from './SettingsPage.module.scss';
import { MdEdit, MdDelete } from 'react-icons/md';

// --- YEH ADD KAREIN ---
import Link from 'next/link';
import { MdGridView } from 'react-icons/md';
// --- END ---

// Interface for TimeSlot
interface TimeSlot {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
}

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SettingsPage = () => {
    // States for Time Slot form
    const [slotName, setSlotName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isBreak, setIsBreak] = useState(false);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    
    // State for Working days
    const [workingDays, setWorkingDays] = useState<string[]>([]);

    useEffect(() => {
        const savedSlots = localStorage.getItem('schoolTimeSlots');
        if (savedSlots) {
            setTimeSlots(JSON.parse(savedSlots));
        }
        const savedDays = localStorage.getItem('schoolWorkingDays');
        if (savedDays) {
            setWorkingDays(JSON.parse(savedDays));
        }
    }, []);

    const handleWorkingDaysChange = (day: string) => {
        const updatedDays = workingDays.includes(day)
            ? workingDays.filter(d => d !== day)
            : [...workingDays, day];
        setWorkingDays(updatedDays);
        localStorage.setItem('schoolWorkingDays', JSON.stringify(updatedDays));
    };
    
    const handleDeleteSlot = (idToDelete: string) => {
        if (window.confirm('Are you sure you want to delete this time slot?')) {
            const updatedSlots = timeSlots.filter(slot => slot.id !== idToDelete);
            setTimeSlots(updatedSlots);
            localStorage.setItem('schoolTimeSlots', JSON.stringify(updatedSlots));
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

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!slotName || !startTime || !endTime) {
            alert('Please fill all the fields.');
            return;
        }

        let updatedSlots;

        if (editingSlotId) {
            updatedSlots = timeSlots.map(slot =>
                slot.id === editingSlotId
                    ? { ...slot, name: slotName, startTime, endTime, isBreak }
                    : slot
            );
        } else {
            const newSlot: TimeSlot = {
                id: Date.now().toString(),
                name: slotName,
                startTime: startTime,
                endTime: endTime,
                isBreak: isBreak,
            };
            updatedSlots = [...timeSlots, newSlot];
        }

        setTimeSlots(updatedSlots);
        localStorage.setItem('schoolTimeSlots', JSON.stringify(updatedSlots));
        cancelEdit();
    };

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

            {/* --- YEH BUTTON ADD KIYA GAYA HAI --- */}
            {/* Yeh button page ke aakhir mein dikhega */}
            <Link href="/admin/school" className={styles.dashboardLinkButton}>
                <MdGridView />
                Go to Dashboard
            </Link>
            {/* --- END --- */}
        </div>
    );
};

export default SettingsPage;