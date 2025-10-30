"use client";
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './SubjectMasteryChart.module.scss';

// --- Step 1: Define the structure of the data we expect ---
interface SubjectData {
  subject: string;
  score: number;
  fullMark?: number; // Optional: Max score for the subject
}

// --- Step 2: Define the props for the component ---
interface SubjectMasteryChartProps {
  data: SubjectData[];
}

// --- Step 3: Update the component to accept 'data' as a prop ---
const SubjectMasteryChart: React.FC<SubjectMasteryChartProps> = ({ data }) => {
  // --- Step 4: Remove the hardcoded sample data ---
  // const masteryData = [ ... ]; // This is no longer needed

  return (
    <div className={styles.chartContainer}>
      <h3>Subject Mastery</h3>
      <ResponsiveContainer width="100%" height={300}>
        {/* --- Step 5: Use the 'data' prop here --- */}
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          {/* Domain set to 0-100, assuming scores are percentages */}
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
             contentStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          />
          <Radar
            name="Performance"
            dataKey="score"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.6}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectMasteryChart;