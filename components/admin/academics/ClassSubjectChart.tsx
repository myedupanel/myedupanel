"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './ClassSubjectChart.module.scss';

const ClassSubjectChart = ({ data }: { data: any[] | undefined }) => {
    if (!data) return <div>Loading...</div>;
    return (
        <div className={styles.chartContainer}>
            <h3>Subject-wise Class Average</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="subject" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#f97316" barSize={20} radius={[0, 8, 8, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClassSubjectChart;
