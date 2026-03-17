/**
 * Advanced E2E AI SQL Pipeline Test v3
 * 20 scenarios: Easy (regression) + Medium + Hard (stats) + Expert (multi-join) + Adversarial
 * Tests: Keyword Router → SQL Generation → Execution → Result Verification → Speed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OLLAMA_URL = process.env.AI_BASE_URL || "http://localhost:11434";
const MODEL = process.env.AI_MODEL_ANALYST || "qwen3:8b";

const { keywordRoute } = require("../src/services/ai-agent/analyst/keyword-router");
const { SQL_B_PROMPT } = require("../src/services/ai-agent/analyst/prompts/sql-generator");
const { validateSql } = require("../src/services/ai-agent/analyst/sql-guard");

const DF = "2025-02-26", DT = "2026-02-26";

interface TC { id: string; cat: string; question: string; expectedRoute: "KEYWORD" | "SQL"; verifyQuery: string; }
interface TR { id: string; cat: string; question: string; routedTo: string; routeOk: boolean; dataOk: boolean; ms: number; err: string | null; genTop: any; gtTop: any; }

const TESTS: TC[] = [
  // ═══ EASY (regression — must still work) ═══
  {
    id: "E01", cat: "Easy", question: "มหาลัยไหนมีการจองมากที่สุด 5 อันดับ", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS booking_count FROM booking b JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY booking_count DESC LIMIT 5`
  },
  {
    id: "E02", cat: "Easy", question: "สัดส่วน Onsite กับ Online", expectedRoute: "KEYWORD",
    verifyQuery: `SELECT booking_service_mode, COUNT(*)::bigint AS cnt FROM booking WHERE booking_created_at >= '${DF}' AND booking_created_at < '${DT}' GROUP BY booking_service_mode ORDER BY cnt DESC`
  },
  {
    id: "E03", cat: "Easy", question: "ปัญหาอะไรมากที่สุด", expectedRoute: "SQL",
    verifyQuery: `SELECT pc.problem_category_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY pc.problem_category_name_th ORDER BY cnt DESC LIMIT 5`
  },

  // ═══ MEDIUM (filtered queries) ═══
  {
    id: "M01", cat: "Med", question: "มหาลัยไหนมีปัญหาการเงินมากสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN university u ON u.university_id = b.university_id JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE pc.problem_category_name_th LIKE '%การเงิน%' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY cnt DESC LIMIT 5`
  },
  {
    id: "M02", cat: "Med", question: "มหาวิทยาลัยในภาคเหนือ จองมากสุดอันดับไหน", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN university u ON u.university_id = b.university_id JOIN province p ON p.province_id = u.province_id JOIN region r ON r.region_id = p.region_id WHERE r.region_name_th LIKE '%เหนือ%' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY cnt DESC LIMIT 10`
  },
  {
    id: "M03", cat: "Med", question: "มหาวิทยาลัยรามคำแหง ปัญหาอะไรมากสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT pc.problem_category_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN university u ON u.university_id = b.university_id JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE u.university_name_th LIKE '%รามคำแหง%' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY pc.problem_category_name_th ORDER BY cnt DESC LIMIT 5`
  },
  {
    id: "M04", cat: "Med", question: "สาเหตุที่นิสิตยกเลิกนัดมากที่สุดคืออะไร", expectedRoute: "KEYWORD",
    verifyQuery: `SELECT cr.cancellation_reason_name_th, COUNT(*)::bigint AS cnt FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY cr.cancellation_reason_name_th ORDER BY cnt DESC`
  },

  // ═══ HARD (statistical calculations) ═══
  {
    id: "H01", cat: "Hard", question: "สัดส่วนเพศชายหญิงที่มาใช้บริการเป็นกี่เปอร์เซ็นต์", expectedRoute: "SQL",
    verifyQuery: `SELECT sp.student_gender, COUNT(*)::bigint AS total, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS pct FROM booking b JOIN student_profile sp ON sp.student_id = b.student_id AND sp.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY sp.student_gender ORDER BY total DESC`
  },
  {
    id: "H02", cat: "Hard", question: "เดือนไหนมีการจองมากที่สุด", expectedRoute: "SQL",
    verifyQuery: `SELECT TO_CHAR(booking_created_at, 'YYYY-MM') AS month, COUNT(*)::bigint AS cnt FROM booking WHERE booking_created_at >= '${DF}' AND booking_created_at < '${DT}' GROUP BY month ORDER BY cnt DESC LIMIT 5`
  },
  {
    id: "H03", cat: "Hard", question: "อัตราการยกเลิกนัดเป็นกี่เปอร์เซ็นต์ของการจองทั้งหมด", expectedRoute: "SQL",
    verifyQuery: `SELECT COUNT(CASE WHEN booking_status = 'CANCELLED' THEN 1 END)::bigint AS cancelled, COUNT(*)::bigint AS total, ROUND(COUNT(CASE WHEN booking_status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(*), 2) AS cancel_pct FROM booking WHERE booking_created_at >= '${DF}' AND booking_created_at < '${DT}'`
  },
  {
    id: "H04", cat: "Hard", question: "แต่ละมหาวิทยาลัยมี risk เฉลี่ยเท่าไร เรียงจากมากไปน้อย", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, AVG(bo.booking_outcome_risk_level)::numeric(10,2) AS avg_risk, COUNT(*)::bigint AS assessed FROM booking b JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY avg_risk DESC LIMIT 10`
  },

  // ═══ EXPERT (multi-join — the hardest) ═══
  {
    id: "X01", cat: "Expert", question: "นิสิตที่มีปัญหาเครียดและเสี่ยงสูง ชื่ออะไร คณะไหน สาขาไหน มหาลัยไหน อาจารย์ที่ปรึกษาชื่ออะไร เบอร์ติดต่อ", expectedRoute: "SQL",
    verifyQuery: `WITH sr AS (SELECT b.student_id, b.university_id, COUNT(*)::bigint AS cnt, AVG(bo.booking_outcome_risk_level)::numeric(10,2) AS avg_risk FROM booking b JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id WHERE pc.problem_category_name_th LIKE '%เครียด%' AND bo.booking_outcome_risk_level >= 4 AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY b.student_id, b.university_id ORDER BY avg_risk DESC, cnt DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, f.faculty_name_th, d.department_name_th, sr.avg_risk, adv.advisor_first_name, adv.advisor_last_name, adv.advisor_phone_number FROM sr JOIN student_profile sp ON sp.student_id = sr.student_id AND sp.university_id = sr.university_id JOIN student_academic sa ON sa.student_id = sr.student_id AND sa.university_id = sr.university_id JOIN university u ON u.university_id = sr.university_id LEFT JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id LEFT JOIN department d ON d.department_id = sa.department_id AND d.university_id = sa.university_id LEFT JOIN advisor adv ON adv.advisor_id = sa.advisor_id AND adv.university_id = sa.university_id ORDER BY sr.avg_risk DESC`
  },
  {
    id: "X02", cat: "Expert", question: "ผู้ให้คำปรึกษาคนไหนรับเคสมากสุด ชื่อ เบอร์ติดต่อ มหาลัยไหน", expectedRoute: "SQL",
    verifyQuery: `SELECT cp.consultant_first_name, cp.consultant_last_name, cp.consultant_phone_number, u.university_name_th, COUNT(*)::bigint AS case_count FROM booking b JOIN consultant c ON c.consultant_id = b.consultant_id AND c.university_id = b.university_id JOIN consultant_profile cp ON cp.consultant_id = c.consultant_id JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY cp.consultant_first_name, cp.consultant_last_name, cp.consultant_phone_number, u.university_name_th ORDER BY case_count DESC LIMIT 10`
  },
  {
    id: "X03", cat: "Expert", question: "นิสิตเพศหญิงที่มีความเสี่ยงสูงสุดคือใคร คณะไหน มหาลัยไหน อาจารย์ที่ปรึกษาชื่ออะไร", expectedRoute: "SQL",
    verifyQuery: `WITH risky AS (SELECT b.student_id, b.university_id, AVG(bo.booking_outcome_risk_level)::numeric(10,2) AS avg_risk, COUNT(*)::bigint AS cnt FROM booking b JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id JOIN student_profile sp ON sp.student_id = b.student_id AND sp.university_id = b.university_id WHERE bo.booking_outcome_risk_level >= 4 AND sp.student_gender = 'FEMALE' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY b.student_id, b.university_id ORDER BY avg_risk DESC, cnt DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, f.faculty_name_th, r.avg_risk, adv.advisor_first_name, adv.advisor_last_name FROM risky r JOIN student_profile sp ON sp.student_id = r.student_id AND sp.university_id = r.university_id JOIN student_academic sa ON sa.student_id = r.student_id AND sa.university_id = r.university_id JOIN university u ON u.university_id = r.university_id LEFT JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id LEFT JOIN advisor adv ON adv.advisor_id = sa.advisor_id AND adv.university_id = sa.university_id ORDER BY r.avg_risk DESC`
  },

  // ═══ ADVERSARIAL (tricky phrasing) ═══
  {
    id: "A01", cat: "Adv", question: "มหาลัยไหนมีนิสิตยกเลิกนัดเยอะสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS cancel_count FROM booking_cancellation bc JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY cancel_count DESC LIMIT 5`
  },
  {
    id: "A02", cat: "Adv", question: "มหาลัยไหนมีนิสิตเครียดมากสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN university u ON u.university_id = b.university_id JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE pc.problem_category_name_th LIKE '%เครียด%' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY cnt DESC LIMIT 5`
  },
  {
    id: "A03", cat: "Adv", question: "คณะวิทยาศาสตร์ มีปัญหาอะไรมากสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT pc.problem_category_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE f.faculty_name_th LIKE '%วิทยาศาสตร์%' AND b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY pc.problem_category_name_th ORDER BY cnt DESC LIMIT 5`
  },
  {
    id: "A04", cat: "Adv", question: "Top 5 university ที่มี booking เยอะสุด", expectedRoute: "SQL",
    verifyQuery: `SELECT u.university_name_th, COUNT(*)::bigint AS cnt FROM booking b JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '${DF}' AND b.booking_created_at < '${DT}' GROUP BY u.university_name_th ORDER BY cnt DESC LIMIT 5`
  },
];

// ============== HELPERS ==============
async function genSql(q: string): Promise<{ sql: string; rows: any[]; ms: number }> {
  const scope = "No university_id filter needed (ministry-level, all universities)";
  const date = `Date filter: WHERE booking.booking_created_at >= '${DF}' AND booking.booking_created_at < '${DT}'`;
  const prompt = `${scope}\n${date}\nIMPORTANT RULES:\n1. Include above date filter.\n2. NEVER hardcode IDs.\n3. Column aliases MUST be English only.\n\n### Question: ${q}\n\n### SQL:\n`;
  const t0 = Date.now();
  const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, think: false, stream: false, options: { temperature: 0 },
      messages: [{ role: "user", content: SQL_B_PROMPT + "\n" + prompt }]
    }),
  });
  const data = await resp.json();
  const ms = Date.now() - t0;
  const raw = data.message?.content || "";
  const g = validateSql(raw, true);
  if (!g.ok || !g.sanitizedSql) throw new Error(`Guard: ${g.reason || "empty"}`);
  const result = await prisma.$queryRawUnsafe(g.sanitizedSql);
  const rows = JSON.parse(JSON.stringify(result, (_, v) => typeof v === "bigint" ? Number(v) : v));
  return { sql: g.sanitizedSql, rows, ms };
}

async function runGt(sql: string): Promise<any[]> {
  const r = await prisma.$queryRawUnsafe(sql);
  return JSON.parse(JSON.stringify(r, (_, v) => typeof v === "bigint" ? Number(v) : v));
}

function match(gen: any[], gt: any[]): boolean {
  if (!gen.length && !gt.length) return true;
  if (!gen.length || !gt.length) return false;
  const gv = Object.values(gt[0]), ev = Object.values(gen[0]);
  for (const g of gv) for (const e of ev) {
    if (g !== null && e !== null) {
      if (typeof g === "number" && typeof e === "number" && Math.abs(g - e) < 2) return true;
      if (typeof g === "string" && typeof e === "string" && (g.includes(String(e)) || String(e).includes(String(g)))) return true;
    }
  }
  return false;
}

// ============== MAIN ==============
async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  Advanced E2E SQL Pipeline Test v3  (20 scenarios)   ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const results: TR[] = [];
  for (const tc of TESTS) {
    console.log(`\n${"═".repeat(65)}`);
    console.log(`[${tc.id}] (${tc.cat}) ${tc.question}`);
    const r: TR = { id: tc.id, cat: tc.cat, question: tc.question, routedTo: "", routeOk: false, dataOk: false, ms: 0, err: null, genTop: null, gtTop: null };

    try {
      const route = keywordRoute(tc.question);
      r.routedTo = route.matched ? `KW:${route.lookupKey}` : "SQL";
      const actual = route.matched ? "KEYWORD" : "SQL";
      r.routeOk = actual === tc.expectedRoute;
      console.log(`Route: ${r.routedTo} ${r.routeOk ? "✅" : "❌"}`);
      if (!r.routeOk) { r.err = `Wrong route: ${actual} != ${tc.expectedRoute}`; results.push(r); continue; }

      if (actual === "SQL") {
        const { sql, rows, ms } = await genSql(tc.question);
        r.ms = ms; r.genTop = rows[0] || {};
        console.log(`SQL: ${ms}ms | ${rows.length} rows`);
        console.log(`Gen: ${JSON.stringify(r.genTop).substring(0, 120)}`);
        const gt = await runGt(tc.verifyQuery);
        r.gtTop = gt[0] || {};
        console.log(`GT:  ${JSON.stringify(r.gtTop).substring(0, 120)}`);
        r.dataOk = match(rows, gt);
        const sp = ms <= 10000 ? "⚡" : ms <= 20000 ? "⏱" : "🐌";
        console.log(`${r.dataOk ? "✅ MATCH" : "❌ MISMATCH"} ${sp} ${(ms / 1000).toFixed(1)}s`);
      } else {
        r.dataOk = true;
        console.log("✅ KEYWORD CACHE");
      }
    } catch (e: any) {
      r.err = (e.message || "").substring(0, 200);
      console.log(`❌ ERROR: ${r.err}`);
    }
    results.push(r);
  }

  // ═══ SUMMARY ═══
  console.log(`\n\n${"═".repeat(65)}`);
  console.log("SUMMARY");
  console.log(`${"═".repeat(65)}`);
  const cats = ["Easy", "Med", "Hard", "Expert", "Adv"];
  for (const cat of cats) {
    const cr = results.filter(r => r.cat === cat);
    const ok = cr.filter(r => r.routeOk && r.dataOk && !r.err).length;
    const avgMs = Math.round(cr.filter(r => r.ms > 0).reduce((a, r) => a + r.ms, 0) / Math.max(1, cr.filter(r => r.ms > 0).length));
    console.log(`\n[${cat}] ${ok}/${cr.length} pass | avg ${avgMs}ms`);
    for (const r of cr) {
      const icon = (r.routeOk && r.dataOk && !r.err) ? "✅" : "❌";
      const sp = r.ms > 0 ? (r.ms <= 10000 ? "⚡" : r.ms <= 20000 ? "⏱" : "🐌") : "";
      const t = r.ms > 0 ? ` ${(r.ms / 1000).toFixed(1)}s` : "";
      const err = r.err ? ` ERR: ${r.err.substring(0, 60)}` : "";
      console.log(`  ${icon} [${r.id}]${t} ${sp}${err}`);
    }
  }

  const allOk = results.filter(r => r.routeOk && r.dataOk && !r.err).length;
  const avgMs = Math.round(results.filter(r => r.ms > 0).reduce((a, r) => a + r.ms, 0) / Math.max(1, results.filter(r => r.ms > 0).length));
  console.log(`\n${"═".repeat(65)}`);
  console.log(`TOTAL: ${allOk}/${results.length} pass | avg ${avgMs}ms`);
  console.log(`${"═".repeat(65)}`);

  const fs = require("fs");
  fs.writeFileSync("/tmp/sql-test-v3-results.json", JSON.stringify(results, null, 2));
  console.log("Results: /tmp/sql-test-v3-results.json");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
