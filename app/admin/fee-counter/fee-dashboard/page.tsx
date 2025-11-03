"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client'; 
import api from '@/backend/utils/api';
import styles from './FeeDashboard.module.scss';
import StatCard from '@/components/admin/StatCard/StatCard';
import FeeTabs from '@/components/admin/FeeTabs/FeeTabs';
import { MdSchedule, MdCreditCard, MdAccountBalanceWallet, MdSchool, MdChevronRight, MdRssFeed } from 'react-icons/md'; // MdRssFeed add kiya

// --- TYPE DEFINITIONS ---
interface DashboardData {
    lateCollection: { amount: number; studentCount: number };
    onlinePayment: { transactionCount: number; totalStudents: number };
    depositCollection: { amount: number; studentCount: number };
    schoolCollection: { collected: number; goal: number };
}

interface Template {
    id: string;
    name: string;
}

interface TemplateDetails {
    name: string;
    studentCount: number;
    paidStudentCount: number;
    totalAmount: number;
    collectedAmount: number;
}

// --- NAYI TYPE ---
interface FeedItem {
  name: string;
  amount: number;
}
// ---

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const FeeDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- NAYA STATE ---
    const [feed, setFeed] = useState<FeedItem[]>([]);
    // ---

    // --- YEH HAIN NAYE REFACTORED FUNCTIONS ---
    
    // 1. Dashboard Stat Cards ke liye data fetch karna
    const fetchDashboardOverview = useCallback(async () => {
        try {
            const dashboardRes = await api.get<DashboardData>('/fees/dashboard-overview');
            setDashboardData(dashboardRes.data);
        } catch (err) {
            console.error("Failed to fetch dashboard overview:", err);
            setError('Failed to load dashboard data. Please try again.');
        }
    }, []); 

    // 2. Fee Templates ki list fetch karna
    const fetchTemplates = useCallback(async () => {
        try {
            const templatesRes = await api.get<Template[]>('/fees/templates');
            setTemplates(templatesRes.data);
            
            if (!selectedTemplate && templatesRes.data && templatesRes.data.length > 0) {
                setSelectedTemplate(templatesRes.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
        }
    }, [selectedTemplate]); 

    // 3. Selected Template ki details fetch karna
    const fetchTemplateDetails = useCallback(async (templateId: string) => {
        setDetailsLoading(true);
        setTemplateDetails(null);
        try {
            const res = await api.get<TemplateDetails>(`/fees/templates/${templateId}`);
            setTemplateDetails(res.data);
        } catch (error) {
            console.error("Error fetching template details:", error);
        } finally {
            setDetailsLoading(false);
        }
    }, []); 


    // --- PEHLA useEffect (Sirf Page Load par run hoga) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchDashboardOverview(),
                fetchTemplates()
            ]);
            setLoading(false);
        };
        fetchInitialData();
    }, [fetchDashboardOverview, fetchTemplates]); 

    // --- DOOSRA useEffect (Jab bhi selectedTemplate badlega, run hoga) ---
    useEffect(() => {
        if (selectedTemplate) {
            fetchTemplateDetails(selectedTemplate.id);
        }
    }, [selectedTemplate, fetchTemplateDetails]); 

    // --- YEH HAI REAL-TIME useEffect (UPDATED) ---
    useEffect(() => {
        const BACKEND_URL = "https://myedupanel.onrender.com";
        const socket = io(BACKEND_URL);

        socket.on('connect', () => {
            console.log('Socket connected to server (Dashboard)');
        });

        socket.on('updateDashboard', () => {
            console.log('Received "updateDashboard" event! Refreshing data...');
            fetchDashboardOverview();
            fetchTemplates();
            if (selectedTemplate) {
                fetchTemplateDetails(selectedTemplate.id);
            }
        });

        // --- YEH NAYA LISTENER HAI ---
        socket.on('new_transaction_feed', (newFeedItem: FeedItem) => {
            console.log('Received new transaction feed:', newFeedItem);
            // Nayi item ko list ke upar add karein, aur list ko 5 items tak limit karein
            setFeed(prevFeed => 
                [newFeedItem, ...prevFeed].slice(0, 5) 
            );
        });
        // --- NAYA LISTENER END ---

        return () => {
            socket.disconnect();
            console.log('Socket disconnected (Dashboard)');
        };
        
    }, [fetchDashboardOverview, fetchTemplates, fetchTemplateDetails, selectedTemplate]);


    // --- AAPKA BAAKI KA CODE (NO CHANGE) ---

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

    return (
        <div className={styles.dashboardContainer}>
            <h1 className={styles.pageTitle}>Dashboard Overview</h1>
            
            {dashboardData && (
                <div className={styles.statsGrid}>
                    {/* ... (StatCard components - no change) ... */}
                    <StatCard
                        icon={<MdSchedule />}
                        title="Late Collection"
                        value={formatCurrency(dashboardData.lateCollection.amount)}
                        theme="orange"
                    />
                    <StatCard
                        icon={<MdCreditCard />}
                        title="Online Payment"
                        value={`${dashboardData.onlinePayment.transactionCount} Txns`}
                        theme="purple"
                    />
                    <StatCard
                        icon={<MdAccountBalanceWallet />}
                        title="Deposit Collection"
                        value={formatCurrency(dashboardData.depositCollection.amount)}
                        theme="blue"
                    />
                    <StatCard
                        icon={<MdSchool />}
                        title="School Collection"
                        value={formatCurrency(dashboardData.schoolCollection.collected)}
                        theme="green"
                    />
                </div>
            )}

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
                                    key={template.id} 
                                    className={`${styles.templateItem} ${selectedTemplate?.id === template.id ? styles.active : ''}`}
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

                {/* --- YEH NAYA CARD HAI --- */}
                {/* Note: Yeh card aapke grid mein add hoga. */}
                {/* Aapko .mainContentGrid ke CSS ko 3 column layout ke liye adjust karna pad sakta hai */}
                <div className={styles.recentActivityCard}>
                     <div className={styles.cardHeader}>
                        <h3><MdRssFeed style={{ marginRight: '8px', verticalAlign: 'bottom' }} /> Live Feed</h3>
                    </div>
                    {feed.length === 0 ? (
                        <div className={styles.placeholder}>
                            <p>Waiting for new payments...</p>
                        </div>
                    ) : (
                        <ul className={styles.feedList}>
                            {feed.map((item, index) => (
                                <li key={index} className={styles.feedItem}>
                                    <span className={styles.feedName}>{item.name}</span>
                                    <span className={styles.feedAmount}>
                                        paid {formatCurrency(item.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* --- NAYA CARD END --- */}

            </div>
            
            <FeeTabs />

        </div>
    );
};

export default FeeDashboardPage;