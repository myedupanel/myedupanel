"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo, useCallback added
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
    MdClass, MdFlashOn, MdStar // MdFlashOn, MdStar added for icons
} from 'react-icons/md';
import Modal from '@/components/common/Modal/Modal';
import AddStudentForm from '@/components/admin/AddStudentForm/AddStudentForm';
import AddTeacherForm from '@/components/admin/AddTeacherForm/AddTeacherForm';
import AddParentForm from '@/components/admin/AddParentForm/AddParentForm';
import AddStaffForm from '@/components/admin/AddStaffForm/AddStaffForm';
import api from '@/backend/utils/api';


// === FIX 1: Missing TypeScript Interfaces ===
// (Previous Interfaces remain unchanged)
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
// === NEW: Subscription Interface and Data Simulation ===
type PlanType = 'TRIAL' | 'STARTER' | 'PRO' | 'FREE';

interface SubscriptionData {
    plan: PlanType;
    trialEndDate: string | null; // ISO Date string for trial end
}

// Simulating the backend data fetch for subscription
const getSimulatedSubscriptionData = (): SubscriptionData => {
    const today = new Date();
    const trialEnd = new Date(today);
    // Setting trial to end 10 days from now for testing the countdown
    trialEnd.setDate(today.getDate() + 10); 
    
    // You can change 'TRIAL' to 'STARTER' or 'PRO' to test
    return {
        plan: 'TRIAL', 
        trialEndDate: trialEnd.toISOString(),
    };
};
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

// --- NEW COMPONENT: TrialWarningModal ---
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
            // Adding a class for disposable pop-up styling
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
                    <Link href="/pricing" className={styles.upgradeLinkButton}>
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


// --- NEW COMPONENT: SubscriptionBanner ---
interface SubscriptionBannerProps {
    subscription: SubscriptionData;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ subscription }) => {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    // Calculate days left and update every second
    useEffect(() => {
        if (subscription.plan === 'TRIAL' && subscription.trialEndDate) {
            const calculateDays = () => {
                const now = new Date().getTime();
                const end = new Date(subscription.trialEndDate!).getTime();
                const diffTime = end - now;
                
                // Convert milliseconds to days and round up to show full days remaining
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                setDaysLeft(diffDays > 0 ? diffDays : 0);
            };

            calculateDays(); // Initial calculation
            const interval = setInterval(calculateDays, 60000); // Update every minute (60000ms)

            return () => clearInterval(interval);
        }
        setDaysLeft(null); // Reset for non-trial plans
    }, [subscription]);

    const isTrial = subscription.plan === 'TRIAL';
    
    // Choose icon, text, and action based on the plan
    const { icon: PlanIcon, text, link, buttonText, className } = useMemo(() => {
        switch (subscription.plan) {
            case 'TRIAL':
                const text = daysLeft !== null ? `${daysLeft} days left` : 'Trial Mode';
                return {
                    icon: MdFlashOn,
                    text: text,
                    link: '/pricing',
                    buttonText: 'Upgrade Now',
                    className: styles.trialBanner,
                };
            case 'STARTER':
                return {
                    icon: MdStar,
                    text: 'Starter Plan',
                    link: '/admin/settings/billing',
                    buttonText: 'Manage Plan',
                    className: styles.starterBanner,
                };
            case 'PRO':
                return {
                    icon: MdStar,
                    text: 'Pro Plan',
                    link: '/admin/settings/billing',
                    buttonText: 'Manage Plan',
                    className: styles.proBanner,
                };
            default: // e.g., FREE
                return {
                    icon: MdFlashOn,
                    text: 'Free Plan',
                    link: '/pricing',
                    buttonText: 'Upgrade Now',
                    className: styles.freeBanner,
                };
        }
    }, [subscription.plan, daysLeft]);

    // Render the countdown animation for trial users
    const renderContent = () => {
        if (isTrial && daysLeft !== null) {
            // Animation is handled by the 'trialCountdown' class in SCSS
            const progress = (daysLeft / 14) * 100; // Assuming a max of 14-day trial for progress bar
            
            return (
                <div className={styles.trialContent}>
                    <div className={styles.countdownValue}>{daysLeft}</div>
                    <div className={styles.countdownLabel}>DAYS LEFT</div>
                    <div className={styles.progressBar}>
                        {/* Inline style for the professional animated countdown bar */}
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.planContent}>
                <PlanIcon size={20} />
                <span>{text}</span>
            </div>
        );
    };

    if (!text) return null;

    return (
        <div className={`${styles.subscriptionBanner} ${className}`}>
            {renderContent()}
            <Link href={link} className={styles.upgradeButton}>
                {buttonText}
            </Link>
        </div>
    );
};
// -------------------------------------------


// --- DashboardControlCenter Component (Main) ---
const DashboardControlCenter = () => {
    const { token } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // NEW STATE: Subscription and Warning
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>(getSimulatedSubscriptionData);
    const [showWarningModal, setShowWarningModal] = useState(false);
    // Use localStorage to track if the user has dismissed the warning
    const [warningDismissed, setWarningDismissed] = useState(false);

    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);
    
    // NEW HANDLERS
    const closeWarningModal = () => {
        setShowWarningModal(false);
        // Persist the dismissal in localStorage
        localStorage.setItem('trialWarningDismissed', 'true');
        setWarningDismissed(true);
    };


    const handleFormSubmit = async () => {
        // ... (handleFormSubmit logic remains unchanged) ...
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

    // Main Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            // ... (Authentication check remains unchanged) ...
            if (!token) {
                setLoading(false);
                setError('Authentication token not found.');
                return;
            }
            try {
                setLoading(true);
                setError('');
                // Fetch Dashboard Data
                const response = await api.get<DashboardData>('/admin/dashboard-data');
                setData(response.data);
                
                // FIX: Here you would ideally fetch the REAL subscription data
                // For now, we keep the simulated data
                setSubscriptionData(getSimulatedSubscriptionData()); 

            } catch (err: any) {
                setError('Could not load dashboard data.');
                console.error("API fetch error:", err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // Check dismissal status on mount
        setWarningDismissed(localStorage.getItem('trialWarningDismissed') === 'true');
    }, [token]);

    // POP-UP LOGIC: Show warning if trial and <= 14 days left and not dismissed
    useEffect(() => {
        if (subscriptionData.plan === 'TRIAL' && subscriptionData.trialEndDate && !warningDismissed) {
            const end = new Date(subscriptionData.trialEndDate).getTime();
            const now = new Date().getTime();
            // Calculate days left (rounded up)
            const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
            
            // Show pop-up if 14 days or less remain
            if (daysLeft <= 14 && daysLeft > 0) {
                // Wait for data loading to complete before showing the modal
                if (!loading && !error) {
                    setShowWarningModal(true);
                }
            }
        }
    }, [subscriptionData, loading, error, warningDismissed]);


    if (loading) { return <div className={styles.message}>Loading Control Center...</div>; }
    if (error) { return <div className={`${styles.message} ${styles.error}`}>{error}</div>; }
    if (!data) { return <div className={styles.message}>No dashboard data available.</div>; }

    // === FIX 2: Implicit 'any' errors ke liye typing add ki ===
    const getStudentClass = (student: RecentStudent) => student.class || student.details?.class || 'N/A';
    const getTeacherSubject = (teacher: RecentTeacher) => teacher.subject || teacher.details?.subject || 'N/A';
    const getStaffRole = (staff: RecentStaff) => staff.role || staff.details?.role || 'N/A';
    // =========================================================

    return (
        <div className={styles.overviewContainer}>
            
            {/* === NEW FIX/FEATURE: Title and Subscription Banner === */}
            <div className={styles.headerRow}>
                <h1 className={styles.mainTitle}>School Control Center</h1>
                {/* Subscription Banner Component Integration */}
                <SubscriptionBanner subscription={subscriptionData} />
            </div>
            {/* ==================================================== */}

            <div className={styles.mainGrid}>
                {/* ... (Chart Box and other summary boxes remain unchanged) ... */}
                
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

                 {/* Staff Box */}
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

            {/* Trial Warning Modal (NEW) */}
            <TrialWarningModal 
                isOpen={showWarningModal} 
                onClose={closeWarningModal} 
                daysLeft={
                    // Recalculating days left for the modal content based on current time
                    Math.ceil((new Date(subscriptionData.trialEndDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                } 
            />

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