"use client";
import React from 'react';
// Cell component ko import karein
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import styles from './Charts.module.scss';

// 1. Ek sundar color palette banayein
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const ClassPerformanceChart = ({ data }: { data: any[] }) => (
  <div className={styles.chartContainer}>
    <h3>Class Performance Comparison</h3>
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
        
        {/* 2. Har bar ke liye alag color set karein */}
        <Bar dataKey="averageScore" barSize={40} radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default ClassPerformanceChart;