// src/services/ai-agent/analyst/presenter/formatter.ts
// Formats raw DB result (JSON) into a markdown table with Thai column headers.

import { getColumnLabel } from "./column-labels";

/** Format phone number: 0xx-xxx-xxxx */
function formatPhone(v: string): string {
    if (/^0\d{8,9}$/.test(v)) {
        return v.length === 10
            ? `${v.slice(0, 3)}-${v.slice(3, 6)}-${v.slice(6)}`
            : `${v.slice(0, 2)}-${v.slice(2, 5)}-${v.slice(5)}`;
    }
    return v;
}

// Columns that should NOT have comma formatting (years, months, IDs, etc.)
const NO_COMMA_COLS = /year|month|day|hour|period|_id$/i;

function formatCellValue(col: string, v: any): string {
    if (v === null || v === undefined) return "-";
    if (typeof v === "bigint") {
        // Year-like bigints (1900-2100) → no commas
        const n = Number(v);
        if (NO_COMMA_COLS.test(col) || (n >= 1900 && n <= 2100)) return String(n);
        return n.toLocaleString();
    }

    // Phone/email/ID: preserve as-is
    if (typeof v === "string" && (
        col.includes("phone") || col.includes("email") || col.includes("_id") ||
        /^0\d{8,9}$/.test(v)
    )) {
        return formatPhone(String(v));
    }

    // Skip comma formatting for year/month/id columns
    if (NO_COMMA_COLS.test(col)) return String(v);

    // Large numbers → localized (but not year-like: 1900-2100)
    if (typeof v === "number") {
        if (v >= 1900 && v <= 2100) return String(v); // year
        if (v >= 1000) return v.toLocaleString();
    }
    if (typeof v === "string" && /^\d{4,}$/.test(v) && !v.startsWith("0")) {
        const n = Number(v);
        if (n >= 1900 && n <= 2100) return v; // year string
        return n.toLocaleString();
    }

    return String(v);
}

export interface FormatResult {
    markdown: string;
    rowCount: number;
}

/** Convert JSON DB result → markdown table with Thai headers */
export function formatDbResultToMarkdown(dbResultStr: string): FormatResult {
    try {
        const rows = JSON.parse(dbResultStr);
        if (!Array.isArray(rows) || rows.length === 0) {
            return { markdown: dbResultStr, rowCount: 0 };
        }

        const cols = Object.keys(rows[0]);
        const displayCols = cols.map(c => getColumnLabel(c));

        let md = `| ${displayCols.join(" | ")} |\n|${displayCols.map(() => "---").join("|")}|\n`;
        for (const row of rows) {
            md += `| ${cols.map(c => formatCellValue(c, row[c])).join(" | ")} |\n`;
        }

        return { markdown: md, rowCount: rows.length };
    } catch {
        return { markdown: dbResultStr, rowCount: 0 };
    }
}

/** Build the data-injection message for Model A */
export function buildDataInjectionMessage(
    preFormatted: string,
    rowCount: number,
    dateRangeText: string,
): string {
    return [
        "[DATA_INJECTED]",
        dateRangeText,
        "",
        "## ข้อมูลจากระบบ:",
        preFormatted,
        "",
        "INSTRUCTIONS:",
        `1. ขึ้นต้นด้วย: "📅 ${dateRangeText}"`,
        "2. แสดงข้อมูลเป็นตาราง markdown — ใช้หัวคอลัมน์ภาษาไทยตามที่ให้มา COPY ทุกค่าตรงๆ ห้ามเปลี่ยน!",
        "3. เพิ่ม 1-2 ประโยค วิเคราะห์/สรุปภาษาไทย ใต้ตาราง",
        `4. ข้อมูลมี ${rowCount} แถว — แสดง ${rowCount} แถว ห้ามเพิ่ม ห้ามลด`,
        "5. ห้ามเพิ่มข้อมูลที่ไม่มีในตาราง",
        "6. ใช้ emoji และภาษาไทย",
        "7. ห้ามใช้คำว่า SQL, Database, Query, Column, Table",
        "8. ⛔ THAI ONLY — ห้ามใช้ภาษาจีน! ห้ามมีตัวอักษรจีนแม้แต่ตัวเดียว!",
    ].join("\n");
}
