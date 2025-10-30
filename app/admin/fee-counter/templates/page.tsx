"use client";
import React, { useState, useEffect } from 'react';
import styles from './FeeTemplates.module.scss';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi'; // <-- NEW ICONS
import Modal from '@/components/common/Modal/Modal';
import AddFeeTemplateForm from '@/components/admin/AddFeeTemplateForm/AddFeeTemplateForm'; // We'll reuse this for editing
import api from '@/backend/utils/api';

// --- NEW: Currency Formatter Helper ---
const formatCurrency = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹ --';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};
// ---

const FeeTemplatesPage = () => {
  // --- UPDATED STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  // ---
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/templates');
      setTemplates(res.data || []); // Default to empty array
    } catch (error) {
      console.error("Failed to fetch templates", error);
      setTemplates([]); // Set to empty on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // --- NEW HANDLERS for Add, Edit, Delete ---
  const handleAddSuccess = () => {
    fetchTemplates(); // Refresh list
    setIsAddModalOpen(false); // Close modal
  };

  const handleEditSuccess = () => {
    fetchTemplates(); // Refresh list
    setIsEditModalOpen(false); // Close modal
    setEditingTemplate(null); // Clear editing state
  };

  const handleEditClick = (template: any) => {
    setEditingTemplate(template); // Set which template to edit
    setIsEditModalOpen(true); // Open edit modal
  };

  const handleDeleteClick = (id: string) => {
    setDeletingTemplateId(id); // Set which template to delete (opens confirm modal)
  };

  const confirmDelete = async () => {
    if (!deletingTemplateId) return;
    try {
      // Assumes backend route DELETE /api/fees/templates/:id
      await api.delete(`/fees/templates/${deletingTemplateId}`);
      alert('Template deleted successfully!');
      fetchTemplates(); // Refresh list
      setDeletingTemplateId(null); // Close confirm modal
    } catch (error) {
      console.error("Failed to delete template", error);
      alert('Failed to delete template. It might be in use.');
    }
  };
  // ---

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>Manage Fee Templates</h1>
          <button className={styles.addButton} onClick={() => setIsAddModalOpen(true)}>
            <FiPlus /> Add New Template
          </button>
        </header>
        
        {/* --- UPDATED CONTENT AREA with Grid Layout --- */}
        <div className={styles.contentArea}>
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <div className={styles.templateGrid}>
              
              {/* Grid Header */}
              <div className={`${styles.templateItem} ${styles.gridHeader}`}>
                <span>Template Name</span>
                <span>Description</span>
                <span>Total Amount</span>
                <span>Actions</span>
              </div>
              
              {/* Grid Body: Map templates */}
              {templates.length > 0 ? templates.map(template => (
                <div key={template.id} className={styles.templateItem}>
                  <span className={styles.templateName}>{template.name}</span>
                  <span className={styles.templateDescription}>{template.description || 'N/A'}</span>
                  <span className={styles.templateAmount}>{formatCurrency(template.totalAmount)}</span>
                  
                  {/* Action Buttons */}
                  <div className={styles.templateActions}>
                    <button 
                      onClick={() => handleEditClick(template)} 
                      className={styles.actionButton} 
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(template.id)} 
                      className={`${styles.actionButton} ${styles.deleteButton}`} 
                      title="Delete"
                    >
                      <FiTrash />
                    </button>
                  </div>
                </div>
              )) : (
                !loading && <p className={styles.noTemplates}>No templates created yet. Click "Add New Template" to start.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- ALL MODALS --- */}
      
      {/* 1. Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Fee Template"
      >
        <AddFeeTemplateForm 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={handleAddSuccess} 
        />
      </Modal>

      {/* 2. Edit Modal (Reuses AddFeeTemplateForm) */}
      {editingTemplate && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => { setIsEditModalOpen(false); setEditingTemplate(null); }}
          title="Edit Fee Template"
        >
          <AddFeeTemplateForm 
            onClose={() => { setIsEditModalOpen(false); setEditingTemplate(null); }} 
            onSuccess={handleEditSuccess}
            templateData={editingTemplate} // <-- IMPORTANT: Pass existing data to the form
          />
        </Modal>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deletingTemplateId && (
        <Modal
          isOpen={!!deletingTemplateId}
          onClose={() => setDeletingTemplateId(null)}
          title="Confirm Deletion"
        >
          <div className={styles.confirmDelete}>
            <p>Are you sure you want to delete this fee template? This action cannot be undone and may affect assigned fees.</p>
            <div className={styles.confirmButtons}>
              <button onClick={() => setDeletingTemplateId(null)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmDelete} className={styles.deleteConfirmButton}>
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default FeeTemplatesPage;