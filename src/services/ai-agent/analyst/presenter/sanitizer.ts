// src/services/ai-agent/analyst/presenter/sanitizer.ts
// Post-processing: strip Chinese characters + hallucination guard.

/**
 * Strip Chinese characters from AI responses.
 * Qwen models may occasionally output Chinese text.
 */
export function sanitizeChinese(text: string): string {
    const chineseCharRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;

    return text
        .split("\n")
        .map(line => {
            const chineseChars = line.match(chineseCharRegex);
            if (!chineseChars) return line;

            const nonSpaceChars = line.replace(/\s/g, "").length;
            if (nonSpaceChars > 0 && chineseChars.length / nonSpaceChars > 0.3) {
                return "";
            }

            return line.replace(chineseCharRegex, "").replace(/\s{2,}/g, " ").trim();
        })
        .filter(line => line.trim() !== "" || line === "")
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Check if Model A hallucinated by comparing its answer against actual DB data.
 * Returns true if the answer appears to contain real data values.
 */
export function hasRealData(finalAnswer: string, dbResultStr: string): boolean {
    try {
        const rows = JSON.parse(dbResultStr);
        if (!Array.isArray(rows) || rows.length === 0) return true;

        const firstRow = rows[0];
        const allValues = Object.values(firstRow).map(v => String(v));
        return allValues.some(v => v.length > 2 && finalAnswer.includes(v));
    } catch {
        return true;
    }
}

/**
 * Check if Model A's "direct answer" is likely fabricated data.
 * Returns true if the answer has suspiciously many numbers.
 */
export function looksLikeHallucination(text: string): boolean {
    const numberMatches = text.match(/\d{1,3}(,\d{3})+|\d{3,}/g);
    return !!numberMatches && numberMatches.length >= 3;
}
