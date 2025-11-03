// File: app/api/school/academic-year/route.ts

import { NextResponse } from "next/server";
// --- YEH RAHA BADLAAV 1 ---
import { Prisma, PrismaClient } from "@prisma/client";
// -------------------------

// Aapka session/auth helper yahaan import karein (e.g., getAuthSession)
// import { getAuthSession } from "@/lib/auth"; 

const prisma = new PrismaClient();

/**
 * Naya Academic Saal Banane ke liye (POST)
 */
export async function POST(req: Request) {
  try {
    // TODO 1: Session se user aur schoolId nikaalein
    // const session = await getAuthSession();
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    // const schoolId = session.user.schoolId;
    
    // Abhi ke liye, hum schoolId ko hardcode kar sakte hain (testing ke liye)
    // !! IMPORTANT: Isse apne actual logic se replace karein !!
    const schoolId = "clerk_id_ya_aapki_school_id"; 

    // Frontend se bheja hua data (form data)
    const body = await req.json();
    const { name, startDate, endDate, templateYearId } = body; // templateYearId woh ID hai jisse copy karna hai

    if (!name || !startDate || !endDate) {
      return new NextResponse("Name, Start Date, aur End Date zaroori hain", { status: 400 });
    }

    // --- Saara logic ab ek Transaction ke andar chalega ---
    
    // --- YEH RAHA BADLAAV 2 ---
    const newAcademicYear = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // -------------------------
      
      // --- AAPKA BUSINESS RULE 1: 300-Din ka Limit ---
      const latestYear = await tx.academicYear.findFirst({
        where: { schoolId: schoolId },
        orderBy: { createdAt: 'desc' }, 
      });

      if (latestYear) {
        const today = new Date();
        const latestYearDate = new Date(latestYear.createdAt);
        const diffTime = Math.abs(today.getTime() - latestYearDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 300) { 
          // Transaction se bahar nikalne ke liye 'throw' ka istemaal karte hain
          throw new Error(`300_DAY_LIMIT:Pichla saal ${diffDays} din pehle hi add kiya gaya tha.`);
        }
      }

      console.log("300-din ka check paas ho gaya.");

      // Naya saal banane se pehle, baaki saare saal ko 'isCurrent = false' set karein
      await tx.academicYear.updateMany({
          where: { schoolId: schoolId },
          data: { isCurrent: false },
      });

      // Ab naya saal banayein
      const year = await tx.academicYear.create({
        data: {
          name: name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isCurrent: true, 
          school: { connect: { id: schoolId } },
        },
      });
      
      console.log("Naya academic saal ban gaya:", year.id);

      // --- AAPKA BUSINESS RULE 2: Template se Data Clone Karna ---
      if (templateYearId) {
        console.log(`Cloning shuru karni hai... template se: ${templateYearId}`);

        // 1. Classes ko Clone karna
        const oldClasses = await tx.classes.findMany({
          where: { academicYearId: templateYearId, schoolId: schoolId }
        });

        if (oldClasses.length > 0) {
          // Nayi classes ka data taiyaar karna
          const classesToCreate = oldClasses.map(c => ({
            class_name: c.class_name,
            schoolId: schoolId,
            academicYearId: year.id // Naye saal ki ID se link karna
          }));
          
          await tx.classes.createMany({
            data: classesToCreate
          });
          console.log(`${classesToCreate.length} classes clone ho gayin.`);
        }

        // 2. Fee Templates ko Clone karna
        const oldFeeTemplates = await tx.feeTemplate.findMany({
          where: { academicYearId: templateYearId, schoolId: schoolId }
        });

        if (oldFeeTemplates.length > 0) {
          // Naye templates ka data taiyaar karna
          const templatesToCreate = oldFeeTemplates.map(t => ({
            name: t.name,
            description: t.description,
            // --- YEH RAHA FIX (Pichla wala) ---
            items: t.items as any, // Cast to 'any' to bypass TS/Prisma type mismatch
            // --- FIX ENDS ---
            totalAmount: t.totalAmount,
            schoolId: schoolId,
            academicYearId: year.id // Naye saal ki ID se link karna
          }));

          await tx.feeTemplate.createMany({
            data: templatesToCreate
          });
          console.log(`${templatesToCreate.length} fee templates clone ho gaye.`);
        }
      }
      
      // Transaction se naya saal return karna
      return year;
    });

    // Agar sab kuch theek raha, toh naya saal return karein
    return NextResponse.json(newAcademicYear, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error("[ACADEMIC_YEAR_POST]", error);

    // 300-din wale specific error ko pakadna
    if (error.message.startsWith("300_DAY_LIMIT:")) {
      const userMessage = error.message.split(":")[1]; // Error message nikalna
      return new NextResponse(userMessage, { status: 403 }); // 403 Forbidden
    }
    
    // Baaki sab errors ke liye
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


/**
 * School ke saare Academic Years paane ke liye (GET)
 * (Frontend par dropdown ke liye)
 */
export async function GET(req: Request) {
  try {
    // TODO: Session se user aur schoolId nikaalein
    // const session = await getAuthSession();
    // if (!session?.user) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    // const schoolId = session.user.schoolId;

    // !! IMPORTANT: Isse apne actual logic se replace karein !!
    const schoolId = "clerk_id_ya_aapki_school_id";

    // Database se saare saal fetch karein, sabse naya upar
    const academicYears = await prisma.academicYear.findMany({
      where: {
        schoolId: schoolId,
      },
      orderBy: {
        createdAt: 'desc', // Sabse naya (ya 'startDate') sabse upar
      },
    });

    return NextResponse.json(academicYears);

  } catch (error) {
    console.error("[ACADEMIC_YEAR_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}