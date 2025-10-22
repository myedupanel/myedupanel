"use client";
import React, { useState, useEffect } from 'react';
import styles from './StudyMaterialPage.module.scss';
import { MdAdd, MdDownload, MdEdit, MdDelete, MdPictureAsPdf, MdDescription, MdBook, MdAssignment, MdLibraryBooks, MdMenuBook } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Modal from '@/components/common/Modal/Modal';
import AddMaterialForm, { MaterialFormData } from '@/components/admin/academics/AddMaterialForm';

// Data Structures
type MaterialCategory = 'Notes' | 'Worksheet' | 'Question Paper' | 'Syllabus';
type Material = {
  id: string; title: string; class: string; subject: string;
  fileType: 'PDF' | 'Word' | 'Other'; uploadDate: string; category: MaterialCategory;
  fileName: string | null; fileContent: string | null;
};
const categories: { name: MaterialCategory | 'All', icon: React.ReactNode }[] = [ { name: 'All', icon: <MdLibraryBooks /> }, { name: 'Notes', icon: <MdBook /> }, { name: 'Worksheet', icon: <MdAssignment /> }, { name: 'Question Paper', icon: <MdMenuBook /> }, { name: 'Syllabus', icon: <MdDescription /> } ];

const StudyMaterialPage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'All'>('All');

  useEffect(() => {
    const saved = localStorage.getItem('studyMaterials');
    if (saved && saved !== '[]') { setMaterials(JSON.parse(saved)); }
  }, []);

  useEffect(() => {
    if (materials.length > 0) {
      localStorage.setItem('studyMaterials', JSON.stringify(materials));
    }
  }, [materials]);

  const filteredMaterials = materials.filter(m => activeCategory === 'All' || m.category === activeCategory);
  
  const getFileIcon = (fileType: string) => {
    if (fileType === 'PDF') return <MdPictureAsPdf className={`${styles.icon} ${styles.pdf}`} />;
    if (fileType === 'Word') return <MdDescription className={`${styles.icon} ${styles.word}`} />;
    return <MdDescription className={styles.icon} />;
  }

  const handleOpenAddModal = () => { setMaterialToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (material: Material) => { setMaterialToEdit(material); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setMaterialToEdit(null); };

  const handleSaveMaterial = (formData: MaterialFormData) => {
    if (materialToEdit) {
      setMaterials(materials.map(m =>
        m.id === materialToEdit.id ? { ...materialToEdit, ...formData, fileName: materialToEdit.fileName, fileContent: materialToEdit.fileContent } : m
      ));
    } else {
      let fileType: 'PDF' | 'Word' | 'Other' = 'Other';
      if (formData.fileName?.toLowerCase().endsWith('.pdf')) fileType = 'PDF';
      if (formData.fileName?.toLowerCase().endsWith('.doc') || formData.fileName?.toLowerCase().endsWith('.docx')) fileType = 'Word';
      
      const newMaterial: Material = {
        id: uuidv4(),
        ...formData,
        fileType,
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setMaterials(prev => [...prev, newMaterial]);
    }
    handleCloseModal();
  };

  const handleDeleteMaterial = (idToDelete: string) => {
    if (window.confirm("Are you sure?")) { setMaterials(materials.filter(m => m.id !== idToDelete)); }
  };
  
  const handleDownload = (fileContent: string | null, fileName: string | null) => {
    if (!fileContent || !fileName) {
      alert("File content not found. Please re-upload the file.");
      return;
    }
    const link = document.createElement('a');
    link.href = fileContent;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1>Study Material</h1>
          <button className={styles.uploadButton} onClick={handleOpenAddModal}> <MdAdd /> Upload New Material </button>
        </div>
        <div className={styles.categoryTabs}>
          {categories.map(cat => ( <button key={cat.name} className={`${styles.tabButton} ${activeCategory === cat.name ? styles.active : ''}`} onClick={() => setActiveCategory(cat.name)}> {cat.icon} <span>{cat.name === 'All' ? 'All Materials' : cat.name}</span></button> ))}
        </div>
        <div className={styles.materialGrid}>
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material) => (
              <div key={material.id} className={`${styles.materialCard} ${material.fileType === 'PDF' ? styles.pdfCard : styles.wordCard}`}>
                <div className={styles.cardHeader}>
                  {getFileIcon(material.fileType)}
                  <div className={styles.cardActions}>
                    <button className={styles.actionButton} onClick={() => handleDownload(material.fileContent, material.fileName)}><MdDownload /></button>
                    <button className={styles.actionButton} onClick={() => handleOpenEditModal(material)}><MdEdit /></button>
                    <button className={styles.actionButton} onClick={() => handleDeleteMaterial(material.id)}><MdDelete /></button>
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{material.title}</h3>
                <div className={styles.cardMeta}>
                  <span>{material.class}</span> • <span>{material.subject}</span>
                </div>
                <p className={styles.cardDate}>Uploaded on: {material.uploadDate}</p>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <h3>No Materials Found</h3>
              <p>There are no materials in this category. Try uploading a new one.</p>
            </div>
          )}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={materialToEdit ? "Edit Material" : "Upload New Material"}>
        {/* ✨ FIX: Added the missing onClose prop here */}
        <AddMaterialForm onSave={handleSaveMaterial} initialData={materialToEdit} onClose={handleCloseModal} />
      </Modal>
    </>
  );
};

export default StudyMaterialPage;