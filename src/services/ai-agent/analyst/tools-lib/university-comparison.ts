import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export const getUniversityComparison = {
  name: "getUniversityComparison",
  description: "Compare booking counts by category across universities. Useful for 'which university has most stress', 'compare mental health cases'. Ministry Level only.",
  parameters: {
    type: "object",
    properties: {
      categoryCode: { 
        type: "string", 
        description: "Problem category code (STRESS, MENTAL, ACAD, FIN, REL, CAREER) or null for all.",
        enum: ["STRESS", "MENTAL", "ACAD", "FIN", "REL", "CAREER"] 
      },
      startDate: { type: "string", description: "Start date YYYY-MM-DD" },
      endDate: { type: "string", description: "End date YYYY-MM-DD" },
    },
  },
  execute: async ({ categoryCode, startDate, endDate }: { categoryCode?: string; startDate?: string; endDate?: string }) => {
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 30));

    // Prepare filter
    const whereClause: any = {
      booking_created_at: { gte: start, lte: end },
    };

    if (categoryCode) {
      const cat = await prisma.problemCategory.findFirst({
        where: { problem_category_code: categoryCode },
        select: { problem_category_id: true }
      });
      if (cat) {
        whereClause.problem_category_id = cat.problem_category_id;
      }
    }

    // Group by university
    const grouped = await prisma.booking.groupBy({
      by: ["university_id"],
      where: whereClause,
      _count: { booking_id: true },
      orderBy: { _count: { booking_id: "desc" } },
      take: 10, // Top 10
    });

    // Enrich with University Names
    const results = await Promise.all(grouped.map(async (item) => {
      const uni = await prisma.university.findUnique({
        where: { university_id: item.university_id },
        select: { university_name_th: true }
      });
      return {
        name: uni?.university_name_th || `Uni #${item.university_id}`,
        value: item._count.booking_id,
      };
    }));

    return {
      summary: `Comparison of ${categoryCode || "All"} cases (${format(start, "yyyy-MM-dd")} - ${format(end, "yyyy-MM-dd")})`,
      data: results,
      recommendedChart: "bar",
      dataKey: "value",
    };
  },
};
