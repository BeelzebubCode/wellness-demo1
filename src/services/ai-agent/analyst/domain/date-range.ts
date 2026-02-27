// src/services/ai-agent/analyst/domain/date-range.ts
// Date range parsing and Thai date formatting.

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export interface DateRange {
    dateFromStr: string;   // YYYY-MM-DD
    dateToStr: string;     // YYYY-MM-DD
    daysOffset: number;
    thaiText: string;      // "ข้อมูลช่วง 1 ก.พ. 2569 - 27 ก.พ. 2569"
}

/** Parse date_range string from Model A → days offset */
export function parseDateRange(dateRangeStr?: string): number {
    if (!dateRangeStr) return 365;

    const map: Record<string, number> = {
        "7d": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365, "all_time": 3650,
    };
    if (map[dateRangeStr]) return map[dateRangeStr];

    // Handle Ny (years): "2y" → 730, "7y" → 2555
    if (dateRangeStr.endsWith("y")) {
        const years = parseInt(dateRangeStr);
        if (!isNaN(years) && years > 0) return years * 365;
    }

    // Handle Nm (months): "12m" → 365, "84m" → 2555
    if (dateRangeStr.endsWith("m")) {
        const months = parseInt(dateRangeStr);
        if (!isNaN(months) && months > 0) return months * 30;
    }

    // Handle Nd (days)
    if (dateRangeStr.endsWith("d")) {
        const days = parseInt(dateRangeStr);
        if (!isNaN(days) && days > 0) return days;
    }

    return 365;
}

/** Detect date hint from Thai question text (fallback when Model A doesn't parse) */
export function detectDateHintFromQuestion(question: string): number | null {
    const q = question.toLowerCase();

    // "ทั้งหมด" / "all time" → max range
    if (/(?:ทั้งหมด|all.?time|ตั้งแต่แรก|ตลอด)/.test(q)) return 3650;

    // Generic N ปี: "7 ปี" → 2555, "3 ปี" → 1095, "1 ปี" → 365
    const yearMatch = q.match(/(\d+)\s*ปี/);
    if (yearMatch) {
        const years = parseInt(yearMatch[1]);
        if (years > 0) return years * 365;
    }

    // Thai year words
    if (/(?:หนึ่งปี|ปีนี้|1y|ในปี)/.test(q)) return 365;

    // Generic N เดือน: "6 เดือน" → 180
    const monthMatch = q.match(/(\d+)\s*เดือน/);
    if (monthMatch) {
        const months = parseInt(monthMatch[1]);
        if (months > 0) return months * 30;
    }

    if (/(?:หกเดือน|ครึ่งปี|6m)/.test(q)) return 180;
    if (/(?:สามเดือน|3m)/.test(q)) return 90;

    // Generic N วัน: "90 วัน" → 90
    const dayMatch = q.match(/(\d+)\s*วัน/);
    if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        if (days > 0) return days;
    }

    if (/(?:สัปดาห์|อาทิตย์|7d|1w|1\s*สัปดาห์)/.test(q)) return 7;

    // "ย้อนหลัง" without number → treat as wanting historical data
    if (/ย้อนหลัง/.test(q)) return 3650;

    return null;
}

/** Build DateRange with Thai-formatted text */
export function buildDateRange(daysOffset: number): DateRange {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysOffset);

    const thaiDateFrom = `${dateFrom.getDate()} ${THAI_MONTHS[dateFrom.getMonth()]} ${dateFrom.getFullYear() + 543}`;
    const thaiDateTo = `${dateTo.getDate()} ${THAI_MONTHS[dateTo.getMonth()]} ${dateTo.getFullYear() + 543}`;

    return {
        dateFromStr: dateFrom.toISOString().slice(0, 10),
        dateToStr: dateTo.toISOString().slice(0, 10),
        daysOffset,
        thaiText: `ข้อมูลช่วง ${thaiDateFrom} - ${thaiDateTo}`,
    };
}

/** Full pipeline: Model A's date_range + question fallback → DateRange */
export function resolveDateRange(dateRangeStr?: string, question?: string): DateRange {
    let days = parseDateRange(dateRangeStr);

    // ALWAYS check question for date hints — override Model A if user explicitly
    // asked for a different range. Model A often defaults to "1m" even when
    // user says "7 ปี".
    if (question) {
        const hint = detectDateHintFromQuestion(question);
        if (hint !== null && hint > days) {
            console.log(`[DateRange] Question hint override: ${days}d → ${hint}d (from: "${question.substring(0, 40)}")`);
            days = hint;
        }
    }

    return buildDateRange(days);
}
