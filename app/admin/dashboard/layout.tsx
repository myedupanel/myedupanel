import Sidebar from '@/components/layout/Sidebar/Sidebar';
import styles from './layout.module.scss';
// STEP 1: Main layout ke liye zaroori icons import karein
import { MdDashboard, MdSchool } from 'react-icons/md';

// STEP 2: Sirf main menu items ki list yahan define karein
const mainMenuItems = [
  { title: 'Dashboard', path: '/admin/dashboard', icon: <MdDashboard /> },
  { title: 'School', path: '/admin/school', icon: <MdSchool /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.container}>
      {/* STEP 3: Sidebar ko menu items ki list prop ke zariye dein */}
      <Sidebar menuItems={mainMenuItems} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}