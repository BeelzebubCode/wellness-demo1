/**
 * Hard questions test — multi-join + 7-year historical
 * Usage: npx tsx scripts/test-hard-questions.ts
 */

import { runAnalytics } from "../src/services/ai-agent/analyst/engine";

const QUESTIONS = [
    "สาเหตุการยกเลิกที่พบมากสุดคืออะไร ใน 1 ปี",
    "มหาวิทยาลัยในภาคเหนือ มหาลัยไหนมีปัญหาการเงินมากสุด ขอ Top 5 ทั้งหมด",
    "แนวโน้มการจองรายปีย้อนหลัง 7 ปี แต่ละปีมีการจองกี่ครั้ง ทั้งหมด",
    "มหาวิทยาลัยไหนมีอัตราการยกเลิกสูงสุด ขอ Top 10 ทั้งหมด",
];

const scope = { university_id: undefined, role: "MINISTRY" };

async function main() {
    for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        console.log(`\n${"═".repeat(80)}`);
        console.log(`  Q${i + 1}: ${q}`);
        console.log(`${"═".repeat(80)}`);

        const t = Date.now();
        try {
            const answer = await runAnalytics(q, scope, []);
            const s = ((Date.now() - t) / 1000).toFixed(1);
            const ok = answer.length > 20 && !answer.includes("ไม่สามารถประมวลผล");
            console.log(`\n  ${ok ? "✅" : "❌"} ${ok ? "PASS" : "FAIL"} (${s}s, ${answer.length} chars)`);
            console.log(`\n  ${answer.substring(0, 800).replace(/\n/g, "\n  ")}`);
            if (answer.length > 800) console.log(`  ... (${answer.length - 800} more)`);
        } catch (err: any) {
            console.error(`\n  ❌ ERROR (${((Date.now() - t) / 1000).toFixed(1)}s): ${err.message}`);
        }
    }
}

main().catch(console.error);
