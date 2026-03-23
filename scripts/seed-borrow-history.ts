/**
 * seed-borrow-history.ts
 * Seeds realistic borrowing history data from 2019-01 to 2026-03
 *
 * Usage: npx tsx scripts/seed-borrow-history.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
function weightedPick<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
}

// Problem categories with borrowing frequency weights
const PROBLEM_WEIGHTS: { id: number; name: string; weight: number }[] = [
    { id: 6, name: "สุขภาพจิต/อารมณ์", weight: 25 },
    { id: 2, name: "ความเครียด", weight: 20 },
    { id: 7, name: "สารเสพติด/การเสพติด", weight: 15 },
    { id: 3, name: "ความสัมพันธ์", weight: 10 },
    { id: 8, name: "ครอบครัว", weight: 8 },
    { id: 11, name: "ถูกรังแก/ความรุนแรง", weight: 6 },
    { id: 1, name: "ปัญหาการเรียน", weight: 5 },
    { id: 15, name: "การสูญเสีย/ความโศกเศร้า", weight: 4 },
    { id: 4, name: "การปรับตัว", weight: 3 },
    { id: 12, name: "เพศสัมพันธ์/อัตลักษณ์", weight: 2 },
    { id: 5, name: "ปัญหาการเงิน", weight: 1 },
    { id: 9, name: "สุขภาพกาย", weight: 1 },
];

const BORROW_REASONS = [
    "ที่ปรึกษาเฉพาะทางไม่เพียงพอ ต้องการผู้เชี่ยวชาญด้าน{PROBLEM}",
    "นิสิตมีปัญหา{PROBLEM}จำนวนมาก ต้องการที่ปรึกษาเพิ่มเติม",
    "ที่ปรึกษาลาพักร้อน ต้องการยืมตัวเพื่อรองรับเคส{PROBLEM}",
    "เคสวิกฤตด้าน{PROBLEM}เพิ่มขึ้น จำเป็นต้องได้ผู้เชี่ยวชาญ",
    "มีกิจกรรมให้คำปรึกษาด้าน{PROBLEM}ช่วงสอบ ต้องการกำลังเสริม",
    "ต้องการที่ปรึกษาช่วยดูแลนิสิตที่มีปัญหา{PROBLEM}ระดับรุนแรง",
];

// Status distribution
type BorrowStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
const STATUS_DIST: { status: BorrowStatus; weight: number }[] = [
    { status: "COMPLETED", weight: 55 },
    { status: "ASSIGNED", weight: 12 },
    { status: "APPROVED", weight: 10 },
    { status: "SUBMITTED", weight: 5 },
    { status: "REJECTED", weight: 8 },
    { status: "CANCELLED", weight: 5 },
    { status: "DRAFT", weight: 5 },
];

// Generate date in range
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
    console.log("🚀 Seeding borrowing history...");

    // 1. Load universities and their consultants + accounts
    const universities = await prisma.$queryRaw<
        { university_id: number; university_code: string; university_name_th: string; consult_count: number; province_id: number }[]
    >`
    SELECT u.university_id, u.university_code, u.university_name_th, u.province_id,
      (SELECT COUNT(*)::int FROM consultant c WHERE c.university_id = u.university_id) AS consult_count
    FROM university u
    WHERE u.university_is_active = true
    ORDER BY university_id
  `;

    console.log(`  📌 Found ${universities.length} universities`);

    // Get accounts per university (HEAD_OF_CONSULTANT or any account)
    const accountMap = new Map<number, number>();
    const accounts = await prisma.$queryRaw<{ account_id: number; account_home_university_id: number }[]>`
    SELECT DISTINCT ON (account_home_university_id)
      account_id, account_home_university_id
    FROM account
    WHERE account_home_university_id IS NOT NULL
    ORDER BY account_home_university_id, account_id
  `;
    for (const a of accounts) {
        accountMap.set(a.account_home_university_id, a.account_id);
    }

    // Get consultants per university
    const consultants = await prisma.$queryRaw<{ consultant_id: number; university_id: number }[]>`
    SELECT consultant_id, university_id FROM consultant ORDER BY university_id, consultant_id
  `;
    const consultByUni = new Map<number, number[]>();
    for (const c of consultants) {
        if (!consultByUni.has(c.university_id)) consultByUni.set(c.university_id, []);
        consultByUni.get(c.university_id)!.push(c.consultant_id);
    }

    // Weight universities by size (more consultants = more likely to borrow AND be borrowed from)
    const uniWeights = universities.map((u) => Math.max(u.consult_count, 1));
    const smallUnis = universities.filter((u) => u.consult_count <= 10);
    const mediumUnis = universities.filter((u) => u.consult_count > 10 && u.consult_count <= 30);
    const largeUnis = universities.filter((u) => u.consult_count > 30);

    console.log(`  📊 Small: ${smallUnis.length}, Medium: ${mediumUnis.length}, Large: ${largeUnis.length}`);

    // Province-based proximity: same province or nearby
    const provinceToUnis = new Map<number, typeof universities>();
    for (const u of universities) {
        if (!provinceToUnis.has(u.province_id)) provinceToUnis.set(u.province_id, []);
        provinceToUnis.get(u.province_id)!.push(u);
    }

    // 2. Generate borrow requests
    const TARGET_REQUESTS = 2000;
    const startDate = new Date("2019-01-01");
    const endDate = new Date("2026-03-15");

    // Yearly distribution (more recent = more borrowing)
    const yearWeights: Record<number, number> = {
        2019: 80, 2020: 100, 2021: 140, 2022: 200,
        2023: 320, 2024: 450, 2025: 500, 2026: 210,
    };

    const requestBatch: any[] = [];
    const assignmentBatch: any[] = [];
    let requestIdCounter = 100; // Start after existing data

    console.log("  ⏳ Generating borrow requests...");

    for (let i = 0; i < TARGET_REQUESTS; i++) {
        // Pick year with weight
        const years = Object.keys(yearWeights).map(Number);
        const yWeights = years.map((y) => yearWeights[y]);
        const year = weightedPick(years, yWeights);

        const yearStart = new Date(`${year}-01-01`);
        const yearEnd = year === 2026 ? new Date("2026-03-15") : new Date(`${year}-12-31`);
        const createdAt = randomDate(yearStart, yearEnd);

        // Pick requesting university (small/medium borrow more often)
        const fromUni = weightedPick(
            universities,
            universities.map((u) => (u.consult_count <= 10 ? 5 : u.consult_count <= 30 ? 3 : 1))
        );

        // Pick target university (large ones get borrowed from more, prefer same province)
        const sameProvince = provinceToUnis.get(fromUni.province_id)?.filter((u) => u.university_id !== fromUni.university_id) || [];
        let toUni: typeof fromUni;
        if (sameProvince.length > 0 && Math.random() < 0.4) {
            toUni = pick(sameProvince);
        } else {
            // Prefer large universities
            const candidates = universities.filter((u) => u.university_id !== fromUni.university_id);
            toUni = weightedPick(
                candidates,
                candidates.map((u) => Math.max(u.consult_count, 1))
            );
        }

        const fromAccountId = accountMap.get(fromUni.university_id);
        const toAccountId = accountMap.get(toUni.university_id);
        if (!fromAccountId || !toAccountId) continue;

        // Pick problem category
        const problem = weightedPick(
            PROBLEM_WEIGHTS,
            PROBLEM_WEIGHTS.map((p) => p.weight)
        );

        // Pick status
        const status = weightedPick(
            STATUS_DIST.map((s) => s.status),
            STATUS_DIST.map((s) => s.weight)
        );

        // Duration: 2-14 days
        const durationDays = rand(2, 14);
        const neededFrom = new Date(createdAt);
        neededFrom.setDate(neededFrom.getDate() + rand(3, 14)); // starts 3-14 days after request
        const neededTo = new Date(neededFrom);
        neededTo.setDate(neededTo.getDate() + durationDays);

        const reason = pick(BORROW_REASONS).replace(/\{PROBLEM\}/g, problem.name);

        // Submit timing
        const submittedAt = status !== "DRAFT" ? new Date(createdAt.getTime() + rand(1, 3) * 3600000) : null;
        const approvedAt = ["APPROVED", "ASSIGNED", "COMPLETED"].includes(status) && submittedAt
            ? new Date(submittedAt.getTime() + rand(4, 48) * 3600000) : null;
        const rejectedAt = status === "REJECTED" && submittedAt
            ? new Date(submittedAt.getTime() + rand(4, 72) * 3600000) : null;

        const reqId = requestIdCounter++;

        requestBatch.push({
            borrow_request_id: reqId,
            from_university_id: fromUni.university_id,
            requested_by_account_id: fromAccountId,
            borrow_request_title: problem.name,
            borrow_request_reason: reason,
            borrow_needed_from: neededFrom,
            borrow_needed_to: neededTo,
            borrow_needed_count: rand(1, 3),
            borrow_request_status: status,
            borrow_submitted_at: submittedAt,
            borrow_submitted_by_account_id: submittedAt ? fromAccountId : null,
            borrow_approved_at: approvedAt,
            borrow_approved_by_account_id: approvedAt ? toAccountId : null,
            borrow_rejected_at: rejectedAt,
            borrow_rejected_by_account_id: rejectedAt ? toAccountId : null,
            borrow_reject_reason: rejectedAt ? "ที่ปรึกษาไม่ว่าง / เต็มกำลัง" : null,
            borrow_request_created_at: createdAt,
            borrow_request_updated_at: approvedAt || rejectedAt || submittedAt || createdAt,
        });

        // Create assignment for ASSIGNED/COMPLETED
        if (["ASSIGNED", "COMPLETED"].includes(status) && approvedAt) {
            const toConsultants = consultByUni.get(toUni.university_id);
            if (toConsultants && toConsultants.length > 0) {
                const consultId = pick(toConsultants);
                assignmentBatch.push({
                    borrow_request_id: reqId,
                    consultant_id: consultId,
                    consultant_university_id: toUni.university_id,
                    borrow_assign_start_at: neededFrom,
                    borrow_assign_end_at: neededTo,
                    borrow_assigned_by_account_id: toAccountId,
                    borrow_assigned_at: new Date(approvedAt.getTime() + rand(1, 24) * 3600000),
                });
            }
        }
    }

    console.log(`  📝 Generated ${requestBatch.length} requests, ${assignmentBatch.length} assignments`);

    // 3. Insert in batches using raw SQL for speed
    console.log("  💾 Inserting borrow requests...");

    // Reset sequence
    await prisma.$executeRawUnsafe(`SELECT setval('borrow_request_borrow_request_id_seq', (SELECT COALESCE(MAX(borrow_request_id), 0) + 1 FROM borrow_request), false)`);

    const BATCH_SIZE = 200;
    for (let i = 0; i < requestBatch.length; i += BATCH_SIZE) {
        const batch = requestBatch.slice(i, i + BATCH_SIZE);
        const values = batch.map((r) => {
            return `(
        ${r.borrow_request_id},
        ${r.from_university_id},
        ${r.requested_by_account_id},
        '${r.borrow_request_title.replace(/'/g, "''")}',
        '${r.borrow_request_reason.replace(/'/g, "''")}',
        ${r.borrow_needed_from ? `'${r.borrow_needed_from.toISOString()}'` : "NULL"},
        ${r.borrow_needed_to ? `'${r.borrow_needed_to.toISOString()}'` : "NULL"},
        ${r.borrow_needed_count},
        '${r.borrow_request_status}'::"BorrowRequestStatus",
        ${r.borrow_submitted_at ? `'${r.borrow_submitted_at.toISOString()}'` : "NULL"},
        ${r.borrow_submitted_by_account_id || "NULL"},
        ${r.borrow_approved_at ? `'${r.borrow_approved_at.toISOString()}'` : "NULL"},
        ${r.borrow_approved_by_account_id || "NULL"},
        ${r.borrow_rejected_at ? `'${r.borrow_rejected_at.toISOString()}'` : "NULL"},
        ${r.borrow_rejected_by_account_id || "NULL"},
        ${r.borrow_reject_reason ? `'${r.borrow_reject_reason.replace(/'/g, "''")}'` : "NULL"},
        '${r.borrow_request_created_at.toISOString()}',
        '${r.borrow_request_updated_at.toISOString()}'
      )`;
        }).join(",\n");

        await prisma.$executeRawUnsafe(`
      INSERT INTO borrow_request (
        borrow_request_id, from_university_id, requested_by_account_id,
        borrow_request_title, borrow_request_reason,
        borrow_needed_from, borrow_needed_to, borrow_needed_count,
        borrow_request_status,
        borrow_submitted_at, borrow_submitted_by_account_id,
        borrow_approved_at, borrow_approved_by_account_id,
        borrow_rejected_at, borrow_rejected_by_account_id,
        borrow_reject_reason,
        borrow_request_created_at, borrow_request_updated_at
      ) VALUES ${values}
      ON CONFLICT (borrow_request_id) DO NOTHING
    `);
        process.stdout.write(`\r    Requests: ${Math.min(i + BATCH_SIZE, requestBatch.length)}/${requestBatch.length}`);
    }
    console.log("\n  ✅ Borrow requests inserted");

    // Fix sequence
    await prisma.$executeRawUnsafe(`SELECT setval('borrow_request_borrow_request_id_seq', (SELECT MAX(borrow_request_id) FROM borrow_request))`);

    // 4. Insert assignments
    console.log("  💾 Inserting borrow assignments...");
    for (let i = 0; i < assignmentBatch.length; i += BATCH_SIZE) {
        const batch = assignmentBatch.slice(i, i + BATCH_SIZE);
        const values = batch.map((a) => {
            return `(
        ${a.borrow_request_id},
        ${a.consultant_id},
        ${a.consultant_university_id},
        '${a.borrow_assign_start_at.toISOString()}',
        '${a.borrow_assign_end_at.toISOString()}',
        ${a.borrow_assigned_by_account_id},
        '${a.borrow_assigned_at.toISOString()}'
      )`;
        }).join(",\n");

        await prisma.$executeRawUnsafe(`
      INSERT INTO borrow_assignment (
        borrow_request_id, consultant_id, consultant_university_id,
        borrow_assign_start_at, borrow_assign_end_at,
        borrow_assigned_by_account_id, borrow_assigned_at
      ) VALUES ${values}
      ON CONFLICT (borrow_request_id, consultant_id) DO NOTHING
    `);
        process.stdout.write(`\r    Assignments: ${Math.min(i + BATCH_SIZE, assignmentBatch.length)}/${assignmentBatch.length}`);
    }
    console.log("\n  ✅ Borrow assignments inserted");

    // 5. Verify
    const totalReq = await prisma.borrowRequest.count();
    const totalAssign = await prisma.borrowAssignment.count();
    const statusDist = await prisma.$queryRaw<{ borrow_request_status: string; c: bigint }[]>`
    SELECT borrow_request_status, COUNT(*)::bigint AS c FROM borrow_request GROUP BY borrow_request_status ORDER BY c DESC
  `;
    const topBorrowers = await prisma.$queryRaw<{ from_university_id: number; name: string; c: bigint }[]>`
    SELECT br.from_university_id, u.university_name_th AS name, COUNT(*)::bigint AS c
    FROM borrow_request br JOIN university u ON u.university_id = br.from_university_id
    GROUP BY br.from_university_id, u.university_name_th
    ORDER BY c DESC LIMIT 10
  `;
    const topProblems = await prisma.$queryRaw<{ title: string; c: bigint }[]>`
    SELECT borrow_request_title AS title, COUNT(*)::bigint AS c
    FROM borrow_request GROUP BY borrow_request_title ORDER BY c DESC LIMIT 5
  `;

    console.log("\n📊 Summary:");
    console.log(`  Total Requests: ${totalReq}`);
    console.log(`  Total Assignments: ${totalAssign}`);
    console.log("  Status Distribution:");
    statusDist.forEach((s) => console.log(`    ${s.borrow_request_status}: ${s.c}`));
    console.log("  Top 10 Borrowing Universities:");
    topBorrowers.forEach((b, i) => console.log(`    ${i + 1}. ${b.name}: ${b.c}`));
    console.log("  Top 5 Problem Categories:");
    topProblems.forEach((p) => console.log(`    ${p.title}: ${p.c}`));

    console.log("\n🎉 Done!");
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error("❌ Error:", e);
    prisma.$disconnect();
    process.exit(1);
});
