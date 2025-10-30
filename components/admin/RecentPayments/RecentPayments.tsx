import React from 'react';
import styles from './RecentPayments.module.scss';

// Define the shape of a single payment
interface Payment {
  id?: string; // Add id if it comes from backend
  student: string; // Assuming 'student' holds the name
  amount: string;
  date?: string; // Add other fields if needed
  status?: 'Paid' | 'Pending'; // Example status
}

// The component expects a prop named 'payments' which is an array of Payment objects
interface RecentPaymentsProps {
  payments: Payment[];
}

const RecentPayments = ({ payments }: RecentPaymentsProps) => {

  // Function to get the first letter for the avatar, WITH SAFETY CHECK
  const getInitials = (name: string | undefined | null): string => {
    // Check if name exists and is a non-empty string
    if (name && typeof name === 'string' && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    // Return a default initial if name is invalid
    return '?';
  };

  // --- Helper function to format date (Optional but good practice) ---
  const formatDate = (dateString: string | undefined): string => {
      if (!dateString) return 'No Date';
      try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {
          return 'Invalid Date';
      }
  };


  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recent Payments</h3>
      <ul className={styles.paymentList}>
        {/* Check if payments array exists and has items */}
        {payments && payments.length > 0 ? (
          payments.map((payment) => ( // Use payment.id if available for a more stable key
            <li key={payment.id || Math.random()} className={styles.paymentItem}>
              {/* --- UPDATE: Use payment.student for name --- */}
              <div className={styles.avatar}>{getInitials(payment.student)}</div>
              <div className={styles.paymentDetails}>
                <span className={styles.name}>{payment.student || 'Unknown Student'}</span>
                {/* --- UPDATE: Use formatDate helper --- */}
                <span className={styles.date}>{formatDate(payment.date)}</span>
              </div>
              <div className={styles.paymentAmount}>
                <span className={styles.amount}>{payment.amount || 'N/A'}</span>
                {/* Status display logic might need adjustment based on actual data */}
                {payment.status && (
                    <span className={`${styles.status} ${styles[payment.status.toLowerCase()]}`}>
                        {payment.status}
                    </span>
                )}
              </div>
            </li>
          ))
        ) : (
          // Display a message if there are no payments
          <li className={styles.noPayments}>No recent payments found.</li>
        )}
      </ul>
    </div>
  );
};

export default RecentPayments;