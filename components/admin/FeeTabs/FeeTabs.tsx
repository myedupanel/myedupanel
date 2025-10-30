"use client";
import React, { useState } from 'react';
import styles from './FeeTabs.module.scss';
import LatePaymentsTable from '@/components/admin/LatePaymentsTable/LatePaymentsTable';
import StudentFeeRecords from '@/components/admin/StudentFeeRecords/StudentFeeRecords';
import ProcessingPaymentsTable from '@/components/admin/ProcessingPaymentsTable/ProcessingPaymentsTable';
import EditedRecordsTable from '@/components/admin/EditedRecordsTable/EditedRecordsTable';
import PdcRecordsTable from '@/components/admin/PdcRecordsTable/PdcRecordsTable';

const FeeTabs: React.FC = () => {
    const [activeTab, setActiveTab] = useState('latePayment');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'latePayment':
                return <LatePaymentsTable />;
            case 'studentRecords':
                return <StudentFeeRecords />;
            case 'processing':
                return <ProcessingPaymentsTable />;
            case 'edited':
                return <EditedRecordsTable />;
            case 'pdc':
                return <PdcRecordsTable />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabHeader}>
                <div className={styles.tabList}>
                    <button className={activeTab === 'latePayment' ? styles.active : ''} onClick={() => setActiveTab('latePayment')}>Late Payment</button>
                    <button className={activeTab === 'studentRecords' ? styles.active : ''} onClick={() => setActiveTab('studentRecords')}>Student Fee Records</button>
                    <button className={activeTab === 'processing' ? styles.active : ''} onClick={() => setActiveTab('processing')}>Payment in Process</button>
                    <button className={activeTab === 'edited' ? styles.active : ''} onClick={() => setActiveTab('edited')}>Edited Fee Records</button>
                    <button className={activeTab === 'pdc' ? styles.active : ''} onClick={() => setActiveTab('pdc')}>PDC Records</button>
                </div>
            </div>
            <div className={styles.tabContent}>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default FeeTabs;