import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { BookingStatus } from "@prisma/client";

export const getBookingStats = {
  name: "getBookingStats",
  description: "Get booking statistics and trends over a date range. Useful for 'how many bookings', 'booking trends', 'completion rate'.",
  parameters: {
    type: "object",
    properties: {
      startDate: { type: "string", description: "Start date in YYYY-MM-DD format (default: 7 days ago)" },
      endDate: { type: "string", description: "End date in YYYY-MM-DD format (default: today)" },
      universityId: { type: "integer", description: "Optional university ID to filter by" },
    },
  },
  execute: async ({ startDate, endDate, universityId }: { startDate?: string; endDate?: string; universityId?: number }) => {
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 7));

    const bookings = await prisma.booking.groupBy({
      by: ["booking_status", "booking_created_at"],
      where: {
        booking_created_at: {
          gte: start,
          lte: end,
        },
        ...(universityId ? { university_id: universityId } : {}),
      },
      _count: {
        booking_id: true,
      },
    });

    // Aggregate by date and status for charts
    const dailyStats: Record<string, Record<string, number>> = {};
    
    bookings.forEach((b) => {
      const dateKey = format(b.booking_created_at, "yyyy-MM-dd");
      if (!dailyStats[dateKey]) dailyStats[dateKey] = {};
      const status = b.booking_status;
      dailyStats[dateKey][status] = (dailyStats[dateKey][status] || 0) + (b._count.booking_id ?? 0);
    });

    // Flatten for Recharts
    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: `Booking stats from ${format(start, "yyyy-MM-dd")} to ${format(end, "yyyy-MM-dd")}`,
      data: chartData,
      recommendedChart: "bar", // or 'line'
      keys: Object.values(BookingStatus),
    };
  },
};
