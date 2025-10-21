"use client";
import React, { useState, useMemo } from 'react'; // <-- useMemo ko import kiya
import styles from './AddFeeTemplateForm.module.scss';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import api from '@/backend/utils/api';

// Type safety ke liye ek interface banaya
interface Item {
  name: string;
  amount: string;
}

const AddFeeTemplateForm = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<Item[]>([{ name: '', amount: '' }]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // ===== NAYA UPGRADE: LIVE TOTAL CALCULATION =====
    // useMemo ka istemal kiya taaki total tabhi calculate ho jab items badlein
    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [items]);

    const handleItemChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newItems = [...items];
        newItems[index][event.target.name as keyof Item] = event.target.value;
        setItems(newItems);
    };

    const addItemRow = () => { setItems([...items, { name: '', amount: '' }]); };
    const removeItemRow = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

    const handleSubmit = async () => {
        setError('');
        if (!name.trim()) { setError('Template name is required.'); return; }
        if (items.some(item => !item.name.trim() || !item.amount.trim() || Number(item.amount) <= 0)) {
            setError('All fee items must have a valid name and amount greater than 0.');
            return;
        }

        setIsSaving(true);
        const payload = { name, description, items: items.map(item => ({ ...item, amount: Number(item.amount) })) };

        try {
            const res = await api.post('/fees/templates', payload);
            alert(res.data.message);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create template.');
        } finally {
            setIsSaving(false);
        }
    };

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
                    <input type="text" name="name" placeholder="Item Name (e.g., Tuition Fee)" value={item.name} onChange={(e) => handleItemChange(index, e)} />
                    <input type="number" name="amount" placeholder="Amount" value={item.amount} onChange={(e) => handleItemChange(index, e)} />
                    <button onClick={() => removeItemRow(index)} className={styles.removeButton} disabled={items.length <= 1}>
                        <FiTrash2 />
                    </button>
                </div>
            ))}
            
            <button onClick={addItemRow} className={styles.addButton}><FiPlus /> Add Another Item</button>
            
            <hr className={styles.divider} />

            {/* ===== NAYA TOTAL AMOUNT DISPLAY ===== */}
            <div className={styles.totalAmount}>
                <span>Total Amount:</span>
                <strong>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}
                </strong>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.formActions}>
                <button onClick={onClose} className={styles.cancelButton} disabled={isSaving}>Cancel</button>
                <button onClick={handleSubmit} className={styles.saveButton} disabled={isSaving}>
                    <FiSave /> {isSaving ? 'Saving...' : 'Save Template'}
                </button>
            </div>
        </div>
    );
};

export default AddFeeTemplateForm;