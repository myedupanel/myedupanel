"use client";
import React, { useState } from 'react';
import styles from './FeeImportExport.module.scss';
import FeeImportForm from '@/components/admin/FeeImportForm/FeeImportForm';
import FeeExportForm from '@/components/admin/FeeExportForm/FeeExportForm'; // <-- Naya component import kiya

const FeeImportExportPage = () => {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fee Import / Export</h1>
      </header>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={activeTab === 'import' ? styles.active : ''}
          onClick={() => setActiveTab('import')}
        >
          Fee Import
        </button>
        <button
          className={activeTab === 'export' ? styles.active : ''}
          onClick={() => setActiveTab('export')}
        >
          Export Sheet
        </button>
        <button
          className={activeTab === 'reports' ? styles.active : ''}
          onClick={() => setActiveTab('reports')}
        >
          Fee Reports
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'import' && <FeeImportForm />}
        
        {/* ===== YAHAN BADLAV KIYA GAYA HAI ===== */}
        {/* Placeholder ki jagah naya FeeExportForm component istemal kiya */}
        {activeTab === 'export' && <FeeExportForm />}

        {activeTab === 'reports' && (
          <div>
            <h3>Generate Fee Reports</h3>
            <p>Yeh feature hum agle step mein banayenge.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeImportExportPage;