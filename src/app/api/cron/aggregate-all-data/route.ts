import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAiSummariesCollection } from "@/lib/mongodb";
import { format, subDays } from "date-fns";
import { revalidatePath } from "next/cache";

export const maxDuration = 300; // Allow 5 minutes for cron job

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting Comprehensive AI Data Aggregation...");
    
    const collection = await getAiSummariesCollection();
    const currentDate = new Date();
    const generatedAt = currentDate.toISOString();
    
    // 1. Clean up old data (keep last 7 days)
    const sevenDaysAgo = subDays(currentDate, 7).toISOString();
    await collection.deleteMany({ generatedAt: { $lt: sevenDaysAgo } });
    console.log("[CRON] Cleaned up old AI summaries.");

    const ops: any[] = [];
    
    // --- 1. GLOBAL (MINISTRY) STATS ---
    const totalStudentsGlobal = await prisma.student.count();
    
    const thirtyDaysAgo = subDays(currentDate, 30);
    const globalBookings = await prisma.booking.findMany({
       where: { booking_created_at: { gte: thirtyDaysAgo } },
       select: { booking_status: true, problemCategory: { select: { problem_category_name_th: true } } }
    });
    
    const statusCount = (bks: typeof globalBookings) => {
       return bks.reduce((acc, b) => {
          acc[b.booking_status] = (acc[b.booking_status] || 0) + 1;
          return acc;
       }, {} as Record<string, number>);
    };

    const categoriesCount = (bks: typeof globalBookings) => {
       const counts: Record<string, number> = {};
       bks.forEach(b => {
          if (b.problemCategory?.problem_category_name_th) {
             counts[b.problemCategory.problem_category_name_th] = (counts[b.problemCategory.problem_category_name_th] || 0) + 1;
          }
       });
       return Object.entries(counts).map(([category, count]) => ({ category, count })).sort((a,b) => b.count - a.count).slice(0, 5);
    };

    ops.push({
      updateOne: {
        filter: { level: "MINISTRY", reference_id: null },
        update: {
          $set: {
            level: "MINISTRY",
            reference_id: null,
            date: format(currentDate, "yyyy-MM-dd"),
            data: {
              overview: {
                 total_students: totalStudentsGlobal,
                 total_bookings_30d: globalBookings.length,
              },
              booking_stats: statusCount(globalBookings),
              top_issues: categoriesCount(globalBookings),
            },
            generatedAt,
          }
        },
        upsert: true
      }
    });

    // --- 2. UNIVERSITY (RECTOR) STATS ---
    const universities = await prisma.university.findMany({ 
       select: { university_id: true, university_name_th: true } 
    });

    for (const uni of universities) {
       const totalStudentsUni = await prisma.student.count({ where: { university_id: uni.university_id } });
       
       const uniBookings = await prisma.booking.findMany({
          where: { university_id: uni.university_id, booking_created_at: { gte: thirtyDaysAgo } },
          select: { booking_status: true, problemCategory: { select: { problem_category_name_th: true } } }
       });

       ops.push({
          updateOne: {
             filter: { level: "UNIVERSITY", reference_id: uni.university_id },
             update: {
                $set: {
                   level: "UNIVERSITY",
                   reference_id: uni.university_id,
                   university_name: uni.university_name_th,
                   date: format(currentDate, "yyyy-MM-dd"),
                   data: {
                      overview: {
                         total_students: totalStudentsUni,
                         total_bookings_30d: uniBookings.length,
                      },
                      booking_stats: statusCount(uniBookings),
                      top_issues: categoriesCount(uniBookings),
                   },
                   generatedAt,
                }
             },
             upsert: true
          }
       });
    }

    // --- 3. FACULTY (DEAN) STATS ---
    const faculties = await prisma.faculty.findMany({
       select: { faculty_id: true, faculty_name_th: true, university_id: true }
    });

    for (const fac of faculties) {
       const totalStudentsFac = await prisma.student.count({ 
          where: { academic: { faculty_id: fac.faculty_id } } 
       });
       
       const facBookings = await prisma.booking.findMany({
          where: { student: { academic: { faculty_id: fac.faculty_id } }, booking_created_at: { gte: thirtyDaysAgo } },
          select: { booking_status: true, problemCategory: { select: { problem_category_name_th: true } } }
       });

       ops.push({
          updateOne: {
             filter: { level: "FACULTY", reference_id: fac.faculty_id },
             update: {
                $set: {
                   level: "FACULTY",
                   reference_id: fac.faculty_id,
                   faculty_name: fac.faculty_name_th,
                   university_id: fac.university_id,
                   date: format(currentDate, "yyyy-MM-dd"),
                   data: {
                      overview: {
                         total_students: totalStudentsFac,
                         total_bookings_30d: facBookings.length,
                      },
                      booking_stats: statusCount(facBookings),
                      top_issues: categoriesCount(facBookings),
                   },
                   generatedAt,
                }
             },
             upsert: true
          }
       });
    }

    if (ops.length > 0) {
      await collection.bulkWrite(ops);
    }
    
    console.log(`[CRON] Aggregation completed. Inserted/Updated ${ops.length} documents.`);
    
    // Attempt revalidate if caching is an issue
    revalidatePath("/dashboards");

    return NextResponse.json({ 
       success: true, 
       message: `Aggregated ${ops.length} levels from PostgreSQL into MongoDB.`,
       generatedAt 
    });

  } catch (error: any) {
    console.error("[CRON] Aggregation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
