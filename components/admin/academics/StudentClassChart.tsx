// components/admin/StudentClassChart/StudentClassChart.tsx
"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './StudentClassChart.module.scss'; // Create this SCSS file

// Component expects data in this format
interface ChartProps {
  data: {
    name: string; // Class Name
    count: number; // Student Count
    color: string; // Pre-assigned color
  }[];
}

const StudentClassChart = ({ data }: ChartProps) => {
  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.chartTitle}>Students by Class</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {/* Use name (Class Name) for X-axis */}
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} // Light blue hover
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          {/* Use 'count' (Student Count) for Legend and Bar */}
          <Legend />
          <Bar dataKey="count" name="Students"> {/* Set bar name for legend */}
            {/* Apply pre-assigned color to each bar */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentClassChart;