"use client";
import React, { useState, useEffect, useMemo } from 'react';
import styles from './FeeTemplates.module.scss';
// FiMenu और FiSearch को जोड़ा
import { FiPlus, FiEdit, FiTrash, FiMenu, FiSearch } from 'react-icons/fi'; 
import Modal from '@/components/common/Modal/Modal';
import AddFeeTemplateForm from '@/components/admin/AddFeeTemplateForm/AddFeeTemplateForm'; 
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
  const [isEditModalOpen, setIsEditModalToOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NAYE STATES FOR MOBILE
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false); 
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // NEW SEARCH STATE
  
  
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/templates');
      setTemplates(res.data || []); 
    } catch (error) {
      console.error("Failed to fetch templates", error);
      setTemplates([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // --- NAYA: Filter Logic ---
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    const lowercasedQuery = searchTerm.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowercasedQuery) || 
      template.description?.toLowerCase().includes(lowercasedQuery)
    );
  }, [templates, searchTerm]);
  // --- END Filter Logic ---

  // --- NEW HANDLERS for Add, Edit, Delete ---
  const handleAddSuccess = () => {
    fetchTemplates(); 
    setIsAddModalOpen(false); 
  };

  const handleEditSuccess = () => {
    fetchTemplates(); 
    setIsEditModalToOpen(false); 
    setEditingTemplate(null); 
  };

  const handleEditClick = (template: any) => {
    setEditingTemplate(template); 
    setIsEditModalToOpen(true); 
  };

  const handleDeleteClick = (id: string) => {
    setDeletingTemplateId(id); 
  };

  const confirmDelete = async () => {
    if (!deletingTemplateId) return;
    try {
      await api.delete(`/fees/templates/${deletingTemplateId}`);
      alert('Template deleted successfully!');
      fetchTemplates(); 
      setDeletingTemplateId(null); 
    } catch (error) {
      console.error("Failed to delete template", error);
      alert('Failed to delete template. It might be in use.');
    }
  };
  
  // NAYA: Search Handler for Modal
  const handleModalSearch = (query: string) => {
    setSearchTerm(query);
    setIsSearchModalOpen(false);
  };
  // ---

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          
          {/* NAYA: Mobile Header Bar */}
          <div className={styles.mobileHeaderBar}>
              {/* Hamburger Menu Icon (Mobile Only) */}
              <button className={styles.menuButton} onClick={() => setIsMenuModalOpen(true)}>
                  <FiMenu />
              </button>
              
              <h1 className={styles.title}>Manage Fee Templates</h1>
              
              {/* Search Icon (Mobile Only) */}
              <button className={styles.searchToggleButton} onClick={() => setIsSearchModalOpen(true)}>
                  <FiSearch />
              </button>
          </div>

          {/* Desktop Add Button (Mobile pe hide) */}
          <button className={`${styles.addButton} ${styles.desktopAddButton}`} onClick={() => setIsAddModalOpen(true)}>
            <FiPlus /> Add New Template
          </button>
        </header>
        
        {/* --- UPDATED CONTENT AREA with Grid Layout --- */}
        <div className={styles.contentArea}>
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <div className={styles.templateGrid}>
              
              {/* Grid Header (Desktop/Tablet) */}
              <div className={`${styles.templateItem} ${styles.gridHeader}`}>
                <span>Template Name</span>
                <span className={styles.templateDescription}>Description</span> {/* Description hidden on mobile */}
                <span className={styles.templateAmount}>Total Amount</span>
                <span className={styles.templateActions}>Actions</span>
              </div>
              
              {/* Grid Body: Map filtered templates */}
              {filteredTemplates.length > 0 ? filteredTemplates.map(template => (
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
                !loading && <p className={styles.noTemplates}>No templates match your search criteria.</p>
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
          onClose={() => { setIsEditModalToOpen(false); setEditingTemplate(null); }}
          title="Edit Fee Template"
        >
          <AddFeeTemplateForm 
            onClose={() => { setIsEditModalToOpen(false); setEditingTemplate(null); }} 
            onSuccess={handleEditSuccess}
            templateData={editingTemplate} 
          />
        </Modal>
      )}

      {/* 3. Delete Confirmation Modal (No Change) */}
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
      
      {/* 4. NAYA: Menu Modal (Hamburger Content) */}
      <Modal 
          isOpen={isMenuModalOpen} 
          onClose={() => setIsMenuModalOpen(false)}
          title="Fees Templates Menu"
      >
          <nav className={styles.mobileMenuNav}>
              <button 
                  onClick={() => { setIsAddModalOpen(true); setIsMenuModalOpen(false); }} 
                  className={styles.modalActionLink}
              >
                  <FiPlus /> Add New Template
              </button>
          </nav>
      </Modal>

      {/* 5. NAYA: Search Modal */}
      <Modal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)}
          title="Search Templates"
      >
          <div className={styles.searchModalContent}>
              <div className={styles.searchBox}>
                  <FiSearch />
                  <input 
                      type="text" 
                      placeholder="Search by name or description..." 
                      defaultValue={searchTerm}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              handleModalSearch(e.currentTarget.value);
                          }
                      }}
                  />
                  <button 
                     onClick={() => handleModalSearch( (document.querySelector(`.${styles.searchModalContent} input`) as HTMLInputElement).value)} 
                     className={styles.searchButton}
                  >
                      Search
                  </button>
              </div>
          </div>
      </Modal>
    </>
  );
};

export default FeeTemplatesPage;