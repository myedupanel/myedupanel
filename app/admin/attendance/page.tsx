import React from 'react';
import { redirect } from 'next/navigation';

// This page redirects to the student attendance page by default
export default function AttendancePage() {
  redirect('/admin/attendance/student');
}