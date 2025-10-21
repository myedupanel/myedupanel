"use client";
import React, { useState, useEffect } from 'react';
import api from '@/backend/utils/api';
import styles from './FeeDashboard.module.scss';
import StatCard from '@/components/admin/StatCard/StatCard';
import FeeTabs from '@/components/admin/FeeTabs/FeeTabs'; // <-- FeeTabs component ko import kiya
import { MdSchedule, MdCreditCard, MdAccountBalanceWallet, MdSchool, MdChevronRight } from 'react-icons/md';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const FeeDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateDetails, setTemplateDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [dashboardRes, templatesRes] = await Promise.all([
                    api.get('/fees/dashboard-overview'),
                    api.get('/fees/templates')
                ]);
                
                setDashboardData(dashboardRes.data);
                setTemplates(templatesRes.data);

                if (templatesRes.data && templatesRes.data.length > 0) {
                    setSelectedTemplate(templatesRes.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError('Failed to load data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        const fetchTemplateDetails = async () => {
            if (!selectedTemplate) return;

            setDetailsLoading(true);
            setTemplateDetails(null);
            try {
                const res = await api.get(`/fees/templates/${selectedTemplate._id}`);
                setTemplateDetails(res.data);
            } catch (error) {
                console.error("Error fetching template details:", error);
            } finally {
                setDetailsLoading(false);
            }
        };
        fetchTemplateDetails();
    }, [selectedTemplate]);

    if (loading) return <div className={styles.loadingState}>Loading Fee Dashboard...</div>;
    if (error) return <div className={styles.errorState}>{error}</div>;

    const getStudentProgress = () => {
        if (!templateDetails || !templateDetails.studentCount) return 0;
        return (templateDetails.paidStudentCount / templateDetails.studentCount) * 100;
    };

    const getCollectionProgress = () => {
        if (!templateDetails || !templateDetails.totalAmount) return 0;
        return (templateDetails.collectedAmount / templateDetails.totalAmount) * 100;
    };

    // ===== SIRF EK RETURN STATEMENT HAI =====
    return (
        <div className={styles.dashboardContainer}>
            <h1 className={styles.pageTitle}>Dashboard Overview</h1>
            
            {/* Phase 1: Overview Cards */}
            {dashboardData && (
                <div className={styles.statsGrid}>
                    <StatCard
                        icon={<MdSchedule />}
                        title="Late Collection"
                        value={formatCurrency(dashboardData.lateCollection.amount)}
                        subtitle={`${dashboardData.lateCollection.studentCount} Students`}
                        theme="late"
                    />
                    <StatCard
                        icon={<MdCreditCard />}
                        title="Online Payment"
                        value={`${dashboardData.onlinePayment.transactionCount} Txns`}
                        subtitle={`out of ${dashboardData.onlinePayment.totalStudents} Students`}
                        theme="online"
                    />
                    <StatCard
                        icon={<MdAccountBalanceWallet />}
                        title="Deposit Collection"
                        value={formatCurrency(dashboardData.depositCollection.amount)}
                        subtitle={`${dashboardData.depositCollection.studentCount} Students`}
                        theme="deposit"
                    />
                    <StatCard
                        icon={<MdSchool />}
                        title="School Collection"
                        value={formatCurrency(dashboardData.schoolCollection.collected)}
                        subtitle={`Goal: ${formatCurrency(dashboardData.schoolCollection.goal)}`}
                        theme="school"
                    />
                </div>
            )}

            {/* Phase 2: Fee Structure Section */}
            <div className={styles.mainContentGrid}>
                <div className={styles.feeStructureCard}>
                    <div className={styles.cardHeader}>
                        <h3>Fee Structure</h3>
                        <span className={styles.templateCount}>{templates.length} Templates</span>
                    </div>
                    <ul className={styles.templateList}>
                        {templates.length > 0 ? (
                            templates.map(template => (
                                <li 
                                    key={template._id} 
                                    className={`${styles.templateItem} ${selectedTemplate?._id === template._id ? styles.active : ''}`}
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    <span>{template.name}</span>
                                    <MdChevronRight />
                                </li>
                            ))
                        ) : (
                            <p className={styles.noTemplates}>No fee templates found.</p>
                        )}
                    </ul>
                </div>
                <div className={styles.feeDetailsCard}>
                     <div className={styles.cardHeader}>
                        <h3>Template Details</h3>
                    </div>
                    {detailsLoading ? (
                        <div className={styles.loadingDetails}>Loading Details...</div>
                    ) : templateDetails ? (
                        <div className={styles.detailsContent}>
                            <h4>{templateDetails.name}</h4>
                            <div className={styles.statItem}>
                                <div className={styles.statHeader}>
                                    <span>Paid Students</span>
                                    <span>{templateDetails.paidStudentCount} / {templateDetails.studentCount}</span>
                                </div>
                                <div className={styles.progress}>
                                    <div className={styles.progressBar} style={{ width: `${getStudentProgress()}%` }}></div>
                                </div>
                            </div>
                            <div className={styles.statItem}>
                                 <div className={styles.statHeader}>
                                    <span>Collection</span>
                                    <span>{formatCurrency(templateDetails.collectedAmount)} / {formatCurrency(templateDetails.totalAmount)}</span>
                                </div>
                                <div className={styles.progress}>
                                    <div className={styles.progressBar} style={{ width: `${getCollectionProgress()}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.placeholder}>
                            <p>Select a template from the left to see details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase 3: Payment Quick View Section */}
            <FeeTabs />

        </div>
    );
};

export default FeeDashboardPage;