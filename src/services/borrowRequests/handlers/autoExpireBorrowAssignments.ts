// src/services/borrowRequests/handlers/autoExpireBorrowAssignments.ts
//
// "Lazy expiration" — เรียกจาก API ที่เกี่ยวข้อง (เช่น assign booking)
// เพื่อ auto-complete borrow requests ที่หมดกำหนดโดยไม่ต้องตั้ง cron แยก

import prisma from "@/lib/prisma";

/** Throttle: รันได้ไม่เกิน 1 ครั้งต่อ 60 วินาที (in-memory) */
let lastRun = 0;
const THROTTLE_MS = 60_000;

/**
 * ค้นหา BorrowRequest ที่ status=ASSIGNED แต่ borrow_needed_to < now
 * แล้ว auto-complete + revoke access ทันที
 *
 * เรียกจากหลาย API ได้ — มี throttle กัน query ซ้ำ
 */
export async function autoExpireAssignments(): Promise<number> {
    const now = Date.now();
    if (now - lastRun < THROTTLE_MS) return 0; // skip if ran recently
    lastRun = now;

    try {
        const nowDate = new Date();

        const expired = await prisma.borrowRequest.findMany({
            where: {
                borrow_request_status: "ASSIGNED",
                borrow_needed_to: { lt: nowDate },
            },
            include: {
                assignments: {
                    select: {
                        borrow_assignment_id: true,
                        consultant_id: true,
                        consultant: {
                            select: { account_id: true },
                        },
                    },
                },
            },
        });

        if (expired.length === 0) return 0;

        let count = 0;

        for (const br of expired) {
            await prisma.$transaction(async (tx) => {
                await tx.borrowRequest.update({
                    where: { borrow_request_id: br.borrow_request_id },
                    data: { borrow_request_status: "COMPLETED" },
                });

                for (const assignment of br.assignments) {
                    const accountId = assignment.consultant.account_id;
                    const targetUniId = br.from_university_id;

                    const otherActive = await tx.borrowAssignment.count({
                        where: {
                            consultant_id: assignment.consultant_id,
                            borrowRequest: {
                                from_university_id: targetUniId,
                                borrow_request_status: { in: ["APPROVED", "ASSIGNED"] },
                            },
                            borrow_assignment_id: { not: assignment.borrow_assignment_id },
                        },
                    });

                    if (otherActive === 0) {
                        await tx.accountUniversityPermission.updateMany({
                            where: {
                                account_id: accountId,
                                university_id: targetUniId,
                                access_revoked_at: null,
                            },
                            data: { access_revoked_at: nowDate },
                        });
                    }
                }
            });

            count++;
        }

        if (count > 0) {
            console.log(`[AUTO_EXPIRE] Completed ${count} expired borrow assignment(s)`);
        }

        return count;
    } catch (err) {
        console.error("[AUTO_EXPIRE_ERROR]", err);
        return 0; // ไม่ throw — ให้ flow หลักทำงานต่อได้
    }
}
