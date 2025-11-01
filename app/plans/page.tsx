import React from 'react';
import styles from './PlansPage.module.scss'; // Hum yeh file agle kadam mein banayenge
import { FiCheck } from 'react-icons/fi'; // Checkmark icon ke liye

// 1. Plan interface (No Change)
interface Plan {
  name: string;
  price: number;
  perks: string[];
  isPopular?: boolean;
}

// 2. Dummy data (No Change)
const plansData: Plan[] = [
  {
    name: 'Starter',
    price: 0,
    perks: [
      'Manage up to 50 students',
      'Basic Fee Collection',
      'Attendance Tracking',
      'Limited Support',
    ],
  },
  {
    name: 'Plus',
    price: 4999,
    perks: [
      'Unlimited Student Management',
      'Complete Admin Dashboard',
      'Fee Management & Online Payment',
      'Attendance Tracking',
      'Parent & Student Login Portals',
    ],
    isPopular: true,
  },
  {
    name: 'Pro',
    price: 9999,
    perks: [
      'All features in Plus',
      'Advanced Timetable Management',
      'Custom Report Generation',
      '24/7 Customer Support',
      'Dedicated Account Manager',
    ],
  },
];

const PlansPage = () => {
  return (
    <div className={styles.plansPageContainer}>
      <header className={styles.header}>
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that's right for your school.</p>
      </header>

      <main className={styles.plansGrid}>
        {plansData.map((plan) => (
          // --- YAHAN BADLAAV KIYA GAYA HAI ---
          // Ab hum poora card build kar rahe hain
          <div 
            key={plan.name} 
            // Agar plan popular hai, toh ek extra class add karein
            className={`${styles.planCard} ${plan.isPopular ? styles.popular : ''}`}
          >
            {/* Popular badge */}
            {plan.isPopular && (
              <div className={styles.popularBadge}>POPULAR</div>
            )}
            
            {/* Plan ka Naam */}
            <h3 className={styles.planName}>{plan.name}</h3>
            
            {/* Plan ki Price */}
            <div className={styles.planPrice}>
              {plan.price === 0 ? (
                'Free'
              ) : (
                `₹${plan.price.toLocaleString('en-IN')}` // Format price (e.g., 4,999)
              )}
              <span>{plan.price > 0 ? '/ per year' : ''}</span>
            </div>
            
            {/* Plan ke Features (Perks) */}
            <ul className={styles.perksList}>
              {plan.perks.map((perk, index) => (
                <li key={index}>
                  <FiCheck className={styles.perkIcon} />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            
            {/* Button */}
            <button className={styles.ctaButton}>
              {plan.price === 0 ? 'Get Started' : 'Grab Now Deal'}
            </button>
          </div>
          // --- END BADLAAV ---
        ))}
      </main>
    </div>
  );
};

export default PlansPage;