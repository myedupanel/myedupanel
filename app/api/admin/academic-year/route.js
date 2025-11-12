// app/api/admin/academic-year/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * GET: Fetch all academic years for the school
 */
export async function GET(request) {
  try {
    // Get auth token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/academic-years`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch years' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET Academic Years Error:', error);
    return NextResponse.json({ error: 'Failed to fetch academic years.' }, { status: 500 });
  }
}

/**
 * POST: Create a new academic year
 */
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/academic-years`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to create year' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST Create Academic Year Error:', error);
    return NextResponse.json({ error: 'Failed to create academic year.' }, { status: 500 });
  }
}