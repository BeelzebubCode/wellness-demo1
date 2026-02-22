// src/app/api/v2/head-consultant/exception-requests/route.ts
// GET: List all exception requests (filtered by status, paginated)
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { account, activeUniversityId } = tenant;

    if (account.role !== "HEAD_CONSULTANT") {
      return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); // PENDING_REVIEW | APPROVED | REJECTED | DRAFT
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = 20;

    const where: any = { university_id: activeUniversityId };
    if (statusFilter) {
      where.booking_exception_status = statusFilter;
    }

    const [total, items] = await Promise.all([
      prisma.bookingExceptionRequest.count({ where }),
      prisma.bookingExceptionRequest.findMany({
        where,
        orderBy: { booking_exception_requested_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: {
            include: {
              profile: {
                select: {
                  student_first_name_th: true,
                  student_last_name_th: true,
                  student_prefix: true,
                },
              },
            },
          },
          booking: {
            select: {
              booking_id: true,
              booking_status: true,
              timeSlot: {
                select: { time_slot_start_datetime: true, time_slot_end_datetime: true },
              },
            },
          },
          evidences: { select: { booking_exception_evidence_id: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e: any) {
    console.error("[GET /api/v2/head-consultant/exception-requests]", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
