"use client";
import React, { useState, useEffect } from 'react';
import styles from './TimetablePage.module.scss';
import { MdAdd, MdEdit } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AssignPeriodForm from '@/components/admin/AssignPeriodForm/AssignPeriodForm';
import Link from 'next/link';

// --- YEH ADD KAREIN ---
import { MdGridView } from 'react-icons/md';
// --- END ---

interface TimeSlot {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean; 
}

interface PeriodData {
    subject: string;
    teacher: string;
}

const classOptions = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const teacherOptions = ["Priya Sharma", "Rahul Verma", "Anjali Mehta", "Suresh Kumar", "Deepika Singh"];

const TimetablePage = () => {
    const [viewBy, setViewBy] = useState<'class' | 'teacher'>('class');
    const [selectedGroup, setSelectedGroup] = useState(classOptions[0]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    const [timetableData, setTimetableData] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState<{ day: string, slotName: string } | null>(null);

    useEffect(() => {
        const savedTimetable = localStorage.getItem('schoolTimetableData');
        if (savedTimetable) { setTimetableData(JSON.parse(savedTimetable)); }

        const savedSlots = localStorage.getItem('schoolTimeSlots');
        if (savedSlots) { setTimeSlots(JSON.parse(savedSlots)); }

        const savedDays = localStorage.getItem('schoolWorkingDays');
        if (savedDays) {
            setWorkingDays(JSON.parse(savedDays));
        } else {
            setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
        }
    }, []);

    const handleOpenModal = (day: string, slotName: string) => {
        if (viewBy === 'teacher') { return; }
        setCurrentSlot({ day, slotName });
        setIsModalOpen(true);
    };
    
    const handleSavePeriod = (data: PeriodData) => {
        if (!currentSlot) return;
        const key = `${currentSlot.day}-${currentSlot.slotName}`;
        const newTimetableData = {
            ...timetableData,
            [selectedGroup]: { ...timetableData[selectedGroup], [key]: data }
        };
        setTimetableData(newTimetableData);
        localStorage.setItem('schoolTimetableData', JSON.stringify(newTimetableData));
        setIsModalOpen(false);
        setCurrentSlot(null);
    };

    const getTeacherTimetable = () => {
        const teacherSchedule: any = {};
        Object.keys(timetableData).forEach(className => {
            Object.keys(timetableData[className]).forEach(slotKey => {
                const period = timetableData[className][slotKey];
                if (period.teacher === selectedGroup) {
                    teacherSchedule[slotKey] = { ...period, class: className };
                }
            });
        });
        return teacherSchedule;
    };
    
    const currentDisplayData = viewBy === 'class' ? timetableData[selectedGroup] : getTeacherTimetable();

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Timetable Management</h1>
                <div className={styles.controls}>
                    <div className={styles.viewToggle}>
                        <button onClick={() => { setViewBy('class'); setSelectedGroup(classOptions[0]); }} className={viewBy === 'class' ? styles.active : ''}>Class View</button>
                        <button onClick={() => { setViewBy('teacher'); setSelectedGroup(teacherOptions[0]); }} className={viewBy === 'teacher' ? styles.active : ''}>Teacher View</button>
                    </div>
                    <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                        {(viewBy === 'class' ? classOptions : teacherOptions).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            <div className={styles.timetableWrapper}>
                {timeSlots.length > 0 ? (
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
                        <h2>No Time Slots Found</h2>
                        <p>Please go to the settings page to create time slots for the timetable.</p>
                        <Link href="/admin/settings" className={styles.settingsButton}> Go to Settings </Link>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Assign Period for ${selectedGroup}`}>
                <AssignPeriodForm
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePeriod}
                    // FIX: Removed the invalid teacherOptions prop below
                    // teacherOptions={teacherOptions} 
                />
            </Modal>

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

export default TimetablePage;