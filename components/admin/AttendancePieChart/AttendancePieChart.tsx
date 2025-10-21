"use client";
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AttendancePieChart.module.scss';

const COLORS = ['#2ecc71', '#e74c3c', '#f1c40f'];

// Naya interface: Batata hai ki component ko kaisa data milega
interface ChartProps {
  data: { name: string; value: number }[];
}

const AttendancePieChart = ({ data }: ChartProps) => {
  // Check karein ki data mein kuch hai ya nahi
  const hasData = data.some(item => item.value > 0);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.title}>Today's Attendance Summary (Overall)</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.noDataMessage}>No attendance marked for today.</p>
      )}
    </div>
  );
};

export default AttendancePieChart;