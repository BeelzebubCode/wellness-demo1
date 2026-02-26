import { chat, ChatMessage } from "./ollama";
import { ANALYST_A_PROMPT } from "./prompts/presenter";
import { SQL_B_PROMPT } from "./prompts/sql-generator";
import { validateSql } from "./sql-guard";
import { executeSql } from "./db-executor";
import { keywordRoute } from "./keyword-router";
import { env } from "process";

/**
 * Strip Chinese characters from AI responses.
 * Qwen models are Chinese-origin and may occasionally output Chinese text.
 * This function removes entire lines that are predominantly Chinese,
 * and strips inline Chinese characters from mixed lines.
 */
function sanitizeChinese(text: string): string {
    // Regex matching CJK Unified Ideographs (Chinese characters)
    const chineseCharRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;

    return text
        .split('\n')
        .map(line => {
            const chineseChars = line.match(chineseCharRegex);
            if (!chineseChars) return line; // No Chinese at all

            // If line is mostly Chinese (>30% of non-space chars), remove entire line
            const nonSpaceChars = line.replace(/\s/g, '').length;
            if (nonSpaceChars > 0 && chineseChars.length / nonSpaceChars > 0.3) {
                return ''; // Remove the whole line
            }

            // Otherwise strip just the Chinese characters
            return line.replace(chineseCharRegex, '').replace(/\s{2,}/g, ' ').trim();
        })
        .filter(line => line.trim() !== '' || line === '') // keep intentional blank lines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
        .trim();
}

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

    // ════════════════════════════════════════════════════════════════════
    // 0. KEYWORD ROUTER — Deterministic routing (runs BEFORE Model A)
    //    Matches common Thai query patterns to QUICK_LOOKUP keys.
    //    This bypasses Model A entirely for 80%+ of common queries.
    // ════════════════════════════════════════════════════════════════════

    // Follow-up detection: if current question is short/time-only,
    // carry topic context from the previous user message.
    let routerQuestion = question;
    const isFollowUp = question.length < 30 && /(\d+\s*(วัน|เดือน|ปี)|ขอ|เปลี่ยน|อีก|ล่าสุด|ทั้งหมด|30|1m|3m|6m|1y)/i.test(question);
    if (isFollowUp && pastMessages.length > 0) {
        // Find the last user message that has topic keywords
        const prevUserMsgs = pastMessages.filter((m: any) => m.role === "user" && m.content);
        for (let i = prevUserMsgs.length - 1; i >= 0; i--) {
            const prevQ = prevUserMsgs[i].content;
            // Check if previous message has a topic keyword
            const prevRoute = keywordRoute(prevQ);
            if (prevRoute.matched) {
                // Extract just the topic from previous question (remove time words)
                const topicPart = prevQ.replace(/\d+\s*(วัน|เดือน|ปี)/g, '').replace(/(ขอ|ใน|จาก|ล่าสุด)/g, '').trim();
                routerQuestion = `${topicPart} ${question}`;
                console.log(`[Orchestrator] Follow-up detected. Combined question: "${routerQuestion}"`);
                break;
            }
        }
    }

    const routerResult = keywordRoute(routerQuestion);
    if (routerResult.matched && routerResult.lookupKey) {
        console.log(`[Orchestrator] KeywordRouter matched: ${routerResult.lookupKey}`);
        try {
            const { getAiKnowledgeContextCollection } = await import("@/lib/mongodb");
            const collection = await getAiKnowledgeContextCollection();
            const doc = await collection.findOne({ lookup_key: routerResult.lookupKey });
            if (doc && doc.payload) {
                console.log(`[Orchestrator] KeywordRouter → MongoDB HIT: ${routerResult.lookupKey} (${doc.payload.length} chars)`);
                return sanitizeChinese(doc.payload);
            }
            // Also try base key without suffix (backward compat)
            const baseKey = routerResult.lookupKey.replace(/_\d+M$/, '');
            if (baseKey !== routerResult.lookupKey) {
                const baseDoc = await collection.findOne({ lookup_key: baseKey });
                if (baseDoc && baseDoc.payload) {
                    console.log(`[Orchestrator] KeywordRouter → MongoDB HIT (base): ${baseKey}`);
                    return sanitizeChinese(baseDoc.payload);
                }
            }
            console.warn(`[Orchestrator] KeywordRouter matched but MongoDB miss for: ${routerResult.lookupKey}. Falling through to Model A.`);
        } catch (err) {
            console.error(`[Orchestrator] KeywordRouter MongoDB error:`, err);
        }
        // Fall through to Model A → SQL if MongoDB has no cached data
    }

    // 1. Model A (Presenter) — uses AI_MODEL (qwen3:8b)
    const modelA = env.AI_MODEL || "qwen3:8b";

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
        // GUARD: Check if the direct answer contains suspiciously many numbers
        // If it does, Model A is likely fabricating data instead of using NEED_DATA
        const numberMatches = responseA.match(/\d{1,3}(,\d{3})+|\d{3,}/g);
        if (numberMatches && numberMatches.length >= 3) {
            console.warn(`[Orchestrator] HALLUCINATION GUARD: Model A answered directly with ${numberMatches.length} numbers. Forcing NEED_DATA.`);
            // Auto-generate a NEED_DATA action from the question
            actionData = {
                action: "NEED_DATA",
                intent: question,
                filters: { date_range: "1m" }
            };
        } else {
            console.log(`[Orchestrator] Model A answered directly without DB.`);
            return sanitizeChinese(responseA);
        }
    }

    // ── FAST-PATH: MongoDB Knowledge Base ──────────────────────────────────
    // GUARD: If the user's question asks for details the cache can't provide,
    // override QUICK_LOOKUP → NEED_DATA so it goes through SQL pipeline.
    const DETAIL_WORDS = ["ชื่อ", "รายชื่อ", "ใคร", "คนไหน", "ชื่ออะไร", "รายละเอียด",
        "แต่ละ", "แยกตาม", "เฉพาะ", "เปรียบเทียบ", "เทียบ", "เจาะจง",
        "คนนั้น", "คนนี้", "อันไหน", "ตัวไหน", "มหาลัยไหน", "สาขา", "คณะอะไร"];
    const qLower = question.toLowerCase();
    const questionNeedsDetail = DETAIL_WORDS.some(kw => qLower.includes(kw));

    if (actionData.action === "QUICK_LOOKUP" && actionData.lookup_key) {
        // If question needs details → force SQL pipeline
        if (questionNeedsDetail) {
            console.log(`[Orchestrator] QUICK_LOOKUP overridden → NEED_DATA (question needs details: "${question.substring(0, 60)}...")`);
            actionData.action = "NEED_DATA";
            actionData.intent = question;
        } else {
            console.log(`[Orchestrator] QUICK_LOOKUP: ${actionData.lookup_key}`);
            try {
                const { getAiKnowledgeContextCollection } = await import("@/lib/mongodb");
                const collection = await getAiKnowledgeContextCollection();
                const doc = await collection.findOne({ lookup_key: actionData.lookup_key });
                if (doc && doc.payload) {
                    console.log(`[Orchestrator] MongoDB hit! Key: ${actionData.lookup_key}, Payload: ${doc.payload.length} chars`);
                    return sanitizeChinese(doc.payload);
                }
                console.warn(`[Orchestrator] MongoDB miss for key: ${actionData.lookup_key}. Falling through to SQL.`);
                actionData.action = "NEED_DATA";
                actionData.intent = `Get data for: ${actionData.lookup_key}`;
            } catch (err) {
                console.error(`[Orchestrator] MongoDB error:`, err);
                actionData.action = "NEED_DATA";
                actionData.intent = `Get data for: ${actionData.lookup_key}`;
            }
        }
    }

    // 2. Model B (SQL Generator) generates query based on intent
    console.log(`[Orchestrator] Model A requested data. Invoking Model B... Intent: ${actionData.intent}`);
    const modelB = env.OLLAMA_MODEL_SQL_GENERATOR || modelA;

    // Compute date range: user-specified or default last 1 year
    let daysOffset = 365; // default 1 year — covers most data distributions
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

    // Fallback: detect date hints directly from user's question text
    // (in case Model A didn't parse date_range correctly)
    if (!dateRangeStr || dateRangeStr === "30d" || dateRangeStr === "1m") {
        const q = question.toLowerCase();
        if (/(?:ทั้งหมด|all.?time|ตั้งแต่แรก|ตลอด)/.test(q)) {
            daysOffset = 3650;
        } else if (/(?:1\s*ปี|หนึ่งปี|ปีนี้|1y|ใน\s*1\s*ปี|ในปี)/.test(q)) {
            daysOffset = 365;
        } else if (/(?:6\s*เดือน|หกเดือน|ครึ่งปี|6m)/.test(q)) {
            daysOffset = 180;
        } else if (/(?:3\s*เดือน|สามเดือน|3m)/.test(q)) {
            daysOffset = 90;
        } else if (/(?:7\s*วัน|สัปดาห์|อาทิตย์|7d|1w|1\s*สัปดาห์)/.test(q)) {
            daysOffset = 7;
        }
        if (daysOffset !== 30) {
            console.log(`[Orchestrator] Date hint detected from question: ${daysOffset} days`);
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

    // Check for empty results
    try {
        const parsed = JSON.parse(dbResultStr);
        if (Array.isArray(parsed) && parsed.length === 0) {
            console.log(`[Orchestrator] SQL returned 0 rows for range: ${dateFromStr} to ${dateToStr}`);
            return `📊 ${dateRangeText}\n\nไม่พบข้อมูลที่ตรงกับคำถามในช่วงเวลานี้ครับ\n\n💡 **ลองพูดว่า:**\n- "...ใน 1 ปี" — ขยายเป็น 1 ปี\n- "...ทั้งหมด" — ดูข้อมูลทั้งหมดในระบบ\n- "...3 เดือน" — ดู 3 เดือนล่าสุด`;
        }
    } catch { }

    // ════════════════════════════════════════════════════════════════════
    // 5. Present Results — STRUCTURAL ANTI-HALLUCINATION
    // Pre-format DB data into markdown table in CODE (not by model).
    // Model A only adds a brief Thai-language commentary/insight.
    // Safety net: if Model A hallucinates, return raw pre-formatted data.
    // ════════════════════════════════════════════════════════════════════
    console.log(`[Orchestrator] Returning DB results to Model A... Data: ${dbResultStr.substring(0, 500)}`);

    // Pre-format the raw DB data into a markdown table
    // Map raw DB column names to user-friendly Thai labels
    const COLUMN_LABELS: Record<string, string> = {
        // Booking counts (various aliases the model may generate)
        booking_count: "จำนวนคิว",
        problem_count: "จำนวนคิว",
        total_count: "จำนวนทั้งหมด",
        total_bookings: "จำนวนคิวทั้งหมด",
        student_count: "จำนวนนิสิต",
        cancel_count: "จำนวนยกเลิก",
        cancellation_count: "จำนวนยกเลิก",
        completed_count: "จำนวนสำเร็จ",
        pending_count: "จำนวนรอ",
        consultation_count: "จำนวนปรึกษา",
        cnt: "จำนวน",
        // Booking fields
        booking_id: "รหัสคิว",
        booking_status: "สถานะ",
        booking_service_mode: "รูปแบบบริการ",
        booking_created_at: "วันที่จอง",
        // University
        university_name_th: "มหาวิทยาลัย",
        university_name_en: "University",
        university_id: "รหัสมหาลัย",
        university_count: "จำนวนมหาลัย",
        // Faculty / Department
        faculty_name_th: "คณะ",
        faculty_count: "จำนวนคณะ",
        department_name_th: "สาขาวิชา",
        department_count: "จำนวนสาขา",
        // Student
        student_first_name_th: "ชื่อ",
        student_last_name_th: "นามสกุล",
        student_name: "ชื่อนิสิต",
        student_gender: "เพศ",
        student_id: "รหัสนิสิต",
        student: "ชื่อนิสิต",
        name: "ชื่อ",
        problem_name: "ประเภทปัญหา",
        full_name: "ชื่อ-นามสกุล",
        // Consultant
        consultant_first_name: "ชื่อที่ปรึกษา",
        consultant_last_name: "นามสกุลที่ปรึกษา",
        consultant_name: "ที่ปรึกษา",
        consultant_count: "จำนวนที่ปรึกษา",
        // Problem / Category
        problem_category_name_th: "ประเภทปัญหา",
        problem_category_name_en: "Problem Category",
        problem_category_code: "รหัสปัญหา",
        category_name: "ประเภท",
        // Cancellation
        cancellation_reason_name_th: "สาเหตุยกเลิก",
        cancellation_reason_name_en: "Cancellation Reason",
        reason_name: "สาเหตุ",
        // Region / Province
        region_name_th: "ภูมิภาค",
        province_name_th: "จังหวัด",
        // Risk
        booking_outcome_risk_level: "ระดับความเสี่ยง",
        risk_level: "ระดับความเสี่ยง",
        avg_risk: "ความเสี่ยงเฉลี่ย",
        avg_risk_level: "ความเสี่ยงเฉลี่ย",
        high_risk_count: "จำนวนเสี่ยงสูง",
        // Online
        online_channel_name_th: "ช่องทาง Online",
        online_channel_code: "ช่องทาง",
        // Time
        month: "เดือน",
        year: "ปี",
        hour: "ชั่วโมง",
        day_of_week: "วัน",
        // Gender
        gender: "เพศ",
        male_count: "ชาย",
        female_count: "หญิง",
        other_count: "อื่นๆ",
        // Misc
        count: "จำนวน",
        total: "รวม",
        rank: "อันดับ",
        percentage: "เปอร์เซ็นต์",
        pct: "เปอร์เซ็นต์",
        avg_count: "เฉลี่ย",
        max_count: "สูงสุด",
        min_count: "ต่ำสุด",
        case_count: "จำนวนเคส",
        // Contact
        consultant_phone_number: "เบอร์โทรที่ปรึกษา",
        advisor_phone_number: "เบอร์โทรอาจารย์",
        consultant_email: "อีเมลที่ปรึกษา",
        advisor_email: "อีเมลอาจารย์",
        student_phone_number: "เบอร์โทรนิสิต",
        student_email: "อีเมลนิสิต",
        // Advisor
        advisor_first_name: "ชื่ออาจารย์ที่ปรึกษา",
        advisor_last_name: "นามสกุลอาจารย์ที่ปรึกษา",
        // Cancel pct
        cancel_pct: "เปอร์เซ็นต์ยกเลิก",
        cancelled: "ยกเลิก",
        cancel_percentage: "เปอร์เซ็นต์ยกเลิก",
        cancelled_appointments: "จำนวนยกเลิก",
    };

    /**
     * Get Thai label for a column name.
     * First checks exact match, then applies pattern-based fallback.
     */
    function getColumnLabel(col: string): string {
        if (COLUMN_LABELS[col]) return COLUMN_LABELS[col];
        // Pattern-based fallback for unmapped columns
        if (col.endsWith("_count")) return "จำนวน";
        if (col.endsWith("_name_th") || col.endsWith("_name_en")) return "ชื่อ";
        if (col.endsWith("_id")) return "รหัส";
        if (col.startsWith("total_")) return "รวม";
        if (col.startsWith("avg_")) return "เฉลี่ย";
        // Fallback: just use column name with underscores → spaces
        return col.replace(/_/g, " ");
    }

    let preFormattedData = "";
    let rowCount = 0;
    try {
        const parsedRows = JSON.parse(dbResultStr);
        if (Array.isArray(parsedRows) && parsedRows.length > 0) {
            rowCount = parsedRows.length;
            const cols = Object.keys(parsedRows[0]);
            // Map column names to Thai labels
            const displayCols = cols.map(c => getColumnLabel(c));
            preFormattedData = `| ${displayCols.join(" | ")} |\n|${displayCols.map(() => "---").join("|")}|\n`;
            parsedRows.forEach((row: any) => {
                preFormattedData += `| ${cols.map(c => {
                    const v = row[c];
                    if (v === null || v === undefined) return "-";
                    if (typeof v === "bigint") return Number(v).toLocaleString();
                    // Phone numbers: preserve as-is (detect by column name or pattern)
                    if (typeof v === "string" && (
                        c.includes("phone") || c.includes("email") || c.includes("_id") ||
                        /^0\d{8,9}$/.test(v)  // Thai phone: starts with 0, 9-10 digits
                    )) {
                        // Format phone: 0xx-xxx-xxxx
                        if (/^0\d{8,9}$/.test(v)) {
                            return v.length === 10
                                ? `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6)}`
                                : `${v.slice(0, 2)}-${v.slice(2, 5)}-${v.slice(5)}`;
                        }
                        return String(v);
                    }
                    // Format large numbers with commas (but NOT phone-like digit strings)
                    if (typeof v === "number" && v >= 1000) return v.toLocaleString();
                    if (typeof v === "string" && /^\d{4,}$/.test(v) && !v.startsWith("0")) return Number(v).toLocaleString();
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
        "## ข้อมูลจากระบบ:",
        preFormattedData,
        "",
        "INSTRUCTIONS:",
        `1. ขึ้นต้นด้วย: "📅 ${dateRangeText}"`,
        "2. แสดงข้อมูลเป็นตาราง markdown — ใช้หัวคอลัมน์ภาษาไทยตามที่ให้มา COPY ทุกค่าตรงๆ ห้ามเปลี่ยน!",
        "3. เพิ่ม 1-2 ประโยค วิเคราะห์/สรุปภาษาไทย ใต้ตาราง",
        `4. ข้อมูลมี ${rowCount} แถว — แสดง ${rowCount} แถว ห้ามเพิ่ม ห้ามลด`,
        "5. ห้ามเพิ่มข้อมูลที่ไม่มีในตาราง",
        "6. ใช้ emoji และภาษาไทย",
        "7. ห้ามใช้คำว่า SQL, Database, Query, Column, Table",
        "8. ⛔ THAI ONLY — ห้ามใช้ภาษาจีน! ห้ามมีตัวอักษรจีนแม้แต่ตัวเดียว!"
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

    return sanitizeChinese(finalAnswer);
}
