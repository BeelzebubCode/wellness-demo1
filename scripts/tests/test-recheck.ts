/**
 * Quick re-test: verify year formatting + cancellation rate query
 * Usage: npx tsx scripts/test-recheck.ts
 */
import { runAnalytics } from "../src/services/ai-agent/analyst/engine";

const QUESTIONS = [
    "แนวโน้มการจองรายปีย้อนหลัง 7 ปี แต่ละปีมีการจองกี่ครั้ง ทั้งหมด",
    "มหาวิทยาลัยไหนมีอัตราการยกเลิกสูงสุดเป็นกี่เปอร์เซ็นต์ ขอ Top 10 ทั้งหมด",
    "ที่ปรึกษาคนไหนรับเคสมากสุด ชื่อ เบอร์โทร มหาลัย ขอ Top 5 ใน 1 ปี",
    "นิสิตที่มีความเสี่ยงสูง ชื่ออะไร คณะ อาจารย์ที่ปรึกษาชื่อ เบอร์ ขอ Top 5 ทั้งหมด",
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
            console.log(`\n  ${ok ? "✅" : "❌"} ${ok ? "PASS" : "FAIL"} (${s}s)`);
            console.log(`\n${answer.substring(0, 1000)}`);
            if (answer.length > 1000) console.log(`... (${answer.length - 1000} more)`);
        } catch (err: any) {
            console.error(`\n  ❌ ERROR: ${err.message}`);
        }
    }
}
main().catch(console.error);
