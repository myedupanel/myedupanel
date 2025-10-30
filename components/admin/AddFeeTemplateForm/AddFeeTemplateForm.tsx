"use client";
import React, { useState, useMemo, useEffect } from 'react';
import styles from './AddFeeTemplateForm.module.scss';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import api from '@/backend/utils/api';

// Type for a single fee item
interface Item {
  name: string;
  amount: string | number; // Allow number for easier state update
}

// Type for the template data we might receive for editing
interface TemplateData {
  id: string;
  name: string;
  description?: string;
  items: { name: string; amount: number }[];
  // Add other fields if they exist
}

// --- FIX 1: Update the component's props interface ---
interface AddFeeTemplateFormProps {
  onClose: () => void;
  onSuccess: () => void;
  templateData?: TemplateData | null; // <-- ADDED: Make templateData optional
}

// --- FIX 2: Accept templateData as a prop ---
const AddFeeTemplateForm = ({ onClose, onSuccess, templateData }: AddFeeTemplateFormProps) => {
    
    // Determine if we are in "edit mode"
    const isEditMode = !!templateData;

    // --- FIX 3: Set initial state based on templateData ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<Item[]>([{ name: '', amount: '' }]);
    
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // This effect runs when the component loads
    useEffect(() => {
        if (isEditMode && templateData) {
            // If in edit mode, fill the form with existing data
            setName(templateData.name);
            setDescription(templateData.description || '');
            // Convert items amounts back to string for the input fields
            setItems(templateData.items.map(item => ({
                name: item.name,
                amount: String(item.amount) 
            })));
        }
    }, [isEditMode, templateData]); // Run only when these change
    // ---

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [items]);

    const handleItemChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newItems = [...items];
        const key = event.target.name as keyof Item;
        if (key === 'name' || key === 'amount') {
             newItems[index][key] = event.target.value;
        }
        setItems(newItems);
    };

    const addItemRow = () => { setItems([...items, { name: '', amount: '' }]); };
    const removeItemRow = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

    // --- FIX 4: Update handleSubmit for both Create (POST) and Edit (PUT) ---
    const handleSubmit = async () => {
        setError('');
        // Validation (same as before)
        if (!name.trim()) { setError('Template name is required.'); return; }
        if (items.some(item => !item.name.trim() || !item.amount || Number(item.amount) <= 0)) {
            setError('All fee items must have a valid name and amount greater than 0.');
            return;
        }

        setIsSaving(true);
        // Convert all item amounts to numbers before sending
        const payload = { 
            name, 
            description, 
            items: items.map(item => ({ ...item, amount: Number(item.amount) })) 
        };

        try {
            let res;
            if (isEditMode && templateData) {
                // --- EDIT (PUT) Request ---
                // Assumes backend route is PUT /api/fees/templates/:id
                res = await api.put(`/fees/templates/${templateData.id}`, payload);
                alert(res.data.message || 'Template updated successfully!');
            } else {
                // --- CREATE (POST) Request ---
                res = await api.post('/fees/templates', payload);
                alert(res.data.message || 'Template created successfully!');
            }
            
            onSuccess(); // Call onSuccess (which refreshes the list)
            onClose();   // Call onClose to close the modal
            
        } catch (err: any) {
            const defaultMessage = isEditMode ? 'Failed to update template.' : 'Failed to create template.';
            setError(err.response?.data?.message || defaultMessage);
        } finally {
            setIsSaving(false);
        }
    };
    // ---

    return (
        <div className={styles.formContainer}>
            <div className={styles.formGroup}>
                <label htmlFor="name">Template Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Annual Fee 2025-26" />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="description">Description (Optional)</label>
                <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., For Grade 5 to 7" />
            </div>

            <hr className={styles.divider} />
            <label className={styles.itemsLabel}>Fee Items</label>

            {items.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                    <input type-="text" name="name" placeholder="Item Name (e.g., Tuition Fee)" value={item.name} onChange={(e) => handleItemChange(index, e)} />
                    <input type="number" name="amount" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(index, e)} min="0" /> 
                    <button type="button" onClick={() => removeItemRow(index)} className={styles.removeButton} disabled={items.length <= 1}>
                        <FiTrash2 />
                    </button>
                </div>
            ))}
            
            <button type="button" onClick={addItemRow} className={styles.addButton}><FiPlus /> Add Another Item</button>
            
            <hr className={styles.divider} />

            <div className={styles.totalAmount}>
                <span>Total Amount:</span>
                <strong>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
                </strong>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formActions}>
                <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSaving}>Cancel</button>
                <button type="button" onClick={handleSubmit} className={styles.saveButton} disabled={isSaving}>
                    <FiSave /> 
                    {/* --- FIX 5: Change button text based on mode --- */}
                    {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Template' : 'Save Template')}
                </button>
            </div>
        </div>
    );
};

export default AddFeeTemplateForm;