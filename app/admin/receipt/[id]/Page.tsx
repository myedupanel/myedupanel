// File: app/admin/receipt/preview/[id]/page.tsx (Updated with SCSS Import)
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/backend/utils/api';
import FeeReceipt from '@/components//admin/fees/FeeReceipt';
import { ReceiptData } from '@/components/admin/fees/FeeReceipt';
import styles from './ReceiptPreviewPage.module.scss'; // 🚨 SCSS IMPORT ADDED

const ReceiptPreviewPage = () => {
    const router = useRouter();
    const params = useParams();
    const transactionId = params.id as string;
    const [transaction, setTransaction] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTransactionData = async (id: string) => {
        try {
            // NOTE: Is API call ko successfully chalaane ke liye backend code zaroori hai.
            const response = await api.get(`/fees/transactions/${id}`);
            setTransaction(response.data);
        } catch (error) {
            console.error("Failed to fetch transaction for preview:", error);
            // Agar data nahi milta, toh wapas bhej do
            router.push('/admin/fee-counter/fee-records'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (transactionId) {
            fetchTransactionData(transactionId);
        }
    }, [transactionId]);

    // CRITICAL: Print logic after data loads
    useEffect(() => {
        if (transaction && !loading) {
            setTimeout(() => {
                // Ensure print logic only runs once
                const alreadyPrinting = document.body.classList.contains('printing-receipt-active');
                if (!alreadyPrinting) {
                    document.body.classList.add('printing-receipt-active');
                    window.print();
                    
                    setTimeout(() => {
                        document.body.classList.remove('printing-receipt-active');
                        // Print ke baad wapas records page par bhej rahe hain
                        router.push('/admin/fee-counter/fee-records'); 
                    }, 500); 
                }
            }, 100);
        }
    }, [transaction, loading, router]);

    if (loading) {
        return (
            <div className={styles.loadingScreen}>
                Loading receipt data... Please wait for print dialog.
            </div>
        );
    }

    if (!transaction) {
         return <div className={styles.loadingScreen}>Receipt not found or failed to load data.</div>;
    }

    // Main FeeReceipt component ko render karo
    return (
        <div className={styles.previewWrapper}>
            <FeeReceipt transaction={transaction} isPreviewPage={true} /> 
        </div>
    );
};

export default ReceiptPreviewPage;