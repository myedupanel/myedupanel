"use client";
import React from 'react';
import styles from './FeesTable.module.scss';

interface Transaction {
  id: string; name: string; class: string; amount: string; status: 'Paid' | 'Pending'; date: string;
}

interface FeesTableProps {
  transactions: Transaction[];
  onViewClick: (transaction: Transaction) => void;
}

const FeesTable = ({ transactions, onViewClick }: FeesTableProps) => {
  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3>All Transactions</h3>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Student Name</th>
            <th>Class</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tr) => (
            <tr key={tr.id}>
              <td>{tr.id}</td>
              <td>{tr.name}</td>
              <td>{tr.class}</td>
              <td>{tr.amount}</td>
              <td>
                <span className={`${styles.status} ${styles[tr.status.toLowerCase()]}`}>
                  {tr.status}
                </span>
              </td>
              <td>{tr.date}</td>
              <td className={styles.actions}>
                <button onClick={() => onViewClick(tr)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeesTable;