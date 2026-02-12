import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole } from "@prisma/client";

function isStaff(role: AccountRole) {
  return role === "HEAD_CONSULTANT" || role === "RECTOR" || role === "SUPER_ADMIN";
}

export async function handleListConsultants(
  ctx: AccountContext & { activeUniversityId?: number },
  input?: { organizationId?: number | null; includeBorrowed?: boolean; date?: string },
) {
  const role = ctx.role as AccountRole;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  const includeBorrowed = input?.includeBorrowed ?? false;
  const targetDate = input?.date; // YYYY-MM-DD

  const where = {
    ...(typeof input?.organizationId === "number"
      ? { organization_id: input.organizationId }
      : {}),

    ...(includeBorrowed
      ? {
        OR: [
          { university_id: activeUniversityId },
          {
            borrowAssignments: {
              some: {
                // borrow_assign_start_at: { lte: now },
                // borrow_assign_end_at: { gte: now },
                borrowRequest: {
                  from_university_id: activeUniversityId,
                  // ✅ User request: Don't show if COMPLETED (Assignee disappears after work done)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
                },
              },
            },
          },
          // ✅ Ghost Accounts (AccountUniversityAccess) -- REVERTED per user request
          // {
          //   account: {
          //     universityAccesses: {
          //       some: {
          //         university_id: activeUniversityId,
          //         access_revoked_at: null,
          //         access_role: { in: ["CONSULTANT", "HEAD_CONSULTANT"] as any },
          //       },
          //     },
          //   },
          // },
        ],
      }
      : {
        university_id: activeUniversityId,
      }),
  };

  const consultants = await prisma.consultant.findMany({
    where,
    select: {
      consultant_id: true,
      university_id: true,
      university: { select: { university_code: true } },
      account: { select: { account_role: true } },
      profile: {
        select: {
          consultant_first_name: true,
          consultant_last_name: true,
        },
      },
      // ✅ Specializations for matching
      specializations: {
        select: {
          consultant_specialization_topic: true,
        },
      },
      // ✅ Count active bookings for workload display
      _count: {
        select: {
          bookings: {
            where: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] as any },
            },
          },
        },
      },
      // ✅ Fetch bookings on the target date to check for clashes
      bookings: targetDate ? {
        where: {
          timeSlot: {
            time_slot_start_datetime: {
              gte: new Date(`${targetDate}T00:00:00Z`),
              lte: new Date(`${targetDate}T23:59:59Z`),
            }
          },
          booking_status: { not: "CANCELLED" as any }
        },
        select: {
          timeSlot: {
            select: {
              time_slot_start_datetime: true,
              time_slot_end_datetime: true,
            }
          }
        }
      } : false,
      // ✅ Fetch feedback ratings for avg rating calc
      feedbacks: {
        select: {
          ratings: {
            select: { feedback_rating_score: true },
          },
        },
      },
      // ✅ Select borrow assignments to get the ID for cross-university booking assignment
      borrowAssignments: {
        where: {
          borrowRequest: {
            from_university_id: activeUniversityId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
          },
        },
        select: {
          borrow_assignment_id: true,
        },
        take: 1,
      },
    },
    orderBy: { consultant_created_at: "desc" },
  });

  const formatted = consultants
    .map((c) => {
      const nameRaw = c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`.trim()
        : null;

      if (!nameRaw) return null;

      let name = nameRaw;
      if (c.university_id !== activeUniversityId && c.university?.university_code) {
        name = `${name} (${c.university.university_code})`;
      }

      // unique borrowAssignmentId for this context
      const borrowAssignmentId = c.borrowAssignments?.[0]?.borrow_assignment_id ?? null;

      // ✅ Compute avg rating from all feedback ratings
      const allScores = c.feedbacks.flatMap((f) => f.ratings.map((r) => r.feedback_rating_score));
      const avgRating = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : null;

      // ✅ Parse busy slots
      const busySlots = (c as any).bookings?.map((b: any) => ({
        start: b.timeSlot.time_slot_start_datetime.toISOString(),
        end: b.timeSlot.time_slot_end_datetime.toISOString(),
      })) ?? [];

      return {
        id: c.consultant_id,
        consultantId: c.consultant_id,
        universityId: c.university_id,
        borrowAssignmentId,
        name,
        accountRole: c.account?.account_role ?? null,
        activeBookings: c._count.bookings,
        avgRating,
        feedbackCount: c.feedbacks.length,
        specializations: c.specializations.map(s => s.consultant_specialization_topic),
        busySlots,
      };
    })
    .filter(Boolean);

  // ✅ ส่ง activeUniversityId กลับไปด้วย เพื่อ debug ว่ามันถือมหาลัยไหน
  return NextResponse.json({
    success: true,
    activeUniversityId,
    includeBorrowed,
    consultants: formatted,
  });
}
