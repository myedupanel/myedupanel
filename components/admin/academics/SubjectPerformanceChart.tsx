"use client";
import React from 'react';
// Cell component ko import karein
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import styles from './Charts.module.scss';

// 1. Wahi color palette yahan bhi istemal karein
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const SubjectPerformanceChart = ({ data }: { data: any[] }) => (
  <div className={styles.chartContainer}>
    <h3>Overall Subject Performance</h3>
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="subject" tick={{ fontSize: 12 }} width={80} />
        <Tooltip wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
        
        {/* 2. Har bar ke liye alag color set karein */}
        <Bar dataKey="averageScore" barSize={25} radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default SubjectPerformanceChart;