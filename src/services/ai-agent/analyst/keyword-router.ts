/**
 * Keyword-based intent router for common Thai queries.
 * Runs BEFORE Model A to deterministically route simple queries
 * to pre-cached MongoDB data, bypassing the LLM entirely.
 *
 * IMPORTANT: Complex/multi-part questions (e.g. asking for student names,
 * faculty details, comparisons) are detected and skipped — those go
 * through Model A → SQL pipeline for accurate results.
 */

interface RouterResult {
    matched: boolean;
    lookupKey?: string;      // e.g. "TOP_PROBLEMS_3M"
    needData?: boolean;      // true = fall through to SQL pipeline
    intent?: string;         // generated intent for Model B
    dateRange?: string;      // e.g. "1m", "3m", "1y"
}

// ── Period Detection ──────────────────────────────────────────────
function detectPeriod(q: string): { suffix: string; dateRange: string } {
    // Match patterns like "1ปี", "7 ปี", "12เดือน", "6 เดือน", "3m", "1y"
    const yearMatch = q.match(/(\d+)\s*ปี/);
    if (yearMatch) {
        const years = parseInt(yearMatch[1]);
        const months = Math.min(years * 12, 120); // up to 10 years
        return { suffix: `_${months}M`, dateRange: `${years}y` };
    }

    const monthMatch = q.match(/(\d+)\s*เดือน/);
    if (monthMatch) {
        const months = Math.min(parseInt(monthMatch[1]), 120);
        return { suffix: `_${months}M`, dateRange: `${months}m` };
    }

    // Day-based detection: "30 วัน" → 1M, "90 วัน" → 3M, etc.
    const dayMatch = q.match(/(\d+)\s*วัน/);
    if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        const months = Math.max(1, Math.min(Math.round(days / 30), 120));
        return { suffix: `_${months}M`, dateRange: `${days}d` };
    }

    // English shortcuts
    if (q.includes("1y") || q.includes("1 year")) return { suffix: "_12M", dateRange: "1y" };
    if (q.includes("6m") || q.includes("6 month")) return { suffix: "_6M", dateRange: "6m" };
    if (q.includes("3m") || q.includes("3 month")) return { suffix: "_3M", dateRange: "3m" };

    // Thai time keywords
    if (q.includes("ล่าสุด") || q.includes("วันนี้") || q.includes("เดือนนี้")) return { suffix: "_1M", dateRange: "1m" };

    // Default: 1 month
    return { suffix: "_1M", dateRange: "1m" };
}

// ── Keyword Matching Rules ───────────────────────────────────────
// Each rule: { keywords: [must match ANY], excludeKeywords: [must NOT match], lookupKey: base key }
const ROUTING_RULES: Array<{
    keywords: string[];
    excludeKeywords?: string[];
    lookupKey: string;
    description: string;
}> = [
        {
            keywords: ["ประเภทปัญหา", "หมวดปัญหา", "ปัญหาอะไรมากสุด", "ปัญหาที่พบ", "ปัญหาที่มาก", "ประเภทการปรึกษา"],
            lookupKey: "TOP_PROBLEMS",
            description: "Problem categories ranking"
        },
        {
            keywords: ["ยกเลิก", "สาเหตุยกเลิก", "เหตุผลยกเลิก", "ทำไมยกเลิก", "สาเหตุการยกเลิก", "cancellation", "cancel"],
            lookupKey: "CANCELLATION_SUMMARY",
            description: "Cancellation reasons"
        },
        {
            keywords: ["อันดับมหาวิทยาลัย", "มหาลัยไหนมากสุด", "มหาวิทยาลัยที่มีคิว", "top มหาลัย", "มหาลัยอันดับ", "มหาวิทยาลัยอันดับ"],
            excludeKeywords: ["ปัญหา", "ประเภท", "หมวด"],
            lookupKey: "TOP_UNIVERSITIES",
            description: "University rankings by booking count"
        },
        {
            keywords: ["ภาพรวม", "สถิติรวม", "ตัวเลขรวม", "สรุปภาพรวม", "overview", "จำนวนทั้งหมด"],
            excludeKeywords: ["ปัญหา", "ยกเลิก", "มหาวิทยาลัย", "คณะ"],
            lookupKey: "STATS_OVERVIEW",
            description: "Overall statistics"
        },
        {
            keywords: ["สถานะคิว", "สถานะการจอง", "booking status"],
            lookupKey: "BOOKING_STATUS_SUMMARY",
            description: "Booking status breakdown"
        },
        {
            keywords: ["เพศ", "ชาย", "หญิง", "gender"],
            excludeKeywords: ["เพศสัมพันธ์"],
            lookupKey: "GENDER_SUMMARY",
            description: "Gender distribution"
        },
        {
            keywords: ["ภูมิภาค", "ภาค", "region"],
            excludeKeywords: ["ภาควิชา"],
            lookupKey: "REGIONAL_SUMMARY",
            description: "Regional statistics"
        },
        {
            keywords: ["คณะ", "faculty", "อันดับคณะ", "คณะไหนมากสุด"],
            excludeKeywords: ["คณบดี"],
            lookupKey: "TOP_FACULTIES",
            description: "Faculty rankings"
        },
        {
            keywords: ["ภาควิชา", "department", "สาขา"],
            lookupKey: "TOP_DEPARTMENTS",
            description: "Department rankings"
        },
        {
            keywords: ["ที่ปรึกษา", "consultant", "อันดับที่ปรึกษา"],
            excludeKeywords: ["หัวหน้า"],
            lookupKey: "TOP_CONSULTANTS",
            description: "Consultant rankings"
        },
        {
            keywords: ["รูปแบบบริการ", "onsite", "online", "service mode"],
            lookupKey: "SERVICE_MODE_SUMMARY",
            description: "Service mode breakdown"
        },
        {
            keywords: ["ระดับความเสี่ยง", "risk level", "ความเสี่ยง"],
            lookupKey: "RISK_LEVEL_SUMMARY",
            description: "Risk level distribution"
        },
        {
            keywords: ["จังหวัด", "province"],
            lookupKey: "PROVINCIAL_SUMMARY",
            description: "Provincial statistics"
        },
        {
            keywords: ["แนวโน้ม", "trend", "รายเดือน", "เทรนด์"],
            lookupKey: "MONTHLY_TREND",
            description: "Monthly trends"
        },
        {
            keywords: ["นิสิต", "นักศึกษา", "student", "จองมากสุด"],
            excludeKeywords: ["มหาวิทยาลัย", "คณะ", "ยกเลิก", "สาเหตุ", "ปัญหา", "เสี่ยง", "ความเสี่ยง", "onsite", "online", "ภาค", "จังหวัด", "เพศ", "ที่ปรึกษา"],
            lookupKey: "TOP_STUDENTS",
            description: "Top students by booking count"
        },
        {
            keywords: ["รายชื่อมหาวิทยาลัย", "มหาวิทยาลัยทั้งหมด", "university list"],
            lookupKey: "UNIVERSITY_LIST",
            description: "List of all universities"
        },
        {
            keywords: ["ช่องทาง", "channel", "line call", "zoom", "google meet", "microsoft teams", "ช่องทางออนไลน์"],
            excludeKeywords: ["ยกเลิก", "เสี่ยง"],
            lookupKey: "ONLINE_CHANNEL_SUMMARY",
            description: "Online channel breakdown"
        },
        {
            keywords: ["ช่วงเวลา", "เวลาไหน", "ชั่วโมง", "peak", "เวลายอดนิยม", "ช่วงไหน"],
            excludeKeywords: ["ยกเลิก", "เสี่ยง"],
            lookupKey: "HOURLY_SUMMARY",
            description: "Peak hours"
        },
        {
            keywords: ["มหาลัยเสี่ยง", "มหาวิทยาลัยเสี่ยง", "เสี่ยงสูงสุด"],
            excludeKeywords: ["นิสิต", "นักศึกษา", "student"],
            lookupKey: "TOP_HIGH_RISK_UNIVERSITIES",
            description: "Universities with highest risk"
        },
        {
            keywords: ["นิสิตเสี่ยง", "นักศึกษาเสี่ยง", "เสี่ยงสูง"],
            excludeKeywords: ["มหาวิทยาลัย", "มหาลัย"],
            lookupKey: "TOP_HIGH_RISK_STUDENTS",
            description: "High risk students"
        },
    ];

// ── Detail keywords that indicate the question needs SQL, not cached summary ──
// If ANY of these appear, the question asks for specifics the cache can't provide.
const DETAIL_KEYWORDS = [
    "ชื่อ", "รายชื่อ", "ใคร", "คนไหน", "ชื่ออะไร",
    "ข้อมูลเพิ่มเติม", "รายละเอียด", "แต่ละ", "แยกตาม",
    "เฉพาะ", "เปรียบเทียบ", "เทียบ", "เจาะจง",
    "คนนั้น", "คนนี้", "อันไหน", "ตัวไหน",
    // Statistical calculations — cache can't compute these
    "เปอร์เซ็นต์", "%", "กี่เปอร์เซ็นต์", "อัตรา", "เฉลี่ย", "ค่าเฉลี่ย",
    "เบอร์ติดต่อ", "เบอร์โทร", "อีเมล", "email",
];

// ── Scope modifiers that indicate the question targets a specific entity ──
// The cache stores aggregate data — if the question is about a specific
// university, region, faculty etc., we MUST go to SQL.
const SCOPE_KEYWORDS = [
    // University-specific indicators
    "มหาวิทยาลัย", "มหาลัย", "สถาบัน", "ราชภัฏ", "ราชมงคล",
    "จุฬา", "ธรรมศาสตร์", "มหิดล", "เกษตร", "รามคำแหง",
    "พระจอม", "ศิลปากร", "บูรพา", "แม่ฟ้า", "นเรศวร",
    "ศรีนครินทร", "สงขลา", "ขอนแก่น", "เชียงใหม่",
    // Faculty/Department
    "คณะวิทย", "คณะศิลป", "คณะวิศว", "คณะแพทย", "คณะพยาบาล",
    "คณะบริหาร", "คณะนิติ", "คณะเภสัช", "คณะครุ", "คณะศึกษา",
    // Region/Province specific
    "ภาคเหนือ", "ภาคใต้", "ภาคอิสาน", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคกลาง",
    "กรุงเทพ", "เชียงราย", "นครราชสีมา", "สุราษฎร์",
    // Problem category specific (these need to filter, not just list)
    "ปัญหาการเงิน", "ปัญหาการเรียน", "ปัญหาครอบครัว", "ปัญหาสุขภาพ",
    "เครียด", "ซึมเศร้า", "วิตกกังวล", "ฆ่าตัวตาย",
];

/**
 * Deterministic keyword-based router.
 * Returns a matched lookup_key + period suffix if the question matches any known pattern.
 * Skips routing when the question is too complex for cached data.
 */
export function keywordRoute(question: string): RouterResult {
    const q = question.toLowerCase().trim();

    // ── Complexity Gate ──────────────────────────────────────────────
    // 1. Check if the question asks for details beyond cached summaries
    const hasDetailRequest = DETAIL_KEYWORDS.some(kw => q.includes(kw));

    // 2. Check if question targets a specific entity (cache can't answer scoped queries)
    const hasScopeModifier = SCOPE_KEYWORDS.some(kw => q.includes(kw.toLowerCase()));

    // 3. Check if multiple routing rules match (= multi-topic question)
    const matchedRuleCount = ROUTING_RULES.filter(rule => {
        const hasKw = rule.keywords.some(kw => q.includes(kw.toLowerCase()));
        if (!hasKw) return false;
        if (rule.excludeKeywords) {
            return !rule.excludeKeywords.some(ek => q.includes(ek.toLowerCase()));
        }
        return true;
    }).length;

    if (hasDetailRequest || hasScopeModifier || matchedRuleCount >= 2) {
        console.log(`[KeywordRouter] SKIP — complex query (details=${hasDetailRequest}, scope=${hasScopeModifier}, matchedRules=${matchedRuleCount}, q="${q.substring(0, 80)}...")`);
        return { matched: false };
    }

    // ── Simple query routing ─────────────────────────────────────────
    for (const rule of ROUTING_RULES) {
        // Check if any keyword matches
        const hasKeyword = rule.keywords.some(kw => q.includes(kw.toLowerCase()));
        if (!hasKeyword) continue;

        // Check exclusions
        if (rule.excludeKeywords) {
            const hasExclude = rule.excludeKeywords.some(ek => q.includes(ek.toLowerCase()));
            if (hasExclude) continue;
        }

        // Detect period
        const period = detectPeriod(q);

        // Build final lookup key with period suffix
        const lookupKey = `${rule.lookupKey}${period.suffix}`;

        console.log(`[KeywordRouter] Matched: "${rule.description}" → ${lookupKey}`);

        return {
            matched: true,
            lookupKey,
            dateRange: period.dateRange
        };
    }

    // No keyword match — fall through to Model A
    return { matched: false };
}
