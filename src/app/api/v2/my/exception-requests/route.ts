// src/app/api/v2/my/exception-requests/route.ts
// GET: List all exception requests + penalty-causing bookings for the logged-in student
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

const DEADLINE_DAYS = 3;

export async function GET(req: NextRequest) {
    try {
        const { account, activeUniversityId } = await requireTenant(req);

        if (account.role !== "STUDENT") {
            return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
        }

        // Find student
        const student = await prisma.student.findFirst({
            where: { university_id: activeUniversityId, account_id: account.accountId },
            select: { student_id: true },
        });

        if (!student) {
            return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
        }

        // ── 1. Student's trust status (penalty info) ──
        const trustStatus = await prisma.studentBehaviorStatus.findUnique({
            where: {
                university_id_student_id: {
                    university_id: activeUniversityId,
                    student_id: student.student_id,
                },
            },
        });

        // ── 2. Existing exception requests ──
        const items = await prisma.bookingExceptionRequest.findMany({
            where: {
                university_id: activeUniversityId,
                student_id: student.student_id,
            },
            orderBy: { booking_exception_requested_at: "desc" },
            include: {
                booking: {
                    select: {
                        booking_id: true,
                        booking_status: true,
                        booking_created_at: true,
                        problemCategory: {
                            select: {
                                problem_category_name_th: true,
                                problem_category_name_en: true,
                            },
                        },
                        cancellation: {
                            select: {
                                booking_cancellation_cancelled_at: true,
                                cancellationReason: {
                                    select: { cancellation_reason_name_en: true },
                                },
                            },
                        },
                        timeSlot: {
                            select: {
                                time_slot_start_datetime: true,
                                time_slot_end_datetime: true,
                            },
                        },
                    },
                },
                evidences: {
                    select: {
                        booking_exception_evidence_id: true,
                        booking_exception_evidence_url: true,
                    },
                },
            },
        });

        // ── 3. ALL cancelled bookings that triggered penalty (not just within deadline) ──
        // These are bookings with late cancel or no-show that contribute to the student's penalty count
        const penaltyBookings = await prisma.booking.findMany({
            where: {
                university_id: activeUniversityId,
                student: { account_id: account.accountId },
                booking_status: "CANCELLED",
            },
            select: {
                booking_id: true,
                booking_created_at: true,
                problemCategory: {
                    select: { problem_category_name_th: true },
                },
                cancellation: {
                    select: {
                        booking_cancellation_cancelled_at: true,
                        cancellationReason: {
                            select: {
                                cancellation_reason_name_en: true,
                                cancellation_reason_name_th: true,
                            },
                        },
                    },
                },
                timeSlot: {
                    select: {
                        time_slot_start_datetime: true,
                        time_slot_end_datetime: true,
                    },
                },
                attendance: {
                    select: { booking_attendance_status: true },
                },
                exceptionRequest: {
                    select: {
                        booking_exception_request_id: true,
                        booking_exception_status: true,
                    },
                },
            },
            orderBy: { booking_created_at: "desc" },
            take: 100,
        });

        // Compute deadline + eligibility per booking
        const now = new Date();
        const penaltyBookingsWithDeadline = penaltyBookings.map((b) => {
            const cancelledAt = b.cancellation?.booking_cancellation_cancelled_at ?? b.booking_created_at;
            const deadlineAt = new Date(cancelledAt);
            deadlineAt.setDate(deadlineAt.getDate() + DEADLINE_DAYS);

            const isExpired = now > deadlineAt;
            const hasRequest = !!b.exceptionRequest;
            const requestStatus = b.exceptionRequest?.booking_exception_status ?? null;

            // Determine penalty type from time slot
            const slotStart = b.timeSlot?.time_slot_start_datetime;
            let penaltyType: "LATE_CANCEL" | "VERY_LATE_CANCEL" | "NORMAL" = "NORMAL";
            if (slotStart && cancelledAt) {
                const timeDiffHours = (new Date(slotStart).getTime() - new Date(cancelledAt).getTime()) / (1000 * 60 * 60);
                if (timeDiffHours < 6) {
                    penaltyType = "VERY_LATE_CANCEL"; // NO_SHOW equivalent
                } else if (timeDiffHours < 24) {
                    penaltyType = "LATE_CANCEL";
                }
            }

            // Can submit if: not expired, no existing request (or rejected), and is penalty booking
            const canSubmit = !isExpired && penaltyType !== "NORMAL" && (!hasRequest || requestStatus === "REJECTED");

            return {
                ...b,
                deadlineAt: deadlineAt.toISOString(),
                isExpired,
                canSubmit,
                penaltyType,
            };
        });

        // Filter to only penalty bookings (LATE_CANCEL or VERY_LATE_CANCEL)
        const penaltyOnly = penaltyBookingsWithDeadline.filter((b) => b.penaltyType !== "NORMAL");

        return NextResponse.json({
            success: true,
            data: items,
            penaltyBookings: penaltyOnly,
            trustStatus: trustStatus
                ? {
                    lateCancelCount: trustStatus.student_trust_late_cancel_count,
                    noShowCount: trustStatus.student_trust_no_show_count,
                    lockedUntil: trustStatus.student_trust_locked_until?.toISOString() ?? null,
                }
                : null,
            total: items.length,
        });
    } catch (e: any) {
        console.error("[GET /api/v2/my/exception-requests]", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
