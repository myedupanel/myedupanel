"use client";
import React, { useState, useEffect } from 'react';
import styles from './EventsPage.module.scss';
import { MdAdd, MdEdit, MdDelete, MdEmojiEvents, MdSportsCricket, MdScience, MdPalette } from 'react-icons/md';
// Removed uuidv4 as backend generates IDs
import Modal from '@/components/common/Modal/Modal';
import AddEventForm, { EventFormData } from '@/components/admin/academics/AddEventForm';
import api from '@/backend/utils/api'; // Import API utility

// Updated types to match backend model
type EventCategory = 'Sports' | 'Academic' | 'Cultural' | 'Other'; // Added 'Other'
type FilterType = EventCategory | 'All';
type EventStatus = 'Upcoming' | 'Completed' | 'Postponed' | 'Cancelled'; // Added 'Cancelled'
type Event = {
  id: string; // Changed from id
  title: string;
  category: EventCategory;
  date: string; // Keep as string for API, format on display
  status: EventStatus;
  description?: string; // Optional field
};

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  // Fetch data from API on load
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Could not load events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []); // Run once on mount

  // Removed localStorage useEffect hooks

  // Icon logic (simplified for example)
  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'Sports': return <MdSportsCricket />;
      case 'Academic': return <MdScience />;
      case 'Cultural': return <MdPalette />;
      default: return <MdEmojiEvents />;
    }
  };

  // Filtering Logic (No change needed)
  const filteredEvents = activeFilter === 'All' ? events : events.filter(e => e.category === activeFilter);

  // Modal Handlers (No change needed)
  const handleOpenAddModal = () => { setEventToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (event: Event) => { setEventToEdit(event); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEventToEdit(null); };

  // --- CRUD Functions Updated with API Calls ---

  const handleSave = async (formData: EventFormData) => {
    try {
      if (eventToEdit) {
        // UPDATE: Call PUT API
        const response = await api.put(`/events/${eventToEdit.id}`, formData);
        setEvents(events.map(e => e.id === eventToEdit.id ? response.data : e));
        console.log("Event updated:", response.data);
      } else {
        // ADD: Call POST API
        const response = await api.post('/events', formData);
        setEvents(prev => [...prev, response.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())); // Add and sort
        console.log("Event added:", response.data);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save event:", err);
      alert(`Error saving event: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    // Find event title for confirmation
    const eventTitle = events.find(e => e.id === id)?.title || 'this event';
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        // DELETE: Call DELETE API
        await api.delete(`/events/${id}`);
        setEvents(events.filter(e => e.id !== id));
        console.log("Event deleted:", id);
      } catch (err: any) {
        console.error("Failed to delete event:", err);
        alert(`Error deleting event: ${err.response?.data?.msg || err.message}`);
      }
    }
  };
  // --- END CRUD Updates ---

  // --- Render Loading/Error States ---
  if (isLoading) return <div className={styles.loadingMessage}>Loading Events...</div>;
  if (error) return <div className={styles.errorMessage}>{error}</div>;
  // ---

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Events & Competitions</h1>
          <button className={styles.addButton} onClick={handleOpenAddModal}>
            <MdAdd /> Add New Event
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filterContainer}>
          <button className={`${styles.filterButton} ${activeFilter === 'All' ? styles.active : ''}`} onClick={() => setActiveFilter('All')}>All Events</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Sports' ? styles.active : ''}`} onClick={() => setActiveFilter('Sports')}>Sports</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Academic' ? styles.active : ''}`} onClick={() => setActiveFilter('Academic')}>Academic</button>
          <button className={`${styles.filterButton} ${activeFilter === 'Cultural' ? styles.active : ''}`} onClick={() => setActiveFilter('Cultural')}>Cultural</button>
          {/* Consider adding 'Other' if used */}
        </div>

        {/* Events Grid */}
        <div className={styles.eventsGrid}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div key={event.id} className={styles.eventCard}> 
                <div className={`${styles.cardIcon} ${styles[event.category.toLowerCase()]}`}>{getCategoryIcon(event.category)}</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <span className={`${styles.statusBadge} ${styles[event.status.toLowerCase()]}`}>{event.status}</span>
                  </div>
                  <p className={styles.cardDate}>Date: {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {event.description && <p className={styles.cardDescription}>{event.description}</p>} {/* Show description if exists */}
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => handleOpenEditModal(event)}><MdEdit /> Edit</button>
                  <button onClick={() => handleDelete(event.id)}><MdDelete /> Delete</button>
                </div>
              </div>
            ))
          ) : (
             <p className={styles.noEventsMessage}>No events found matching your criteria.</p> // Empty state message
          )}
        </div>
      </div>

      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={eventToEdit ? 'Edit Event' : 'Add New Event'}>
        <AddEventForm onSave={handleSave} initialData={eventToEdit} />
      </Modal>
    </>
  );
};

export default EventsPage;