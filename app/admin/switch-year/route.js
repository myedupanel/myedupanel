// app/api/admin/switch-year/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@/backend/middleware/auth';
import { setActiveYear } from '@/backend/services/AcademicYearService';
import { setActiveAcademicYearCookie } from '@/lib/utils/academicYear';

// POST: User ke liye selected year ID ko cookie mein set karna
export async function POST(request) {
  try {
    const auth = await getAuth(request);
    if (!auth.schoolId) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const body = await request.json();
    const { newAcademicYearId, setAsDefault } = body; // setAsDefault option: DB mein isCurrent ko update karna

    if (!newAcademicYearId) {
      return NextResponse.json({ error: 'Missing newAcademicYearId.' }, { status: 400 });
    }
    
    const newYearId = parseInt(newAcademicYearId);

    // Step 1: Agar admin chahta hai to DB mein bhi default year update karo
    if (setAsDefault) {
      await setActiveYear(auth.schoolId, newYearId);
    }

    // Step 2: Cookie set karo (User ke session ke liye zaroori)
    setActiveAcademicYearCookie(newYearId);

    // Step 3: Response return karo
    return NextResponse.json({ 
      success: true, 
      message: `Academic year successfully switched to ID ${newYearId}.` 
    });

  } catch (error) {
    console.error("POST Switch Year Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to switch academic year context.' }, { status: 500 });
  }
}