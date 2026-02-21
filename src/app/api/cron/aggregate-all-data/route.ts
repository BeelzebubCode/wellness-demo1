import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAiSummariesCollection } from "@/lib/mongodb";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

export const maxDuration = 300; // 5 min

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
    const thirtyDaysAgo = subDays(currentDate, 30);
    const sevenDaysAgo = subDays(currentDate, 7);

    // ────────────────────────────────────────────────
    // 0. Pre-fetch shared reference data once
    // ────────────────────────────────────────────────
    const allCategories = await prisma.problemCategory.findMany({
      select: { problem_category_id: true, problem_category_name_th: true },
    });
    const categoryMap = Object.fromEntries(
      allCategories.map((c) => [c.problem_category_id, c.problem_category_name_th])
    );

    // ────────────────────────────────────────────────
    // Helper functions
    // ────────────────────────────────────────────────
    type BookingRow = {
      booking_status: string;
      problem_category_id: number;
      booking_created_at: Date;
    };

    const computeStats = (bookings: BookingRow[]) => {
      const statusCounts: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      for (const b of bookings) {
        statusCounts[b.booking_status] = (statusCounts[b.booking_status] || 0) + 1;
        const catName = categoryMap[b.problem_category_id] || "ไม่ระบุ";
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
        const day = format(b.booking_created_at, "yyyy-MM-dd");
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }

      const top_issues = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const daily_trend = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const total = bookings.length;
      const completed = statusCounts["COMPLETED"] || 0;
      const cancelled = statusCounts["CANCELLED"] || 0;
      const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const cancellation_rate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

      return {
        booking_stats: statusCounts,
        top_issues,
        daily_trend,
        completion_rate,
        cancellation_rate,
      };
    };

    const ops: object[] = [];

    // ────────────────────────────────────────────────
    // 1. MINISTRY: Global view with per-university ranking
    // ────────────────────────────────────────────────
    const universities = await prisma.university.findMany({
      select: {
        university_id: true,
        university_name_th: true,
        university_name_en: true,
        university_type: true,
      },
    });

    const uniRankData: Array<{
      university_id: number;
      university_name: string;
      total_students: number;
      total_bookings_30d: number;
      total_bookings_all_time: number;
      completion_rate: number;
      stress_score: number;
      top_issue: string;
    }> = [];

    for (const uni of universities) {
      const totalStudents = await prisma.student.count({
        where: { university_id: uni.university_id },
      });
      // 30-day window
      const uniBookings30d = await prisma.booking.findMany({
        where: {
          university_id: uni.university_id,
          booking_created_at: { gte: thirtyDaysAgo },
        },
        select: {
          booking_status: true,
          problem_category_id: true,
          booking_created_at: true,
        },
      });
      // All-time count (fast)
      const totalBookingsAllTime = await prisma.booking.count({
        where: { university_id: uni.university_id },
      });

      const stats = computeStats(uniBookings30d);
      // Stress score: all-time bookings per 100 students (so seeded data still works)
      const bookingsForScore = uniBookings30d.length > 0 ? uniBookings30d.length : totalBookingsAllTime;
      const stressScore =
        totalStudents > 0
          ? Math.round((bookingsForScore / totalStudents) * 1000) / 10
          : 0;

      uniRankData.push({
        university_id: uni.university_id,
        university_name: uni.university_name_th,
        total_students: totalStudents,
        total_bookings_30d: uniBookings30d.length,
        total_bookings_all_time: totalBookingsAllTime,
        completion_rate: stats.completion_rate,
        stress_score: stressScore,
        top_issue: stats.top_issues[0]?.category || "ไม่มีข้อมูล",
      });
    }

    // Sort by stress score desc
    const uniByStress = [...uniRankData].sort((a, b) => b.stress_score - a.stress_score);
    const uniByBookings = [...uniRankData].sort((a, b) => (b.total_bookings_all_time ?? 0) - (a.total_bookings_all_time ?? 0));

    const globalBookings = await prisma.booking.findMany({
      where: { booking_created_at: { gte: thirtyDaysAgo } },
      select: {
        booking_status: true,
        problem_category_id: true,
        booking_created_at: true,
      },
    });
    const globalStats = computeStats(globalBookings);
    const totalStudentsGlobal = await prisma.student.count();

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
                total_universities: universities.length,
                total_students: totalStudentsGlobal,
                total_bookings_30d: globalBookings.length,
                completion_rate: globalStats.completion_rate,
                cancellation_rate: globalStats.cancellation_rate,
              },
              booking_stats: globalStats.booking_stats,
              top_issues: globalStats.top_issues,
              daily_trend: globalStats.daily_trend,
              // 🔥 Key Ministry insights:
              university_ranking_by_stress: uniByStress.slice(0, 20).map((u, i) => ({
                rank: i + 1,
                university_name: u.university_name,
                stress_score: u.stress_score,
                bookings_per_100_students: u.stress_score,
                total_bookings_30d: u.total_bookings_30d,
                top_issue: u.top_issue,
              })),
              university_ranking_by_volume: uniByBookings.slice(0, 20).map((u, i) => ({
                rank: i + 1,
                university_name: u.university_name,
                total_bookings_all_time: u.total_bookings_all_time,
                total_bookings_30d: u.total_bookings_30d,
                total_students: u.total_students,
                completion_rate: u.completion_rate,
              })),
            },
            generatedAt,
          },
        },
        upsert: true,
      },
    });

    // ────────────────────────────────────────────────
    // 2. RECTOR: per-university with faculty breakdown
    // ────────────────────────────────────────────────
    const faculties = await prisma.faculty.findMany({
      select: {
        faculty_id: true,
        faculty_name_th: true,
        university_id: true,
      },
    });

    for (const uni of universities) {
      const uniFaculties = faculties.filter((f) => f.university_id === uni.university_id);
      const totalStudents = uniRankData.find((u) => u.university_id === uni.university_id)?.total_students || 0;

      const uniBookings = await prisma.booking.findMany({
        where: {
          university_id: uni.university_id,
          booking_created_at: { gte: thirtyDaysAgo },
        },
        select: {
          booking_status: true,
          problem_category_id: true,
          booking_created_at: true,
        },
      });

      const uniStats = computeStats(uniBookings);

      // Faculty breakdown
      const facultyRankData: Array<{
        faculty_id: number;
        faculty_name: string;
        student_count: number;
        bookings_30d: number;
        stress_score: number;
        top_issue: string;
      }> = [];

      for (const fac of uniFaculties) {
        const facStudentCount = await prisma.student.count({
          where: { academic: { faculty_id: fac.faculty_id } },
        });
        const facBookings = await prisma.booking.findMany({
          where: {
            university_id: uni.university_id,
            student: { academic: { faculty_id: fac.faculty_id } },
            booking_created_at: { gte: thirtyDaysAgo },
          },
          select: {
            booking_status: true,
            problem_category_id: true,
            booking_created_at: true,
          },
        });
        const facStats = computeStats(facBookings);
        const stressScore =
          facStudentCount > 0
            ? Math.round((facBookings.length / facStudentCount) * 1000) / 10
            : 0;
        facultyRankData.push({
          faculty_id: fac.faculty_id,
          faculty_name: fac.faculty_name_th,
          student_count: facStudentCount,
          bookings_30d: facBookings.length,
          stress_score: stressScore,
          top_issue: facStats.top_issues[0]?.category || "ไม่มีข้อมูล",
        });
      }

      const facultyByStress = [...facultyRankData].sort((a, b) => b.stress_score - a.stress_score);

      // Available time slots (next 7 days)
      const availableSlots = await prisma.timeSlot.findMany({
        where: {
          university_id: uni.university_id,
          time_slot_status: "OPEN",
          time_slot_start_datetime: {
            gte: currentDate,
            lte: subDays(currentDate, -7),
          },
        },
        select: {
          time_slot_start_datetime: true,
          time_slot_end_datetime: true,
          time_slot_max_capacity: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { time_slot_start_datetime: "asc" },
        take: 30,
      });

      const slots_available = availableSlots
        .filter((s) => s._count.bookings < s.time_slot_max_capacity)
        .map((s) => ({
          date: format(s.time_slot_start_datetime, "yyyy-MM-dd"),
          day: format(s.time_slot_start_datetime, "EEEE"),
          start: format(s.time_slot_start_datetime, "HH:mm"),
          end: format(s.time_slot_end_datetime, "HH:mm"),
          remaining: s.time_slot_max_capacity - s._count.bookings,
        }));

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
                  total_students: totalStudents,
                  total_bookings_30d: uniBookings.length,
                  completion_rate: uniStats.completion_rate,
                  cancellation_rate: uniStats.cancellation_rate,
                  total_faculties: uniFaculties.length,
                },
                booking_stats: uniStats.booking_stats,
                top_issues: uniStats.top_issues,
                daily_trend: uniStats.daily_trend,
                // 🔥 Key Rector insights:
                faculty_ranking_by_stress: facultyByStress.slice(0, 20).map((f, i) => ({
                  rank: i + 1,
                  faculty_name: f.faculty_name,
                  stress_score: f.stress_score,
                  bookings_per_100_students: f.stress_score,
                  bookings_30d: f.bookings_30d,
                  student_count: f.student_count,
                  top_issue: f.top_issue,
                })),
                slots_available_next_7d: slots_available,
              },
              generatedAt,
            },
          },
          upsert: true,
        },
      });
    }

    // ────────────────────────────────────────────────
    // 3. FACULTY (DEAN): per-faculty detailed view
    // ────────────────────────────────────────────────
    for (const fac of faculties) {
      const facStudentCount = await prisma.student.count({
        where: { academic: { faculty_id: fac.faculty_id } },
      });
      const facBookings = await prisma.booking.findMany({
        where: {
          student: { academic: { faculty_id: fac.faculty_id } },
          booking_created_at: { gte: thirtyDaysAgo },
        },
        select: {
          booking_status: true,
          problem_category_id: true,
          booking_created_at: true,
        },
      });
      const facStats = computeStats(facBookings);

      // Available slots for this faculty's university
      const availableSlots = await prisma.timeSlot.findMany({
        where: {
          university_id: fac.university_id,
          time_slot_status: "OPEN",
          time_slot_start_datetime: {
            gte: currentDate,
            lte: subDays(currentDate, -7),
          },
        },
        select: {
          time_slot_start_datetime: true,
          time_slot_end_datetime: true,
          time_slot_max_capacity: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { time_slot_start_datetime: "asc" },
        take: 20,
      });
      const slots_available = availableSlots
        .filter((s) => s._count.bookings < s.time_slot_max_capacity)
        .map((s) => ({
          date: format(s.time_slot_start_datetime, "yyyy-MM-dd"),
          day: format(s.time_slot_start_datetime, "EEEE"),
          start: format(s.time_slot_start_datetime, "HH:mm"),
          end: format(s.time_slot_end_datetime, "HH:mm"),
          remaining: s.time_slot_max_capacity - s._count.bookings,
        }));

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
                  total_students: facStudentCount,
                  total_bookings_30d: facBookings.length,
                  completion_rate: facStats.completion_rate,
                  cancellation_rate: facStats.cancellation_rate,
                },
                booking_stats: facStats.booking_stats,
                top_issues: facStats.top_issues,
                daily_trend: facStats.daily_trend,
                slots_available_next_7d: slots_available,
              },
              generatedAt,
            },
          },
          upsert: true,
        },
      });
    }

    // ────────────────────────────────────────────────
    // 4. STUDENT: time slot availabilities per university
    // ────────────────────────────────────────────────
    for (const uni of universities) {
      const upcomingSlots = await prisma.timeSlot.findMany({
        where: {
          university_id: uni.university_id,
          time_slot_status: "OPEN",
          time_slot_start_datetime: {
            gte: startOfDay(currentDate),
            lte: endOfDay(subDays(currentDate, -14)),
          },
        },
        select: {
          time_slot_start_datetime: true,
          time_slot_end_datetime: true,
          time_slot_max_capacity: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { time_slot_start_datetime: "asc" },
        take: 50,
      });

      const available_slots = upcomingSlots
        .filter((s) => s._count.bookings < s.time_slot_max_capacity)
        .map((s) => ({
          date: format(s.time_slot_start_datetime, "yyyy-MM-dd"),
          day_th: ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"][s.time_slot_start_datetime.getDay()],
          start: format(s.time_slot_start_datetime, "HH:mm"),
          end: format(s.time_slot_end_datetime, "HH:mm"),
          remaining_slots: s.time_slot_max_capacity - s._count.bookings,
        }));

      // Group by date for easy day queries
      const byDate: Record<string, typeof available_slots> = {};
      for (const slot of available_slots) {
        if (!byDate[slot.date]) byDate[slot.date] = [];
        byDate[slot.date].push(slot);
      }
      const available_by_date = Object.entries(byDate).map(([date, slots]) => ({
        date,
        day_th: slots[0].day_th,
        time_slots: slots.map((s) => `${s.start}-${s.end} (เหลือ ${s.remaining_slots} ที่)`),
      }));

      ops.push({
        updateOne: {
          filter: { level: "STUDENT", reference_id: uni.university_id },
          update: {
            $set: {
              level: "STUDENT",
              reference_id: uni.university_id,
              university_name: uni.university_name_th,
              date: format(currentDate, "yyyy-MM-dd"),
              data: {
                available_slots,
                available_by_date,
                total_available_slots: available_slots.length,
                next_available: available_slots[0] || null,
              },
              generatedAt,
            },
          },
          upsert: true,
        },
      });
    }

    // ────────────────────────────────────────────────
    // Write all to MongoDB
    // ────────────────────────────────────────────────
    if (ops.length > 0) {
      await collection.bulkWrite(ops as Parameters<typeof collection.bulkWrite>[0]);
    }

    console.log(`[CRON] Done. Upserted ${ops.length} documents.`);
    revalidatePath("/dashboards");

    return NextResponse.json({
      success: true,
      message: `Aggregated ${ops.length} AI knowledge documents from PostgreSQL into MongoDB.`,
      breakdown: {
        ministry: 1,
        universities: universities.length,
        faculties: faculties.length,
        student_views: universities.length,
      },
      generatedAt,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[CRON] Aggregation Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
