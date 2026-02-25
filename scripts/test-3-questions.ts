import { runAnalytics } from "../src/services/ai-agent/analyst/orchestrator";

const QUESTIONS = [
  "นิสิตคนไหนปรึกษามากสุด 10อันดับแรกพร้อมชื่อและมหาลัย คณะ สาขา ที่อยู่",
  "นิสิตคนไหนปรึกษามากสุด 10อันดับแรกพร้อมชื่อและมหาลัย",
  "คณะไหนมีความเครียด (ยอดจอง) สูงสุด 3 อันดับแรก?"
];

async function main() {
  for (const q of QUESTIONS) {
    console.log(`\n=== Q: ${q} ===`);
    try {
      const answer = await runAnalytics(q, { role: "MINISTRY" }, []);
      console.log(`\n[ANSWER]\n${answer}`);
    } catch (e: any) {
      console.error(`[ERROR] ${e.message}`);
    }
  }
}

main().catch(console.error);
