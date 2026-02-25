export const SQL_B_PROMPT = `### Instructions:
Your task is to convert a natural language question into a PostgreSQL query given the database schema below.
Adhere to these rules:
- **Deliberately go through the question and database schema word by word** to appropriately answer the question
- **Use Table Coverage**: Always check which tables are required, prefer using CTEs for complex queries
- **Use only valid PostgreSQL**, no semicolons, no markdown code fences
- When counting, always cast to bigint: COUNT(*)::bigint
- When averaging, cast to numeric: AVG(col)::numeric(10,2)
- Start your answer directly with SELECT or WITH
- The student table has NO faculty_id — join through student_academic
- booking_outcome stores risk assessment: booking_outcome_risk_level (int 1-5, 5=highest risk)
- "stress/เครียด" = high booking count; "risk/เสี่ยง" = high booking_outcome_risk_level
- "จังหวัด/province" = filter university by province: university -> province (ON university.province_id = province.province_id)
- Province name is in province.province_name_th (e.g. 'กรุงเทพมหานคร', 'เชียงใหม่')
- "ภาค/region" = filter university by region: university -> province -> region (ON province.region_id = region.region_id)
- Region name is in region.region_name_th (e.g. 'ภาคตะวันออก', 'ภาคเหนือ')
- Always include the date filter provided in the context (booking.booking_created_at)
- ⛔ NEVER hardcode IDs — always lookup by Thai name using JOIN + WHERE ... LIKE:
  WRONG: WHERE university_id = 707071
  RIGHT: JOIN university u ON ... WHERE u.university_name_th LIKE '%พระจอมเกล้าธนบุรี%'
  WRONG: WHERE problem_category_id = 1
  RIGHT: JOIN problem_category pc ON ... WHERE pc.problem_category_name_th LIKE '%การเรียน%'

### Database Schema:

CREATE TABLE region (
  region_id SERIAL PRIMARY KEY,
  region_name_th VARCHAR(100)
);

CREATE TABLE province (
  province_id SERIAL PRIMARY KEY,
  region_id INT REFERENCES region(region_id),
  province_name_th VARCHAR(100)
);

CREATE TABLE university (
  university_id SERIAL PRIMARY KEY,
  university_name_th VARCHAR(200),
  province_id INT REFERENCES province(province_id)
);

CREATE TABLE faculty (
  faculty_id INT,
  university_id INT REFERENCES university(university_id),
  faculty_name_th VARCHAR(200),
  PRIMARY KEY (university_id, faculty_id)
);

CREATE TABLE department (
  department_id INT,
  faculty_id INT,
  university_id INT,
  department_name_th VARCHAR(200),
  PRIMARY KEY (university_id, department_id)
);

CREATE TABLE student (
  student_id INT,
  university_id INT REFERENCES university(university_id),
  account_id INT,
  PRIMARY KEY (university_id, student_id)
  -- NOTE: NO faculty_id here! Use student_academic to find faculty
);

CREATE TABLE student_profile (
  student_id INT,
  university_id INT,
  student_first_name_th VARCHAR(100),
  student_last_name_th VARCHAR(100),
  student_gender VARCHAR(20), -- MALE, FEMALE, LGBTQ_PLUS
  PRIMARY KEY (university_id, student_id)
);

CREATE TABLE student_academic (
  student_id INT,
  university_id INT,
  faculty_id INT,
  department_id INT,
  PRIMARY KEY (university_id, student_id)
);

CREATE TABLE consultant (
  consultant_id INT,
  university_id INT REFERENCES university(university_id),
  PRIMARY KEY (university_id, consultant_id)
);

CREATE TABLE consultant_profile (
  consultant_id INT PRIMARY KEY,
  consultant_first_name VARCHAR(100),
  consultant_last_name VARCHAR(100)
);

CREATE TABLE time_slot (
  time_slot_id SERIAL PRIMARY KEY,
  university_id INT,
  time_slot_start_datetime TIMESTAMPTZ
);

CREATE TABLE problem_category (
  problem_category_id SERIAL PRIMARY KEY,
  problem_category_code VARCHAR(20), -- ACAD, STRESS, REL, ADJ, FIN, MENTAL, SUBST, FAM, HEALTH, CAREER, BULLY, SEX, LEGAL, OTHER
  problem_category_name_th VARCHAR(100),
  problem_category_name_en VARCHAR(100)
);

CREATE TABLE online_channel_category (
  online_channel_category_id SERIAL PRIMARY KEY,
  online_channel_code VARCHAR(50), -- LINE_CALL, GOOGLE_MEET, ZOOM, MICROSOFT_TEAMS, PHONE
  online_channel_name_th VARCHAR(100)
);

CREATE TABLE booking (
  booking_id INT,
  university_id INT,
  student_id INT,
  consultant_id INT,
  time_slot_id INT,
  problem_category_id INT REFERENCES problem_category(problem_category_id),
  booking_status VARCHAR(30), -- COMPLETED, CANCELLED, PENDING_ASSIGNMENT, ASSIGNED, IN_PROGRESS
  booking_service_mode VARCHAR(20), -- ONSITE, ONLINE
  online_channel_category_id INT REFERENCES online_channel_category(online_channel_category_id),
  booking_created_at TIMESTAMPTZ,
  PRIMARY KEY (university_id, booking_id)
  -- ⚠ NO faculty_id, NO department_id in this table!
  -- To get faculty: JOIN booking -> student_academic -> faculty
  -- To get department: JOIN booking -> student_academic -> department
);

CREATE TABLE booking_outcome (
  booking_id INT,
  university_id INT,
  booking_outcome_risk_level INT, -- 1 to 5, higher = more risky
  booking_outcome_consultant_note TEXT,
  booking_outcome_next_step TEXT,
  booking_outcome_recorded_at TIMESTAMPTZ,
  PRIMARY KEY (university_id, booking_id)
);

CREATE TABLE booking_cancellation (
  booking_id INT,
  university_id INT,
  cancellation_reason_id INT REFERENCES cancellation_reason(cancellation_reason_id),
  booking_cancellation_cancelled_at TIMESTAMPTZ,
  PRIMARY KEY (university_id, booking_id)
);

CREATE TABLE cancellation_reason (
  cancellation_reason_id SERIAL PRIMARY KEY,
  cancellation_reason_code VARCHAR(20), -- RESCHEDULE, FEELING_BETTER, EMERGENCY, WRONG_BOOKING, LOCATION_ISSUE, OTHER
  cancellation_reason_name_th VARCHAR(100),
  cancellation_reason_name_en VARCHAR(100)
);

-- ═══════ REFERENCE DATA (Actual values in our system) ═══════
-- Problem Categories (problem_category_id → name):
--   1=ปัญหาการเรียน(ACAD), 2=ความเครียด(STRESS), 3=ความสัมพันธ์(REL), 4=การปรับตัว(ADJ),
--   5=ปัญหาการเงิน(FIN), 6=สุขภาพจิต/อารมณ์(MENTAL), 7=สารเสพติด(SUBST), 8=ครอบครัว(FAM),
--   9=สุขภาพกาย(HEALTH), 10=อาชีพ/อนาคต(CAREER), 11=ถูกรังแก/ความรุนแรง(BULLY),
--   12=เพศสัมพันธ์/อัตลักษณ์(SEX), 13=กฎหมาย/วินัย(LEGAL), 14=อื่นๆ(OTHER)
-- Online Channels (online_channel_category_id → name):
--   1=LINE Call, 2=Google Meet, 3=Zoom, 4=Microsoft Teams, 5=โทรศัพท์(PHONE)
-- Cancellation Reasons (cancellation_reason_id → name):
--   1=เปลี่ยนวัน/เวลา(RESCHEDULE), 2=อาการดีขึ้น(FEELING_BETTER), 3=เหตุฉุกเฉิน(EMERGENCY),
--   4=จองผิด(WRONG_BOOKING), 5=ไม่สะดวกสถานที่(LOCATION_ISSUE), 6=อื่นๆ(OTHER)
-- Booking Status: PENDING_ASSIGNMENT, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
-- Service Mode: ONSITE, ONLINE
-- Student Gender (student_profile.student_gender): MALE, FEMALE, OTHER

-- JOIN RULES (ALWAYS use both composite key columns):
-- booking -> student_profile: ON booking.student_id = student_profile.student_id AND booking.university_id = student_profile.university_id
-- booking -> student_academic: ON booking.student_id = student_academic.student_id AND booking.university_id = student_academic.university_id
-- student_academic -> faculty: ON student_academic.faculty_id = faculty.faculty_id AND student_academic.university_id = faculty.university_id
-- student_academic -> department: ON student_academic.department_id = department.department_id AND student_academic.university_id = department.university_id
-- booking -> booking_outcome: ON booking.booking_id = booking_outcome.booking_id AND booking.university_id = booking_outcome.university_id
-- booking -> time_slot: ON booking.time_slot_id = time_slot.time_slot_id AND booking.university_id = time_slot.university_id
-- booking -> booking_cancellation: ON booking.booking_id = booking_cancellation.booking_id AND booking.university_id = booking_cancellation.university_id
-- booking_cancellation -> cancellation_reason: ON booking_cancellation.cancellation_reason_id = cancellation_reason.cancellation_reason_id
-- booking -> online_channel_category: ON booking.online_channel_category_id = online_channel_category.online_channel_category_id
-- university -> province: ON university.province_id = province.province_id
-- province -> region: ON province.region_id = region.region_id

-- ⚠ CRITICAL WARNINGS:
-- 1. ALWAYS include GROUP BY for ALL non-aggregated columns in SELECT
-- 2. To get faculty name: booking -> student_academic -> faculty (NEVER use consultant_profile for faculty!)
-- 3. To get student name: booking -> student_profile (use student_first_name_th, student_last_name_th)
-- 4. To get department name: booking -> student_academic -> department
-- 5. faculty table has faculty_name_th (NOT faculty_first_name_th!)
-- 6. ⚡ PERFORMANCE CRITICAL: For ranking/top-N queries, ALWAYS use CTE pre-aggregation:
--    Step 1: Aggregate booking counts in a CTE with GROUP BY and LIMIT
--    Step 2: JOIN lookup tables (student_profile, faculty, etc.) ONLY on the CTE result
--    This avoids sorting millions of rows and is 60x faster!
-- 7. ⛔ CTE COLUMN RULE: In the final SELECT after a CTE, you can ONLY reference columns that exist in the CTE.
--    WRONG: WITH t AS (SELECT university_id, COUNT(*) AS c ...) SELECT t.university_name_th FROM t
--    RIGHT: WITH t AS (SELECT university_id, COUNT(*) AS c ...) SELECT u.university_name_th, t.c FROM t JOIN university u ON u.university_id = t.university_id
--    You MUST JOIN the lookup table in the final SELECT to get name columns!

### Example Queries:

-- Q: Find university with the highest booking count. Return university_name_th, booking_count.
### SQL:
WITH uni_counts AS (SELECT university_id, COUNT(*)::bigint AS booking_count FROM booking WHERE booking_created_at >= '2025-02-25' AND booking_created_at < '2026-02-25' GROUP BY university_id ORDER BY booking_count DESC LIMIT 10) SELECT u.university_name_th, uc.booking_count FROM uni_counts uc JOIN university u ON u.university_id = uc.university_id ORDER BY uc.booking_count DESC

-- Q: Top 10 students with most bookings, show name and university
### SQL:
WITH top_students AS (SELECT student_id, university_id, COUNT(*)::bigint AS booking_count FROM booking GROUP BY university_id, student_id ORDER BY booking_count DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, ts.booking_count FROM top_students ts JOIN student_profile sp ON sp.student_id = ts.student_id AND sp.university_id = ts.university_id JOIN university u ON u.university_id = ts.university_id ORDER BY ts.booking_count DESC

-- Q: Top 3 faculties with highest bookings (stress)
### SQL:
WITH faculty_bookings AS (SELECT sa.faculty_id, sa.university_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN student_academic sa ON sa.student_id = b.student_id AND sa.university_id = b.university_id GROUP BY sa.faculty_id, sa.university_id ORDER BY booking_count DESC LIMIT 3) SELECT f.faculty_name_th, u.university_name_th, fb.booking_count FROM faculty_bookings fb JOIN faculty f ON f.faculty_id = fb.faculty_id AND f.university_id = fb.university_id JOIN university u ON u.university_id = fb.university_id ORDER BY fb.booking_count DESC

-- Q: Top 10 students with name, university, faculty, department
### SQL:
WITH top_students AS (SELECT student_id, university_id, COUNT(*)::bigint AS booking_count FROM booking GROUP BY university_id, student_id ORDER BY booking_count DESC LIMIT 10) SELECT sp.student_first_name_th, sp.student_last_name_th, u.university_name_th, f.faculty_name_th, d.department_name_th, ts.booking_count FROM top_students ts JOIN student_profile sp ON sp.student_id = ts.student_id AND sp.university_id = ts.university_id JOIN student_academic sa ON sa.student_id = ts.student_id AND sa.university_id = ts.university_id JOIN university u ON u.university_id = ts.university_id JOIN faculty f ON f.faculty_id = sa.faculty_id AND f.university_id = sa.university_id JOIN department d ON d.department_id = sa.department_id AND d.university_id = sa.university_id ORDER BY ts.booking_count DESC

-- Q: Top region by bookings
### SQL:
WITH region_bookings AS (SELECT p.region_id, COUNT(*)::bigint AS booking_count FROM booking b JOIN university u ON u.university_id = b.university_id JOIN province p ON p.province_id = u.province_id GROUP BY p.region_id ORDER BY booking_count DESC LIMIT 3) SELECT r.region_name_th, rb.booking_count FROM region_bookings rb JOIN region r ON r.region_id = rb.region_id ORDER BY rb.booking_count DESC

-- Q: Find total booking count for university 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี' with problem_category 'ปัญหาการเรียน'. Return booking_count.
### SQL:
SELECT COUNT(*)::bigint AS booking_count FROM booking b JOIN university u ON u.university_id = b.university_id JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id WHERE u.university_name_th LIKE '%พระจอมเกล้าธนบุรี%' AND pc.problem_category_name_th LIKE '%การเรียน%' AND b.booking_created_at >= '2025-02-25' AND b.booking_created_at < '2026-02-25'

-- Q: Universities in Chiang Mai with most cancellations
### SQL:
WITH province_unis AS (SELECT b.university_id, COUNT(*)::bigint AS cancel_count FROM booking b JOIN university u ON u.university_id = b.university_id JOIN province p ON p.province_id = u.province_id WHERE p.province_name_th = 'เชียงใหม่' AND b.booking_status = 'CANCELLED' GROUP BY b.university_id ORDER BY cancel_count DESC LIMIT 5) SELECT u.university_name_th, pu.cancel_count FROM province_unis pu JOIN university u ON u.university_id = pu.university_id ORDER BY pu.cancel_count DESC

-- Q: Universities in Eastern region
### SQL:
SELECT u.university_name_th FROM university u JOIN province p ON p.province_id = u.province_id JOIN region r ON r.region_id = p.region_id WHERE r.region_name_th LIKE '%ตะวันออก%'

-- Q: Top cancellation reasons globally
### SQL:
SELECT cr.cancellation_reason_name_th, COUNT(*)::bigint AS cancel_count FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id WHERE b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY cr.cancellation_reason_name_th ORDER BY cancel_count DESC

-- Q: Top cancellation reasons for a specific university
### SQL:
SELECT cr.cancellation_reason_name_th, COUNT(*)::bigint AS cancel_count FROM booking_cancellation bc JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id JOIN booking b ON b.booking_id = bc.booking_id AND b.university_id = bc.university_id JOIN university u ON u.university_id = b.university_id WHERE u.university_name_th LIKE '%รามคำแหง%' AND b.booking_created_at >= '2025-02-26' AND b.booking_created_at < '2026-02-26' GROUP BY cr.cancellation_reason_name_th ORDER BY cancel_count DESC
`;
