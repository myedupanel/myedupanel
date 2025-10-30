// components/admin/academics/PerformanceChart.tsx

"use client"; 
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Charts.module.scss';

// 1. Parent component se mila 'PerformanceData' interface.
interface PerformanceData {
  subject: string;
  average: number; // API se 'average' aa raha hai, 'performance' nahi
}

// 2. Component ke props ka type define karein
interface PerformanceChartProps {
  data: PerformanceData[]; // Hum 'data' naam ka ek prop receive karenge
}

// 3. Dummy 'data' array yahaan se delete kar diya gaya hai

// 4. Component ab 'data' ko prop ke roop mein receive kar raha hai
const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <div className={styles.chartContainer}>
      <h4>Subject-wise Performance</h4>

      {/* 5. Check karein ki 'data' array mein kuch hai ya nahi */}
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data} // 6. Yahaan dummy data ki jagah real 'data' prop use karein
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="subject" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'rgba(240, 249, 255, 0.5)'}}/>
            
            {/* 7. 'dataKey' ko "performance" se "average" mein badlein */}
            <Bar dataKey="average" fill="#0ea5e9" barSize={30} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        // 8. Agar koi data na ho toh yeh message dikhayein
        <div className={styles.emptyChartMessage}>
          No performance data available yet.
        </div>
      )}
    </div>
  );
};

export default PerformanceChart;