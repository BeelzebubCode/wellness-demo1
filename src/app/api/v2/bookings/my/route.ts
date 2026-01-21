// src/app/api/v1/bookings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant, assertRole } from "@/lib/tenants/server";

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    // ✅ อนุญาตเฉพาะ STUDENT (ถ้าอยากให้ CONSULTANT ดูของตัวเองด้วยค่อยเพิ่มทีหลัง)
    assertRole(account.role, ["STUDENT"]);

    const bookings = await prisma.booking.findMany({
      where: {
        // ✅ กันข้อมูลข้ามมหาลัย
        university_id: activeUniversityId,

        // ✅ ของนิสิตคนนี้เท่านั้น
        student: { account_id: account.accountId },
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

    return NextResponse.json({
      success: true,
      universityId: activeUniversityId,
      bookings: formatted,
    });
  } catch (e: any) {
    console.error("[BOOKINGS_MY_GET]", e);

    // ✅ ถ้า requireTenant/assertRole โยน error ที่มี status มา ให้ส่งตามนั้น
    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : "Failed to load bookings";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
