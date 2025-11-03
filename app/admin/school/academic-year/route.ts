// File: app/api/school/academic-year/route.ts

import { NextResponse } from "next/server";
// --- YEH IMPORT FIX KIYA GAYA HAI ---
// Classes aur FeeTemplate ko yahaan se import nahi karna chahiye
import { Prisma, PrismaClient } from "@prisma/client";
// -----------------------------------

// Naye types define karne ke liye, hum use karenge:
type PrismaClassesType = Prisma.ClassesGetPayload<{}>;
type PrismaFeeTemplateType = Prisma.FeeTemplateGetPayload<{}>;


const prisma = new PrismaClient();

/**
 * Naya Academic Saal Banane ke liye (POST)
 */
export async function POST(req: Request) {
  try {
    // TODO 1: Session se user aur schoolId nikaalein
    // ... (session logic yahaan)
    
    // !! IMPORTANT: Isse apne actual logic se replace karein !!
    const schoolId = "clerk_id_ya_aapki_school_id"; 

    // Frontend se bheja hua data (form data)
    const body = await req.json();
    const { name, startDate, endDate, templateYearId } = body; 

    if (!name || !startDate || !endDate) {
      return new NextResponse("Name, Start Date, aur End Date zaroori hain", { status: 400 });
    }

    // --- Saara logic ab ek Transaction ke andar chalega ---
    // (tx ka type Prisma.TransactionClient bilkul sahi hai)
    const newAcademicYear = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
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
        // NOTE: academicYearId ki jagah classId use ho raha tha purane code mein
        const oldClasses = await tx.classes.findMany({
          where: { academicYearId: templateYearId, schoolId: schoolId }
        });

        if (oldClasses.length > 0) {
          
          // FIX: Type ko Prisma.ClassesGetPayload<{}> use kiya
          const classesToCreate = oldClasses.map((c: PrismaClassesType) => ({
            class_name: c.class_name,
            schoolId: schoolId,
            academicYearId: year.id 
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
          
          // FIX: Type ko Prisma.FeeTemplateGetPayload<{}> use kiya
          const templatesToCreate = oldFeeTemplates.map((t: PrismaFeeTemplateType) => ({
            name: t.name,
            description: t.description,
            items: t.items as any, // 'as any' JSON ke liye zaroori hai
            totalAmount: t.totalAmount,
            schoolId: schoolId,
            academicYearId: year.id 
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

    return NextResponse.json(newAcademicYear, { status: 201 }); 

  } catch (error: any) {
    console.error("[ACADEMIC_YEAR_POST]", error);

    // 300-din wale specific error ko pakadna
    if (error.message.startsWith("300_DAY_LIMIT:")) {
      const userMessage = error.message.split(":")[1]; 
      return new NextResponse(userMessage, { status: 403 }); 
    }
    
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
    // ... (session logic yahaan)

    // !! IMPORTANT: Isse apne actual logic se replace karein !!
    const schoolId = "clerk_id_ya_aapki_school_id";

    // Database se saare saal fetch karein, sabse naya upar
    const academicYears = await prisma.academicYear.findMany({
      where: {
        schoolId: schoolId,
      },
      orderBy: {
        createdAt: 'desc', 
      },
    });

    return NextResponse.json(academicYears);

  } catch (error) {
    console.error("[ACADEMIC_YEAR_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}