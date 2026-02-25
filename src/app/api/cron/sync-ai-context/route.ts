import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAiKnowledgeContextCollection } from "@/lib/mongodb";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";

export const maxDuration = 300; // 5 min
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (
            process.env.NODE_ENV === "production" &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[CRON] Starting AI Knowledge RAG Aggregation...");
        const collection = await getAiKnowledgeContextCollection();
        const currentDate = new Date();
        const thirtyDaysAgo = subDays(currentDate, 30);
        const ops: object[] = [];

        // Helper: format Thai date
        const fDate = (d: Date) => format(d, "d MMM yyyy", { locale: th });
        const fTime = (d: Date) => format(d, "HH:mm");

        // ────────────────────────────────────────────────
        // 0. Pre-fetch shared data
        // ────────────────────────────────────────────────
        const allCategories = await prisma.problemCategory.findMany();
        const catMap = Object.fromEntries(allCategories.map(c => [c.problem_category_id, c.problem_category_name_th]));

        // ────────────────────────────────────────────────
        // 1. MINISTRY / GLOBAL
        // ────────────────────────────────────────────────
        const totalBookingsGlobal = await prisma.booking.count({ where: { booking_created_at: { gte: thirtyDaysAgo } } });
        const activeStudents = await prisma.student.count();
        const globalPayload = `ข้อมูลภาพรวมระดับประเทศ (MINISTRY) 30 วันที่ผ่านมา: มีการใช้งานระบบทั้งหมด ${totalBookingsGlobal} ครั้ง จากนักศึกษาในระบบทั้งหมด ${activeStudents} คน`;

        ops.push({
            updateOne: {
                filter: { "access_control.level": "MINISTRY", context_type: "NATIONAL_STAT_SUMMARY" },
                update: {
                    $set: {
                        context_type: "NATIONAL_STAT_SUMMARY",
                        payload: globalPayload,
                        access_control: { level: "MINISTRY", university_id: null, faculty_id: null, owner_user_id: null },
                        updated_at: currentDate
                    }
                },
                upsert: true
            }
        });

        // ────────────────────────────────────────────────
        // 1b. SYSTEM FACTS — University List (for QUICK_LOOKUP)
        // ────────────────────────────────────────────────
        const allUniversities = await prisma.university.findMany({
            include: { province: { include: { region: true } } },
            orderBy: { university_id: "asc" }
        });

        const uniListPayload = allUniversities.map((u, i) =>
            `${i + 1}. ${u.university_name_th} (${u.province.province_name_th}, ${u.province.region?.region_name_th || "-"})`
        ).join("\n");

        ops.push({
            updateOne: {
                filter: { context_type: "SYSTEM_UNIVERSITY_LIST" },
                update: {
                    $set: {
                        context_type: "SYSTEM_UNIVERSITY_LIST",
                        lookup_key: "UNIVERSITY_LIST",
                        payload: `รายชื่อมหาวิทยาลัย/สถาบันทั้งหมดในระบบ (${allUniversities.length} แห่ง):\n${uniListPayload}`,
                        access_control: { level: "PUBLIC" },
                        updated_at: currentDate
                    }
                },
                upsert: true
            }
        });

        // Stats overview
        const totalUniversities = allUniversities.length;
        const totalConsultants = await prisma.consultant.count();
        const completedBookings30d = await prisma.booking.count({ where: { booking_created_at: { gte: thirtyDaysAgo }, booking_status: "COMPLETED" } });
        const cancelledBookings30d = await prisma.booking.count({ where: { booking_created_at: { gte: thirtyDaysAgo }, booking_status: "CANCELLED" } });

        ops.push({
            updateOne: {
                filter: { context_type: "SYSTEM_STATS_OVERVIEW" },
                update: {
                    $set: {
                        context_type: "SYSTEM_STATS_OVERVIEW",
                        lookup_key: "STATS_OVERVIEW",
                        payload: `สถิติภาพรวมระบบ (30 วันล่าสุด):\n- มหาวิทยาลัยทั้งหมด: ${totalUniversities} แห่ง\n- นักศึกษาในระบบ: ${activeStudents} คน\n- ที่ปรึกษาในระบบ: ${totalConsultants} คน\n- การจองทั้งหมด (30 วัน): ${totalBookingsGlobal} ครั้ง\n- สำเร็จ: ${completedBookings30d} ครั้ง\n- ยกเลิก: ${cancelledBookings30d} ครั้ง`,
                        access_control: { level: "PUBLIC" },
                        updated_at: currentDate
                    }
                },
                upsert: true
            }
        });

        // ────────────────────────────────────────────────
        // 2. UNIVERSITIES (RECTOR)
        // ────────────────────────────────────────────────
        const universities = await prisma.university.findMany({
            include: {
                students: { select: { student_id: true } }
            }
        });

        for (const uni of universities) {
            const uniBookings30d = await prisma.booking.findMany({
                where: { university_id: uni.university_id, booking_created_at: { gte: thirtyDaysAgo } },
                select: { problem_category_id: true }
            });
            const topIssueId = uniBookings30d.length > 0
                ? Object.entries(uniBookings30d.reduce((acc, b) => ({ ...acc, [b.problem_category_id]: (acc[b.problem_category_id] || 0) + 1 }), {} as Record<number, number>))
                    .sort((a, b) => b[1] - a[1])[0][0]
                : null;

            const issueText = topIssueId ? `ปัญหาที่พบมากที่สุดคือ ${catMap[Number(topIssueId)] || "ไม่ระบุ"}` : "ยังไม่มีข้อมูลปัญหาเพียงพอ";

            const uniPayload = `ข้อมูลสรุปรวม${uni.university_name_th}: ใน 30 วันที่ผ่านมา มีการจองคิวรับคำปรึกษา ${uniBookings30d.length} ครั้ง ${issueText}`;
            ops.push({
                updateOne: {
                    filter: { "access_control.level": "RECTOR", "access_control.university_id": uni.university_id, context_type: "UNIVERSITY_STAT_SUMMARY" },
                    update: {
                        $set: {
                            context_type: "UNIVERSITY_STAT_SUMMARY",
                            payload: uniPayload,
                            access_control: { level: "RECTOR", university_id: uni.university_id, faculty_id: null, owner_user_id: null },
                            updated_at: currentDate
                        }
                    },
                    upsert: true
                }
            });
        }

        // ────────────────────────────────────────────────
        // 3. FACULTIES (DEAN)
        // ────────────────────────────────────────────────
        const faculties = await prisma.faculty.findMany();
        for (const fac of faculties) {
            const facBookings = await prisma.booking.count({
                where: {
                    student: { academic: { faculty_id: fac.faculty_id } },
                    booking_created_at: { gte: thirtyDaysAgo }
                }
            });
            const facPayload = `ข้อมูลสรุปคณะ${fac.faculty_name_th}: ใน 30 วันที่ผ่านมา มีนักศึกษาเข้ามาใช้บริการ ${facBookings} ครั้ง`;
            ops.push({
                updateOne: {
                    filter: { "access_control.level": "DEAN", "access_control.faculty_id": fac.faculty_id, context_type: "FACULTY_STAT_SUMMARY" },
                    update: {
                        $set: {
                            context_type: "FACULTY_STAT_SUMMARY",
                            payload: facPayload,
                            access_control: { level: "DEAN", university_id: fac.university_id, faculty_id: fac.faculty_id, owner_user_id: null },
                            updated_at: currentDate
                        }
                    },
                    upsert: true
                }
            });
        }

        // ────────────────────────────────────────────────
        // 4. CONSULTANTS
        // ────────────────────────────────────────────────
        const next7DaysEnd = endOfDay(subDays(currentDate, -7));
        const consultants = await prisma.consultant.findMany({
            include: {
                account: { select: { account_username: true } },
                bookings: {
                    where: {
                        timeSlot: { time_slot_start_datetime: { gte: currentDate, lte: next7DaysEnd } },
                        booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] }
                    },
                    include: {
                        timeSlot: true,
                        student: { include: { profile: true } }
                    }
                }
            }
        });

        for (const c of consultants) {
            const cons: any = c;
            if (!cons.account) continue;
            let consPayload = `ตารางงานของคุณ (7 วันล่วงหน้า):\n`;
            if (cons.bookings.length === 0) {
                consPayload += "ไม่มีนัดหมายใหม่ในช่วง 7 วันนี้";
            } else {
                cons.bookings.forEach((b: any) => {
                    consPayload += `- วันที่ ${fDate(b.timeSlot.time_slot_start_datetime)} เวลา ${fTime(b.timeSlot.time_slot_start_datetime)}-${fTime(b.timeSlot.time_slot_end_datetime)} นัดกับ ${b.student?.profile?.student_first_name_th || "นักศึกษา"}\n`;
                });
            }

            ops.push({
                updateOne: {
                    filter: { "access_control.level": "CONSULTANT", "access_control.owner_user_id": String(cons.account_id), context_type: "CONSULTANT_DAILY_SUMMARY" },
                    update: {
                        $set: {
                            context_type: "CONSULTANT_DAILY_SUMMARY",
                            title: "สรุปตารางงานที่ปรึกษา",
                            payload: consPayload,
                            access_control: { level: "CONSULTANT", university_id: cons.university_id, faculty_id: null, owner_user_id: String(cons.account_id) },
                            updated_at: currentDate
                        }
                    },
                    upsert: true
                }
            });
        }

        // ────────────────────────────────────────────────
        // 5. PUBLIC / STUDENT (AVAILABLE SLOTS)
        // ────────────────────────────────────────────────
        for (const uni of universities) {
            const openSlots = await prisma.timeSlot.findMany({
                where: {
                    university_id: uni.university_id,
                    time_slot_status: "OPEN",
                    time_slot_start_datetime: { gte: currentDate, lte: next7DaysEnd }
                },
                orderBy: { time_slot_start_datetime: "asc" },
                take: 30
            });

            let slotPayload = `คิวที่ว่างของ ${uni.university_name_th} (7 วันข้างหน้า):\n`;
            if (openSlots.length === 0) {
                slotPayload += "ขณะนี้คิวเต็มทั้งหมด กรุณาตรวจสอบใหม่ภายหลัง";
            } else {
                openSlots.forEach(s => {
                    slotPayload += `- ว่างวัน ${fDate(s.time_slot_start_datetime)} ช่วงเวลา ${fTime(s.time_slot_start_datetime)}-${fTime(s.time_slot_end_datetime)}\n`;
                });
            }

            ops.push({
                updateOne: {
                    filter: { "access_control.level": "PUBLIC", "access_control.university_id": uni.university_id, context_type: "AVAILABLE_SLOTS" },
                    update: {
                        $set: {
                            context_type: "AVAILABLE_SLOTS",
                            title: "คิวว่างของมหาวิทยาลัย",
                            payload: slotPayload,
                            access_control: { level: "PUBLIC", university_id: uni.university_id, faculty_id: null, owner_user_id: null },
                            updated_at: currentDate
                        }
                    },
                    upsert: true
                }
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // 6. GLOBAL PRE-COMPUTED ANALYTICS (QUICK_LOOKUP)
        //    20 keys × 12 time periods (1M–12M) = ~240 cache entries
        // ════════════════════════════════════════════════════════════════════
        console.log("[CRON] Computing global analytics cache (20 keys × 12 periods)...");

        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const fThaiDate = (d: Date) => `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
        const statusMap: Record<string, string> = { "COMPLETED": "✅ เสร็จสิ้น", "CANCELLED": "❌ ยกเลิก", "PENDING_ASSIGNMENT": "⏳ รอจัดที่ปรึกษา", "ASSIGNED": "👤 จัดที่ปรึกษาแล้ว", "IN_PROGRESS": "🔄 กำลังปรึกษา" };
        const genderMap: Record<string, string> = { "MALE": "👨 ชาย", "FEMALE": "👩 หญิง", "OTHER": "🌈 อื่นๆ" };
        const riskLabels: Record<number, string> = { 1: "� ต่ำมาก", 2: "🟡 ต่ำ", 3: "🟠 ปานกลาง", 4: "🔴 สูง", 5: "🚨 สูงมาก" };
        const modeLabels: Record<string, string> = { "ONSITE": "🏢 Onsite (มาพบตัว)", "ONLINE": "💻 Online" };

        // Helper: push upsert for a lookup key (also writes default key without suffix for 1M)
        const pushLookup = (baseKey: string, suffix: string, title: string, payload: string) => {
            const key = `${baseKey}${suffix}`;
            ops.push({ updateOne: { filter: { lookup_key: key }, update: { $set: { context_type: "GLOBAL_STAT", lookup_key: key, title, payload, updated_at: currentDate, access_control: { level: "PUBLIC" } } }, upsert: true } });
            // Also write default (no suffix) for 1M → backward compatible
            if (suffix === "_1M") {
                ops.push({ updateOne: { filter: { lookup_key: baseKey }, update: { $set: { context_type: "GLOBAL_STAT", lookup_key: baseKey, title, payload, updated_at: currentDate, access_control: { level: "PUBLIC" } } }, upsert: true } });
            }
        };

        const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        for (const months of periods) {
            const pFrom = subDays(currentDate, months * 30);
            const pFromStr = pFrom.toISOString().slice(0, 10);
            const pToStr = currentDate.toISOString().slice(0, 10);
            const pLabel = months === 12 ? "1 ปี" : `${months} เดือน`;
            const dateLabel = `📅 ข้อมูลช่วง ${fThaiDate(pFrom)} - ${fThaiDate(currentDate)} (${pLabel})`;
            const sfx = `_${months}M`;
            const df = `booking_created_at >= '${pFromStr}' AND booking_created_at < '${pToStr}'`;
            const bdf = `b.booking_created_at >= '${pFromStr}' AND b.booking_created_at < '${pToStr}'`;

            console.log(`[CRON]   Period: ${pLabel}`);

            // ── 6.1 TOP_UNIVERSITIES ──
            const q1 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT university_id, COUNT(*)::bigint AS c FROM booking WHERE ${df} GROUP BY university_id ORDER BY c DESC LIMIT 20) SELECT u.university_name_th, t.c FROM t JOIN university u ON u.university_id = t.university_id ORDER BY t.c DESC`);
            let s1 = `${dateLabel}\n\n### 🏆 Top 20 มหาวิทยาลัยที่มีการจองปรึกษามากสุด\n\n| อันดับ | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|\n`;
            q1.forEach((r, i) => s1 += `| ${i + 1} | **${r.university_name_th}** | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_UNIVERSITIES", sfx, "Top 20 มหาวิทยาลัย", s1);

            // ── 6.2 TOP_PROBLEMS ──
            const q2 = await prisma.$queryRawUnsafe<any[]>(`SELECT pc.problem_category_name_th, COUNT(*)::bigint AS c FROM booking b JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE ${bdf} GROUP BY pc.problem_category_name_th ORDER BY c DESC`);
            let s2 = `${dateLabel}\n\n### 📊 ประเภทปัญหาที่พบมากสุด\n\n| อันดับ | ประเภทปัญหา | จำนวนคิว |\n|---|---|---|\n`;
            q2.forEach((r, i) => s2 += `| ${i + 1} | **${r.problem_category_name_th}** | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_PROBLEMS", sfx, "ปัญหาที่พบมากสุด", s2);

            // ── 6.3 REGIONAL_SUMMARY ──
            const q3 = await prisma.$queryRawUnsafe<any[]>(`SELECT r.region_name_th, COUNT(*)::bigint AS c, COUNT(DISTINCT b.university_id)::bigint AS u FROM booking b JOIN university u2 ON u2.university_id = b.university_id JOIN province p ON p.province_id = u2.province_id JOIN region r ON r.region_id = p.region_id WHERE ${bdf} GROUP BY r.region_name_th ORDER BY c DESC`);
            let s3 = `${dateLabel}\n\n### 🗺️ สถิติตามภูมิภาค\n\n| อันดับ | ภูมิภาค | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
            q3.forEach((r, i) => s3 += `| ${i + 1} | **${r.region_name_th}** | ${Number(r.u)} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("REGIONAL_SUMMARY", sfx, "สถิติตามภูมิภาค", s3);

            // ── 6.4 TOP_STUDENTS ──
            const q4 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT student_id, university_id, COUNT(*)::bigint AS c FROM booking WHERE ${df} GROUP BY university_id, student_id ORDER BY c DESC LIMIT 20) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, t.c FROM t JOIN student_profile sp ON sp.student_id = t.student_id AND sp.university_id = t.university_id JOIN university u ON u.university_id = t.university_id ORDER BY t.c DESC`);
            let s4 = `${dateLabel}\n\n### 🏆 Top 20 นิสิต/นักศึกษาที่จองปรึกษามากสุด\n\n| อันดับ | ชื่อ-นามสกุล | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
            q4.forEach((r, i) => s4 += `| ${i + 1} | **${r.student_first_name_th} ${r.student_last_name_th}** | ${r.university_name_th} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_STUDENTS", sfx, "Top 20 นิสิต", s4);

            // ── 6.5 BOOKING_STATUS_SUMMARY ──
            const q5 = await prisma.$queryRawUnsafe<any[]>(`SELECT booking_status, COUNT(*)::bigint AS c FROM booking WHERE ${df} GROUP BY booking_status ORDER BY c DESC`);
            const tot5 = q5.reduce((s, r) => s + Number(r.c), 0);
            let s5 = `${dateLabel}\n\n### 📊 สรุปสถานะการจอง\n\n**จำนวนคิวทั้งหมด: ${tot5.toLocaleString()}**\n\n| สถานะ | จำนวน | สัดส่วน |\n|---|---|---|\n`;
            q5.forEach(r => { const pct = tot5 > 0 ? ((Number(r.c) / tot5) * 100).toFixed(1) : "0"; s5 += `| ${statusMap[r.booking_status] || r.booking_status} | ${Number(r.c).toLocaleString()} | ${pct}% |\n`; });
            pushLookup("BOOKING_STATUS_SUMMARY", sfx, "สรุปสถานะ", s5);

            // ── 6.6 GENDER_SUMMARY ──
            const q6 = await prisma.$queryRawUnsafe<any[]>(`SELECT sp.student_gender, COUNT(*)::bigint AS c FROM booking b JOIN student_profile sp ON sp.student_id = b.student_id AND sp.university_id = b.university_id WHERE ${bdf} GROUP BY sp.student_gender ORDER BY c DESC`);
            let s6 = `${dateLabel}\n\n### 📊 สถิติตามเพศ\n\n| เพศ | จำนวนคิว |\n|---|---|\n`;
            q6.forEach(r => s6 += `| ${genderMap[r.student_gender] || r.student_gender} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("GENDER_SUMMARY", sfx, "สถิติตามเพศ", s6);

            // ── 6.7 TOP_FACULTIES ──
            const q7 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT sa.faculty_id, sa.university_id, COUNT(*)::bigint AS c FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id WHERE ${bdf} GROUP BY sa.faculty_id, sa.university_id ORDER BY c DESC LIMIT 20) SELECT f.faculty_name_th, u.university_name_th, t.c FROM t JOIN faculty f ON f.faculty_id = t.faculty_id AND f.university_id = t.university_id JOIN university u ON u.university_id = t.university_id ORDER BY t.c DESC`);
            let s7 = `${dateLabel}\n\n### 🏛️ Top 20 คณะที่มีการจองปรึกษามากสุด\n\n| อันดับ | คณะ | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
            q7.forEach((r, i) => s7 += `| ${i + 1} | **${r.faculty_name_th}** | ${r.university_name_th} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_FACULTIES", sfx, "Top 20 คณะ", s7);

            // ── 6.8 TOP_DEPARTMENTS ──
            const q8 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT sa.department_id, sa.university_id, COUNT(*)::bigint AS c FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id WHERE ${bdf} GROUP BY sa.department_id, sa.university_id ORDER BY c DESC LIMIT 20) SELECT d.department_name_th, u.university_name_th, t.c FROM t JOIN department d ON d.department_id = t.department_id AND d.university_id = t.university_id JOIN university u ON u.university_id = t.university_id ORDER BY t.c DESC`);
            let s8 = `${dateLabel}\n\n### � Top 20 สาขาวิชาที่มีการจองปรึกษามากสุด\n\n| อันดับ | สาขาวิชา | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
            q8.forEach((r, i) => s8 += `| ${i + 1} | **${r.department_name_th}** | ${r.university_name_th} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_DEPARTMENTS", sfx, "Top 20 สาขาวิชา", s8);

            // ── 6.9 TOP_CONSULTANTS ──
            const q9 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT consultant_id, university_id, COUNT(*)::bigint AS c FROM booking WHERE ${df} AND consultant_id IS NOT NULL GROUP BY consultant_id, university_id ORDER BY c DESC LIMIT 20) SELECT cp.consultant_first_name, cp.consultant_last_name, u.university_name_th, t.c FROM t JOIN consultant_profile cp ON cp.consultant_id = t.consultant_id JOIN university u ON u.university_id = t.university_id ORDER BY t.c DESC`);
            let s9 = `${dateLabel}\n\n### 👨‍⚕️ Top 20 ที่ปรึกษาที่รับเคสมากสุด\n\n| อันดับ | ที่ปรึกษา | มหาวิทยาลัย | จำนวนเคส |\n|---|---|---|---|\n`;
            q9.forEach((r, i) => s9 += `| ${i + 1} | **${r.consultant_first_name} ${r.consultant_last_name}** | ${r.university_name_th} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_CONSULTANTS", sfx, "Top 20 ที่ปรึกษา", s9);

            // ── 6.10 SERVICE_MODE_SUMMARY ──
            const q10 = await prisma.$queryRawUnsafe<any[]>(`SELECT booking_service_mode, COUNT(*)::bigint AS c FROM booking WHERE ${df} AND booking_service_mode IS NOT NULL GROUP BY booking_service_mode ORDER BY c DESC`);
            let s10 = `${dateLabel}\n\n### 🖥️ สถิติรูปแบบบริการ\n\n| รูปแบบ | จำนวนคิว |\n|---|---|\n`;
            q10.forEach(r => s10 += `| ${modeLabels[r.booking_service_mode] || r.booking_service_mode} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("SERVICE_MODE_SUMMARY", sfx, "รูปแบบบริการ", s10);

            // ── 6.11 CANCELLATION_SUMMARY ──
            const q11 = await prisma.$queryRawUnsafe<any[]>(`SELECT cr.cancellation_reason_name_th, COUNT(*)::bigint AS c FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id WHERE ${bdf} GROUP BY cr.cancellation_reason_name_th ORDER BY c DESC`);
            let s11 = `${dateLabel}\n\n### ❌ สาเหตุการยกเลิกคิว\n\n| อันดับ | สาเหตุ | จำนวน |\n|---|---|---|\n`;
            q11.forEach((r, i) => s11 += `| ${i + 1} | **${r.cancellation_reason_name_th}** | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("CANCELLATION_SUMMARY", sfx, "สาเหตุยกเลิก", s11);

            // ── 6.12 RISK_LEVEL_SUMMARY ──
            const q12 = await prisma.$queryRawUnsafe<any[]>(`SELECT bo.booking_outcome_risk_level AS lvl, COUNT(*)::bigint AS c FROM booking_outcome bo JOIN booking b ON b.booking_id = bo.booking_id AND b.university_id = bo.university_id WHERE ${bdf} AND bo.booking_outcome_risk_level IS NOT NULL GROUP BY bo.booking_outcome_risk_level ORDER BY bo.booking_outcome_risk_level`);
            const tot12 = q12.reduce((s, r) => s + Number(r.c), 0);
            let s12 = `${dateLabel}\n\n### ⚠️ ระดับความเสี่ยง\n\n| ระดับ | จำนวน | สัดส่วน |\n|---|---|---|\n`;
            q12.forEach(r => { const pct = tot12 > 0 ? ((Number(r.c) / tot12) * 100).toFixed(1) : "0"; s12 += `| ${riskLabels[Number(r.lvl)] || `ระดับ ${r.lvl}`} | ${Number(r.c).toLocaleString()} | ${pct}% |\n`; });
            pushLookup("RISK_LEVEL_SUMMARY", sfx, "ระดับความเสี่ยง", s12);

            // ── 6.13 PROVINCIAL_SUMMARY ──
            const q13 = await prisma.$queryRawUnsafe<any[]>(`SELECT p.province_name_th, COUNT(*)::bigint AS c, COUNT(DISTINCT b.university_id)::bigint AS u FROM booking b JOIN university u2 ON u2.university_id = b.university_id JOIN province p ON p.province_id = u2.province_id WHERE ${bdf} GROUP BY p.province_name_th ORDER BY c DESC LIMIT 20`);
            let s13 = `${dateLabel}\n\n### 🏙️ Top 20 จังหวัดที่มีการจองมากสุด\n\n| อันดับ | จังหวัด | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
            q13.forEach((r, i) => s13 += `| ${i + 1} | **${r.province_name_th}** | ${Number(r.u)} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("PROVINCIAL_SUMMARY", sfx, "สถิติตามจังหวัด", s13);

            // ── 6.14 ONLINE_CHANNEL_SUMMARY ──
            const q14 = await prisma.$queryRawUnsafe<any[]>(`SELECT oc.online_channel_name_th, COUNT(*)::bigint AS c FROM booking b JOIN online_channel_category oc ON oc.online_channel_category_id = b.online_channel_category_id WHERE ${bdf} AND b.online_channel_category_id IS NOT NULL GROUP BY oc.online_channel_name_th ORDER BY c DESC`);
            let s14 = `${dateLabel}\n\n### 📱 สถิติช่องทาง Online\n\n| ช่องทาง | จำนวนคิว |\n|---|---|\n`;
            q14.forEach(r => s14 += `| **${r.online_channel_name_th}** | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("ONLINE_CHANNEL_SUMMARY", sfx, "ช่องทาง Online", s14);

            // ── 6.15 MONTHLY_TREND (only for 12M) ──
            if (months === 12) {
                const q15 = await prisma.$queryRawUnsafe<any[]>(`SELECT TO_CHAR(booking_created_at, 'YYYY-MM') AS m, COUNT(*)::bigint AS c FROM booking WHERE ${df} GROUP BY m ORDER BY m`);
                let s15 = `${dateLabel}\n\n### 📈 เทรนด์การจองรายเดือน\n\n| เดือน | จำนวนคิว |\n|---|---|\n`;
                q15.forEach(r => s15 += `| ${r.m} | ${Number(r.c).toLocaleString()} |\n`);
                pushLookup("MONTHLY_TREND", sfx, "เทรนด์รายเดือน", s15);
                // Also write default key for MONTHLY_TREND
                ops.push({ updateOne: { filter: { lookup_key: "MONTHLY_TREND" }, update: { $set: { context_type: "GLOBAL_STAT", lookup_key: "MONTHLY_TREND", title: "เทรนด์รายเดือน", payload: s15, updated_at: currentDate, access_control: { level: "PUBLIC" } } }, upsert: true } });
            }

            // ── 6.16 HOURLY_SUMMARY ──
            const q16 = await prisma.$queryRawUnsafe<any[]>(`SELECT EXTRACT(HOUR FROM ts.time_slot_start_datetime)::int AS h, COUNT(*)::bigint AS c FROM booking b JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id WHERE ${bdf} GROUP BY h ORDER BY h`);
            let s16 = `${dateLabel}\n\n### ⏰ ช่วงเวลาที่มีการจองมากสุด\n\n| เวลา | จำนวนคิว |\n|---|---|\n`;
            q16.forEach(r => s16 += `| ${String(r.h).padStart(2, '0')}:00 | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("HOURLY_SUMMARY", sfx, "ช่วงเวลายอดนิยม", s16);

            // ── 6.17 TOP_HIGH_RISK_UNIVERSITIES ──
            const q17 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT b.university_id, AVG(bo.booking_outcome_risk_level)::numeric(3,1) AS avg_risk, COUNT(*)::bigint AS c FROM booking b JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id WHERE ${bdf} AND bo.booking_outcome_risk_level IS NOT NULL GROUP BY b.university_id HAVING COUNT(*) >= 5 ORDER BY avg_risk DESC LIMIT 20) SELECT u.university_name_th, t.avg_risk, t.c FROM t JOIN university u ON u.university_id = t.university_id ORDER BY t.avg_risk DESC`);
            let s17 = `${dateLabel}\n\n### � Top 20 มหาวิทยาลัยที่มีความเสี่ยงเฉลี่ยสูงสุด\n\n| อันดับ | มหาวิทยาลัย | ความเสี่ยงเฉลี่ย | จำนวนเคส |\n|---|---|---|---|\n`;
            q17.forEach((r, i) => s17 += `| ${i + 1} | **${r.university_name_th}** | ${Number(r.avg_risk).toFixed(1)}/5.0 | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_HIGH_RISK_UNIVERSITIES", sfx, "มหาลัยเสี่ยงสูง", s17);

            // ── 6.18 TOP_HIGH_RISK_STUDENTS ──
            const q18 = await prisma.$queryRawUnsafe<any[]>(`WITH t AS (SELECT b.student_id, b.university_id, MAX(bo.booking_outcome_risk_level) AS max_risk, COUNT(*)::bigint AS c FROM booking b JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id WHERE ${bdf} AND bo.booking_outcome_risk_level >= 4 GROUP BY b.student_id, b.university_id ORDER BY max_risk DESC, c DESC LIMIT 20) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, t.max_risk, t.c FROM t JOIN student_profile sp ON sp.student_id = t.student_id AND sp.university_id = t.university_id JOIN university u ON u.university_id = t.university_id ORDER BY t.max_risk DESC, t.c DESC`);
            let s18 = `${dateLabel}\n\n### 🚨 นิสิต/นักศึกษาที่มีความเสี่ยงสูง (ระดับ 4-5)\n\n| อันดับ | ชื่อ-นามสกุล | มหาวิทยาลัย | ระดับเสี่ยงสูงสุด | จำนวนเคส |\n|---|---|---|---|---|\n`;
            q18.forEach((r, i) => s18 += `| ${i + 1} | **${r.student_first_name_th} ${r.student_last_name_th}** | ${r.university_name_th} | ${riskLabels[Number(r.max_risk)] || r.max_risk} | ${Number(r.c).toLocaleString()} |\n`);
            pushLookup("TOP_HIGH_RISK_STUDENTS", sfx, "นิสิตเสี่ยงสูง", s18);
        }

        console.log(`[CRON] Total ops: ${ops.length}`);

        if (ops.length > 0) {
            await collection.bulkWrite(ops as Parameters<typeof collection.bulkWrite>[0]);
        }

        return NextResponse.json({ success: true, message: `Synced AI RAG context docs: ${ops.length}` });
    } catch (err: any) {
        console.error("[CRON sync-ai-context] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
