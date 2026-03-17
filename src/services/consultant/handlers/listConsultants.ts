import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, BorrowRequestStatus, Prisma } from "@prisma/client";


function isStaff(role: string) {
  return role === "HEAD_CONSULTANT" || role === "RECTOR" || role === "SUPER_ADMIN";
}

export async function handleListConsultants(
  ctx: AccountContext & { activeUniversityId?: number },
  input?: { organizationId?: number | null; includeBorrowed?: boolean; date?: string },
) {
  const role = ctx.role as string;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUniversityId = ctx.activeUniversityId;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const denied = requireUniversity(ctx, activeUniversityId);
  if (denied) return denied;

  const includeBorrowed = input?.includeBorrowed ?? false;
  const targetDate = input?.date; // YYYY-MM-DD

  const where: Prisma.ConsultantWhereInput = {
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
                ...(targetDate
                  ? {
                    // ✅ If targetDate is provided, only include assignments where the target date falls within the start/end window
                    borrow_assign_start_at: { lte: new Date(`${targetDate}T23:59:59Z`) },
                    borrow_assign_end_at: { gte: new Date(`${targetDate}T00:00:00Z`) },
                  }
                  : {}),
                borrowRequest: {
                  from_university_id: activeUniversityId,
                  // ✅ User request: Don't show if COMPLETED (Assignee disappears after work done)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  borrow_request_status: { in: [BorrowRequestStatus.APPROVED, BorrowRequestStatus.ASSIGNED] },
                },
              },
            },
          },
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
      // ✅ Count active bookings + feedbacks (no rating rows loaded)
      _count: {
        select: {
          bookings: {
            where: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              booking_status: { in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
            },
          },
          feedbacks: true,
        },
      },
      bookings: targetDate ? {
        where: {
          timeSlot: {
            time_slot_start_datetime: {
              gte: new Date(`${targetDate}T00:00:00Z`),
              lte: new Date(`${targetDate}T23:59:59Z`),
            }
          },
          booking_status: { not: BookingStatus.CANCELLED }
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

      // ✅ Select borrow assignments to get the ID for cross-university booking assignment
      borrowAssignments: {
        where: {
          ...(targetDate
            ? {
              borrow_assign_start_at: { lte: new Date(`${targetDate}T23:59:59Z`) },
              borrow_assign_end_at: { gte: new Date(`${targetDate}T00:00:00Z`) },
            }
            : {}),
          borrowRequest: {
            from_university_id: activeUniversityId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            borrow_request_status: { in: [BorrowRequestStatus.APPROVED, BorrowRequestStatus.ASSIGNED] },
          },
        },
        select: {
          borrow_assignment_id: true,
          borrow_assign_start_at: true,
          borrow_assign_end_at: true,
        },
        take: 1,
      },
    },
    orderBy: { consultant_created_at: "desc" },
  });

  // ✅ Batch fetch avg ratings per consultant (single SQL instead of 24k+ IN clause)
  const consultantIds = consultants.map(c => c.consultant_id);
  const avgRatings = consultantIds.length > 0
    ? await (async () => {
        const results = await prisma.$queryRaw<Array<{ consultant_id: number; avg_rating: number }>>`
          SELECT f.consultant_id, AVG(fr.feedback_rating_score)::float AS avg_rating
          FROM feedback_rating fr
          JOIN feedback f ON f.feedback_id = fr.feedback_id
          WHERE f.consultant_id = ANY(${consultantIds})
          GROUP BY f.consultant_id
        `;
        return new Map(results.map(r => [r.consultant_id, Math.round(r.avg_rating * 10) / 10]));
      })()
    : new Map<number, number>();

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
      const borrowWindow = borrowAssignmentId
        ? {
          start: c.borrowAssignments[0].borrow_assign_start_at.toISOString(),
          end: c.borrowAssignments[0].borrow_assign_end_at.toISOString(),
        }
        : null;

      // ✅ Avg rating from batch aggregate (no N+1)
      const avgRating = avgRatings.get(c.consultant_id) ?? null;

      // ✅ Parse busy slots
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const busySlots = (c.bookings && typeof c.bookings !== 'boolean') ? (c.bookings as any[]).map((b) => ({
        start: b.timeSlot?.time_slot_start_datetime.toISOString(),
        end: b.timeSlot?.time_slot_end_datetime.toISOString(),
      })) : [];

      return {
        id: c.consultant_id,
        consultantId: c.consultant_id,
        universityId: c.university_id,
        borrowAssignmentId,
        borrowWindow,
        name,
        accountRole: c.account?.account_role ?? null,
        activeBookings: c._count.bookings,
        avgRating,
        feedbackCount: c._count.feedbacks,
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
