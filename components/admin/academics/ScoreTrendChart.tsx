"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './ScoreTrendChart.module.scss';

// Component ab 'data' prop lega
const ScoreTrendChart = ({ data }: { data: any[] | undefined }) => {
  if (!data) {
    return <div className={styles.chartContainer}>Loading chart...</div>;
  }

  return (
    <div className={styles.chartContainer}>
      <h3>Score Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          {/* Chart ka baaki ka structure waise hi rahega */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreTrendChart;