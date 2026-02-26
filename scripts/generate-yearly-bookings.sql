-- scripts/generate-yearly-bookings.sql
-- Generate bookings to meet per-year targets:
-- BKK: ~7% of students per year, OTHER: ~2.5% per year
-- Years: 2019-2025 (7 years)
\timing on

-- ─── STEP 0: TARGETS ───
DROP TABLE IF EXISTS _gen_targets;

CREATE TABLE _gen_targets AS
SELECT
    u.university_id,
    CASE
        WHEN p.province_name_th = 'กรุงเทพมหานคร' THEN 0.07
        ELSE 0.025
    END AS target_pct,
    (
        SELECT COUNT(*)
        FROM student s
        WHERE
            s.university_id = u.university_id
    ) AS student_count
FROM university u
    LEFT JOIN province p ON u.province_id = p.province_id
WHERE
    EXISTS (
        SELECT 1
        FROM student s2
        WHERE
            s2.university_id = u.university_id
    );

ALTER TABLE _gen_targets ADD PRIMARY KEY (university_id);

DROP TABLE IF EXISTS _years;

CREATE TABLE _years (yr INT);

INSERT INTO
    _years
VALUES (2019),
    (2020),
    (2021),
    (2022),
    (2023),
    (2024),
    (2025);

-- ─── STEP 1: PER-YEAR GAP ───
DROP TABLE IF EXISTS _existing;

CREATE TABLE _existing AS
SELECT b.university_id, EXTRACT(
        YEAR
        FROM ts.time_slot_start_datetime
    )::INT AS yr, COUNT(DISTINCT b.student_id) AS existing_students
FROM booking b
    JOIN time_slot ts ON b.university_id = ts.university_id
    AND b.time_slot_id = ts.time_slot_id
GROUP BY
    1,
    2;

DROP TABLE IF EXISTS _needed;

CREATE TABLE _needed AS
SELECT t.university_id, y.yr, GREATEST(
        0, CEIL(
            t.student_count * t.target_pct
        )::INT - COALESCE(e.existing_students, 0)
    ) AS new_needed
FROM
    _gen_targets t
    CROSS JOIN _years y
    LEFT JOIN _existing e ON e.university_id = t.university_id
    AND e.yr = y.yr
WHERE
    GREATEST(
        0,
        CEIL(
            t.student_count * t.target_pct
        )::INT - COALESCE(e.existing_students, 0)
    ) > 0;

SELECT 'Total new bookings needed: ' || SUM(new_needed)::TEXT
FROM _needed;

-- ─── STEP 2: GENERATE BOOKING ROWS ───
DROP TABLE IF EXISTS _new_bookings;

CREATE TABLE _new_bookings (
    university_id INT,
    student_id INT,
    consultant_id INT,
    time_slot_id INT,
    problem_category_id INT,
    service_mode TEXT,
    created_at TIMESTAMP,
    yr INT
);

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT university_id, yr, new_needed FROM _needed ORDER BY university_id, yr LOOP
    RAISE NOTICE 'Uni % Year %: +% bookings', r.university_id, r.yr, r.new_needed;
    INSERT INTO _new_bookings
    SELECT r.university_id, s.student_id,
      (SELECT c.consultant_id FROM consultant c WHERE c.university_id = r.university_id ORDER BY random() LIMIT 1),
      (SELECT ts.time_slot_id FROM time_slot ts 
       WHERE ts.university_id = r.university_id AND EXTRACT(YEAR FROM ts.time_slot_start_datetime) = r.yr
       ORDER BY random() LIMIT 1),
      1 + floor(random() * 10)::int,
      CASE WHEN random() < 0.7 THEN 'ONSITE' ELSE 'ONLINE' END,
      (r.yr || '-01-01')::TIMESTAMP + (random() * 365 * INTERVAL '1 day'),
      r.yr
    FROM (
      SELECT student_id FROM (
        SELECT DISTINCT s2.student_id FROM student s2
        WHERE s2.university_id = r.university_id
        AND NOT EXISTS (
          SELECT 1 FROM booking b JOIN time_slot ts2 ON b.university_id = ts2.university_id AND b.time_slot_id = ts2.time_slot_id
          WHERE b.student_id = s2.student_id AND b.university_id = r.university_id
          AND EXTRACT(YEAR FROM ts2.time_slot_start_datetime) = r.yr
        )
      ) avail ORDER BY random() LIMIT r.new_needed
    ) s;
  END LOOP;
END $$;

DELETE FROM _new_bookings
WHERE
    time_slot_id IS NULL
    OR consultant_id IS NULL;

SELECT 'Clean bookings: ' || COUNT(*)::TEXT FROM _new_bookings;

-- ─── STEP 3: INSERT BOOKINGS ───
\echo '>>> Inserting bookings...'

-- Get max booking_id before insert
DROP TABLE IF EXISTS _max_before;

CREATE TABLE _max_before AS
SELECT COALESCE(MAX(booking_id), 0) AS max_id
FROM booking;

INSERT INTO
    booking (
        student_id,
        consultant_id,
        time_slot_id,
        problem_category_id,
        booking_detail_text,
        booking_status,
        booking_created_at,
        booking_updated_at,
        university_id,
        booking_service_mode
    )
SELECT
    nb.student_id,
    nb.consultant_id,
    nb.time_slot_id,
    nb.problem_category_id,
    'นัดหมายให้คำปรึกษา',
    'COMPLETED'::"BookingStatus",
    nb.created_at,
    nb.created_at + INTERVAL '1 hour',
    nb.university_id,
    nb.service_mode::"ServiceMode"
FROM _new_bookings nb;

-- ─── STEP 4: INSERT CHILD RECORDS ───
\echo '>>> Creating new ID lookup...' DROP TABLE IF EXISTS _new_ids;

CREATE TABLE _new_ids AS
SELECT b.booking_id, b.university_id, b.student_id, b.consultant_id, b.booking_created_at, b.booking_service_mode
FROM booking b
WHERE
    b.booking_id > (
        SELECT max_id
        FROM _max_before
    );

CREATE INDEX idx_ni ON _new_ids (university_id, booking_id);

SELECT 'New bookings inserted: ' || COUNT(*)::TEXT FROM _new_ids;

-- 4a. booking_assignment
\echo '>>> booking_assignment...'
INSERT INTO booking_assignment (booking_id, assigned_at, assigned_by_account_id, assigned_note,
  consultant_id, consultant_university_id, university_id, is_active, is_auto_assigned)
SELECT n.booking_id, n.booking_created_at + INTERVAL '30 minutes',
  (SELECT a.account_id FROM consultant c JOIN account a ON c.account_id = a.account_id WHERE c.consultant_id = n.consultant_id LIMIT 1),
  'มอบหมายผู้ให้คำปรึกษา (auto)', n.consultant_id, n.university_id, n.university_id, true, true
FROM _new_ids n;

-- 4b. booking_outcome (risk: 27% lv1, 27% lv2, 36% lv3, 5% lv4, 5% lv5)
\echo '>>> booking_outcome...'
INSERT INTO booking_outcome (booking_id, booking_outcome_consultant_note, 
  booking_outcome_risk_level, booking_outcome_recorded_at, university_id)
SELECT n.booking_id,
  CASE floor(random()*5)::int
    WHEN 0 THEN 'ให้คำปรึกษาเบื้องต้น'
    WHEN 1 THEN 'ติดตามอาการต่อเนื่อง'
    WHEN 2 THEN 'แนะนำเทคนิคจัดการความเครียด'
    WHEN 3 THEN 'ส่งต่อพบจิตแพทย์'
    ELSE 'ประเมินอาการปกติ'
  END,
  CASE WHEN random() < 0.27 THEN 1 WHEN random() < 0.54 THEN 2
       WHEN random() < 0.90 THEN 3 WHEN random() < 0.95 THEN 4 ELSE 5 END,
  n.booking_created_at + INTERVAL '2 hours', n.university_id
FROM _new_ids n;

-- 4c. booking_attendance
\echo '>>> booking_attendance...'
INSERT INTO booking_attendance (university_id, booking_id, booking_attendance_status,
  booking_attendance_checked_in_at, booking_attendance_marked_by_id, booking_attendance_marked_at)
SELECT n.university_id, n.booking_id, 'CHECKED_IN'::"AttendanceStatus",
  n.booking_created_at + INTERVAL '55 minutes',
  (SELECT a.account_id FROM consultant c JOIN account a ON c.account_id = a.account_id WHERE c.consultant_id = n.consultant_id LIMIT 1),
  n.booking_created_at + INTERVAL '50 minutes'
FROM _new_ids n;

-- 4d. booking_session
\echo '>>> booking_session...'
INSERT INTO booking_session (university_id, booking_id, booking_session_mode,
  booking_session_location_text, provided_by_account_id, provided_at, booking_session_is_link_visible)
SELECT n.university_id, n.booking_id, n.booking_service_mode,
  CASE WHEN n.booking_service_mode = 'ONSITE'::"ServiceMode" THEN 'ห้องให้คำปรึกษา' ELSE NULL END,
  (SELECT a.account_id FROM consultant c JOIN account a ON c.account_id = a.account_id WHERE c.consultant_id = n.consultant_id LIMIT 1),
  n.booking_created_at + INTERVAL '45 minutes', true
FROM _new_ids n;

-- 4e. booking_agreement_signature
\echo '>>> booking_agreement_signature...'
INSERT INTO booking_agreement_signature (university_id, booking_id, student_id,
  signature_method, signature_payload)
SELECT n.university_id, n.booking_id, n.student_id,
  'DRAW'::"ConsentSignatureMethod",
  '{"strokes": [], "timestamp": "auto-seed"}'::JSONB
FROM _new_ids n;

-- ─── CLEANUP ───
DROP TABLE IF EXISTS _new_ids;

DROP TABLE IF EXISTS _new_bookings;

DROP TABLE IF EXISTS _max_before;

DROP TABLE IF EXISTS _needed;

DROP TABLE IF EXISTS _existing;

DROP TABLE IF EXISTS _years;

DROP TABLE IF EXISTS _gen_targets;

\echo '=== GENERATION COMPLETE ==='
SELECT 'Total bookings: ' || COUNT(*)::TEXT FROM booking;