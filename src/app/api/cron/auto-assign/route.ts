import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

function hasClash(bookingTimeSlot: { start: Date, end: Date }, consultantBookings: any[]): boolean {
  if (!bookingTimeSlot) return true; // Safety

  const bStart = bookingTimeSlot.start.getTime();
  const bEnd = bookingTimeSlot.end.getTime();

  return consultantBookings.some((b: any) => {
    if (!b.timeSlot) return false;
    const sStart = b.timeSlot.time_slot_start_datetime.getTime();
    const sEnd = b.timeSlot.time_slot_end_datetime.getTime();
    return bStart < sEnd && bEnd > sStart;
  });
}

function getSpecMatchScore(bookingText: string, specializations: any[]): number {
  if (!specializations?.length) return 0;

  const bText = bookingText.toLowerCase();
  const bTokens = bText.split(/[\/\s,]+/).map((t: string) => t.trim()).filter((t: string) => t.length > 1);

  let matches = 0;
  for (const specObj of specializations) {
    const sLow = specObj.consultant_specialization_topic.toLowerCase();

    if (bText.includes(sLow) || sLow.includes(bText)) {
      matches += 2;
      continue;
    }

    const sTokens = sLow.split(/[\/\s,]+/).map((t: string) => t.trim()).filter((t: string) => t.length > 1);
    for (const bt of bTokens) {
      if (sTokens.some((st: string) => st.includes(bt) || bt.includes(st))) {
        matches += 1;
        break;
      }
    }
  }

  return matches;
}

export async function GET() {
  try {
    // const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 นาที (สำหรับ Production)
    const delaySec = Number(process.env.NEXT_PUBLIC_AUTO_ASSIGN_DELAY_SEC) || 30;
    const thresholdAgo = new Date(Date.now() - delaySec * 1000);

    // Fetch pending bookings along with problem details and timeSlot for clashing checks
    const pendingBookings = await prisma.booking.findMany({
      where: {
        booking_status: BookingStatus.PENDING_ASSIGNMENT,
        booking_created_at: {
          lt: thresholdAgo,
        },
      },
      select: {
        booking_id: true,
        university_id: true,
        booking_detail_text: true,
        problemCategory: { select: { problem_category_name_th: true } },
        timeSlot: {
          select: {
            time_slot_start_datetime: true,
            time_slot_end_datetime: true,
          }
        }
      }
    });

    if (pendingBookings.length === 0) {
      return NextResponse.json({ message: "No bookings to auto-assign" });
    }

    let assignedCount = 0;

    for (const booking of pendingBookings) {
      const universityId = booking.university_id;

      if (!booking.timeSlot) continue; // Unable to evaluate if time is unknown

      // Build target text for specialization matching
      const problemText = ((booking.problemCategory?.problem_category_name_th || "") + " " + (booking.booking_detail_text || "")).trim();

      const targetDate = new Date(booking.timeSlot.time_slot_start_datetime).toISOString().split('T')[0];

      // Fetch consultants within the same university OR borrowed to this university for this date
      const consultantsInUni = await prisma.consultant.findMany({
        where: {
          account: { account_role: "CONSULTANT" },
          OR: [
            { university_id: universityId },
            {
              borrowAssignments: {
                some: {
                  borrow_assign_start_at: { lte: new Date(`${targetDate}T23:59:59Z`) },
                  borrow_assign_end_at: { gte: new Date(`${targetDate}T00:00:00Z`) },
                  borrowRequest: {
                    from_university_id: universityId,
                    borrow_request_status: { in: ["APPROVED", "ASSIGNED"] },
                  },
                },
              },
            },
          ],
        },
        select: {
          consultant_id: true,
          university_id: true,
          specializations: {
            select: { consultant_specialization_topic: true }
          },
          borrowAssignments: {
            where: {
              borrow_assign_start_at: { lte: new Date(`${targetDate}T23:59:59Z`) },
              borrow_assign_end_at: { gte: new Date(`${targetDate}T00:00:00Z`) },
              borrowRequest: {
                from_university_id: universityId,
                borrow_request_status: { in: ["APPROVED", "ASSIGNED"] },
              },
            },
            select: { borrow_assignment_id: true },
            take: 1,
          },
          _count: {
            select: {
              BookingAssignment: {
                where: {
                  is_active: true,
                  booking: {
                    booking_status: { in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] }
                  }
                }
              }
            }
          },
          bookings: {
            where: {
              timeSlot: {
                time_slot_start_datetime: {
                  gte: new Date(new Date(booking.timeSlot.time_slot_start_datetime).setHours(0, 0, 0, 0)),
                  lte: new Date(new Date(booking.timeSlot.time_slot_start_datetime).setHours(23, 59, 59, 999)),
                }
              },
              booking_status: { not: BookingStatus.CANCELLED } // Ignore canceled
            },
            select: {
              timeSlot: {
                select: {
                  time_slot_start_datetime: true,
                  time_slot_end_datetime: true,
                }
              }
            }
          }
        }
      });

      if (consultantsInUni.length === 0) continue;

      // ✅ Batch avg rating via raw SQL (1 query instead of N feedback_rating IN clauses)
      const cIds = consultantsInUni.map(c => c.consultant_id);
      const avgRatingsMap = cIds.length > 0
        ? await (async () => {
            const results = await prisma.$queryRaw<Array<{ consultant_id: number; avg_rating: number }>>`
              SELECT f.consultant_id, AVG(fr.feedback_rating_score)::float AS avg_rating
              FROM feedback_rating fr
              JOIN feedback f ON f.feedback_id = fr.feedback_id
              WHERE f.consultant_id = ANY(${cIds})
              GROUP BY f.consultant_id
            `;
            return new Map(results.map(r => [r.consultant_id, Math.round(r.avg_rating * 10) / 10]));
          })()
        : new Map<number, number>();

      // Filter and Rank
      const candidates = consultantsInUni
        .map(c => {
          const avgRating = avgRatingsMap.get(c.consultant_id) ?? 0;

          return {
            id: c.consultant_id,
            homeUniversityId: c.university_id,
            borrowAssignmentId: c.borrowAssignments?.[0]?.borrow_assignment_id ?? null,
            isClash: hasClash({
              start: booking.timeSlot!.time_slot_start_datetime,
              end: booking.timeSlot!.time_slot_end_datetime
            }, c.bookings),
            specScore: getSpecMatchScore(problemText, c.specializations),
            activeWorkload: c._count.BookingAssignment,
            avgRating
          };
        })
        .filter(c => !c.isClash) // Reject anyone with overlapping times
        .sort((a, b) => {
          // 1. Spec Score (Higher is better)
          if (a.specScore !== b.specScore) return b.specScore - a.specScore;
          // 2. Workload (Lower is better)
          if (a.activeWorkload !== b.activeWorkload) return a.activeWorkload - b.activeWorkload;
          // 3. Rating (Higher is better)
          return b.avgRating - a.avgRating;
        });

      if (candidates.length === 0) continue; // All available are clashing or zero

      const chosenCandidate = candidates[0];

      // Execute transaction
      await prisma.$transaction(async (tx) => {
        const upd = await tx.booking.updateMany({
          where: {
            university_id: universityId,
            booking_id: booking.booking_id,
            booking_status: BookingStatus.PENDING_ASSIGNMENT,
          },
          data: {
            booking_status: BookingStatus.ASSIGNED,
            consultant_id: chosenCandidate.id,
          },
        });

        if (upd.count > 0) {
          await tx.bookingAssignment.create({
            data: {
              university_id: universityId,
              booking_id: booking.booking_id,
              consultant_id: chosenCandidate.id,
              consultant_university_id: chosenCandidate.homeUniversityId,
              borrow_assignment_id: chosenCandidate.borrowAssignmentId,
              is_auto_assigned: true,
              is_active: true,
              assigned_note: "[System Auto-Assignment] ระบบแจกงานโดยพิจารณาจาก: เวลาว่าง, ความถนัด, ปริมาณงานในมือ และเรตติ้งคิว",
            }
          });
          assignedCount++;
        }
      });
    }

    return NextResponse.json({
      message: `Auto-assigned ${assignedCount} bookings successfully`,
    });
  } catch (error) {
    console.error("[CRON AutoAssign Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
