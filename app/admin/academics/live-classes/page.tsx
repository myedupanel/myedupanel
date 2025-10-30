"use client";
import React, { useState, useEffect } from 'react';
import styles from './LiveClassesPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdVideocam } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddLiveClassForm, { LiveClassFormData } from '@/components/admin/academics/AddLiveClassForm';
import api from '@/backend/utils/api'; 

// Updated data structure to match backend
type LiveClassStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'; 
type LiveClass = {
  id: string; 
  topic: string;
  teacherName: string; 
  className: string; 
  subject: string;
  date: string; 
  time: string; // Expect HH:MM format
  status: LiveClassStatus;
  meetingLink: string;
};

const LiveClassesPage = () => {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<LiveClass | null>(null);

  // Fetch data from API on load
  const fetchLiveClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/live-classes');
      setLiveClasses(response.data);
    } catch (err) {
      console.error("Failed to fetch live classes:", err);
      setError("Could not load live class schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []); 

  // Modal Handlers
  const handleOpenAddModal = () => { setClassToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (cls: LiveClass) => { setClassToEdit(cls); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setClassToEdit(null); };

  // --- CRUD Functions Updated with API Calls ---
  const handleSave = async (formData: LiveClassFormData) => {
    handleCloseModal(); // Close modal immediately
    try {
      if (classToEdit) {
        // UPDATE
        // Hum form se aaya data bhej rahe hain.
        // Backend 'status' ko update nahi karega kyunki form use bhej nahi raha hai.
        const response = await api.put(`/live-classes/${classToEdit.id}`, formData);
        setLiveClasses(liveClasses.map(c => c.id === classToEdit.id ? response.data : c));
        console.log("Live class updated:", response.data);
      } else {
        // ADD
        // FIX 1: Hum 'formData.status' ko access nahi kar rahe hain.
        // Hum naye class ka status hamesha 'Scheduled' set kar rahe hain.
        const response = await api.post('/live-classes', { ...formData, status: 'Scheduled' });
        
        // Add new class and re-sort
        setLiveClasses(prev => [...prev, response.data].sort((a, b) => {
             const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
             if (dateComparison !== 0) return dateComparison;
             return a.time.localeCompare(b.time);
        }));
        console.log("Live class added:", response.data);
      }
    } catch (err: any) {
      console.error("Failed to save live class:", err);
      alert(`Error saving class: ${err.response?.data?.msg || err.message}`);
      fetchLiveClasses(); // Re-fetch on error
    }
  };

  const handleDelete = async (id: string) => {
    const classTopic = liveClasses.find(c => c.id === id)?.topic || 'this class';
    if (window.confirm(`Are you sure you want to delete the class "${classTopic}"?`)) {
      try {
        await api.delete(`/live-classes/${id}`);
        setLiveClasses(liveClasses.filter(c => c.id !== id));
        console.log("Live class deleted:", id);
      } catch (err: any) {
        console.error("Failed to delete live class:", err);
        alert(`Error deleting class: ${err.response?.data?.msg || err.message}`);
         fetchLiveClasses(); // Re-fetch on error
      }
    }
  };
  // --- END CRUD Updates ---

  // Time ko AM/PM format mein dikhayein
  const formatTime = (time: string): string => {
    if (!time || !time.includes(':')) return 'Invalid Time';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    if (isNaN(hour) || isNaN(minute)) return 'Invalid Time';

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; 
    const formattedMinutes = minute < 10 ? `0${minute}` : minute; 

    return `${formattedHour}:${formattedMinutes} ${ampm}`;
  };

  if (isLoading) return <div className={styles.loadingMessage}>Loading Live Classes...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Live Class Schedule</h1>
          <button className={styles.scheduleButton} onClick={handleOpenAddModal}>
            <MdAdd />
            Schedule New Class
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Teacher</th>
                <th>Class & Subject</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.length > 0 ? (
                liveClasses.map((cls) => (
                  <tr key={cls.id}> 
                    <td className={styles.topicCell}>{cls.topic}</td>
                    <td>{cls.teacherName}</td> 
                    <td>{`${cls.className} - ${cls.subject}`}</td> 
                    <td>{`${new Date(cls.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${formatTime(cls.time)}`}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[cls.status.replace(/\s+/g, '').toLowerCase()]}`}> 
                        {cls.status}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" className={styles.joinButton}>
                        <MdVideocam /> Join
                      </a>
                      <button className={styles.actionButton} onClick={() => handleOpenEditModal(cls)}><MdEdit /></button>
                      <button className={styles.actionButton} onClick={() => handleDelete(cls.id)}><MdDelete /></button> 
                    </td>
                  </tr>
                ))
               ) : (
                 <tr><td colSpan={6} className={styles.noDataCell}>No live classes scheduled yet.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === FIX 2: MODAL SECTION UPDATED === */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={classToEdit ? 'Edit Class Schedule' : 'Schedule New Class'}>
        <AddLiveClassForm 
          onSave={handleSave} 
          // Hum 'classToEdit' (LiveClass type) ko 'LiveClassFormData' type mein badal rahe hain
          // Ismein 'status' field nahi hoga, kyunki form use expect nahi karta.
          initialData={classToEdit ? {
              topic: classToEdit.topic,
              teacherName: classToEdit.teacherName,
              className: classToEdit.className,
              subject: classToEdit.subject,
              date: classToEdit.date ? new Date(classToEdit.date).toISOString().split('T')[0] : '', // Date format fix
              time: classToEdit.time,
              meetingLink: classToEdit.meetingLink
          } : null} 
        />
      </Modal>
      {/* === END FIX === */}
    </>
  );
};

export default LiveClassesPage;