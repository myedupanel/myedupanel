"use client";
import React, { useState, useEffect } from 'react';
import styles from './LiveClassesPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdVideocam } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/common/Modal/Modal';
import AddLiveClassForm, { LiveClassFormData } from '@/components/admin/academics/AddLiveClassForm';


// Data structure
type LiveClass = {
  id: string;
  topic: string;
  teacher: string;
  class: string;
  subject: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  meetingLink: string;
};

const LiveClassesPage = () => {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<LiveClass | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('liveClasses');
    if (saved && saved !== '[]') {
      setLiveClasses(JSON.parse(saved));
    } else {
      setLiveClasses([
        { id: 'LC01', topic: 'Introduction to Algebra', teacher: 'Priya Sharma', class: 'Grade 9', subject: 'Mathematics', date: '2025-10-05', time: '10:00', status: 'Scheduled', meetingLink: 'https://meet.google.com' },
        { id: 'LC02', topic: 'The Solar System', teacher: 'Rahul Verma', class: 'Grade 8', subject: 'Science', date: '2025-10-05', time: '11:30', status: 'Scheduled', meetingLink: 'https://zoom.us' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('liveClasses', JSON.stringify(liveClasses));
  }, [liveClasses]);

  const handleOpenAddModal = () => { setClassToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (cls: LiveClass) => { setClassToEdit(cls); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setClassToEdit(null); };

  const handleSave = (formData: LiveClassFormData) => {
    if (classToEdit) {
      setLiveClasses(liveClasses.map(c => c.id === classToEdit.id ? { ...classToEdit, ...formData } : c));
    } else {
      // Nayi class ke liye status 'Scheduled' set karein
      setLiveClasses(prev => [...prev, { id: uuidv4(), ...formData, status: 'Scheduled' }]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this scheduled class?")) {
      setLiveClasses(liveClasses.filter(c => c.id !== id));
    }
  };
  
  // Time ko AM/PM format mein dikhayein
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  }

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
              {liveClasses.map((cls) => (
                <tr key={cls.id}>
                  <td className={styles.topicCell}>{cls.topic}</td>
                  <td>{cls.teacher}</td>
                  <td>{`${cls.class} - ${cls.subject}`}</td>
                  <td>{`${new Date(cls.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${formatTime(cls.time)}`}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[cls.status.replace(' ', '').toLowerCase()]}`}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={classToEdit ? 'Edit Class Schedule' : 'Schedule New Class'}>
        <AddLiveClassForm onSave={handleSave} initialData={classToEdit} />
      </Modal>
    </>
  );
};

export default LiveClassesPage;