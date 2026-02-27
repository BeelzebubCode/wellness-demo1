export interface SqlValidationResult {
    ok: boolean;
    reason?: string;
    sanitizedSql?: string; // the sql string with markdown and semicolons stripped
}

export function validateSql(rawSql: string, isMinistry: boolean = false): SqlValidationResult {
    if (!rawSql) {
        return { ok: false, reason: "No SQL provided." };
    }

    // 1. Strip markdown codeblock if present
    let cleanSql = rawSql.replace(/```sql/gi, "").replace(/```/g, "").trim();

    // 2. Strip LLM artifacts (BOS/EOS tokens, special tokens)
    cleanSql = cleanSql
        .replace(/&lt;\/?s&gt;/gi, "") // Strip <s> and </s>
        .replace(/&lt;\|im_end\|&gt;/gi, "")
        .replace(/&lt;\|im_start\|&gt;/gi, "")
        .replace(/&lt;\|endoftext\|&gt;/gi, "")
        .replace(/<\/?s>/gi, "")
        .replace(/<\|im_end\|>/gi, "")
        .replace(/<\|im_start\|>/gi, "")
        .replace(/<\|endoftext\|>/gi, "")
        .replace(/<think>[\s\S]*?<\/think>/g, "") // Strip Qwen3 thinking tags
        .trim();

    // 2b. Quote Thai column aliases with double-quotes for PostgreSQL compatibility
    // e.g. "AS ชื่อ-นามสกุล" → 'AS "ชื่อ-นามสกุล"' so ORDER BY still works
    cleanSql = cleanSql
        .replace(/\bAS\s+([\u0E00-\u0E7F][\u0E00-\u0E7F\w\-\/]*)/gi, (_m, alias) => `AS "${alias}"`)
        .trim();

    // 2c. Also quote bare Thai words in ORDER BY / GROUP BY
    // e.g. "ORDER BY จำนวน DESC" → 'ORDER BY "จำนวน" DESC'
    cleanSql = cleanSql
        .replace(/\b(ORDER\s+BY|GROUP\s+BY)\s+([\u0E00-\u0E7F][\u0E00-\u0E7F\w\-\/]*)/gi,
            (_m, clause, col) => `${clause} "${col}"`)
        .trim();

    // 2d. Auto-fix missing _th suffix on Thai name columns
    // The LLM sometimes writes student_first_name instead of student_first_name_th
    const thColumns = [
        "student_first_name", "student_last_name", "student_nickname",
        "university_name", "faculty_name", "department_name",
        "problem_category_name", "province_name", "region_name",
        "cancellation_reason_name",
    ];
    for (const col of thColumns) {
        // Replace "col" but NOT "col_th" or "col_en"
        const regex = new RegExp(`\\b(${col})(?!_(?:th|en))\\b`, "g");
        cleanSql = cleanSql.replace(regex, `${col}_th`);
    }

    // 2e. Auto-fix Thai booking_status enum values
    cleanSql = cleanSql
        .replace(/'ยกเลิก'/g, "'CANCELLED'")
        .replace(/'เสร็จ(?:สิ้น)?'/g, "'COMPLETED'")
        .replace(/'รอ(?:ดำเนินการ)?'/g, "'PENDING'")
        .replace(/'ยืนยัน'/g, "'CONFIRMED'")
        // StudentGender enum
        .replace(/'หญิง'/g, "'FEMALE'")
        .replace(/'ชาย'/g, "'MALE'")
        .replace(/'(?:LGBTQ|อื่น(?:ๆ)?|ทางเลือก)'/g, "'LGBTQ_PLUS'");

    // 3. Extract only the SQL part (find first SELECT or WITH)
    const upperTrimmed = cleanSql.toUpperCase();
    const selectIdx = upperTrimmed.indexOf("SELECT");
    const withIdx = upperTrimmed.indexOf("WITH");
    let startIdx = -1;
    if (selectIdx !== -1 && withIdx !== -1) {
        startIdx = Math.min(selectIdx, withIdx);
    } else if (selectIdx !== -1) {
        startIdx = selectIdx;
    } else if (withIdx !== -1) {
        startIdx = withIdx;
    }
    if (startIdx > 0) {
        cleanSql = cleanSql.substring(startIdx).trim();
    }

    // 3b. Truncate at echo boundary (sqlcoder may echo back examples after the real answer)
    const echoBoundaries = ["\n### ", "\n-- Q:", "\n-- q:", "\nQuestion:", "\n\nSELECT ", "\nNo ", "\nDate "];
    for (const marker of echoBoundaries) {
        const markerIdx = cleanSql.indexOf(marker);
        if (markerIdx > 10) { // only if there's actual SQL before it
            cleanSql = cleanSql.substring(0, markerIdx).trim();
        }
    }

    // Remove trailing semicolons (prevent multi-statement execution via simple concat)
    if (cleanSql.endsWith(";")) {
        cleanSql = cleanSql.slice(0, -1).trim();
    }

    // Auto-fix internal semicolons: take only the first statement (sqlcoder sometimes duplicates)
    if (cleanSql.includes(";")) {
        cleanSql = cleanSql.split(";")[0].trim();
    }

    const upperQuery = cleanSql.toUpperCase();

    // ═══ Programmatic SQL correctness checks ═══
    // Catch known LLM failure patterns and reject with helpful error for retry

    // Check 1: student_academic has NO name columns
    if (/\bsa\.faculty_name_th\b/i.test(cleanSql) || /\bstudent_academic\.\s*faculty_name_th\b/i.test(cleanSql)) {
        return { ok: false, reason: "student_academic has NO faculty_name_th column! JOIN faculty table: JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id, then use f.faculty_name_th" };
    }
    if (/\bsa\.department_name_th\b/i.test(cleanSql) || /\bstudent_academic\.\s*department_name_th\b/i.test(cleanSql)) {
        return { ok: false, reason: "student_academic has NO department_name_th column! JOIN department table: JOIN department d ON d.department_id = sa.department_id AND d.university_id = sa.university_id, then use d.department_name_th" };
    }

    // Check 2: booking_cancellation.booking_id must come from booking, not student_id
    if (/bc\.booking_id\s*=\s*\w+\.student_id/i.test(cleanSql)) {
        return { ok: false, reason: "booking_cancellation.booking_id is a BOOKING ID, not a student_id! Join: booking b JOIN booking_cancellation bc ON bc.booking_id = b.booking_id AND bc.university_id = b.university_id" };
    }

    // Check 3: Auto-fix OR operator precedence (LIKE '%x%' OR LIKE '%x%' AND date_filter)
    // Without parentheses, the OR returns wrong results. Wrap the OR group.
    cleanSql = cleanSql.replace(
        /WHERE\s+([\w.]+\s+LIKE\s+'[^']+'\s+OR\s+[\w.]+\s+LIKE\s+'[^']+')\s+AND\b/gi,
        'WHERE ($1) AND'
    );

    // 3. Must start with SELECT or WITH
    if (!upperQuery.startsWith("SELECT") && !upperQuery.startsWith("WITH")) {
        return { ok: false, reason: "Only SELECT or WITH queries are allowed." };
    }

    // 4. Block forbidden keywords
    const forbidden = [
        "INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ", "CREATE ", "TRUNCATE ", "GRANT ", "REVOKE ", "EXEC "
    ];
    for (const keyword of forbidden) {
        // Basic check for keyword presence
        if (upperQuery.includes(keyword)) {
            return { ok: false, reason: `Forbidden SQL keyword detected: ${keyword.trim()}` };
        }
    }

    // 5. Enforce Tenant scope: if not ministry, MUST contain university_id filter
    if (!isMinistry && !cleanSql.includes("university_id")) {
        return { ok: false, reason: "Query is missing mandatory tenant filter (university_id)." };
    }

    return { ok: true, sanitizedSql: cleanSql };
}
