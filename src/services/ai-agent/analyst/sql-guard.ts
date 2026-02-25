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
        .trim();

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
