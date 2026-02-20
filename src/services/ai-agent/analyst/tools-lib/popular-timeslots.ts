import { prisma } from "@/lib/prisma";

export const getPopularTimeSlots = {
  name: "getPopularTimeSlots",
  description: "Get popular time slots/hours based on bookings. Useful for 'peak hours', 'popular times'.",
  parameters: {
    type: "object",
    properties: {
      universityId: { type: "integer", description: "Optional university ID to filter by" },
    },
  },
  execute: async ({ universityId }: { universityId?: number }) => {
    const bookings = await prisma.booking.findMany({
      where: {
        ...(universityId ? { university_id: universityId } : {}),
        booking_status: { not: "CANCELLED" },
      },
      select: {
        timeSlot: {
          select: {
            time_slot_start_datetime: true,
          }
        }
      },
      take: 1000, 
    });

    const hourCounts: Record<string, number> = {};

    bookings.forEach((b) => {
      if (b.timeSlot?.time_slot_start_datetime) {
        const date = new Date(b.timeSlot.time_slot_start_datetime);
        const hour = date.getHours().toString().padStart(2, '0') + ":00";
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const chartData = Object.entries(hourCounts)
      .map(([time, value]) => ({ time, value }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      summary: "Popular booking times",
      data: chartData,
      recommendedChart: "bar",
      xAxisKey: "time",
      dataKey: "value",
    };
  },
};
