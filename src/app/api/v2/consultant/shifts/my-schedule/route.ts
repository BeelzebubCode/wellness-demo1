import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify token and get account
    const tokenCookie = req.cookies.get("auth_token");
    if (!tokenCookie) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = await verifyToken(tokenCookie.value);
    if (!token || !token.accountId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get consultant record
    const account = await prisma.account.findUnique({
      where: { account_id: token.accountId },
      include: {
        consultant: true,
      },
    });

    if (!account || !account.consultant) {
      return NextResponse.json(
        { success: false, error: "Not a consultant account" },
        { status: 403 }
      );
    }

    const consultantId = account.consultant.consultant_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Fetch shifts with borrow periods
    const shifts = await prisma.consultantShift.findMany({
      where: {
        consultant_id: consultantId,
      },
      include: {
        borrowPeriods: {
          include: {
            borrowedToUniversity: {
              select: {
                university_name_th: true,
                university_name_en: true,
                university_code: true,
              },
            },
          },
          orderBy: {
            borrow_start_date: "asc",
          },
        },
        university: {
          select: {
            university_name_th: true,
            university_name_en: true,
          },
        },
      },
      orderBy: {
        shift_start_date: "desc",
      },
    });

    // 4. Categorize shifts
    const currentShift = shifts.find(
      (s) =>
        s.shift_start_date <= today &&
        s.shift_end_date >= today &&
        (s.status === "ACTIVE" || s.status === "ON_LOAN")
    );

    const upcomingShifts = shifts.filter(
      (s) => s.shift_start_date > today
    );

    const completedShifts = shifts.filter(
      (s) => s.status === "COMPLETED" || s.status === "CANCELLED"
    );

    // 5. Format response
    const formatShift = (shift: any) => ({
      shiftId: shift.shift_id,
      startDate: shift.shift_start_date.toISOString().split("T")[0],
      endDate: shift.shift_end_date.toISOString().split("T")[0],
      daysWorked: shift.days_worked,
      daysRemaining: shift.days_remaining,
      status: shift.status,
      homeUniversity: {
        nameTh: shift.university.university_name_th,
        nameEn: shift.university.university_name_en,
      },
      borrowPeriods: shift.borrowPeriods.map((bp: any) => ({
        periodId: bp.period_id,
        borrowedToUniversity: {
          nameTh: bp.borrowedToUniversity.university_name_th,
          nameEn: bp.borrowedToUniversity.university_name_en,
          code: bp.borrowedToUniversity.university_code,
        },
        startDate: bp.borrow_start_date.toISOString().split("T")[0],
        endDate: bp.borrow_end_date.toISOString().split("T")[0],
        actualReturnDate: bp.actual_return_date
          ? bp.actual_return_date.toISOString().split("T")[0]
          : null,
        status: bp.status,
      })),
      createdAt: shift.created_at.toISOString(),
      completedAt: shift.completed_at?.toISOString() || null,
    });

    return NextResponse.json({
      success: true,
      data: {
        currentShift: currentShift ? formatShift(currentShift) : null,
        upcomingShifts: upcomingShifts.map(formatShift),
        completedShifts: completedShifts.map(formatShift),
      },
    });
  } catch (error) {
    console.error("[CONSULTANT_SHIFTS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
