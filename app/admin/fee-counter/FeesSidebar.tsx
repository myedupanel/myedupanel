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
  MdListAlt,
  // MdClass // <-- 1. 'MdClass' icon import HATA diya
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
  {
    title: 'Fee Templates',
    path: '/admin/fee-counter/templates',
    icon: <MdListAlt />,
  },
  
  // --- 2. "Manage Classes" waala block yahaan se HATA diya gaya hai ---
  // {
  //   title: 'Manage Classes',
  //   path: '/admin/fee-counter/classes',
  //   icon: <MdClass />,
  // },
  // --- END ---

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
    title: 'Go to Dashboard',
    path: '/admin/school', // Path update kiya dashboard ke liye
    icon: <MdArrowBack />,
    isExternal: true, // Yeh link alag section mein rahega
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
              // Active state check update kiya gaya hai
              className={`menu-item ${pathname.startsWith(item.path) && !item.isExternal ? 'active' : ''}`} 
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