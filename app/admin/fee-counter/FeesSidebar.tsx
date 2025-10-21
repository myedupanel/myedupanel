"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Hum aapke purane sidebar ki styling hi yahan istemal karenge
import '../../../components/layout/Sidebar/Sidebar.scss'; 
import { 
  MdDashboard, 
  MdReceipt,
  MdFileUpload,
  MdPayment,
  MdArrowBack,
  MdListAlt // <-- 1. Naya icon import kiya
} from 'react-icons/md';

const feeMenuItems = [
  {
    title: 'Fee Dashboard',
    path: '/admin/fee-counter/fee-dashboard',
    icon: <MdDashboard />,
  },
  {
    title: 'Assign Fee',
    path: '/admin/fee-counter/assign',
    icon: <MdReceipt />,
  },
  // --- 2. YEH NAYA LINK ADD KIYA GAYA HAI ---
  {
    title: 'Fee Templates',
    path: '/admin/fee-counter/templates',
    icon: <MdListAlt />,
  },
  {
    title: 'Import/Export',
    path: '/admin/fee-counter/fee-import-export',
    icon: <MdFileUpload />,
  },
  {
    title: 'Fee Collection',
    path: '/admin/fee-counter/collection',
    icon: <MdPayment />,
  },
  {
    title: 'Go to Main Dashboard',
    path: '/admin/dashboard',
    icon: <MdArrowBack />,
    isExternal: true,
  },
];

const FeesSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="sidebar-container">
      <div className="logo-section">
        <Link href="/admin/fee-counter/fee-dashboard">
          <h2>Fees Counter</h2>
        </Link>
      </div>
      <nav className="menu-section">
        <ul>
          {feeMenuItems.map((item) => (
            <li
              key={item.path}
              className={`menu-item ${pathname === item.path && !item.isExternal ? 'active' : ''}`}
            >
              <Link href={item.path}>
                <span className="icon">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default FeesSidebar;