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
                exceptionReason: {
                    select: {
                        exception_reason_id: true,
                        exception_reason_code: true,
                        exception_reason_name_th: true,
                    },
                },
            },
        });

        // ── 3. Find bookings that ACTUALLY triggered penalties via discipline_log ──
        // Use discipline_log as source of truth instead of re-computing from time-diff
        const penaltyLogs = await prisma.disciplineLog.findMany({
            where: {
                university_id: activeUniversityId,
                student_id: student.student_id,
                action_type_code: { in: ["NO_SHOW", "LATE_CANCEL"] },
                booking_id: { not: null },
            },
            select: {
                booking_id: true,
                action_type_code: true,
                created_at: true,
            },
            orderBy: { created_at: "desc" },
        });

        // Get unique booking IDs that were penalized
        const penaltyBookingIds = [...new Set(penaltyLogs.map(l => l.booking_id!))];

        // Build a map: bookingId → penaltyType from the discipline log
        const penaltyTypeMap = new Map<number, "LATE_CANCEL" | "VERY_LATE_CANCEL">();
        for (const log of penaltyLogs) {
            if (!log.booking_id) continue;
            if (!penaltyTypeMap.has(log.booking_id)) {
                penaltyTypeMap.set(
                    log.booking_id,
                    log.action_type_code === "NO_SHOW" ? "VERY_LATE_CANCEL" : "LATE_CANCEL"
                );
            }
        }

        // Fetch full booking data for penalized bookings
        const penaltyBookings = penaltyBookingIds.length > 0
            ? await prisma.booking.findMany({
                where: {
                    university_id: activeUniversityId,
                    booking_id: { in: penaltyBookingIds },
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
            })
            : [];

        // Compute deadline + eligibility per booking
        const now = new Date();
        const isCurrentlyLocked = trustStatus?.student_trust_locked_until
            ? new Date(trustStatus.student_trust_locked_until) > now
            : false;

        const penaltyBookingsWithDeadline = penaltyBookings.map((b) => {
            const cancelledAt = b.cancellation?.booking_cancellation_cancelled_at ?? b.booking_created_at;
            const deadlineAt = new Date(cancelledAt);
            deadlineAt.setDate(deadlineAt.getDate() + DEADLINE_DAYS);

            const isExpired = now > deadlineAt;
            const hasRequest = !!b.exceptionRequest;
            const requestStatus = b.exceptionRequest?.booking_exception_status ?? null;

            // Use discipline_log as source of truth for penalty type
            const penaltyType = penaltyTypeMap.get(b.booking_id) ?? "VERY_LATE_CANCEL";

            // Can submit if:
            //   - No existing active request (or was rejected)
            //   - Either: deadline hasn't passed OR student is currently locked/banned
            //     (Locked students should always be able to appeal)
            const noBlockingRequest = !hasRequest || requestStatus === "REJECTED";
            const canSubmit = noBlockingRequest && (!isExpired || isCurrentlyLocked);

            return {
                ...b,
                deadlineAt: deadlineAt.toISOString(),
                isExpired: isExpired && !isCurrentlyLocked,
                canSubmit,
                penaltyType,
            };
        });

        return NextResponse.json({
            success: true,
            data: items,
            penaltyBookings: penaltyBookingsWithDeadline,
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
