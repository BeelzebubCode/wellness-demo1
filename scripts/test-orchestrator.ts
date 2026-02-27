/**
 * Test harness for 2-Model Analytics Orchestrator
 * Runs 10 minister-level questions and logs Model A intent, Model B SQL, and final answer.
 * Usage: npx tsx scripts/test-orchestrator.ts
 */

import { runAnalytics } from "../src/services/ai-agent/analyst/engine";

const QUESTIONS = [
    "ภาคไหนเครียดสุด (มีการจองปรึกษามากสุด)",
    "มหาวิทยาลัยไหนมีนิสิตเข้าปรึกษามากที่สุด ขอ Top 5",
    "นิสิตที่มีความเสี่ยงสูงสุดคือใคร ชื่ออะไร อยู่มหาลัยไหน",
    "สัดส่วนการจองที่สำเร็จ vs ยกเลิก เป็นอย่างไร",
    "ปัญหาที่นิสิตมาปรึกษามากที่สุด 5 อันดับแรก คือเรื่องอะไร",
    "แยกตามเพศ เพศไหนจองปรึกษามากที่สุด",
    "ที่ปรึกษาคนไหนรับเคสที่สำเร็จมากสุด ขอ Top 3 พร้อมชื่อและมหาลัย",
    "ภาคกลางตอนบน มีมหาลัยอะไรบ้าง และแต่ละมหาลัยมียอดจองเท่าไร ขอ Top 5",
    "เดือนไหนมีการจองมากที่สุด ขอ Top 3 เดือน",
    "ภาคไหนเครียดสุด เป็นมหาลัยอะไร นิสิตคนที่เสี่ยงมากสุดคือใคร ชื่ออะไร ขอ student_id ด้วย",
];

const scope = { university_id: undefined, role: "MINISTRY" };

async function main() {
    for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        console.log(`\n${"=".repeat(80)}`);
        console.log(`Q${i + 1}: ${q}`);
        console.log("=".repeat(80));

        try {
            const answer = await runAnalytics(q, scope, []);
            console.log(`\n--- ANSWER ---`);
            console.log(answer);
        } catch (err: any) {
            console.error(`[ERROR] Q${i + 1}: ${err.message}`);
        }

        console.log(`\n${"─".repeat(80)}`);
    }
}

main().catch(console.error);
