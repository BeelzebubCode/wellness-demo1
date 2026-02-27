// src/services/ai-agent/analyst/engine.ts
// Slim orchestrator for AI Analyst — delegates to modular components.
// Flow: Question → KeywordRouter → [Cache?] → Model A → Model B (SQL) → Execute → Format → Present

import { chat, ChatMessage } from "./ollama";
import { ANALYST_A_PROMPT } from "./prompts/presenter";
import { buildSqlPrompt } from "./prompts/sql-generator";
import { validateSql } from "./sql-guard";
import { executeSql } from "./db-executor";
import { keywordRoute } from "./keyword-router";
import { env } from "process";

import { AnalystScope, isBlocked, isGlobalRole, getRoleContext, getScopeHint } from "./domain/rbac";
import { resolveDateRange } from "./domain/date-range";
import { lookupFromCache } from "./adapters/mongo-cache";
import { formatDbResultToMarkdown, buildDataInjectionMessage } from "./presenter/formatter";
import { sanitizeChinese, hasRealData, looksLikeHallucination } from "./presenter/sanitizer";

// Detail keywords → force SQL pipeline (cache can't answer these)
const DETAIL_WORDS = [
    "ชื่อ", "รายชื่อ", "ใคร", "คนไหน", "ชื่ออะไร", "รายละเอียด",
    "แต่ละ", "แยกตาม", "เฉพาะ", "เปรียบเทียบ", "เทียบ", "เจาะจง",
    "คนนั้น", "คนนี้", "อันไหน", "ตัวไหน", "มหาลัยไหน", "สาขา", "คณะอะไร",
];

export type { AnalystScope };

export async function runAnalytics(
    question: string,
    scope: AnalystScope,
    pastMessages: any[] = [],
): Promise<string> {
    // ── RBAC Gate ──
    if (isBlocked(scope.role)) {
        return "⚠️ ขออภัยครับ ฟีเจอร์ AI สรุปผลสำหรับผู้บริหารและบุคลากรเท่านั้น หากต้องการจองคิวปรึกษา กรุณาใช้โหมด \"จองคิว\" แทนครับ";
    }

    const roleContext = getRoleContext(scope);

    // Detect query characteristics
    const qLower = question.toLowerCase();
    const yearMatch = qLower.match(/(\d+)\s*ปี/);
    const wantsMultiYear = (yearMatch && parseInt(yearMatch[1]) > 1) ||
        /ย้อนหลัง|all.?time|ตั้งแต่แรก|ตลอด/.test(qLower);
    const needsDetail = DETAIL_WORDS.some(kw => qLower.includes(kw));

    // Cache has up to 12M (1 year) data. Strategy:
    // - Simple aggregate + any time period → use 12M cache (instant, close enough)
    // - Detail (ชื่อ, เบอร์) + multi-year → bypass cache, use SQL
    // - "ทั้งหมด" without detail → use 12M cache
    const shouldBypassCache = needsDetail && wantsMultiYear;

    // ═══ 0. KEYWORD ROUTER (deterministic fast-path) ═══
    if (!shouldBypassCache) {
        const routerQuestion = buildRouterQuestion(question, pastMessages);
        const routerResult = keywordRoute(routerQuestion);

        if (routerResult.matched && routerResult.lookupKey) {
            console.log(`[Engine] KeywordRouter matched: ${routerResult.lookupKey}`);
            const cached = await lookupFromCache(routerResult.lookupKey);
            if (cached) return sanitizeChinese(cached);
        }
    } else {
        console.log(`[Engine] Detail + multi-year → skipping cache, forcing SQL pipeline`);
    }

    // ═══ 1. MODEL A — Presenter / Intent Classifier ═══
    const modelA = env.AI_MODEL_ANALYST || "qwen3:8b";

    const formattedHistory: ChatMessage[] = pastMessages
        .filter((m: any) => m.role !== "system" && m.content)
        .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const systemPrompt = `${ANALYST_A_PROMPT}\n\n## 🔒 สิทธิ์ผู้ใช้ปัจจุบัน:\n${roleContext}\n⛔ ถ้าผู้ใช้ถามเกี่ยวกับข้อมูลที่อยู่นอกเหนือสิทธิ์ ให้ตอบว่า: "ขออภัยครับ คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"`;

    const messagesA: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: question },
    ];

    console.log(`[Engine] Invoking Model A (${modelA})... Role: ${scope.role}`);
    let responseA = (await chat(messagesA, { model: modelA, keep_alive: "10m", options: { temperature: 0, num_ctx: 4096, num_predict: 150 } })).trim();

    // Parse JSON action from Model A
    let actionData = parseModelAAction(responseA);

    // If Model A answered directly (no action) — check for hallucination
    if (!actionData) {
        if (looksLikeHallucination(responseA)) {
            console.warn(`[Engine] HALLUCINATION GUARD: forcing NEED_DATA`);
            actionData = { action: "NEED_DATA", intent: question, filters: { date_range: "1m" } };
        } else {
            console.log(`[Engine] Model A answered directly.`);
            return sanitizeChinese(responseA);
        }
    }

    // ═══ QUICK_LOOKUP → MongoDB Cache ═══
    if (actionData.action === "QUICK_LOOKUP" && actionData.lookup_key) {
        if (shouldBypassCache) {
            console.log(`[Engine] QUICK_LOOKUP overridden → detail + multi-year`);
            actionData.action = "NEED_DATA";
            actionData.intent = question;
        } else {
            const cached = await lookupFromCache(actionData.lookup_key);
            if (cached) return sanitizeChinese(cached);
            // Miss → fall through to SQL
            actionData.action = "NEED_DATA";
            actionData.intent = `Get data for: ${actionData.lookup_key}`;
        }
    }

    // ═══ 2. MODEL B — SQL Generator ═══
    const dateRange = resolveDateRange(actionData.filters?.date_range, question);
    const scopeHint = getScopeHint(scope);
    const dateHint = `Date filter: WHERE booking.booking_created_at >= '${dateRange.dateFromStr}' AND booking.booking_created_at < '${dateRange.dateToStr}'`;
    const modelB = env.OLLAMA_MODEL_SQL_GENERATOR || modelA;

    const bUserPrompt = `${scopeHint}\n${dateHint}\nIMPORTANT RULES:\n1. If your query uses the 'booking' table, you MUST include the date filter above.\n2. If the query does NOT need the booking table (e.g. looking up a student by ID, listing universities), do NOT add a date filter.\n3. When searching by name use LIKE '%...%'. When user gives a specific numeric ID (e.g. "id 1000009"), use WHERE student_id = 1000009 directly.\n4. For student lookup by ID: SELECT from student_profile JOIN student_academic JOIN faculty JOIN university — no booking table needed.\n\n### Question: ${actionData.intent}\n\n### SQL:\n`;

    const sqlPrompt = buildSqlPrompt();
    const messagesB: ChatMessage[] = [{ role: "user", content: sqlPrompt + "\n" + bUserPrompt }];

    console.log(`[Engine] Invoking Model B (${modelB}) for SQL...`);
    let rawSql = await chat(messagesB, { model: modelB, keep_alive: "10m", options: { temperature: 0, num_ctx: 8192, num_predict: 500 } });

    // ═══ 3-4. Validate → Execute → Retry ═══
    const dbResultStr = await executeWithRetries(
        rawSql, messagesB, modelB, isGlobalRole(scope.role),
    );

    if (!dbResultStr) {
        return "⚠️ ขออภัยครับ ระบบไม่สามารถประมวลผลข้อมูลนี้ได้ในขณะนี้ (Database Error) กรุณาลองปรับคำถามหรือขอบเขตข้อมูลใหม่อีกครั้งครับ";
    }

    // Empty result check
    try {
        const parsed = JSON.parse(dbResultStr);
        if (Array.isArray(parsed) && parsed.length === 0) {
            return `📊 ${dateRange.thaiText}\n\nไม่พบข้อมูลที่ตรงกับคำถามในช่วงเวลานี้ครับ\n\n💡 **ลองพูดว่า:**\n- "...ใน 1 ปี" — ขยายเป็น 1 ปี\n- "...ทั้งหมด" — ดูข้อมูลทั้งหมดในระบบ\n- "...3 เดือน" — ดู 3 เดือนล่าสุด`;
        }
    } catch { }

    // ═══ 5. Present — Table + LLM DataStory ═══
    const { markdown, rowCount } = formatDbResultToMarkdown(dbResultStr);

    // DataStory LLM — narrate the data for all results
    const storyPrompt: ChatMessage[] = [
        {
            role: "user",
            content: [
                `คุณคือ Data Storyteller ระดับมืออาชีพ เล่าข้อมูลเป็นเรื่องราวภาษาไทยที่น่าสนใจ`,
                ``,
                `## คำถามเดิม: ${question}`,
                `## ช่วงเวลา: ${dateRange.thaiText}`,
                `## ข้อมูล (${rowCount} แถว):`,
                markdown,
                ``,
                `## กฎเหล็ก:`,
                `1. ขึ้นต้นด้วย "📅 ${dateRange.thaiText}"`,
                `2. แสดงตาราง markdown — COPY ทุกค่าตรงๆ จากข้อมูล ห้ามเปลี่ยนตัวเลข ห้ามปัดเศษ ห้ามเพิ่ม/ลดแถว`,
                `3. ใต้ตาราง เขียนสรุปวิเคราะห์ 2-4 ประโยค ภาษาไทย ใช้ emoji ✨`,
                `4. ตัวเลขทุกตัวต้องตรงกับตารางเป๊ะ — ถ้าจำไม่ได้ ห้ามเดา`,
                `5. ห้ามใช้คำว่า SQL, Database, Query, SELECT, Table`,
                `6. ภาษาไทยเท่านั้น ห้ามภาษาจีน`,
                `7. ห้ามสมมุติข้อมูลหรือเพิ่มข้อมูลที่ไม่มีในตาราง`,
            ].join("\n"),
        },
    ];

    console.log(`[Engine] DataStory LLM (${rowCount} rows)...`);
    const story = sanitizeChinese(
        await chat(storyPrompt, { model: modelA, keep_alive: "10m", options: { temperature: 0.3, num_ctx: 4096, num_predict: 600 } })
    );

    if (hasRealData(story, dbResultStr)) {
        return story;
    }

    // Fallback: LLM hallucinated — return table with deterministic summary
    console.warn(`[Engine] DataStory hallucinated — falling back to table-only`);
    return `📅 ${dateRange.thaiText}\n\n${markdown}\n${buildDeterministicInsight(dbResultStr, rowCount)}`;

}

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a factual 1-line insight from actual data — no LLM, no hallucination */
function buildDeterministicInsight(dbResultStr: string, rowCount: number): string {
    try {
        const rows = JSON.parse(dbResultStr);
        if (!Array.isArray(rows) || rows.length === 0) return "";

        const cols = Object.keys(rows[0]);

        // Pick the LAST numeric column (the aggregate/count — not id/year which come first)
        const isNumeric = (v: any) => typeof v === "number" || typeof v === "bigint" ||
            (typeof v === "string" && /^\d+(\.\d+)?$/.test(v));

        let numCol: string | undefined;
        for (let i = cols.length - 1; i >= 0; i--) {
            if (isNumeric(rows[0][cols[i]])) { numCol = cols[i]; break; }
        }

        if (!numCol) return `📊 แสดงข้อมูล ${rowCount} รายการ`;

        // Pick the first STRING column as label (skip numeric/id columns)
        const labelCol = cols.find(c =>
            c !== numCol && typeof rows[0][c] === "string" && rows[0][c].length > 0
        );

        const topVal = Number(rows[0][numCol]);
        const topLabel = labelCol ? String(rows[0][labelCol]) : "";
        const total = rows.reduce((sum: number, r: any) => sum + Number(r[numCol!] || 0), 0);

        if (topLabel && rowCount > 1) {
            return `📊 อันดับ 1: **${topLabel}** (${topVal.toLocaleString()}) จากทั้งหมด ${rowCount} รายการ รวม ${total.toLocaleString()}`;
        }
        return `📊 แสดงข้อมูล ${rowCount} รายการ รวม ${total.toLocaleString()}`;
    } catch {
        return `📊 แสดงข้อมูล ${rowCount} รายการ`;
    }
}

function buildRouterQuestion(question: string, pastMessages: any[]): string {
    const isFollowUp = question.length < 30 && /(วัน|เดือน|ปี|ขอ|เปลี่ยน|อีก|ล่าสุด|ทั้งหมด)/i.test(question);
    if (!isFollowUp || !pastMessages.length) return question;

    const prevUserMsgs = pastMessages.filter((m: any) => m.role === "user" && m.content);
    for (let i = prevUserMsgs.length - 1; i >= 0; i--) {
        const prevRoute = keywordRoute(prevUserMsgs[i].content);
        if (prevRoute.matched) {
            const topicPart = prevUserMsgs[i].content.replace(/\d+\s*(วัน|เดือน|ปี)/g, "").replace(/(ขอ|ใน|จาก|ล่าสุด)/g, "").trim();
            return `${topicPart} ${question}`;
        }
    }
    return question;
}

function parseModelAAction(response: string): any | null {
    try {
        let jsonStr = response.replace(/```json/gi, "").replace(/```/g, "").trim();
        const startIdx = jsonStr.indexOf("{");
        const endIdx = jsonStr.lastIndexOf("}");
        if (startIdx === -1 || endIdx === -1) return null;
        jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        return (parsed.action === "NEED_DATA" || parsed.action === "QUICK_LOOKUP") ? parsed : null;
    } catch {
        return null;
    }
}

async function executeWithRetries(
    rawSql: string,
    messagesB: ChatMessage[],
    modelB: string,
    isGlobal: boolean,
    maxRetries = 2,
): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const validation = validateSql(rawSql, isGlobal);

        if (!validation.ok || !validation.sanitizedSql) {
            console.warn(`[Engine] Attempt ${attempt + 1}: Invalid SQL: ${validation.reason}`);
            if (attempt < maxRetries) {
                messagesB.push({ role: "assistant", content: rawSql });
                messagesB.push({ role: "user", content: `The SQL above is invalid: ${validation.reason}. Fix it. Output ONLY the corrected SQL.` });
                rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                continue;
            }
            return null;
        }

        console.log(`[Engine] Attempt ${attempt + 1}: Running SQL:\n${validation.sanitizedSql}`);
        try {
            const result = await executeSql(validation.sanitizedSql);
            if (result.startsWith('{"error":')) {
                const errMsg = JSON.parse(result).error || "Unknown DB error";
                console.error(`[Engine] SQL error: ${errMsg}`);
                if (attempt < maxRetries) {
                    messagesB.push({ role: "assistant", content: validation.sanitizedSql });
                    messagesB.push({ role: "user", content: `PostgreSQL error: ${errMsg}. Fix the SQL. When using WITH (CTE), you MUST JOIN lookup tables in the final SELECT. Output ONLY the corrected SQL.` });
                    rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                    continue;
                }
                return null;
            }
            return result;
        } catch (execError: any) {
            const errMsg = execError.meta?.message || execError.message || "Unknown DB error";
            console.error(`[Engine] Execution failed: ${errMsg}`);
            if (attempt < maxRetries) {
                messagesB.push({ role: "assistant", content: validation.sanitizedSql });
                messagesB.push({ role: "user", content: `PostgreSQL error: ${errMsg}. Fix the SQL. Remember: booking has NO faculty_id, use student_academic. Output ONLY the corrected SQL.` });
                rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                continue;
            }
        }
    }
    return null;
}
