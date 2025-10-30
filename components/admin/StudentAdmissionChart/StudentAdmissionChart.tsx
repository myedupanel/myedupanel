"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './StudentAdmissionChart.module.scss';

// Component ke props ka type define karein
interface ChartProps {
  data: {
    name: string;
    admissions: number;
    color: string; // Color property ab zaroori hai
  }[];
}

const StudentAdmissionChart = ({ data }: ChartProps) => {
  return (
    <div className={styles.chartWrapper}>
      <h3 className={styles.chartTitle}>Student Admission</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="admissions">
            {/* YEH LOGIC HAR BAR KO USKA APNA COLOR DETA HAI */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentAdmissionChart;