"use client";
import React, { useState, useEffect } from 'react';
import styles from './EventsPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdEmojiEvents, MdSportsCricket, MdScience, MdPalette } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/common/Modal/Modal';
import AddEventForm, { EventFormData } from '@/components/admin/academics/AddEventForm';

type EventCategory = 'Sports' | 'Academic' | 'Cultural';
type FilterType = EventCategory | 'All';
type Event = {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Postponed';
};

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    const saved = localStorage.getItem('schoolEvents');
    if (saved && saved !== '[]') {
      setEvents(JSON.parse(saved));
    } else {
      setEvents([
        { id: 'EV001', title: 'Annual Sports Day', category: 'Sports', date: '2025-11-15', status: 'Upcoming' },
        { id: 'EV002', title: 'Science Fair Exhibition', category: 'Academic', date: '2025-11-22', status: 'Upcoming' },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('schoolEvents', JSON.stringify(events));
  }, [events]);

  const getCategoryIcon = (category: EventCategory) => { /* ... */ return <MdEmojiEvents />; };

  const filteredEvents = activeFilter === 'All' ? events : events.filter(e => e.category === activeFilter);

  const handleOpenAddModal = () => { setEventToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (event: Event) => { setEventToEdit(event); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEventToEdit(null); };

  const handleSave = (formData: EventFormData) => {
    if (eventToEdit) {
      setEvents(events.map(e => e.id === eventToEdit.id ? { ...eventToEdit, ...formData } : e));
    } else {
      setEvents(prev => [...prev, { id: uuidv4(), ...formData }]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Events & Competitions</h1>
          <button className={styles.addButton} onClick={handleOpenAddModal}>
            <MdAdd /> Add New Event
          </button>
        </div>

        <div className={styles.filterContainer}>
          <button className={`${styles.filterButton} ${activeFilter === 'All' ? styles.active : ''}`} onClick={() => setActiveFilter('All')}>All Events</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Sports' ? styles.active : ''}`} onClick={() => setActiveFilter('Sports')}>Sports</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Academic' ? styles.active : ''}`} onClick={() => setActiveFilter('Academic')}>Academic</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Cultural' ? styles.active : ''}`} onClick={() => setActiveFilter('Cultural')}>Cultural</button>
        </div>

        <div className={styles.eventsGrid}>
          {filteredEvents.map((event) => (
            <div key={event.id} className={styles.eventCard}>
              <div className={`${styles.cardIcon} ${styles[event.category.toLowerCase()]}`}>{getCategoryIcon(event.category)}</div>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  <span className={`${styles.statusBadge} ${styles[event.status.toLowerCase()]}`}>{event.status}</span>
                </div>
                <p className={styles.cardDate}>Date: {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className={styles.cardActions}>
                <button onClick={() => handleOpenEditModal(event)}><MdEdit /> Edit</button>
                <button onClick={() => handleDelete(event.id)}><MdDelete /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={eventToEdit ? 'Edit Event' : 'Add New Event'}>
        <AddEventForm onSave={handleSave} initialData={eventToEdit} />
      </Modal>
    </>
  );
};

export default EventsPage;