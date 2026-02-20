// src/app/api/v2/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { BookingStatus } from "@prisma/client";
import { requireTenant, assertRole } from "@/lib/tenant/server";
import { handleListBookings } from "@/services/booking/handlers/listBookings";
import { handleCreateBooking } from "@/services/booking/handlers/createBooking";
import { autoExpireAssignments } from "@/services/borrow-requests";

function getIpAddress(req: NextRequest): string | null {
  // รองรับ proxy หลายชั้น (เอาตัวแรก)
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;

  // บาง infra ใช้ header นี้
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim() || null;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(request);

    assertRole(account.role, [
      "STUDENT",
      "CONSULTANT",
      "HEAD_CONSULTANT",
      "SUPER_ADMIN",
      "RECTOR",
    ]);

    // ✅ Lazy expiration: auto-complete expired borrow assignments
    await autoExpireAssignments();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as BookingStatus | null;
    const studentUsername = searchParams.get("student");
    const consultantIdRaw = searchParams.get("consultantId");
    const problemCategoryIdRaw = searchParams.get("problemCategoryId");
    const date = searchParams.get("date"); // yyyy-mm-dd
    const assignmentMethodRaw = searchParams.get("assignmentMethod");

    const consultantId = consultantIdRaw ? Number(consultantIdRaw) : null;
    const problemCategoryId = problemCategoryIdRaw ? Number(problemCategoryIdRaw) : null;
    const assignmentMethod = (assignmentMethodRaw === "AUTO" || assignmentMethodRaw === "MANUAL") ? assignmentMethodRaw : "ALL";

    return await handleListBookings(
      { ...(account as any), activeUniversityId },
      {
        status,
        studentUsername,
        consultantId: Number.isFinite(consultantId as any) ? consultantId : null,
        problemCategoryId: Number.isFinite(problemCategoryId as any) ? problemCategoryId : null,
        date,
        assignmentMethod,
      },
    );
  } catch (err: any) {
    console.error("[GET /api/v2/bookings]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch bookings" },
      { status: err?.status ?? 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(request);

    // ✅ ให้เฉพาะนักศึกษาจองเอง
    assertRole(account.role, ["STUDENT"]);

    const body = (await request.json().catch(() => ({}))) as any;

    // ✅ map / normalize ให้ตรง handler ใหม่
    // - FE ใช้ bookingDetailText
    // - กันพัง ถ้า client เก่าส่ง detailText
    const bookingDetailText =
      typeof body.bookingDetailText === "string"
        ? body.bookingDetailText
        : typeof body.detailText === "string"
          ? body.detailText
          : body.bookingDetailText ?? null;

    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get("user-agent");

    return await handleCreateBooking(
      { ...(account as any), activeUniversityId },
      {
        ...body,
        bookingDetailText,
        ipAddress,
        userAgent: userAgent ?? null,
      },
    );
  } catch (err: any) {
    console.error("[POST /api/v2/bookings]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create booking" },
      { status: err?.status ?? 500 },
    );
  }
}
