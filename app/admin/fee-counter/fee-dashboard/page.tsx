// app/admin/fee-counter/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client'; 
import api from '@/backend/utils/api';
import styles from './FeeDashboard.module.scss';
import StatCard from '@/components/admin/StatCard/StatCard';
import FeeTabs from '@/components/admin/FeeTabs/FeeTabs';
import { MdSchedule, MdCreditCard, MdAccountBalanceWallet, MdSchool, MdChevronRight, MdRssFeed } from 'react-icons/md'; 

// FIX: useSession Import हटा दिया गया

// --- TYPE DEFINITIONS (No Change) ---
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
    // FIX 1: useSession hook कॉल हटा दिया गया
    // const { viewingSession } = useSession(); 
    
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [feed, setFeed] = useState<FeedItem[]>([]);
    
    // 1. Dashboard Stat Cards ke liye data fetch karna
    // FIX 2: Session Logic हटा दिया गया
    const fetchDashboardOverview = useCallback(async () => {
        try {
            // FIX: API call से sessionId param हटा दिया गया
            const dashboardRes = await api.get<DashboardData>('/fees/dashboard-overview');
            setDashboardData(dashboardRes.data);
        } catch (err) {
            console.error("Failed to fetch dashboard overview:", err);
            throw new Error('API_FETCH_DASHBOARD_FAILED'); 
        }
    }, []); 

    // 2. Fee Templates ki list fetch karna
    // FIX 3: Session Logic हटा दिया गया
    const fetchTemplates = useCallback(async () => {
        try {
            // FIX: API call से sessionId param हटा दिया गया
            const templatesRes = await api.get<Template[]>('/fees/templates');
            const templatesData = templatesRes.data;
            setTemplates(templatesData);
            
            if (!selectedTemplate && templatesData && templatesData.length > 0) {
                setSelectedTemplate(templatesData[0]);
            } else if (selectedTemplate && !templatesData.some(t => t.id === selectedTemplate.id)) {
                 setSelectedTemplate(templatesData[0] || null);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
             throw new Error('API_FETCH_TEMPLATES_FAILED'); 
        }
    }, [selectedTemplate]); 

    // 3. Selected Template ki details fetch karna
    // FIX 4: Session Logic हटा दिया गया
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


    // --- PEHLA useEffect (Timeout Logic) ---
    useEffect(() => {
        const dataFetchPromise = Promise.all([
            fetchDashboardOverview(),
            fetchTemplates()
        ]);
        
        // 💡 2-सेकंड का Timeout Promise (बरकरार)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Fee Dashboard Load Timeout")), 2000)
        );

        const loadInitialData = async () => {
            setLoading(true);
            setError('');

            try {
                await Promise.race([dataFetchPromise, timeoutPromise]);
                
            } catch (err: any) {
                console.error("Fee Dashboard Load Failed or Timed Out:", err.message);
                
                if (err.message.includes("Timeout")) {
                    setError('Dashboard timed out (2s). Backend is slow/down.');
                } else if (err.response && err.response.status === 400) {
                     // 400 error के लिए स्पेसिफिक मैसेज
                    setError('Error: API requires Session ID (Time Travel logic) which is currently reversed.');
                }
                
                setDashboardData(null); 
                setTemplates([]);
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();

    }, [fetchDashboardOverview, fetchTemplates]); 

    // --- DOOSRA useEffect (Jab bhi selectedTemplate badlega, run hoga) ---
    useEffect(() => {
        if (selectedTemplate && selectedTemplate.id) { 
            fetchTemplateDetails(selectedTemplate.id);
        }
    }, [selectedTemplate, fetchTemplateDetails]); 

    // --- YEH HAI REAL-TIME useEffect (No Change) ---
    useEffect(() => {
        const BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://myedupanel.onrender.com";
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

        socket.on('new_transaction_feed', (newFeedItem: FeedItem) => {
            console.log('Received new transaction feed:', newFeedItem);
            setFeed(prevFeed => 
                [newFeedItem, ...prevFeed].slice(0, 5) 
            );
        });

        return () => {
            socket.disconnect();
            console.log('Socket disconnected (Dashboard)');
        };
        
    }, [fetchDashboardOverview, fetchTemplates, fetchTemplateDetails, selectedTemplate]);


    // --- AAPKA BAAKI KA CODE ---

    if (loading) return <div className={styles.loadingState}>Loading Fee Dashboard...</div>;
    
    if (error || !dashboardData) return <div className={styles.errorState}>{error || "Failed to load dashboard data. Please check logs."}</div>;

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