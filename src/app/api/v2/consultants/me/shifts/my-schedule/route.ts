
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

    const anyAccount = account as any;
    if (!anyAccount || !anyAccount.consultant) {
      return NextResponse.json(
        { success: false, error: "Not a consultant account" },
        { status: 403 }
      );
    }

    const consultantId = anyAccount.consultant.consultant_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Fetch shifts (from BorrowAssignment properly)
    // BorrowAssignment represents actual finalized borrowing shifts where this consultant is assigned to another university
    const shifts = await prisma.borrowAssignment.findMany({
      where: {
        consultant_id: consultantId,
      },
      include: {
        consultantUniversity: {
          select: {
            university_name_th: true,
            university_name_en: true,
          }
        },
        borrowRequest: {
          include: {
            fromUniversity: {
              select: {
                university_id: true,
                university_name_th: true,
                university_name_en: true,
                university_code: true,
              },
            }
          }
        },
      },
      orderBy: {
        borrow_assign_start_at: "desc",
      },
    });

    // 4. Categorize shifts (Optional depending on usage, but keep identical structure for frontend compat)
    const currentShift = shifts.find(
      (s) =>
        s.borrow_assign_start_at <= today &&
        s.borrow_assign_end_at >= today
    );

    // 5. Format response
    const formatShift = (shift: typeof shifts[number]) => {
      // If we are mapping BorrowAssignment, status is ACTIVE implicitly if not CANCELLED
      // (Assumption: assignments are ACTIVE unless their system adds cancellation, we default to ACTIVE)
      const isPast = shift.borrow_assign_end_at < today;
      return {
        borrowShiftId: shift.borrow_assignment_id,
        borrowPlanId: String(shift.borrow_request_id),
        startDate: shift.borrow_assign_start_at.toISOString(),
        endDate: shift.borrow_assign_end_at.toISOString(),
        status: isPast ? "COMPLETED" : "ACTIVE",
        homeUniversity: {
          nameTh: shift.consultantUniversity.university_name_th,
          nameEn: shift.consultantUniversity.university_name_en,
        },
        targetUniversity: {
          id: shift.borrowRequest.fromUniversity.university_id,
          nameTh: shift.borrowRequest.fromUniversity.university_name_th,
          nameEn: shift.borrowRequest.fromUniversity.university_name_en,
          code: shift.borrowRequest.fromUniversity.university_code,
        },
        createdAt: shift.borrow_assigned_at.toISOString(),
        completedAt: isPast ? shift.borrow_assign_end_at.toISOString() : null,
      };
    };

    // Fetch shift team manually via raw query to bypass old Prisma client memory in dev server
    const rawConsultant = await prisma.$queryRaw<any[]>`SELECT shift_team_id FROM consultant WHERE consultant_id = ${consultantId}`;
    const shiftTeamId = rawConsultant?.[0]?.shift_team_id;

    let myTeam = null;
    if (shiftTeamId) {
      const rawTeam = await prisma.$queryRaw<any[]>`SELECT shift_team_id, team_order, team_name FROM consultant_shift_team WHERE shift_team_id = ${shiftTeamId}`;
      myTeam = rawTeam?.[0] || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        teamId: myTeam?.shift_team_id ?? null,
        teamOrder: myTeam?.team_order ?? null,
        teamName: myTeam?.team_name ?? null,
        config: {
          epochDate: "2024-01-01",
          cycleDays: 56, // 4 teams * 14 days
          teamLengthDays: 14,
        },
        borrowShifts: shifts.map(formatShift),
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
