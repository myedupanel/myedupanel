// app/api/admin/switch-year/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * POST: Switch to a different academic year
 * Sets the cookie and updates backend
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { yearId, setAsDefault } = body;

    if (!yearId) {
      return NextResponse.json({ error: 'Year ID is required' }, { status: 400 });
    }

    // If setAsDefault is true, update the current year in the database
    if (setAsDefault) {
      const response = await fetch(`${BACKEND_URL}/api/academic-years/set-current`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yearId: parseInt(yearId) }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Failed to set current year' }, { status: response.status });
      }
    }

    // Set the cookie for the selected year (valid for 30 days)
    const response = NextResponse.json({ 
      success: true, 
      message: 'Academic year switched successfully',
      yearId: parseInt(yearId)
    });

    response.cookies.set('academicYearId', yearId.toString(), {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Switch Year Error:', error);
    return NextResponse.json({ error: 'Failed to switch academic year.' }, { status: 500 });
  }
}
