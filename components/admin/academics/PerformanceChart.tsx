"use client"; 
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Charts.module.scss';

const data = [
  { subject: 'Maths', performance: 85 },
  { subject: 'Science', performance: 92 },
  { subject: 'English', performance: 78 },
  { subject: 'History', performance: 81 },
  { subject: 'Art', performance: 75 },
];

const PerformanceChart = () => {
  return (
    <div className={styles.chartContainer}>
      <h4>Subject-wise Performance</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="subject" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip cursor={{fill: 'rgba(240, 249, 255, 0.5)'}}/>
          <Bar dataKey="performance" fill="#0ea5e9" barSize={30} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
