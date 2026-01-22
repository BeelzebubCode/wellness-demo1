// src/app/api/v1/bookings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const account = await getAccountFromRequest(req);

    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (account.role !== "STUDENT") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        student: { account_id: account.accountId },
      },
      include: {
        problemCategory: true,
        timeSlot: true, // ✅
      },
      orderBy: { booking_created_at: "desc" },
    });

    const formatted = bookings.map((b) => {
      const slot = b.timeSlot;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory.problem_category_name_th,
        createdAt: b.booking_created_at.toISOString(),
        updatedAt: b.booking_updated_at.toISOString(),
        date: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toISOString().split("T")[0]
          : null,
        startTime: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toTimeString().slice(0, 5)
          : null,
        endTime: slot?.time_slot_end_datetime
          ? slot.time_slot_end_datetime.toTimeString().slice(0, 5)
          : null,
      };
    });

    return NextResponse.json({ bookings: formatted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}
