// scripts/seeds/seed-recent-bookings.ts
// Fix 2026 booking data: complete existing ASSIGNED bookings, add outcomes
// Run: npx tsx scripts/seeds/seed-recent-bookings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedPick<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
}
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Consultant notes pool ──────────────────────────────────────────────────
const NOTES = [
    "นิสิตมีความกังวลเรื่องผลการเรียน ได้ให้คำแนะนำเรื่องการจัดตารางอ่านหนังสือ",
    "นิสิตรู้สึกเครียดจากการสอบ ได้ทำ relaxation technique ร่วมกัน",
    "ปรึกษาเรื่องความสัมพันธ์กับเพื่อน ได้ให้มุมมองใหม่และแนวทางการสื่อสาร",
    "นิสิตมีปัญหาการนอนหลับ ได้แนะนำ sleep hygiene",
    "ปรึกษาเรื่องอนาคตการทำงาน มีความกังวลเรื่องตลาดแรงงาน",
    "นิสิตมีความเครียดจากปัญหาครอบครัว ได้รับฟังอย่างตั้งใจ",
    "ปรึกษาเรื่องปรับตัวเข้ากับสิ่งแวดล้อมใหม่ มีปัญหา homesick",
    "นิสิตรู้สึกหมดแรงจูงใจ ได้ทำ goal setting ร่วมกัน",
    "ปรึกษาเรื่องสุขภาพจิตทั่วไป อารมณ์แปรปรวน ได้ประเมินและให้คำแนะนำ",
    "นิสิตมีความวิตกกังวลเรื่องการเงิน อยากลาออก ได้พูดคุยทางเลือก",
    "ปรึกษาเรื่องแรงกดดันจากครอบครัว ได้ทำ cognitive reframing",
    "นิสิตรู้สึกโดดเดี่ยว ไม่มีเพื่อนสนิท ได้แนะนำกิจกรรมสังคม",
    "ปรึกษาเรื่องการกลั่นแกล้ง ได้ประเมินสถานการณ์และวางแผนแก้ปัญหา",
    "นิสิตมีอาการท้อแท้ รู้สึกไม่มีคุณค่า ได้ประเมิน risk level",
    "Follow-up case เดิม อาการดีขึ้นจากครั้งก่อน สามารถจัดการความเครียดได้ดี",
];

const NEXT_STEPS = [
    "นัดติดตาม 2 สัปดาห์",
    "ไม่จำเป็นต้องนัดติดตาม",
    "นัดพบอีกครั้งในสัปดาห์หน้า",
    "แนะนำเข้าร่วมกลุ่มกิจกรรม",
    "ส่งต่อผู้เชี่ยวชาญเฉพาะทาง",
    null,
    null,
];

async function main() {
    console.log("🔧 Fixing 2026 booking data...\n");

    // ─── Step 1: Get all ASSIGNED/IN_PROGRESS bookings in 2026 ───────────────
    const staleBookings = await prisma.$queryRaw<any[]>`
    SELECT b.university_id, b.booking_id, b.student_id, b.consultant_id,
           b.time_slot_id, b.problem_category_id, b.booking_status
    FROM booking b
    JOIN time_slot ts ON b.university_id = ts.university_id AND b.time_slot_id = ts.time_slot_id
    WHERE ts.time_slot_start_datetime >= '2026-01-01'
      AND ts.time_slot_start_datetime < NOW()
      AND b.booking_status IN ('ASSIGNED', 'IN_PROGRESS')
  `;
    console.log(`Found ${staleBookings.length} stale ASSIGNED/IN_PROGRESS bookings in 2026 to complete`);

    // ─── Step 2: Complete ~85% of them, cancel ~10%, no-show ~5% ─────────────
    const riskWeights = [30, 35, 20, 10, 5]; // VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    const riskIds = [1, 2, 3, 4, 5];

    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    const batchSize = 200;

    for (let i = 0; i < staleBookings.length; i += batchSize) {
        const batch = staleBookings.slice(i, i + batchSize);

        await prisma.$transaction(async (tx) => {
            for (const b of batch) {
                const fate = Math.random();

                if (fate < 0.85) {
                    // ── COMPLETED ──
                    const riskId = weightedPick(riskIds, riskWeights);
                    const note = pick(NOTES);
                    const nextStep = pick(NEXT_STEPS);

                    await tx.booking.update({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        data: { booking_status: "COMPLETED" },
                    });

                    // Create outcome
                    await tx.bookingOutcome.upsert({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        create: {
                            university_id: b.university_id,
                            booking_id: b.booking_id,
                            booking_outcome_consultant_note: note,
                            booking_outcome_next_step: nextStep,
                            risk_level_id: riskId,
                        },
                        update: {},
                    });

                    // Create attendance
                    await tx.bookingAttendance.upsert({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        create: {
                            university_id: b.university_id,
                            booking_id: b.booking_id,
                            booking_attendance_status: "CHECKED_IN",
                            booking_attendance_marked_by_id: b.consultant_id ?? 1,
                        },
                        update: {},
                    });

                    completed++;
                } else if (fate < 0.95) {
                    // ── CANCELLED ─ (late cancel)
                    const reasonId = weightedPick([1, 2, 3, 7, 8, 5], [25, 15, 20, 20, 10, 10]);

                    await tx.booking.update({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        data: { booking_status: "CANCELLED" },
                    });

                    // Cancellation record — find account for student
                    const studentAccount = await tx.account.findFirst({
                        where: { student: { student_id: b.student_id, university_id: b.university_id } },
                        select: { account_id: true }
                    });

                    if (studentAccount) {
                        await tx.bookingCancellation.upsert({
                            where: {
                                university_id_booking_id: {
                                    university_id: b.university_id, booking_id: b.booking_id
                                }
                            },
                            create: {
                                university_id: b.university_id,
                                booking_id: b.booking_id,
                                cancellation_reason_id: reasonId,
                                booking_cancellation_cancelled_by_id: studentAccount.account_id,
                            },
                            update: {},
                        });
                    }
                    cancelled++;
                } else {
                    // ── NO_SHOW (status stays COMPLETED, tracked via attendance) ──
                    const riskId = weightedPick(riskIds, riskWeights);

                    await tx.booking.update({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        data: { booking_status: "COMPLETED" },
                    });

                    // Outcome with higher risk
                    await tx.bookingOutcome.upsert({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        create: {
                            university_id: b.university_id,
                            booking_id: b.booking_id,
                            booking_outcome_consultant_note: "นิสิตไม่มาตามนัดหมาย",
                            booking_outcome_next_step: "ติดต่อนิสิตและนัดใหม่",
                            risk_level_id: riskId,
                        },
                        update: {},
                    });

                    await tx.bookingAttendance.upsert({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        create: {
                            university_id: b.university_id,
                            booking_id: b.booking_id,
                            booking_attendance_status: "NO_SHOW",
                            booking_attendance_marked_by_id: b.consultant_id ?? null,
                        },
                        update: {},
                    });
                    noShow++;
                }
            }
        });

        console.log(`  Processed ${Math.min(i + batchSize, staleBookings.length)}/${staleBookings.length}`);
    }

    console.log(`\n✅ Results:`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Cancelled: ${cancelled}`);
    console.log(`  No-show: ${noShow}`);

    // ─── Step 3: Fix existing CANCELLED that don't have cancellation records ──
    const orphanCancels = await prisma.$queryRaw<any[]>`
    SELECT b.university_id, b.booking_id, b.student_id
    FROM booking b
    JOIN time_slot ts ON b.university_id = ts.university_id AND b.time_slot_id = ts.time_slot_id
    LEFT JOIN booking_cancellation bc ON b.university_id = bc.university_id AND b.booking_id = bc.booking_id
    WHERE ts.time_slot_start_datetime >= '2026-01-01'
      AND b.booking_status = 'CANCELLED'
      AND bc.booking_id IS NULL
    LIMIT 500
  `;
    console.log(`\n🔧 Fixing ${orphanCancels.length} cancelled bookings without cancellation records...`);

    for (let i = 0; i < orphanCancels.length; i += batchSize) {
        const batch = orphanCancels.slice(i, i + batchSize);
        await prisma.$transaction(async (tx) => {
            for (const b of batch) {
                const reasonId = weightedPick([1, 2, 3, 7, 8, 9, 5], [20, 15, 10, 20, 10, 15, 10]);
                const studentAccount = await tx.account.findFirst({
                    where: { student: { student_id: b.student_id, university_id: b.university_id } },
                    select: { account_id: true }
                });
                if (studentAccount) {
                    await tx.bookingCancellation.upsert({
                        where: {
                            university_id_booking_id: {
                                university_id: b.university_id, booking_id: b.booking_id
                            }
                        },
                        create: {
                            university_id: b.university_id,
                            booking_id: b.booking_id,
                            cancellation_reason_id: reasonId,
                            booking_cancellation_cancelled_by_id: studentAccount.account_id,
                        },
                        update: {},
                    });
                }
            }
        });
    }

    // ─── Step 4: Also add outcomes to COMPLETED bookings in 2026 that lack them ─
    const completedNoOutcome = await prisma.$queryRaw<any[]>`
    SELECT b.university_id, b.booking_id, b.consultant_id
    FROM booking b
    JOIN time_slot ts ON b.university_id = ts.university_id AND b.time_slot_id = ts.time_slot_id
    LEFT JOIN booking_outcome bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
    WHERE ts.time_slot_start_datetime >= '2026-01-01'
      AND b.booking_status = 'COMPLETED'
      AND bo.booking_id IS NULL
  `;
    console.log(`\n🔧 Adding outcomes to ${completedNoOutcome.length} completed bookings without outcomes...`);

    for (let i = 0; i < completedNoOutcome.length; i += batchSize) {
        const batch = completedNoOutcome.slice(i, i + batchSize);
        await prisma.$transaction(async (tx) => {
            for (const b of batch) {
                const riskId = weightedPick(riskIds, riskWeights);
                await tx.bookingOutcome.create({
                    data: {
                        university_id: b.university_id,
                        booking_id: b.booking_id,
                        booking_outcome_consultant_note: pick(NOTES),
                        booking_outcome_next_step: pick(NEXT_STEPS),
                        risk_level_id: riskId,
                    },
                });
            }
        });
    }

    // ─── Final summary ───────────────────────────────────────────────────────
    const finalStats = await prisma.$queryRaw<any[]>`
    SELECT 
      TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM') as month,
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE b.booking_status = 'COMPLETED')::int as completed,
      COUNT(*) FILTER (WHERE b.booking_status = 'CANCELLED')::int as cancelled
    FROM booking b
    JOIN time_slot ts ON b.university_id = ts.university_id AND b.time_slot_id = ts.time_slot_id
    WHERE ts.time_slot_start_datetime >= '2025-09-01'
    GROUP BY TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM')
    ORDER BY month
  `;
    console.log("\n📊 Final monthly breakdown:");
    console.table(finalStats);

    console.log("\n🎉 Done! Data is now realistic.");
}

main()
    .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
