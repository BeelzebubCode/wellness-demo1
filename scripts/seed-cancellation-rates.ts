// scripts/seed-cancellation-rates.ts
// Converts existing COMPLETED bookings → CANCELLED to reach target cancel rates:
// Bangkok: 9-13%, Other provinces: 4-9%
// Uses pure SQL for speed on large datasets
import prisma from "../src/lib/prisma";

async function main() {
    const START = "2025-02-26";
    const END = "2026-02-27";

    console.log("╔═══════════════════════════════════════════════╗");
    console.log("║  Seed Cancellation Rates                     ║");
    console.log("║  BKK: 11% target | Other: 6.5% target       ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    // Step 1: Get current stats
    const stats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            CASE WHEN p.province_name_th = 'กรุงเทพมหานคร' THEN 'BKK' ELSE 'OTHER' END AS area,
            COUNT(*)::int AS total,
            COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END)::int AS cancelled
        FROM booking b
        JOIN university u ON u.university_id = b.university_id
        JOIN province p ON p.province_id = u.province_id
        WHERE b.booking_created_at >= '${START}' AND b.booking_created_at < '${END}'
        GROUP BY area
    `);

    const bkk = stats.find(s => s.area === "BKK")!;
    const other = stats.find(s => s.area === "OTHER")!;

    console.log("Current state:");
    console.log(`  BKK:   ${bkk.cancelled}/${bkk.total} = ${(bkk.cancelled / bkk.total * 100).toFixed(2)}%`);
    console.log(`  OTHER: ${other.cancelled}/${other.total} = ${(other.cancelled / other.total * 100).toFixed(2)}%`);

    // Target: BKK 11% (midpoint of 9-13%), Other 6.5% (midpoint of 4-9%)
    const bkkTarget = Math.round(bkk.total * 0.11);
    const otherTarget = Math.round(other.total * 0.065);
    const bkkNeeded = Math.max(0, bkkTarget - bkk.cancelled);
    const otherNeeded = Math.max(0, otherTarget - other.cancelled);

    console.log(`\nTarget cancellations:`);
    console.log(`  BKK:   ${bkkTarget} (need ${bkkNeeded} more) → ~11%`);
    console.log(`  OTHER: ${otherTarget} (need ${otherNeeded} more) → ~6.5%`);

    if (bkkNeeded === 0 && otherNeeded === 0) {
        console.log("\n✅ Already at target rates. Nothing to do.");
        await prisma.$disconnect();
        return;
    }

    // Step 2: Convert COMPLETED → CANCELLED for BKK universities
    if (bkkNeeded > 0) {
        console.log(`\n[1/4] Converting ${bkkNeeded} BKK bookings to CANCELLED...`);
        const bkkResult = await prisma.$executeRawUnsafe(`
            UPDATE booking
            SET booking_status = 'CANCELLED'
            WHERE booking_id IN (
                SELECT b.booking_id
                FROM booking b
                JOIN university u ON u.university_id = b.university_id
                JOIN province p ON p.province_id = u.province_id
                WHERE p.province_name_th = 'กรุงเทพมหานคร'
                  AND b.booking_status = 'COMPLETED'
                  AND b.booking_created_at >= '${START}'
                  AND b.booking_created_at < '${END}'
                ORDER BY RANDOM()
                LIMIT ${bkkNeeded}
            )
        `);
        console.log(`  ✅ Updated ${bkkResult} rows`);
    }

    // Step 3: Convert COMPLETED → CANCELLED for OTHER universities
    if (otherNeeded > 0) {
        console.log(`[2/4] Converting ${otherNeeded} OTHER bookings to CANCELLED...`);
        const otherResult = await prisma.$executeRawUnsafe(`
            UPDATE booking
            SET booking_status = 'CANCELLED'
            WHERE booking_id IN (
                SELECT b.booking_id
                FROM booking b
                JOIN university u ON u.university_id = b.university_id
                JOIN province p ON p.province_id = u.province_id
                WHERE p.province_name_th != 'กรุงเทพมหานคร'
                  AND b.booking_status = 'COMPLETED'
                  AND b.booking_created_at >= '${START}'
                  AND b.booking_created_at < '${END}'
                ORDER BY RANDOM()
                LIMIT ${otherNeeded}
            )
        `);
        console.log(`  ✅ Updated ${otherResult} rows`);
    }

    // Step 4: Insert booking_cancellation records for new CANCELLED bookings without one
    console.log(`[3/4] Creating booking_cancellation records...`);
    const cancelResult = await prisma.$executeRawUnsafe(`
        INSERT INTO booking_cancellation (
            booking_id,
            university_id,
            cancellation_reason_id,
            booking_cancellation_cancelled_by_id,
            booking_cancellation_cancelled_at,
            booking_cancellation_note
        )
        SELECT 
            b.booking_id,
            b.university_id,
            -- Random reason 1-6 with weighted distribution:
            -- 1=Schedule 35%, 2=Feeling Better 20%, 3=Emergency 15%, 4=Wrong 10%, 5=Location 10%, 6=Other 10%
            CASE 
                WHEN r < 0.35 THEN 1
                WHEN r < 0.55 THEN 2
                WHEN r < 0.70 THEN 3
                WHEN r < 0.80 THEN 4
                WHEN r < 0.90 THEN 5
                ELSE 6
            END,
            b.student_id,  -- cancelled by student
            b.booking_created_at + interval '1 hour' * (1 + RANDOM() * 23),  -- cancelled 1-24h after booking
            NULL
        FROM booking b
        LEFT JOIN booking_cancellation bc ON bc.booking_id = b.booking_id AND bc.university_id = b.university_id
        CROSS JOIN LATERAL (SELECT RANDOM() AS r) AS rand
        WHERE b.booking_status = 'CANCELLED'
          AND b.booking_created_at >= '${START}'
          AND b.booking_created_at < '${END}'
          AND bc.booking_id IS NULL
    `);
    console.log(`  ✅ Inserted ${cancelResult} cancellation records`);

    // Step 5: Verify final rates
    console.log(`[4/4] Verifying final rates...`);
    const finalStats = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            CASE WHEN p.province_name_th = 'กรุงเทพมหานคร' THEN 'BKK' ELSE 'OTHER' END AS area,
            COUNT(*)::int AS total,
            COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END)::int AS cancelled,
            ROUND(COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(*), 2) AS cancel_pct
        FROM booking b
        JOIN university u ON u.university_id = b.university_id
        JOIN province p ON p.province_id = u.province_id
        WHERE b.booking_created_at >= '${START}' AND b.booking_created_at < '${END}'
        GROUP BY area
        ORDER BY area
    `);
    console.log("\n═══ Final Cancellation Rates ═══");
    finalStats.forEach(s => {
        const emoji = s.area === "BKK"
            ? (s.cancel_pct >= 9 && s.cancel_pct <= 13 ? "✅" : "⚠️")
            : (s.cancel_pct >= 4 && s.cancel_pct <= 9 ? "✅" : "⚠️");
        console.log(`  ${emoji} ${s.area}: ${s.cancelled}/${s.total} = ${s.cancel_pct}%`);
    });

    // Check daily minimums
    const dailyCheck = await prisma.$queryRawUnsafe<any[]>(`
        SELECT booking_created_at::date AS day, COUNT(*)::int AS cnt
        FROM booking
        WHERE booking_created_at >= '${START}' AND booking_created_at < '${END}'
        GROUP BY day
        HAVING COUNT(*) < 4
        ORDER BY cnt ASC
        LIMIT 5
    `);
    if (dailyCheck.length === 0) {
        console.log("  ✅ All days have ≥4 bookings");
    } else {
        console.log(`  ⚠️ ${dailyCheck.length} days have <4 bookings`);
        console.table(dailyCheck);
    }

    // Check no future dates
    const futureCheck = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int AS future_count
        FROM booking
        WHERE booking_created_at > NOW()
    `);
    console.log(`  ${futureCheck[0].future_count === 0 ? "✅" : "⚠️"} Future bookings: ${futureCheck[0].future_count}`);

    console.log("\n🎉 Done!");
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
