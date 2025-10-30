"use client";
import React, { useState, useEffect } from 'react';
import styles from './StudyMaterialPage.module.scss';
import { MdAdd, MdDownload, MdEdit, MdDelete, MdPictureAsPdf, MdDescription, MdBook, MdAssignment, MdLibraryBooks, MdMenuBook } from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddMaterialForm, { MaterialFormData } from '@/components/admin/academics/AddMaterialForm';
import api from '@/backend/utils/api'; 

// Updated Data Structures to match backend
type MaterialCategory = 'Notes' | 'Worksheet' | 'Question Paper' | 'Syllabus' | 'Other';
type MaterialFileType = 'PDF' | 'Word' | 'Image' | 'Other'; 
type Material = {
  id: string; 
  title: string;
  className: string; // Backend 'className' use karta hai
  subject: string;
  fileType: MaterialFileType;
  createdAt: string; 
  category: MaterialCategory;
  fileUrl: string; 
  originalFilename: string; 
};
const categories: { name: MaterialCategory | 'All', icon: React.ReactNode }[] = [ { name: 'All', icon: <MdLibraryBooks /> }, { name: 'Notes', icon: <MdBook /> }, { name: 'Worksheet', icon: <MdAssignment /> }, { name: 'Question Paper', icon: <MdMenuBook /> }, { name: 'Syllabus', icon: <MdDescription /> }, { name: 'Other', icon: <MdDescription />} ]; 


const StudyMaterialPage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'All'>('All');

  // Fetch data from API
  const fetchMaterials = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await api.get('/study-material');
          setMaterials(response.data);
      } catch (err) {
          console.error("Failed to fetch study materials:", err);
          setError("Could not load study materials.");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchMaterials();
  }, []); 

  // Filtering
  const filteredMaterials = materials.filter(m => activeCategory === 'All' || m.category === activeCategory);

  // Icon logic
  const getFileIcon = (fileType: MaterialFileType) => {
    if (fileType === 'PDF') return <MdPictureAsPdf className={`${styles.icon} ${styles.pdf}`} />;
    if (fileType === 'Word') return <MdDescription className={`${styles.icon} ${styles.word}`} />;
    return <MdDescription className={styles.icon} />;
  }

  // Modal Handlers
  const handleOpenAddModal = () => { setMaterialToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (material: Material) => { setMaterialToEdit(material); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setMaterialToEdit(null); };

  // --- CRUD Functions Updated ---

  // FIX 1: handleSaveMaterial ab (formData, file) lega, jo Form se aa raha hai
  const handleSaveMaterial = async (formData: MaterialFormData, file: File | null) => {
      handleCloseModal(); 
      setIsLoading(true); 

      try {
          // formData ab 'className' ke saath aa raha hai
          const apiData = {
              title: formData.title,
              className: formData.className, // Ab direct use kar sakte hain
              subject: formData.subject,
              category: formData.category,
          };

          if (materialToEdit) {
              // UPDATE (Metadata only)
              const response = await api.put(`/study-material/${materialToEdit.id}`, apiData);
              setMaterials(materials.map(m => m.id === materialToEdit.id ? response.data : m));
              console.log("Material updated:", response.data);
              alert("Material metadata updated successfully. To replace the file, please delete and re-upload.");

          } else {
              // ADD (Requires file)
              if (!file) {
                  alert("Please select a file to upload.");
                  setIsLoading(false);
                  return;
              }
              const data = new FormData();
              data.append('title', apiData.title);
              data.append('className', apiData.className);
              data.append('subject', apiData.subject);
              data.append('category', apiData.category);
              data.append('materialFile', file); 

              const response = await api.post('/study-material/upload', data, {
                  headers: { 'Content-Type': 'multipart/form-data' } 
              });
              setMaterials(prev => [response.data, ...prev]); 
              console.log("Material added:", response.data);
          }
      } catch (err: any) {
          console.error("Failed to save material:", err);
          alert(`Error saving material: ${err.response?.data?.msg || err.message}`);
      } finally {
          setIsLoading(false);
      }
  };


  const handleDeleteMaterial = async (idToDelete: string) => {
    const materialTitle = materials.find(m => m.id === idToDelete)?.title || 'this material';
    if (window.confirm(`Are you sure you want to delete "${materialTitle}"? This will remove the file permanently.`)) {
      try {
        setIsLoading(true); 
        await api.delete(`/study-material/${idToDelete}`);
        setMaterials(materials.filter(m => m.id !== idToDelete));
        console.log("Material deleted:", idToDelete);
      } catch (err: any) {
        console.error("Failed to delete material:", err);
        alert(`Error deleting material: ${err.response?.data?.msg || err.message}`);
      } finally {
         setIsLoading(false);
      }
    }
  };

  if (isLoading && materials.length === 0) return <div className={styles.loadingMessage}>Loading Study Materials...</div>; 
  if (error) return <div className={styles.errorMessage}>{error}</div>;

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

        {isLoading && materials.length > 0 && <div className={styles.loadingOverlay}>Updating...</div>}

        <div className={styles.materialGrid}>
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material) => (
              <div key={material.id} className={`${styles.materialCard} ${styles[material.fileType.toLowerCase()]}`}>
                <div className={styles.cardHeader}>
                  {getFileIcon(material.fileType)}
                  <div className={styles.cardActions}>
                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.actionButton} title="Download">
                        <MdDownload />
                    </a>
                    <button className={styles.actionButton} onClick={() => handleOpenEditModal(material)} title="Edit"><MdEdit /></button>
                    <button className={styles.actionButton} onClick={() => handleDeleteMaterial(material.id)} title="Delete"><MdDelete /></button>
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{material.title}</h3>
                <div className={styles.cardMeta}>
                  <span>{material.className}</span> • <span>{material.subject}</span>
                </div>
                <p className={styles.cardDate}>Uploaded on: {new Date(material.createdAt).toLocaleDateString()}</p>
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

      {/* === FIX 2: MODAL SECTION UPDATED === */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={materialToEdit ? "Edit Material" : "Upload New Material"}>
        <AddMaterialForm
            // FIX: Ab 'handleSaveMaterial' function 'onSave' prop se match karta hai
            onSave={handleSaveMaterial}
            
            // FIX: Ab 'initialData' bhi form se match karta hai (dono 'className' use karte hain)
            initialData={materialToEdit ? {
                className: materialToEdit.className, 
                title: materialToEdit.title,
                subject: materialToEdit.subject,
                category: materialToEdit.category,
            } : null}
            onClose={handleCloseModal}
        />
      </Modal>
      {/* === END FIX === */}
    </>
  );
};

export default StudyMaterialPage;