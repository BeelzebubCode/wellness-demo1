/**
 * Full speed + accuracy test — mixed easy/hard + 7-year queries
 * Target: ALL answers < 20 seconds, data reflects correct date range
 * Usage: npx tsx scripts/test-speed-accuracy.ts
 */
import { runAnalytics } from "../src/services/ai-agent/analyst/engine";

const QUESTIONS = [
    // ── Easy (cache) ──
    { q: "ประเภทปัญหาที่พบมากสุด", expect: "cache" },
    { q: "สถานะคิวทั้งหมดเป็นอย่างไร", expect: "cache" },

    // ── Medium (SQL, 1yr) ──
    { q: "Onsite กับ Online สัดส่วนเป็นอย่างไร ใน 1 ปี", expect: "sql" },
    { q: "เดือนไหนมีการจองมากที่สุด ใน 1 ปี", expect: "sql" },

    // ── Hard (SQL, multi-join) ──
    { q: "นิสิตคนไหนจองปรึกษามากสุด ชื่อ คณะ มหาลัย ขอ Top 5 ใน 1 ปี", expect: "sql" },
    { q: "ที่ปรึกษาคนไหนรับเคสมากสุด ชื่อ เบอร์โทร ขอ Top 5 ใน 1 ปี", expect: "sql" },

    // ── 7-Year Historical (CRITICAL) ──
    { q: "แนวโน้มการจองรายปี ย้อนหลัง 7 ปี", expect: "sql-7y" },
    { q: "สัดส่วน Onsite vs Online ใน 7 ปี", expect: "sql-7y" },
    { q: "ปัญหาที่พบมากสุด ใน 5 ปี ขอ Top 5", expect: "sql-5y" },
    { q: "มหาวิทยาลัยไหนมียอดจองสูงสุด ขอ Top 10 ใน 3 ปี", expect: "sql-3y" },
];

const scope = { university_id: undefined, role: "MINISTRY" };

async function main() {
    console.log(`\n${"█".repeat(80)}`);
    console.log(`  SPEED + ACCURACY TEST — Target: ALL < 20s`);
    console.log(`${"█".repeat(80)}\n`);

    let passed = 0, failed = 0, totalTime = 0;

    for (let i = 0; i < QUESTIONS.length; i++) {
        const { q, expect } = QUESTIONS[i];
        console.log(`\n${"═".repeat(80)}`);
        console.log(`  Q${i + 1}/${QUESTIONS.length} [${expect}]: ${q}`);
        console.log(`${"═".repeat(80)}`);

        const t = Date.now();
        try {
            const answer = await runAnalytics(q, scope, []);
            const elapsed = (Date.now() - t) / 1000;
            totalTime += elapsed;

            // Validate
            const hasContent = answer.length > 20;
            const noError = !answer.includes("ไม่สามารถประมวลผล");
            const under20s = elapsed < 20;

            // Check date range for 7y/5y/3y queries
            let dateOk = true;
            if (expect.includes("7y")) {
                // Should show year data going back to ~2019
                dateOk = answer.includes("2019") || answer.includes("2020") || answer.includes("2559") || answer.includes("2562") || answer.includes("2563");
                if (!dateOk) console.log(`  ⚠️ 7-YEAR CHECK: No historical year found in answer`);
            } else if (expect.includes("5y")) {
                dateOk = answer.includes("2021") || answer.includes("2022") || answer.includes("2564") || answer.includes("2565");
            } else if (expect.includes("3y")) {
                dateOk = answer.includes("2023") || answer.includes("2566");
            }

            const ok = hasContent && noError && dateOk;
            if (ok) passed++; else failed++;

            const icon = ok ? "✅" : "❌";
            const speedIcon = under20s ? "🚀" : "🐌";
            console.log(`\n  ${icon} ${ok ? "PASS" : "FAIL"} ${speedIcon} ${elapsed.toFixed(1)}s (${answer.length} chars)`);
            console.log(`\n${answer.substring(0, 600)}`);
            if (answer.length > 600) console.log(`... (${answer.length - 600} more)`);
        } catch (err: any) {
            failed++;
            const elapsed = (Date.now() - t) / 1000;
            totalTime += elapsed;
            console.error(`\n  ❌ ERROR (${elapsed.toFixed(1)}s): ${err.message}`);
        }
    }

    console.log(`\n${"█".repeat(80)}`);
    console.log(`  RESULTS: ${passed}/${QUESTIONS.length} PASS | ${failed} FAIL`);
    console.log(`  AVG TIME: ${(totalTime / QUESTIONS.length).toFixed(1)}s | TOTAL: ${totalTime.toFixed(1)}s`);
    console.log(`${"█".repeat(80)}\n`);
}

main().catch(console.error);
