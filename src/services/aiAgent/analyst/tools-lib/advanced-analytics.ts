
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export const getAdvancedBookingAnalytics = {
  name: "getAdvancedBookingAnalytics",
  description: "Advanced analytics for booking data. Supports grouping by university, faculty, problem category, etc. and filtering.",
  parameters: {
    type: "object",
    properties: {
      groupBy: { 
        type: "string", 
        description: "Field to group by: 'university', 'faculty', 'problem_category', 'booking_status', 'time_slot'",
        enum: ["university", "faculty", "problem_category", "booking_status", "time_slot"]
      },
      metric: {
        type: "string",
        description: "Metric to calculate: 'count', 'avg_score' (only for feedback)",
        enum: ["count"]
      },
      universityId: { type: "integer", description: "Filter by University ID" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      categoryCode: { type: "string", description: "Filter by Problem Category Code" }
    },
    required: ["groupBy"]
  },
  execute: async ({ groupBy, metric, universityId, startDate, endDate, categoryCode }: any) => {
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 30));

    const where: any = { booking_created_at: { gte: start, lte: end } };
    if (universityId) where.university_id = universityId;
    
    if (categoryCode) {
        const cat = await prisma.problemCategory.findFirst({ where: { problem_category_code: categoryCode } });
        if (cat) where.problem_category_id = cat.problem_category_id;
    }

    let data;
    let xAxisKey = "name";

    if (groupBy === "university") {
        const grouped = await prisma.booking.groupBy({
            by: ["university_id"],
            where,
            _count: { booking_id: true },
            orderBy: { _count: { booking_id: "desc" } },
            take: 10
        });
        // Enrich
        data = await Promise.all(grouped.map(async (g) => {
            const u = await prisma.university.findUnique({ where: { university_id: g.university_id }, select: { university_name_th: true } });
            return { name: u?.university_name_th || `ID ${g.university_id}`, value: g._count.booking_id };
        }));
    } else if (groupBy === "problem_category") {
         const grouped = await prisma.booking.groupBy({
            by: ["problem_category_id"],
            where,
            _count: { booking_id: true },
            orderBy: { _count: { booking_id: "desc" } },
            take: 10
        });
        data = await Promise.all(grouped.map(async (g) => {
            const c = await prisma.problemCategory.findUnique({ where: { problem_category_id: g.problem_category_id }, select: { problem_category_name_th: true } });
            return { name: c?.problem_category_name_th || `ID ${g.problem_category_id}`, value: g._count.booking_id };
        }));

    } else if (groupBy === "booking_status") {
        const grouped = await prisma.booking.groupBy({
            by: ["booking_status"],
            where,
            _count: { booking_id: true }
        });
        data = grouped.map(g => ({ name: g.booking_status, value: g._count.booking_id }));
    } else {
        return { error: "Unsupported grouping for now" };
    }

    return {
        summary: `Analytics grouped by ${groupBy}`,
        data,
        recommendedChart: "bar",
        xAxisKey: "name",
        dataKey: "value"
    };
  }
};
