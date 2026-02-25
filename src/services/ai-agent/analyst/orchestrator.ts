import { chat, ChatMessage } from "./ollama";
import { ANALYST_A_PROMPT } from "./prompts/presenter";
import { SQL_B_PROMPT } from "./prompts/sql-generator";
import { validateSql } from "./sql-guard";
import { executeSql } from "./db-executor";
import { env } from "process";

interface OrhcestratorScope {
    university_id?: number;
    faculty_id?: number;
    role: string;
}

export async function runAnalytics(question: string, scope: OrhcestratorScope, pastMessages: any[] = []): Promise<string> {
    // ── RBAC Gate ──────────────────────────────────────────────────────────
    const BLOCKED_ROLES = ["STUDENT"];
    if (BLOCKED_ROLES.includes(scope.role)) {
        return "⚠️ ขออภัยครับ ฟีเจอร์ AI สรุปผลสำหรับผู้บริหารและบุคลากรเท่านั้น หากต้องการจองคิวปรึกษา กรุณาใช้โหมด \"จองคิว\" แทนครับ";
    }

    // ── Role context for Model A ───────────────────────────────────────────
    const roleHints: Record<string, string> = {
        MINISTRY: "ผู้ใช้คือรัฐมนตรี — เข้าถึงข้อมูลได้ทุกมหาวิทยาลัย ทุกระดับ",
        SUPER_ADMIN: "ผู้ใช้คือ Super Admin — เข้าถึงข้อมูลได้ทุกมหาวิทยาลัย ทุกระดับ",
        RECTOR: `ผู้ใช้คืออธิการบดี — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=${scope.university_id}) เท่านั้น ห้ามแสดงข้อมูลมหาวิทยาลัยอื่น`,
        DEAN: `ผู้ใช้คือคณบดี — เข้าถึงข้อมูลได้เฉพาะคณะของตน (faculty_id=${scope.faculty_id}, university_id=${scope.university_id}) เท่านั้น`,
        ADMIN: `ผู้ใช้คือผู้ดูแลระบบมหาวิทยาลัย — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=${scope.university_id})`,
        PERSONNEL: `ผู้ใช้คือบุคลากร — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=${scope.university_id})`,
        CONSULTANT: `ผู้ใช้คือที่ปรึกษา — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=${scope.university_id})`,
        HEAD_CONSULTANT: `ผู้ใช้คือหัวหน้าที่ปรึกษา — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=${scope.university_id})`,
    };
    const roleContext = roleHints[scope.role] || "ผู้ใช้ไม่ระบุบทบาท — ให้ตอบแค่ข้อมูลทั่วไป";

    // 1. Model A (Presenter) — uses AI_MODEL (qwen2.5:7b)
    const modelA = env.AI_MODEL || "qwen2.5:7b";

    let formattedHistory: ChatMessage[] = pastMessages
        .filter((m: any) => m.role !== "system" && m.content)
        .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const systemPrompt = `${ANALYST_A_PROMPT}\n\n## 🔒 สิทธิ์ผู้ใช้ปัจจุบัน:\n${roleContext}\n⛔ ถ้าผู้ใช้ถามเกี่ยวกับข้อมูลที่อยู่นอกเหนือสิทธิ์ ให้ตอบว่า: "ขออภัยครับ คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"`;

    let messagesA: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: question }
    ];

    console.log(`[Orchestrator] Invoking Model A (${modelA}) for intent... Role: ${scope.role}`);
    // Note: we ask it to return JSON if it needs data, else just text.
    let responseA = await chat(messagesA, { model: modelA });
    responseA = responseA.trim();

    // Try parsing JSON out of Model A response
    let actionData: any = null;
    try {
        // Sometimes models wrap json in markdown
        let jsonStr = responseA.replace(/```json/gi, "").replace(/```/g, "").trim();

        // Attempt to find first { and last }
        const startIdx = jsonStr.indexOf("{");
        const endIdx = jsonStr.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            const parsed = JSON.parse(jsonStr);
            if (parsed.action === "NEED_DATA" || parsed.action === "QUICK_LOOKUP") {
                actionData = parsed;
            }
        }
    } catch (e) {
        // Not JSON, or failed to parse. This means Model A decided to just answer directly.
    }

    // If Model A answered directly (no action):
    if (!actionData) {
        console.log(`[Orchestrator] Model A answered directly without DB.`);
        return responseA;
    }

    // ── FAST-PATH: MongoDB Knowledge Base ──────────────────────────────────
    if (actionData.action === "QUICK_LOOKUP" && actionData.lookup_key) {
        console.log(`[Orchestrator] QUICK_LOOKUP: ${actionData.lookup_key}`);
        try {
            const { getAiKnowledgeContextCollection } = await import("@/lib/mongodb");
            const collection = await getAiKnowledgeContextCollection();
            const doc = await collection.findOne({ lookup_key: actionData.lookup_key });
            if (doc && doc.payload) {
                console.log(`[Orchestrator] MongoDB hit! Key: ${actionData.lookup_key}, Payload: ${doc.payload.length} chars`);
                return doc.payload;
            }
            console.warn(`[Orchestrator] MongoDB miss for key: ${actionData.lookup_key}. Falling through to SQL.`);
            // Fall through to SQL pipeline if MongoDB has no data
            actionData.action = "NEED_DATA";
            actionData.intent = `Get data for: ${actionData.lookup_key}`;
        } catch (err) {
            console.error(`[Orchestrator] MongoDB error:`, err);
            actionData.action = "NEED_DATA";
            actionData.intent = `Get data for: ${actionData.lookup_key}`;
        }
    }

    // 2. Model B (SQL Generator) generates query based on intent
    console.log(`[Orchestrator] Model A requested data. Invoking Model B... Intent: ${actionData.intent}`);
    const modelB = env.OLLAMA_MODEL_SQL_GENERATOR || modelA;

    // Compute date range: user-specified or default last 30 days
    let daysOffset = 30; // default 30 days
    const dateRangeStr = actionData.filters?.date_range;
    if (dateRangeStr) {
        if (dateRangeStr === "7d") daysOffset = 7;
        else if (dateRangeStr === "1m") daysOffset = 30;
        else if (dateRangeStr === "3m") daysOffset = 90;
        else if (dateRangeStr === "6m") daysOffset = 180;
        else if (dateRangeStr === "1y") daysOffset = 365;
        else if (dateRangeStr === "all_time") daysOffset = 3650; // 10 years
        else if (dateRangeStr.endsWith("d")) {
            const parsed = parseInt(dateRangeStr);
            if (!isNaN(parsed) && parsed > 0) daysOffset = parsed;
        }
    }

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysOffset);
    const dateFromStr = dateFrom.toISOString().slice(0, 10); // YYYY-MM-DD
    const dateToStr = dateTo.toISOString().slice(0, 10);

    // Format Thai dates
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiDateFrom = `${dateFrom.getDate()} ${thaiMonths[dateFrom.getMonth()]} ${dateFrom.getFullYear() + 543}`;
    const thaiDateTo = `${dateTo.getDate()} ${thaiMonths[dateTo.getMonth()]} ${dateTo.getFullYear() + 543}`;
    const dateRangeText = `ข้อมูลช่วง ${thaiDateFrom} - ${thaiDateTo}`;

    // SQLCoder expects: system prompt (schema) + user prompt with ### Question: / ### SQL:
    const isGlobalRole = ["MINISTRY", "SUPER_ADMIN"].includes(scope.role);
    const scopeHint = scope.university_id && !isGlobalRole
        ? `Filter: WHERE booking.university_id = ${scope.university_id}`
        : "No university_id filter needed (ministry-level, all universities)";

    const dateHint = `Date filter: WHERE booking.booking_created_at >= '${dateFromStr}' AND booking.booking_created_at < '${dateToStr}'`;

    const bUserPrompt = `${scopeHint}
${dateHint}
IMPORTANT RULES:
1. If your query uses the 'booking' table, you MUST include the date filter above in your WHERE clause.
2. NEVER hardcode IDs. Always lookup by Thai name using JOIN + WHERE name LIKE '%...%'.
3. If no date filter is needed (e.g. just listing universities), skip the date filter.

### Question: ${actionData.intent}

### SQL:
`;

    let messagesB: ChatMessage[] = [
        { role: "user", content: SQL_B_PROMPT + "\n" + bUserPrompt }
    ];

    let rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });

    // 3–4. Validate, Execute, and Retry loop (max 2 retries on error)
    const MAX_RETRIES = 2;
    let dbResultStr: string | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        // 3. Validate SQL (pass true if ministry to bypass university_id check)
        const validation = validateSql(rawSql, isGlobalRole);

        if (!validation.ok || !validation.sanitizedSql) {
            console.warn(`[Orchestrator] Attempt ${attempt + 1}: Invalid SQL: ${validation.reason}\nSQL: ${rawSql}`);
            if (attempt < MAX_RETRIES) {
                // Feed error back to Model B for self-correction
                messagesB.push({ role: "assistant", content: rawSql });
                messagesB.push({ role: "user", content: `The SQL above is invalid: ${validation.reason}. Fix it. Output ONLY the corrected SQL.` });
                rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                continue;
            }
            break;
        }

        // 4. Execute
        console.log(`[Orchestrator] Attempt ${attempt + 1}: Running SQL:\n${validation.sanitizedSql}`);
        try {
            const result = await executeSql(validation.sanitizedSql);
            // Check if executeSql returned an error JSON string
            if (result.startsWith("{\"error\":")) {
                const errObj = JSON.parse(result);
                const errMsg = errObj.error || "Unknown DB error";
                console.error(`[Orchestrator] Attempt ${attempt + 1}: SQL returned error: ${errMsg}`);
                if (attempt < MAX_RETRIES) {
                    messagesB.push({ role: "assistant", content: validation.sanitizedSql });
                    messagesB.push({ role: "user", content: `PostgreSQL error: ${errMsg}. Fix the SQL. When using WITH (CTE), you MUST JOIN lookup tables in the final SELECT, not reference columns directly from the CTE that were not selected. Output ONLY the corrected SQL.` });
                    rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                    continue;
                }
                break;
            }
            dbResultStr = result;
            break; // Success!
        } catch (execError: any) {
            const errMsg = execError.meta?.message || execError.message || "Unknown DB error";
            console.error(`[Orchestrator] Attempt ${attempt + 1}: SQL execution failed: ${errMsg}`);
            if (attempt < MAX_RETRIES) {
                // Feed Postgres error back to Model B for self-correction
                messagesB.push({ role: "assistant", content: validation.sanitizedSql });
                messagesB.push({ role: "user", content: `PostgreSQL error: ${errMsg}. Fix the SQL. Remember: booking has NO faculty_id, use student_academic to join faculty. ALWAYS include all tables referenced in ON clauses in your FROM/JOIN. Output ONLY the corrected SQL.` });
                rawSql = await chat(messagesB, { model: modelB, options: { temperature: 0.0, num_ctx: 8192 } });
                continue;
            }
        }
    }

    // If all retries failed
    if (!dbResultStr) {
        console.error(`[Orchestrator] All SQL execution retries failed. Returning hardcoded fallback.`);
        return "⚠️ ขออภัยครับ ระบบไม่สามารถประมวลผลข้อมูลนี้ได้ในขณะนี้ (Database Error) กรุณาลองปรับคำถามหรือขอบเขตข้อมูลใหม่อีกครั้งครับ";
    }

    // ════════════════════════════════════════════════════════════════════
    // 5. Present Results — STRUCTURAL ANTI-HALLUCINATION
    // Pre-format DB data into markdown table in CODE (not by model).
    // Model A only adds a brief Thai-language commentary/insight.
    // Safety net: if Model A hallucinates, return raw pre-formatted data.
    // ════════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] Returning DB results to Model A... Data: ${dbResultStr.substring(0, 500)}`);

    // Pre-format the raw DB data into a markdown table
    let preFormattedData = "";
    let rowCount = 0;
    try {
        const parsedRows = JSON.parse(dbResultStr);
        if (Array.isArray(parsedRows) && parsedRows.length > 0) {
            rowCount = parsedRows.length;
            const cols = Object.keys(parsedRows[0]);
            preFormattedData = `| ${cols.join(" | ")} |\n|${cols.map(() => "---").join("|")}|\n`;
            parsedRows.forEach((row: any) => {
                preFormattedData += `| ${cols.map(c => {
                    const v = row[c];
                    if (v === null || v === undefined) return "-";
                    if (typeof v === "bigint") return Number(v).toLocaleString();
                    return String(v);
                }).join(" | ")} |\n`;
            });
        } else {
            preFormattedData = dbResultStr;
        }
    } catch {
        preFormattedData = dbResultStr; // fallback: use raw string
    }

    // Build the data injection message for Model A
    const dataMsg = [
        "[DATA_INJECTED]",
        dateRangeText,
        "",
        "## Raw data from system:",
        preFormattedData,
        "",
        "INSTRUCTIONS:",
        `1. Show date range: "${dateRangeText}"`,
        "2. Display the data above as a markdown table — COPY every value EXACTLY as-is, do NOT change any text!",
        "3. Add 1-2 sentences of Thai-language insight/analysis below the table",
        `4. The data has exactly ${rowCount} rows — show exactly ${rowCount} rows, no more, no less`,
        "5. Do NOT add data that is not in the table above",
        "6. Use emoji and Thai language",
        "7. Do NOT use words: SQL, Database, Query"
    ].join("\n");

    messagesA.push({ role: "assistant", content: responseA });
    messagesA.push({ role: "user", content: dataMsg });

    const finalAnswer = await chat(messagesA, { model: modelA });

    // SAFETY NET: If Model A's response doesn't contain any of the actual data values,
    // it hallucinated. Return the pre-formatted data directly instead.
    try {
        const parsedRows = JSON.parse(dbResultStr);
        if (Array.isArray(parsedRows) && parsedRows.length > 0) {
            const firstRow = parsedRows[0];
            const allValues = Object.values(firstRow).map(v => String(v));
            // Check if at least one non-trivial value from the data appears in the answer
            const hasRealData = allValues.some(v => v.length > 2 && finalAnswer.includes(v));
            if (!hasRealData) {
                console.warn(`[Orchestrator] HALLUCINATION DETECTED — Model A did not include actual data values. Returning pre-formatted data.`);
                return `📅 ${dateRangeText}\n\n${preFormattedData}`;
            }
        }
    } catch {
        // If parsing fails, just return Model A's answer
    }

    return finalAnswer;
}
