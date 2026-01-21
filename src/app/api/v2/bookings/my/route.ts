import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenant/server";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ อนุญาตเฉพาะ STUDENT
    assertRole(account.role, ["STUDENT"]);

    const bookings = await prisma.booking.findMany({
      where: {
        university_id: activeUniversityId,

        // ✅ ปลอดภัยกว่า: relation filter ใช้ is:
        student: {
          is: { account_id: account.accountId },
        },
      },
      include: {
        problemCategory: true,
        timeSlot: true,
      },
      orderBy: { booking_created_at: "desc" },
    });

    const formatted = bookings.map((b) => {
      const slot = b.timeSlot;

      return {
        id: b.booking_id,
        status: b.booking_status,
        problemType: b.problemCategory?.problem_category_name_th ?? null,

        // ✅ กัน null (กัน 500 ที่พบบ่อยสุด)
        createdAt: b.booking_created_at ? b.booking_created_at.toISOString() : null,
        updatedAt: b.booking_updated_at ? b.booking_updated_at.toISOString() : null,

        date: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toISOString().slice(0, 10)
          : null,

        startTime: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toTimeString().slice(0, 5)
          : null,

        endTime: slot?.time_slot_end_datetime
          ? slot.time_slot_end_datetime.toTimeString().slice(0, 5)
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      universityId: activeUniversityId,
      bookings: formatted,
    });
  } catch (e: any) {
    console.error("[BOOKINGS_MY_V2_GET]", {
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
      status: e?.status,
    });

    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : e?.message ?? "Failed to load bookings";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
