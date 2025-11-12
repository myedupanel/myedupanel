// lib/utils/academicYear.js
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma'; // Assuming your Prisma client is exported from here

const ACADEMIC_YEAR_COOKIE = 'activeAcademicYearId';

/**
 * Har request ke liye active academic year ID nikalta hai.
 * Pehle cookie check karta hai, agar nahi mila to default (isCurrent: true) nikalta hai.
 * @param {string} schoolId
 * @returns {Promise<number>} academicYearId
 */
export async function getAcademicYearContext(schoolId) {
  const cookieStore = cookies();
  const yearIdFromCookie = cookieStore.get(ACADEMIC_YEAR_COOKIE)?.value;

  if (yearIdFromCookie) {
    // 1. Agar cookie mein ID hai aur woh valid hai, toh use return karo
    const id = parseInt(yearIdFromCookie);
    if (!isNaN(id)) return id;
  }
  
  // 2. Agar cookie nahi hai ya invalid hai, toh DB se current year ID nikalo
  const currentYear = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { id: true },
  });

  if (currentYear) {
    // Agar DB mein current year mila, toh use cookie mein set karo aur return karo
    // Note: Cookie setting sirf API route ke NextResponse mein ho sakti hai.
    // Hum sirf ID return karenge aur API route se cookie set karwayenge.
    return currentYear.id;
  }

  // 3. Fallback: Agar school ka koi bhi year set nahi hai
  throw new Error("ACADEMIC_YEAR_NOT_FOUND: School must define at least one academic year.");
}

/**
 * Active academic year ID ko cookie mein set karta hai.
 */
export function setActiveAcademicYearCookie(yearId) {
  cookies().set(ACADEMIC_YEAR_COOKIE, yearId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

// Ye utility function har us API route mein use hoga jahan data filter karna hai.