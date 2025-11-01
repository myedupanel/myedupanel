"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './TimetablePage.module.scss';
import { MdAdd, MdEdit, MdGridView } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AssignPeriodForm from '@/components/admin/AssignPeriodForm/AssignPeriodForm';
import Link from 'next/link';
// --- API Import ---
import api from '@/backend/utils/api'; 
// --- End API Import ---

// --- NEW INTERFACES (No Change) ---
interface TimeSlot {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean; 
}

interface PeriodAssignment { 
    id: number; 
    day: string;
    timeSlotName: string;
    className: string;
    teacherName: string;
    subject: string;
}
// --- END NEW INTERFACES ---

const TimetablePage = () => {
    const [viewBy, setViewBy] = useState<'class' | 'teacher'>('class');
    const [selectedGroup, setSelectedGroup] = useState('');
    
    // --- New States for Live Data (No Change) ---
    const [classOptions, setClassOptions] = useState<string[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    const [allAssignments, setAllAssignments] = useState<PeriodAssignment[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    // --- End New States ---

    const [isModalOpen, setIsModalOpen] = useState(false); // <--- Correct state setter name
    const [currentSlot, setCurrentSlot] = useState<{ day: string, slotName: string } | null>(null);

    // --- 1. Fetching Assignments (No Change) ---
    const fetchAssignments = useCallback(async () => {
        try {
            const assignmentsRes = await api.get('/timetable/assignments'); 
            setAllAssignments(assignmentsRes.data);
        } catch(error) {
             console.error("Error fetching assignments:", error);
        }
    }, []);

    // --- 2. Fetching Settings (No Change) ---
    const fetchSettings = useCallback(async () => {
        try {
            const [classesRes, teachersRes] = await Promise.all([
                api.get('/classes'),
                api.get('/teachers') 
            ]);
            const fetchedClasses = classesRes.data.map((c: any) => c.class_name);
            const fetchedTeachers = teachersRes.data.data.map((t: any) => t.name);
            
            setClassOptions(fetchedClasses);
            setTeacherOptions(fetchedTeachers);

            const configRes = await api.get<{ timeSlots: TimeSlot[], workingDays: string[] }>('/timetable/settings'); 

            setTimeSlots(configRes.data.timeSlots);
            setWorkingDays(configRes.data.workingDays);

            if (fetchedClasses.length > 0 && !selectedGroup) {
                 setSelectedGroup(fetchedClasses[0]);
            }

        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    }, [selectedGroup]);

    // --- 3. Initial Load Effect (No Change) ---
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchSettings();
            await fetchAssignments();
            setIsLoading(false);
        };
        loadData();
    }, [fetchSettings, fetchAssignments]);

    // --- 4. ASYNC Save Logic (Argument Type 'any' किया) ---
    const handleSavePeriod = async (data: any) => {
        if (!currentSlot) return;

        const className = viewBy === 'class' ? selectedGroup : data.class; 
        const teacherName = viewBy === 'teacher' ? selectedGroup : data.teacher;
        const subject = data.subject;

        if (!className || !teacherName || !subject) {
             alert('Error: Data is incomplete. Please check your form fields.');
             return;
        }

        const payload = {
            day: currentSlot.day,
            slotName: currentSlot.slotName,
            className: className, 
            teacherName: teacherName, 
            subject: subject,
        };
        
        try {
             await api.post('/timetable/assign', payload);
             alert('Period assigned successfully! Refreshing data...');
             await fetchAssignments(); 
        } catch (error: any) {
             console.error("Error saving period:", error);
             alert(`Failed to save period: ${error.response?.data?.message || 'Server Error'}`);
        }

        setIsModalOpen(false);
        setCurrentSlot(null);
    };

    // --- 5. SYNCHRONOUS Wrapper (No Change) ---
    const handleSavePeriodSync = (data: any) => {
        handleSavePeriod(data);
    };
    // --- END FIX ---
    
    // --- 6. Process Display Data (No Change) ---
    const currentDisplayData = useMemo(() => {
        const filteredData: any = {};
        
        if (viewBy === 'class') {
             allAssignments
                .filter(a => a.className === selectedGroup)
                .forEach(a => {
                    const key = `${a.day}-${a.timeSlotName}`;
                    filteredData[key] = { subject: a.subject, teacher: a.teacherName };
                });
            
        } else {
            allAssignments
                .filter(a => a.teacherName === selectedGroup)
                .forEach(a => {
                    const key = `${a.day}-${a.timeSlotName}`;
                    filteredData[key] = { subject: a.subject, class: a.className };
                });
        }
        
        return filteredData;

    }, [allAssignments, selectedGroup, viewBy]);

    const handleOpenModal = (day: string, slotName: string) => {
        if (viewBy === 'teacher') { return; }
        setCurrentSlot({ day, slotName });
        setIsModalOpen(true);
    };

    if (isLoading) return <div className={styles.loadingState}>Loading Timetable Configuration...</div>;
    
    const availableOptions = viewBy === 'class' ? classOptions : teacherOptions;
    
    if (!availableOptions.includes(selectedGroup) && availableOptions.length > 0) {
        setSelectedGroup(availableOptions[0]);
        return <div className={styles.loadingState}>Switching view...</div>;
    }


    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Timetable Management</h1>
                <div className={styles.controls}>
                    <div className={styles.viewToggle}>
                        <button onClick={() => { setViewBy('class'); setSelectedGroup(classOptions[0]); }} className={viewBy === 'class' ? styles.active : ''} disabled={classOptions.length === 0}>Class View</button>
                        <button onClick={() => { setViewBy('teacher'); setSelectedGroup(teacherOptions[0]); }} className={viewBy === 'teacher' ? styles.active : ''} disabled={teacherOptions.length === 0}>Teacher View</button>
                    </div>
                    <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} disabled={availableOptions.length === 0}>
                        {availableOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.timetableWrapper}>
                {timeSlots.length > 0 && workingDays.length > 0 ? (
                    <table className={styles.timetableTable}>
                        <thead>
                            <tr>
                                <th>Day / Time</th>
                                {timeSlots.map(slot => (
                                    <th key={slot.id}>{slot.name}<br/><span>({slot.startTime} - {slot.endTime})</span></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {workingDays.map(day => (
                                <tr key={day}>
                                    <td>{day}</td>
                                    {timeSlots.map(slot => {
                                        const key = `${day}-${slot.name}`;
                                        const periodData = currentDisplayData?.[key];
                                        
                                        if (slot.isBreak) {
                                            return (
                                                <td key={slot.id} className={styles.breakCell}>
                                                    <span className={styles.breakText}>{slot.name}</span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={slot.id}>
                                                {periodData ? (
                                                    <div className={styles.periodEntry}>
                                                        <span className={styles.subject}>{periodData.subject}</span>
                                                        <span className={styles.details}>{viewBy === 'class' ? periodData.teacher : periodData.class}</span>
                                                        {viewBy === 'class' && (
                                                            <button className={styles.editButton} onClick={() => handleOpenModal(day, slot.name)}><MdEdit /></button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    viewBy === 'class' ? (
                                                        <button className={styles.addButton} onClick={() => handleOpenModal(day, slot.name)}><MdAdd /></button>
                                                    ) : <span className={styles.freeSlot}>Free</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <h2>Timetable Configuration Missing</h2>
                        <p>Please ensure you have created time slots and working days in the settings page.</p>
                        <Link href="/admin/settings" className={styles.settingsButton}> Go to Settings </Link>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Assign Period for ${selectedGroup} - ${currentSlot?.day}`}>
                <AssignPeriodForm
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePeriodSync} 
                    classOptions={classOptions}
                    teacherOptions={teacherOptions} 
                />
            </Modal>

            <Link href="/admin/school" className={styles.dashboardLinkButton}>
                <MdGridView />
                Go to Dashboard
            </Link>
        </div>
    );
};

export default TimetablePage;