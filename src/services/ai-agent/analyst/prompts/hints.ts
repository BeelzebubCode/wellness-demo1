// src/services/ai-agent/analyst/prompts/hints.ts
// Domain-specific hints that Prisma DMMF cannot express.
// These are critical for SQL accuracy and MUST be maintained manually.

export const SCHEMA_HINTS = `
-- ═══════ CRITICAL DOMAIN RULES ═══════
-- ⛔ Column aliases MUST be simple English (e.g. booking_count, student_name). NEVER use Thai aliases like "AS ชื่อนิสิต" — PostgreSQL will error!
-- ⛔ NEVER output markdown fences (\`\`\`sql). Output raw SQL only.
-- ⛔ Thai name columns ALWAYS end with _th: student_first_name_th (NOT student_first_name), student_last_name_th, university_name_th, faculty_name_th, department_name_th, problem_category_name_th, province_name_th, region_name_th
-- ⛔ booking_status values are ENGLISH enums: 'PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED' — NEVER use Thai values!
-- ⛔ student_gender values: 'MALE', 'FEMALE', 'LGBTQ_PLUS' — NEVER use Thai like 'หญิง'!
-- ⛔ booking_service_mode: 'ONSITE', 'ONLINE' — NOT 'service_type'!
-- ⛔ When filtering by name, ALWAYS use LIKE '%คำค้น%', NOT exact match '='!
-- ⛔ Risk level is in booking_outcome.booking_outcome_risk_level (int 1-5), NOT in booking!
-- ⛔ When searching by NAME, use LIKE '%คำค้น%'. But when user gives a specific ID number (e.g. student id 1000009), use WHERE student_id = 1000009 directly
-- ⛔ When searching a person by ONE name keyword (e.g. "อุไร"), use OR between first_name and last_name:
--   WHERE cp.consultant_first_name LIKE '%อุไร%' OR cp.consultant_last_name LIKE '%อุไร%'
--   WRONG: ...first_name LIKE '%อุไร%' AND ...last_name LIKE '%อุไร%' — this will match NOTHING!
-- ⛔ The student table has NO faculty_id — join through student_academic
-- ⛔ "ที่ปรึกษา/อาจารย์ที่ปรึกษา/advisor" = advisor table (via student_academic.advisor_id), NOT consultant!
-- ⛔ "ผู้ให้คำปรึกษา/consultant/นักจิตวิทยา" = consultant → consultant_profile (via booking.consultant_id)
-- ⛔ "ปัญหาการเงิน" = filter on problem_category.problem_category_name_th LIKE '%การเงิน%', NOT university!

-- ═══════ ⚠⚠⚠ CRITICAL: คณะ vs ภาควิชา — DIFFERENT TABLES! ⚠⚠⚠ ═══════
-- "คณะ" = faculty table → sa.faculty_id → JOIN faculty f ON f.faculty_id = sa.faculty_id → f.faculty_name_th
-- "ภาควิชา/สาขา/department" = department table → sa.department_id → JOIN department d ON d.department_id = sa.department_id → d.department_name_th
-- ⛔ NEVER use department when user says "คณะ"! คณะ = FACULTY, always!
-- ⛔ NEVER use faculty when user says "ภาควิชา"! ภาควิชา = DEPARTMENT!

-- ═══════ ⚠⚠⚠ CRITICAL: FACULTY vs UNIVERSITY ARE SEPARATE TABLES! ⚠⚠⚠ ═══════
-- faculty.faculty_name_th = ONLY the faculty name, e.g. 'คณะวิศวกรรมศาสตร์'
-- university.university_name_th = ONLY the university name, e.g. 'จุฬาลงกรณ์มหาวิทยาลัย'
-- ⛔ NEVER combine them! WRONG: faculty_name_th = 'คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย'
-- ⛔ student_academic has NO faculty_name_th! WRONG: sa.faculty_name_th — this column does NOT exist!
-- ⛔ student_academic has NO department_name_th! WRONG: sa.department_name_th — this column does NOT exist!
-- ✅ CORRECT PATTERN for faculty+university filter:
--   JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id
--   JOIN university u ON u.university_id = sa.university_id
--   WHERE f.faculty_name_th LIKE '%วิศวกรรม%' AND u.university_name_th LIKE '%จุฬา%'

-- ═══════ PHONE NUMBERS ═══════
-- Consultant phone: consultant_profile.consultant_phone_number
-- Advisor phone: advisor.advisor_phone (may be NULL)
-- Student phone: NOT available in student_profile

-- ═══════ CONSULTANT vs ADVISOR ═══════
-- "ที่ปรึกษา/อาจารย์ที่ปรึกษา" (academic advisor) = advisor table
--   JOIN: student_academic sa → advisor a ON a.advisor_id = sa.advisor_id
-- "ผู้ให้คำปรึกษา/นักจิตวิทยา/counselor" (professional counselor) = consultant table
--   JOIN: booking b → consultant c ON c.consultant_id = b.consultant_id AND c.university_id = b.university_id
--         → consultant_profile cp ON cp.consultant_id = c.consultant_id
-- ⛔ consultant_profile has NO consultant_name_th! Use: cp.consultant_first_name || ' ' || cp.consultant_last_name

-- ═══════ COLUMN EXISTENCE (CRITICAL!) ═══════
-- ⛔ student_academic: ONLY has student_id, faculty_id, department_id, advisor_id, student_program, student_degree, student_degree_name, student_admit_academic_year, university_id
-- ⛔ consultant_profile: has consultant_first_name, consultant_last_name, consultant_phone_number — NO consultant_name_th!
-- ⛔ booking_cancellation: has booking_id, university_id, cancellation_reason_id — booking_id is from BOOKING table, NOT student_id!
-- ✅ For cancelled booking + reason: booking b (WHERE status='CANCELLED') JOIN booking_cancellation bc ON bc.booking_id = b.booking_id AND bc.university_id = b.university_id JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id

-- ═══════ GENERAL SQL RULES ═══════
-- When counting, always cast: COUNT(*)::bigint
-- When averaging, cast: AVG(col)::numeric(10,2)
-- Start answer directly with SELECT or WITH
-- ⚠️ LIMIT RULE: If user says "Top 5" → LIMIT 5, "Top 10" → LIMIT 10. ALWAYS match the user's requested N exactly!
--   If user does NOT specify a number, default LIMIT 10. NEVER use LIMIT 20 unless user asks for "Top 20".
-- Always include date filter on booking.booking_created_at when querying bookings
-- "stress/เครียด" = high booking count; "risk/เสี่ยง" = high booking_outcome_risk_level
-- booking_outcome stores risk: booking_outcome_risk_level (int 1-5, 5=highest)
-- "จังหวัด/province" = university → province (ON university.province_id = province.province_id)
-- "ภาค/region" = university → province → region (ON province.region_id = region.region_id)
-- ⛔ region_name_th is on REGION table, NOT province!

-- ═══════ JOIN RULES (ALWAYS use both composite key columns) ═══════
-- booking → student_profile: ON booking.student_id = student_profile.student_id AND booking.university_id = student_profile.university_id
-- booking → student_academic: ON booking.student_id = student_academic.student_id AND booking.university_id = student_academic.university_id
-- student_academic → faculty: ON student_academic.faculty_id = faculty.faculty_id AND student_academic.university_id = faculty.university_id
-- student_academic → department: ON student_academic.department_id = department.department_id AND student_academic.university_id = department.university_id
-- booking → booking_outcome: ON booking.booking_id = booking_outcome.booking_id AND booking.university_id = booking_outcome.university_id
-- booking → time_slot: ON booking.time_slot_id = time_slot.time_slot_id AND booking.university_id = time_slot.university_id
-- booking → booking_cancellation: ON booking.booking_id = booking_cancellation.booking_id AND booking.university_id = booking_cancellation.university_id
-- booking_cancellation → cancellation_reason: ON booking_cancellation.cancellation_reason_id = cancellation_reason.cancellation_reason_id
-- booking → online_channel_category: ON booking.online_channel_category_id = online_channel_category.online_channel_category_id
-- university → province: ON university.province_id = province.province_id
-- province → region: ON province.region_id = region.region_id

-- ═══════ REFERENCE DATA ═══════
-- Problem Categories: 1=ปัญหาการเรียน(ACAD), 2=ความเครียด(STRESS), 3=ความสัมพันธ์(REL), 4=การปรับตัว(ADJ),
--   5=ปัญหาการเงิน(FIN), 6=สุขภาพจิต/อารมณ์(MENTAL), 7=สารเสพติด(SUBST), 8=ครอบครัว(FAM),
--   9=สุขภาพกาย(HEALTH), 10=อาชีพ/อนาคต(CAREER), 11=ถูกรังแก/ความรุนแรง(BULLY),
--   12=เพศสัมพันธ์/อัตลักษณ์(SEX), 13=กฎหมาย/วินัย(LEGAL), 14=อื่นๆ(OTHER)
-- Online Channels: 1=LINE Call, 2=Google Meet, 3=Zoom, 4=Microsoft Teams, 5=โทรศัพท์(PHONE)
-- Cancellation Reasons: 1=เปลี่ยนวัน/เวลา(RESCHEDULE), 2=อาการดีขึ้น(FEELING_BETTER), 3=เหตุฉุกเฉิน(EMERGENCY),
--   4=จองผิด(WRONG_BOOKING), 5=ไม่สะดวกสถานที่(LOCATION_ISSUE), 6=อื่นๆ(OTHER)
-- Booking Status: PENDING_ASSIGNMENT, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
-- Service Mode: ONSITE, ONLINE
-- Student Gender: MALE, FEMALE, LGBTQ_PLUS

-- ⚠ PERFORMANCE CRITICAL:
-- For ranking/top-N queries, ALWAYS use CTE pre-aggregation:
--   Step 1: Aggregate in CTE with GROUP BY and LIMIT
--   Step 2: JOIN lookup tables ONLY on CTE result (60x faster!)
-- ⛔ CTE COLUMN RULE: Final SELECT can ONLY reference columns in the CTE.
--   WRONG: WITH t AS (SELECT university_id, COUNT(*) ...) SELECT t.university_name_th FROM t
--   RIGHT: WITH t AS (SELECT university_id, COUNT(*) ...) SELECT u.university_name_th FROM t JOIN university u ON ...
`;