// src/services/ai-agent/analyst/prompts/sql-generator.ts
// SQL Generator prompt — now uses auto-generated schema from Prisma DMMF.

import { getAnalyticsSchema } from "../adapters/schema-extractor";
import { SCHEMA_HINTS } from "./hints";

const SQL_INSTRUCTIONS = `### Instructions:
Your task is to convert a natural language question into a PostgreSQL query given the database schema below.
Adhere to these rules:
- **Deliberately go through the question and database schema word by word** to appropriately answer the question
- **Use Table Coverage**: Always check which tables are required, prefer using CTEs for complex queries
- **Use only valid PostgreSQL**, no semicolons, no markdown code fences
- When counting, always cast to bigint: COUNT(*)::bigint
- When averaging, cast to numeric: AVG(col)::numeric(10,2)
- Start your answer directly with SELECT or WITH
- ⛔ Column aliases MUST be simple English (e.g. booking_count, student_name). NEVER use Thai aliases like "AS ชื่อนิสิต" — PostgreSQL will error!
- ⛔ NEVER output markdown fences (\`\`\`sql). Output raw SQL only.
- Always LIMIT results to 20 rows max unless told otherwise`;

const SQL_EXAMPLES = `
### Example Queries:

-- Q: Find university with the highest booking count. Return university_name_th, booking_count.
### SQL:
WITH uni_counts AS (SELECT university_id, COUNT(*)::bigint AS booking_count FROM booking WHERE booking_created_at >= '2025-02-25' AND booking_created_at < '2026-02-25' GROUP BY university_id ORDER BY booking_count DESC LIMIT 10) SELECT u.university_name_th, uc.booking_count FROM uni_counts uc JOIN university u ON u.university_id = uc.university_id ORDER BY uc.booking_count DESC

-- Q: Top 10 students with most bookings, show name and university
### SQL:
WITH top_students AS (SELECT student_id, university_id, COUNT(*)::bigint AS booking_count FROM booking GROUP BY university_id, student_id ORDER BY booking_count DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, ts.booking_count FROM top_students ts JOIN student_profile sp ON sp.student_id = ts.student_id AND sp.university_id = ts.university_id JOIN university u ON u.university_id = ts.university_id ORDER BY ts.booking_count DESC

-- Q: Top 3 faculties with highest bookings
### SQL:
WITH faculty_bookings AS (SELECT sa.faculty_id, sa.university_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id GROUP BY sa.faculty_id, sa.university_id ORDER BY booking_count DESC LIMIT 3) SELECT f.faculty_name_th, u.university_name_th, fb.booking_count FROM faculty_bookings fb JOIN faculty f ON f.faculty_id = fb.faculty_id AND f.university_id = fb.university_id JOIN university u ON u.university_id = fb.university_id ORDER BY fb.booking_count DESC

-- Q: Top region by bookings
### SQL:
WITH region_bookings AS (SELECT p.region_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN university u ON u.university_id = b.university_id JOIN province p ON p.province_id = u.province_id GROUP BY p.region_id ORDER BY booking_count DESC LIMIT 3) SELECT r.region_name_th, rb.booking_count FROM region_bookings rb JOIN region r ON r.region_id = rb.region_id ORDER BY rb.booking_count DESC

-- Q: Top cancellation reasons globally
### SQL:
SELECT cr.cancellation_reason_name_th, COUNT(*)::bigint AS cancel_count FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id WHERE b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY cr.cancellation_reason_name_th ORDER BY cancel_count DESC

-- Q: มหาลัยไหนมีปัญหาการเงินมากสุด
### SQL:
WITH uni_fin AS (SELECT b.university_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE pc.problem_category_name_th LIKE '%การเงิน%' AND b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY b.university_id ORDER BY booking_count DESC LIMIT 5) SELECT u.university_name_th, uf.booking_count FROM uni_fin uf JOIN university u ON u.university_id = uf.university_id ORDER BY uf.booking_count DESC

-- Q: สัดส่วน Onsite กับ Online เป็นอย่างไร
### SQL:
SELECT booking_service_mode, COUNT(*)::bigint AS booking_count FROM booking WHERE booking_created_at >= '2025-02-26' AND booking_created_at < '2026-02-26' GROUP BY booking_service_mode ORDER BY booking_count DESC

-- Q: นิสิตที่มีระดับความเสี่ยงสูงสุดคือใคร
### SQL:
WITH high_risk AS (SELECT b.student_id, b.university_id, AVG(bo.booking_outcome_risk_level)::numeric(10,2) AS avg_risk, COUNT(*)::bigint AS booking_count FROM booking b JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id WHERE b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' AND bo.booking_outcome_risk_level >= 4 GROUP BY b.student_id, b.university_id ORDER BY avg_risk DESC, booking_count DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, hr.avg_risk, hr.booking_count FROM high_risk hr JOIN student_profile sp ON sp.student_id = hr.student_id AND sp.university_id = hr.university_id JOIN university u ON u.university_id = hr.university_id ORDER BY hr.avg_risk DESC, hr.booking_count DESC

-- Q: นิสิตที่มีปัญหาเครียดและเสี่ยงสูง ชื่ออะไร คณะไหน สาขาไหน อาจารย์ที่ปรึกษาชื่ออะไร เบอร์ติดต่อ
### SQL:
WITH stressed_risky AS (SELECT b.student_id, b.university_id, COUNT(*)::bigint AS booking_count, AVG(bo.booking_outcome_risk_level)::numeric(10,2) AS avg_risk FROM booking b JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id WHERE pc.problem_category_name_th LIKE '%เครียด%' AND bo.booking_outcome_risk_level >= 4 AND b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY b.student_id, b.university_id ORDER BY avg_risk DESC, booking_count DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, f.faculty_name_th, d.department_name_th, sr.avg_risk, sr.booking_count, adv.advisor_first_name, adv.advisor_last_name, adv.advisor_phone_number FROM stressed_risky sr JOIN student_profile sp ON sp.student_id = sr.student_id AND sp.university_id = sr.university_id JOIN student_academic sa ON sa.student_id = sr.student_id AND sa.university_id = sr.university_id JOIN university u ON u.university_id = sr.university_id LEFT JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id LEFT JOIN department d ON d.department_id = sa.department_id AND d.university_id = sa.university_id LEFT JOIN advisor adv ON adv.advisor_id = sa.advisor_id AND adv.university_id = sa.university_id ORDER BY sr.avg_risk DESC, sr.booking_count DESC

-- Q: ผู้ให้คำปรึกษาคนไหนรับเคสมากสุด
### SQL:
SELECT cp.consultant_first_name, cp.consultant_last_name, cp.consultant_phone_number, u.university_name_th, COUNT(*)::bigint AS case_count FROM booking b JOIN consultant c ON c.consultant_id = b.consultant_id AND c.university_id = b.university_id JOIN consultant_profile cp ON cp.consultant_id = c.consultant_id JOIN university u ON u.university_id = b.university_id WHERE b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY cp.consultant_first_name, cp.consultant_last_name, cp.consultant_phone_number, u.university_name_th ORDER BY case_count DESC LIMIT 10

-- Q: อัตราการยกเลิกนัดเป็นกี่เปอร์เซ็นต์
### SQL:
SELECT COUNT(CASE WHEN booking_status = 'CANCELLED' THEN 1 END)::bigint AS cancelled, COUNT(*)::bigint AS total, ROUND(COUNT(CASE WHEN booking_status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(*), 2) AS cancel_pct FROM booking WHERE booking_created_at >= '2025-02-26' AND booking_created_at < '2026-02-26'

-- Q: คณะวิศวกรรมศาสตร์ จุฬาฯ มีนิสิตจองกี่คิว (CRITICAL: faculty and university are SEPARATE tables!)
### SQL:
WITH faculty_bookings AS (SELECT sa.faculty_id, sa.university_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id JOIN university u ON u.university_id = sa.university_id WHERE f.faculty_name_th LIKE '%วิศวกรรม%' AND u.university_name_th LIKE '%จุฬา%' AND b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY sa.faculty_id, sa.university_id ORDER BY booking_count DESC LIMIT 5) SELECT f.faculty_name_th, u.university_name_th, fb.booking_count FROM faculty_bookings fb JOIN faculty f ON f.faculty_id = fb.faculty_id AND f.university_id = fb.university_id JOIN university u ON u.university_id = fb.university_id ORDER BY fb.booking_count DESC

-- Q: นิสิตคณะแพทย์ที่ยกเลิกคิวบ่อยสุด ชื่อ คณะ สาเหตุ (⚠️ CRITICAL: booking_cancellation.booking_id is from BOOKING, NOT student_id!)
### SQL:
WITH cancel_students AS (SELECT b.student_id, b.university_id, COUNT(*)::bigint AS cancel_count FROM booking b WHERE b.booking_status = 'CANCELLED' AND b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY b.student_id, b.university_id ORDER BY cancel_count DESC LIMIT 10) SELECT sp.student_first_name_th || ' ' || sp.student_last_name_th AS student_name_th, f.faculty_name_th, u.university_name_th, cs.cancel_count, (SELECT cr.cancellation_reason_name_th FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking bk ON bk.booking_id = bc.booking_id AND bk.university_id = bc.university_id WHERE bk.student_id = cs.student_id AND bk.university_id = cs.university_id LIMIT 1) AS last_cancel_reason FROM cancel_students cs JOIN student_profile sp ON sp.student_id = cs.student_id AND sp.university_id = cs.university_id JOIN student_academic sa ON sa.student_id = cs.student_id AND sa.university_id = cs.university_id JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id JOIN university u ON u.university_id = cs.university_id ORDER BY cs.cancel_count DESC
`;

/** Build the full SQL generator prompt (schema auto-generated from Prisma) */
export function buildSqlPrompt(): string {
  const schema = getAnalyticsSchema();
  return `${SQL_INSTRUCTIONS}\n\n### Database Schema:\n\n${schema}\n\n${SCHEMA_HINTS}\n${SQL_EXAMPLES}`;
}

// Backward compat: static export for existing imports
export const SQL_B_PROMPT = buildSqlPrompt();
