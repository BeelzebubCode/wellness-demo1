/**
 * Comprehensive AI Analyst Engine Test
 * Tests the refactored engine with challenging questions including 7-year data.
 * Usage: npx tsx scripts/test-analyst-engine.ts
 */

import { runAnalytics } from "../src/services/ai-agent/analyst/engine";

const QUESTIONS = [
    // ── Simple (should hit keyword-router / cache) ──
    "ภาพรวมการจองทั้งหมดเป็นอย่างไร",
    "ประเภทปัญหาที่พบมากสุดคืออะไร",

    // ── Medium (SQL pipeline) ──
    "นิสิตคนไหนจองปรึกษามากสุด 5 อันดับ ชื่อ คณะ สาขา มหาลัย",
    "สัดส่วน Onsite vs Online เป็นกี่เปอร์เซ็นต์ ใน 1 ปี",
    "สาเหตุการยกเลิกที่พบมากสุดคืออะไร ใน 1 ปี",

    // ── Hard (multi-join, scoped) ──
    "มหาวิทยาลัยในภาคเหนือ มหาลัยไหนมีปัญหาการเงินมากสุด ขอ Top 5",
    "ที่ปรึกษาคนไหนรับเคสมากสุด ชื่อ เบอร์โทร มหาลัย ขอ Top 5 ใน 1 ปี",
    "นิสิตที่มีความเสี่ยงสูง (risk level >= 4) ชื่ออะไร คณะ สาขา อาจารย์ที่ปรึกษาชื่อ เบอร์ ขอ Top 10 ทั้งหมด",

    // ── 7-Year Historical Data ──
    "แนวโน้มการจองรายปีย้อนหลัง 7 ปี แต่ละปีมีการจองกี่ครั้ง ทั้งหมด",
    "ปัญหาอะไรที่เพิ่มขึ้นมากที่สุดในรอบ 7 ปี เปรียบเทียบปีแรกกับปีล่าสุด ทั้งหมด",
    "มหาวิทยาลัยไหนมีอัตราการยกเลิกสูงสุดใน 7 ปี ทั้งหมด",
];

const scope = { university_id: undefined, role: "MINISTRY" };

async function main() {
    console.log(`\n${"█".repeat(80)}`);
    console.log(`  AI ANALYST ENGINE TEST — ${new Date().toISOString()}`);
    console.log(`${"█".repeat(80)}\n`);

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        console.log(`\n${"═".repeat(80)}`);
        console.log(`  Q${i + 1}/${QUESTIONS.length}: ${q}`);
        console.log(`${"═".repeat(80)}`);

        const startTime = Date.now();
        try {
            const answer = await runAnalytics(q, scope, []);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            // Basic validation
            const hasContent = answer.length > 20;
            const noError = !answer.includes("ไม่สามารถประมวลผล") && !answer.includes("Database Error");
            const noEmpty = !answer.includes("ไม่พบข้อมูล") || answer.includes("ลองพูดว่า");
            const ok = hasContent && noError;

            if (ok) {
                passed++;
                console.log(`\n  ✅ PASS (${elapsed}s, ${answer.length} chars)`);
            } else {
                failed++;
                console.log(`\n  ❌ FAIL (${elapsed}s, ${answer.length} chars)`);
            }

            // Print first 500 chars of answer
            console.log(`\n  --- ANSWER (first 500 chars) ---`);
            console.log(`  ${answer.substring(0, 500).replace(/\n/g, "\n  ")}`);
            if (answer.length > 500) console.log(`  ... (${answer.length - 500} more chars)`);
        } catch (err: any) {
            failed++;
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.error(`\n  ❌ ERROR (${elapsed}s): ${err.message}`);
        }

        console.log(`\n${"─".repeat(80)}`);
    }

    console.log(`\n${"█".repeat(80)}`);
    console.log(`  RESULTS: ${passed}/${QUESTIONS.length} PASSED, ${failed} FAILED`);
    console.log(`${"█".repeat(80)}\n`);
}

main().catch(console.error);
