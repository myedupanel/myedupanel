// File: app/admin/school/page.tsx (FINAL UPDATED CODE)
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SchoolPage.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth, User } from '@/app/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    MdPeople, MdSchool, MdFamilyRestroom, MdBadge,
    MdEventAvailable, MdAttachMoney, MdSchedule,
    MdAssessment, MdSettings, MdPersonAdd,
    MdClass, MdFlashOn, MdStar // Added icons for the banner
} from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import api from '@/backend/utils/api';


// === 1. TypeScript Interfaces ===
interface RecentStudent {
    id: string; 
    name: string; 
    class?: string; 
    details?: { class?: string };
}
interface RecentTeacher {
    id: string; 
    name: string; 
    subject?: string; 
    details?: { subject?: string };
}
interface RecentStaff {
    id: string; 
    name: string; 
    role?: string; 
    details?: { role?: string };
}
interface RecentFee {
    id: string; 
    student: string; 
    amount: string; 
    date?: string;
}
interface RecentParent {
    id: string;
    name: string;
}
interface AdmissionDataPoint {
    month?: number; 
    name: string; 
    admissions: number;
}


// === Subscription Interface ===
type PlanType = 'NONE' | 'TRIAL' | 'STARTER' | 'PRO'; 
interface SubscriptionData {
    plan: PlanType;
    planExpiryDate: string | null; // Database से आ रहा है
}
// =========================================================

interface DashboardData {
    admissionsData: AdmissionDataPoint[];
    recentStudents: RecentStudent[];
    recentTeachers: RecentTeacher[];
    recentFees: RecentFee[];
    recentParents: RecentParent[];
    recentStaff: RecentStaff[];
    stats?: {
        totalStudents: number;
        totalTeachers: number;
        totalParents: number;
        totalStaff: number;
    }
}
// ===========================================

// --- NEW COMPONENT: TrialWarningModal (Unchanged) ---
interface TrialWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    daysLeft: number;
}
const TrialWarningModal: React.FC<TrialWarningModalProps> = ({ isOpen, onClose, daysLeft }) => {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Trial Period Ending Soon! ⏳"
            modalClassName={styles.warningModal}
        >
            <div className={styles.modalContent}>
                <p>Your **{daysLeft} day** free trial will expire soon.</p>
                <p>To avoid any disruption to your school's operations, please consider **upgrading** to a paid plan today.</p>
                <p className={styles.warningMessage}>
                    <MdFlashOn size={20} style={{ marginRight: '8px' }}/> 
                    Once your trial ends, access to some features will be restricted.
                </p>
                <div className={styles.modalActions}>
                    <Link href="/upgrade" className={styles.upgradeLinkButton}>
                        Upgrade Now
                    </Link>
                    <button onClick={onClose} className={styles.dismissButton}>
                        Continue Using Trial
                    </button>
                </div>
            </div>
        </Modal>
    );
};
// ----------------------------------------


// --- UPDATED COMPONENT: SubscriptionBanner ---
interface SubscriptionBannerProps {
    plan: PlanType;
    planExpiryDate: string | null;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ plan, planExpiryDate }) => {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    // Calculate days left and update every minute
    useEffect(() => {
        if (plan === 'TRIAL' || plan === 'STARTER' || plan === 'PRO') {
            if (!planExpiryDate) { // If plan is active but expiry is null (e.g., SuperAdmin override or error)
                 setDaysLeft(null);
                 return;
            }
            const calculateDays = () => {
                const now = new Date().getTime();
                const end = new Date(planExpiryDate).getTime();
                const diffTime = end - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                setDaysLeft(diffDays > 0 ? diffDays : 0);
            };

            calculateDays();
            const interval = setInterval(calculateDays, 60000);

            return () => clearInterval(interval);
        }
        setDaysLeft(null);
    }, [plan, planExpiryDate]);

    const isTrial = plan === 'TRIAL';
    
    // Choose icon, text, and action based on the plan
    const { icon: PlanIcon, text, link, buttonText, className, isPaid } = useMemo(() => {
        switch (plan) {
            case 'TRIAL':
                return {
                    icon: MdFlashOn,
                    text: 'Trial Mode Active',
                    link: '/upgrade', 
                    buttonText: 'Upgrade Now',
                    className: styles.trialBanner,
                    isPaid: false,
                };
            case 'STARTER':
                return {
                    icon: MdStar,
                    text: 'Starter Plan Active',
                    link: '/admin/settings/billing', // Though we remove the button, keep link for safety
                    buttonText: null, // Button removed for paid plan as requested
                    className: styles.paidPlanBanner, // Use new glowing class
                    isPaid: true,
                };
            case 'PRO':
                return {
                    icon: MdStar,
                    text: 'Pro Plan Active',
                    link: '/admin/settings/billing', 
                    buttonText: null, // Button removed
                    className: styles.paidPlanBanner, // Use new glowing class
                    isPaid: true,
                };
            case 'NONE':
            default:
                return {
                    icon: MdFlashOn,
                    text: 'No Active Plan',
                    link: '/upgrade',
                    buttonText: 'Start Trial / Upgrade',
                    className: styles.freeBanner,
                    isPaid: false,
                };
        }
    }, [plan, daysLeft]);

    const renderContent = () => {
        // === RENDER FOR TRIAL MODE (Slogan, Countdown, Bar) ===
        if (isTrial && daysLeft !== null) {
            const progress = (daysLeft / 14) * 100;
            
            return (
                <div className={styles.trialContent}>
                    <div className={styles.trialSlogan}>Your 14-day trial has begun!</div>
                    <div className={styles.trialCountdown}>
                        <div className={styles.countdownValue}>{daysLeft}</div>
                        <div className={styles.countdownLabel}>DAYS LEFT</div>
                        <div className={styles.progressBar}>
                            <div 
                                className={styles.progressFill} 
                                style={{ width: `${progress > 100 ? 100 : progress}%` }} 
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // === RENDER FOR PAID/SUPERADMIN MODE (Simple Badge) ===
        return (
            <div className={styles.planContent}>
                <PlanIcon size={20} />
                <span>{text}</span>
                {/* 1 Year Remaining Alert for Paid Users */}
                {isPaid && daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                     <span className={styles.paidExpiryWarning}>
                        (Expires in {daysLeft} Days)
                     </span>
                )}
            </div>
        );
    };

    if (plan === 'NONE') return null; 

    return (
        <div className={`${styles.subscriptionBanner} ${className}`}>
            {renderContent()}
            {/* Upgrade Button sirf tab dikhega jab buttonText set ho (i.e., Trial/None) */}
            {buttonText && (
                <Link href={link} className={styles.upgradeButton}>
                    {buttonText}
                </Link>
            )}
        </div>
    );
};
// -------------------------------------------


// --- DashboardControlCenter Component (Main) ---
const DashboardControlCenter = () => {
    const { token, user } = useAuth(); 
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // REAL-TIME SUBSCRIPTION DATA from useAuth().user
    const subscriptionData: SubscriptionData = useMemo(() => {
        // === SuperAdmin Logic (Override) ===
        if (user && user.role === 'SuperAdmin') {
            // SuperAdmin को सिर्फ 'Starter Plan Active' दिखना चाहिए, भले ही database में 'PRO' हो
            return { plan: 'STARTER' as PlanType, planExpiryDate: null }; 
        }

        const plan = user?.plan as PlanType || 'NONE';
        const planExpiryDate = user?.planExpiryDate || null;
        
        return { plan, planExpiryDate };
    }, [user]);

    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningDismissed, setWarningDismissed] = useState(false);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);
    
    // FIX: closeWarningModal handler definition
    const closeWarningModal = () => {
        setShowWarningModal(false);
        localStorage.setItem('trialWarningDismissed', 'true');
        setWarningDismissed(true);
    };
    // ... (rest of the handlers remain unchanged) ...

    const handleFormSubmit = async () => {
        return new Promise<void>((resolve) => {
             console.log("Form submitted!");
             closeModal();
             resolve();
        });
    };

    const handleStudentSuccess = () => { console.log("Student added!"); closeModal(); }
    const handleTeacherSuccess = () => { console.log("Teacher added!"); closeModal(); }
    const handleParentSuccess = () => { console.log("Parent added!"); closeModal(); }
    const handleStaffSuccess = async (staffData: any) => { console.log("Staff potentially added/updated via API call inside AddStaffForm", staffData); closeModal(); return Promise.resolve(); }

    const getModalTitle = () => {
        switch (activeModal) {
            case 'add-student': return 'Add New Student';
            case 'add-teacher': return 'Add New Teacher';
            case 'add-parent': return 'Add New Parent';
            case 'add-staff': return 'Add New Staff';
            default: return 'New Entry';
        }
    };

    // Main Data Fetch (Dashboard Data)
    useEffect(() => {
        // ... (data fetching logic remains unchanged) ...
        const fetchData = async () => {
            if (!token) {
                setLoading(false);
                setError('Authentication token not found.');
                return;
            }
            try {
                setLoading(true);
                setError('');
                const response = await api.get<DashboardData>('/admin/dashboard-data');
                setData(response.data);
            } catch (err: any) {
                setError('Could not load dashboard data.');
                console.error("API fetch error:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        setWarningDismissed(localStorage.getItem('trialWarningDismissed') === 'true');
    }, [token]);

    // POP-UP LOGIC: Show warning if trial and <= 14 days left and not dismissed
    useEffect(() => {
        // ... (logic remains unchanged) ...
        if (subscriptionData.plan === 'TRIAL' && subscriptionData.planExpiryDate && !warningDismissed) {
            const end = new Date(subscriptionData.planExpiryDate).getTime();
            const now = new Date().getTime();
            const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 14 && daysLeft > 0) {
                if (!loading && !error) {
                    setShowWarningModal(true);
                }
            }
        }
    }, [subscriptionData, loading, error, warningDismissed]);


    if (loading) { return <div className={styles.message}>Loading Control Center...</div>; }
    if (error) { return <div className={`${styles.message} ${styles.error}`}>{error}</div>; }
    if (!data) { return <div className={styles.message}>No dashboard data available.</div>; }

    const getStudentClass = (student: RecentStudent) => student.class || student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: RecentTeacher) => teacher.subject || teacher.details?.subject || 'N/A';
    const getStaffRole = (staff: RecentStaff) => staff.role || staff.details?.role || 'N/A';

    return (
        <div className={styles.overviewContainer}>
            
            <div className={styles.headerRow}>
                <h1 className={styles.mainTitle}>School Control Center</h1>
                {user && (
                    <SubscriptionBanner 
                        plan={subscriptionData.plan} 
                        planExpiryDate={subscriptionData.planExpiryDate} 
                    />
                )}
            </div>

            <div className={styles.mainGrid}>
                {/* ... (All other Boxes remain unchanged) ... */}
                 {/* Chart Box */}
                <div className={`${styles.summaryBox} ${styles.chartBox}`}>
                     <div className={styles.boxHeader}><h2><MdAssessment/> Student Admissions</h2></div>
                     <div className={styles.chartContainer}>
                         <ResponsiveContainer width="100%" height={250}>
                             <BarChart data={data.admissionsData || []} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="name" fontSize={10} interval={0} />
                                 <YAxis fontSize={10} allowDecimals={false}/>
                                 <Tooltip wrapperStyle={{ fontSize: '12px' }}/>
                                 <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Students Box */}
                 <div className={styles.summaryBox}>
                     <div className={styles.boxHeader}><h2><MdPeople/> Students</h2><Link href="/admin/students" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                          {(data.recentStudents || []).map(s => <li key={s.id}><span>{s.name} ({getStudentClass(s)})</span></li>)}
                          {(data.recentStudents || []).length === 0 && <li className={styles.noRecent}>No recent students</li>}
                     </ul>
                     <div className={styles.boxFooter}><button onClick={() => openModal('add-student')} className={styles.addButton}><MdPersonAdd /> Add Student</button></div>
                 </div>

                 {/* Teachers Box */}
                 <div className={styles.summaryBox}>
                     <div className={styles.boxHeader}><h2><MdSchool/> Teachers</h2><Link href="/admin/teachers" className={styles.viewAllLink}>View All</Link></div>
                     <ul className={styles.recentList}>
                          {(data.recentTeachers || []).map(t => <li key={t.id}><span>{t.name}</span><span className={styles.subject}>{getTeacherSubject(t)}</span></li>)}
                          {(data.recentTeachers || []).length === 0 && <li className={styles.noRecent}>No recent teachers</li>}
                      </ul>
                      <div className={styles.boxFooter}><button onClick={() => openModal('add-teacher')} className={styles.addButton}><MdPersonAdd /> Add Teacher</button></div>
                  </div>
                 
                 {/* Fee Counter Box */}
                 <div className={styles.summaryBox}>
                     <div className={styles.boxHeader}><h2><MdAttachMoney/> Fee Counter</h2><Link href="/admin/fee-counter" className={styles.viewAllLink}>View All</Link></div>
                      <ul className={styles.recentList}>
                           {(data.recentFees || []).map(f => <li key={f.id}><span>{f.student}</span><span>{f.amount}</span></li>)}
                           {(data.recentFees || []).length === 0 && <li className={styles.noRecent}>No recent payments</li>}
                      </ul>
                      <div className={styles.boxFooter}><Link href="/admin/fee-counter/collection" className={styles.addButton}>Collect Fees</Link></div>
                 </div>

                 {/* Parents Box */}
                 <div className={styles.summaryBox}>
                     <div className={styles.boxHeader}><h2><MdFamilyRestroom/> Parents</h2><Link href="/admin/parents" className={styles.viewAllLink}>View All</Link></div>
                      <ul className={styles.recentList}>
                          {(data.recentParents || []).map(p => <li key={p.id}><span>{p.name}</span></li>)}
                          {(data.recentParents || []).length === 0 && <li className={styles.noRecent}>No recent parents</li>}
                      </ul>
                      <div className={styles.boxFooter}><button onClick={() => openModal('add-parent')} className={styles.addButton}><MdPersonAdd /> Add Parent</button></div>
                 </div>

                 /* Staff Box */
                 <div className={styles.summaryBox}>
                     <div className={styles.boxHeader}><h2><MdBadge/> Staff</h2><Link href="/admin/staff" className={styles.viewAllLink}>View All</Link></div>
                      <ul className={styles.recentList}>
                          {(data.recentStaff || []).map(s => <li key={s.id}><span>{s.name}</span><span className={styles.subject}>{getStaffRole(s)}</span></li>)}
                          {(data.recentStaff || []).length === 0 && <li className={styles.noRecent}>No recent staff</li>}
                      </ul>
                      <div className={styles.boxFooter}><button onClick={() => openModal('add-staff')} className={styles.addButton}><MdPersonAdd /> Add Staff</button></div>
                 </div>
            </div>
            
            {/* General Modals */}
            <Modal isOpen={!!activeModal} onClose={closeModal} title={getModalTitle()}>
                <>
                    {activeModal === 'add-student' && <AddStudentForm onClose={closeModal} onSuccess={handleStudentSuccess} />}
                    {activeModal === 'add-teacher' && <AddTeacherForm onClose={closeModal} onSubmit={handleTeacherSuccess} />}
                    {activeModal === 'add-parent' && <AddParentForm onClose={closeModal} onSubmit={handleParentSuccess} />}
                    {activeModal === 'add-staff' && <AddStaffForm onClose={closeModal} onSave={handleStaffSuccess} />}
                </>
            </Modal>

            {/* Trial Warning Modal (Shows if applicable) */}
            {subscriptionData.planExpiryDate && (
                <TrialWarningModal 
                    isOpen={showWarningModal} 
                    onClose={closeWarningModal} 
                    daysLeft={
                        Math.ceil((new Date(subscriptionData.planExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    } 
                />
            )}

        </div>
    );
};


// Main Page Component
const SchoolPage = () => {
    return (
        <div className={styles.schoolPageContainer}>
            <main className={styles.mainContent}>
                <DashboardControlCenter />
            </main>
        </div>
    );
};
export default SchoolPage;