// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";

export type MyBookingDTO = {
  id: number;
  status: string;
  problemType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
};

export async function getMyBookings(params: {
  accountId: number;
  activeUniversityId: number;
}): Promise<MyBookingDTO[]> {
  const { accountId, activeUniversityId } = params;

  const bookings = await prisma.booking.findMany({
    where: {
      university_id: activeUniversityId,
      student: { is: { account_id: accountId } },
    },
    include: {
      problemCategory: true,
      timeSlot: true,
    },
    orderBy: { booking_created_at: "desc" },
  });

  return bookings.map((b) => {
    const slot = b.timeSlot;

    return {
      id: b.booking_id,
      status: b.booking_status,
      problemType: b.problemCategory?.problem_category_name_th ?? null,
      createdAt: b.booking_created_at ? b.booking_created_at.toISOString() : null,
      updatedAt: b.booking_updated_at ? b.booking_updated_at.toISOString() : null,
      date: slot?.time_slot_start_datetime ? slot.time_slot_start_datetime.toISOString().slice(0, 10) : null,
      startTime: slot?.time_slot_start_datetime ? slot.time_slot_start_datetime.toTimeString().slice(0, 5) : null,
      endTime: slot?.time_slot_end_datetime ? slot.time_slot_end_datetime.toTimeString().slice(0, 5) : null,
    };
  });
}
