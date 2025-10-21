"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AttendanceChart.module.scss';

// Dummy data for the week's attendance
const data = [
  { day: 'Mon', attendance: 88 },
  { day: 'Tue', attendance: 92 },
  { day: 'Wed', attendance: 95 },
  { day: 'Thu', attendance: 85 },
  { day: 'Fri', attendance: 91 },
  { day: 'Sat', attendance: 94 },
];

const AttendanceChart = () => {
  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Overall Attendance (%)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;