
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { BorrowAvailabilityStatus } from "@prisma/client";

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

    // 3. Fetch shifts (Now ConsultantBorrowAvailability)
    const shifts = await prisma.consultantBorrowAvailability.findMany({
      where: {
        consultant_id: consultantId,
      },
      include: {
        homeUniversity: {
            select: {
                university_name_th: true,
                university_name_en: true,
            }
        },
        targetUniversity: {
          select: {
            university_id: true,
            university_name_th: true,
            university_name_en: true,
            university_code: true,
          },
        },
      },
      orderBy: {
        availability_start_date: "desc",
      },
    });

    // 4. Categorize shifts
    const currentShift = shifts.find(
      (s) =>
        s.availability_start_date <= today &&
        s.availability_end_date >= today &&
        s.status === BorrowAvailabilityStatus.ACTIVE
    );

    // History = Completed, Cancelled, or Past Active
    const historyShifts = shifts.filter(
        (s) => s.consultant_borrow_availability_id !== currentShift?.consultant_borrow_availability_id
    );

    // 5. Format response
    const formatShift = (shift: typeof shifts[number]) => ({
      // Map new DB fields to API response keys (keeping old keys for frontend compat if needed, or updating to new)
      // User said "API พัง" => 500 error. I will align response keys to what they likely expect or were using
      // But clearer to use new names? I will keep "borrowShiftId" as key to avoid breaking frontend that expects it,
      // mapping it from the new ID.
      borrowShiftId: shift.consultant_borrow_availability_id, 
      borrowPlanId: shift.borrow_plan_id,
      startDate: shift.availability_start_date.toISOString().split("T")[0],
      endDate: shift.availability_end_date.toISOString().split("T")[0],
      status: shift.status,
      homeUniversity: {
        nameTh: shift.homeUniversity.university_name_th,
        nameEn: shift.homeUniversity.university_name_en,
      },
      targetUniversity: {
          id: shift.targetUniversity.university_id,
          nameTh: shift.targetUniversity.university_name_th,
          nameEn: shift.targetUniversity.university_name_en,
          code: shift.targetUniversity.university_code,
      },
      createdAt: shift.created_at.toISOString(),
      completedAt: shift.completed_at?.toISOString() || null,
    });

    return NextResponse.json({
      success: true,
      data: {
        currentShift: currentShift ? formatShift(currentShift) : null,
        historyShifts: historyShifts.map(formatShift),
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
