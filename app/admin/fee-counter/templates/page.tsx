"use client";
import React, { useState, useEffect } from 'react';
import styles from './FeeTemplates.module.scss';
import { FiPlus } from 'react-icons/fi';
import Modal from '@/components/common/Modal/Modal';
import AddFeeTemplateForm from '@/components/admin/AddFeeTemplateForm/AddFeeTemplateForm';
import api from '@/backend/utils/api';

const FeeTemplatesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/templates');
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>Manage Fee Templates</h1>
          <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
            <FiPlus /> Add New Template
          </button>
        </header>
        <div className={styles.contentArea}>
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <ul className={styles.templateList}>
              {templates.length > 0 ? templates.map(template => (
                <li key={template._id} className={styles.templateItem}>
                  {template.name}
                </li>
              )) : (
                <p>No templates created yet. Click "Add New Template" to start.</p>
              )}
            </ul>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Fee Template"
      >
        <AddFeeTemplateForm 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchTemplates} 
        />
      </Modal>
    </>
  );
};

export default FeeTemplatesPage;