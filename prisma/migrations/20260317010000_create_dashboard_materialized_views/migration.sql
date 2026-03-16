-- CreateMaterializedViews
-- ─────────────────────────────────────────────────────────────────────────────
-- Pre-computed dashboard statistics for all 5 actors
-- Supports REFRESH MATERIALIZED VIEW CONCURRENTLY (non-blocking reads)
-- ─────────────────────────────────────────────────────────────────────────────

-- ███ MV 1: mv_student_summary ████████████████████████████████████████████████
-- Per-scope student counts + profile distributions
-- Scope = (university_id, faculty_id, department_id, advisor_id)

CREATE MATERIALIZED VIEW mv_student_summary AS
SELECT
    sa.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0) AS advisor_id,
    -- Student counts
    COUNT(DISTINCT sa.student_id)::int AS total_students,
    COUNT(DISTINCT b.student_id)::int AS consulted_students,
    -- Profile code breakdowns (pre-aggregated as text keys)
    COALESCE(bgc.code, 'UNKNOWN') AS blood_group_code,
    COALESCE(ibc.code, 'UNKNOWN') AS income_bracket_code,
    COALESCE(psc.code, 'UNKNOWN') AS parental_status_code,
    COALESCE(gc.code, 'UNKNOWN')  AS gender_code,
    COUNT(DISTINCT sa.student_id)::int AS profile_count
FROM student_academic sa
LEFT JOIN student_profile sp
    ON sp.university_id = sa.university_id AND sp.student_id = sa.student_id
LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
LEFT JOIN booking b
    ON b.student_id = sa.student_id AND b.university_id = sa.university_id
GROUP BY
    sa.university_id, sa.faculty_id, sa.department_id,
    COALESCE(sa.advisor_id, 0),
    bgc.code, ibc.code, psc.code, gc.code
WITH DATA;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_student_summary_pk
ON mv_student_summary (
    university_id, faculty_id, department_id, advisor_id,
    blood_group_code, income_bracket_code, parental_status_code, gender_code
);
-- Fast lookups by scope level
CREATE INDEX idx_mv_student_summary_uni ON mv_student_summary (university_id);
CREATE INDEX idx_mv_student_summary_fac ON mv_student_summary (university_id, faculty_id);
CREATE INDEX idx_mv_student_summary_dept ON mv_student_summary (university_id, faculty_id, department_id);
CREATE INDEX idx_mv_student_summary_adv ON mv_student_summary (advisor_id) WHERE advisor_id != 0;


-- ███ MV 2: mv_booking_summary ████████████████████████████████████████████████
-- Per-scope booking stats aggregated by month + problem category

CREATE MATERIALIZED VIEW mv_booking_summary AS
SELECT
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0) AS advisor_id,
    -- Time dimension
    TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM') AS month,
    -- Problem dimension
    COALESCE(b.problem_category_id, 0) AS problem_category_id,
    COALESCE(pc.problem_category_name_th, 'ไม่ระบุ') AS problem_category_name_th,
    -- Aggregated booking counts
    COUNT(b.booking_id)::int AS total_bookings,
    COUNT(CASE WHEN ba.booking_attendance_status = 'CHECKED_IN' THEN 1 END)::int AS checked_in,
    COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show,
    COUNT(CASE WHEN b.booking_status = 'COMPLETED' THEN 1 END)::int AS completed,
    COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END)::int AS cancelled
FROM booking b
JOIN student_academic sa
    ON sa.student_id = b.student_id AND sa.university_id = b.university_id
JOIN time_slot ts
    ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
LEFT JOIN booking_attendance ba
    ON ba.booking_id = b.booking_id AND ba.university_id = b.university_id
LEFT JOIN problem_category pc
    ON pc.problem_category_id = b.problem_category_id
GROUP BY
    b.university_id, sa.faculty_id, sa.department_id,
    COALESCE(sa.advisor_id, 0),
    TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM'),
    COALESCE(b.problem_category_id, 0),
    pc.problem_category_name_th
WITH DATA;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_booking_summary_pk
ON mv_booking_summary (
    university_id, faculty_id, department_id, advisor_id,
    month, problem_category_id
);
CREATE INDEX idx_mv_booking_summary_uni ON mv_booking_summary (university_id);
CREATE INDEX idx_mv_booking_summary_fac ON mv_booking_summary (university_id, faculty_id);
CREATE INDEX idx_mv_booking_summary_dept ON mv_booking_summary (university_id, faculty_id, department_id);
CREATE INDEX idx_mv_booking_summary_adv ON mv_booking_summary (advisor_id) WHERE advisor_id != 0;
CREATE INDEX idx_mv_booking_summary_month ON mv_booking_summary (month);


-- ███ MV 3: mv_risk_summary ██████████████████████████████████████████████████
-- Per-scope risk level distribution (completed bookings only)

CREATE MATERIALIZED VIEW mv_risk_summary AS
SELECT
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0) AS advisor_id,
    -- Risk level (integer from booking_outcome, cast to text for grouping)
    COALESCE(bo.booking_outcome_risk_level::text, 'UNKNOWN') AS risk_level,
    -- Count
    COUNT(DISTINCT b.booking_id)::int AS count
FROM booking b
JOIN student_academic sa
    ON sa.student_id = b.student_id AND sa.university_id = b.university_id
JOIN time_slot ts
    ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
LEFT JOIN booking_outcome bo
    ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id
WHERE b.booking_status = 'COMPLETED'
GROUP BY
    b.university_id, sa.faculty_id, sa.department_id,
    COALESCE(sa.advisor_id, 0),
    COALESCE(bo.booking_outcome_risk_level::text, 'UNKNOWN')
WITH DATA;

CREATE UNIQUE INDEX idx_mv_risk_summary_pk
ON mv_risk_summary (
    university_id, faculty_id, department_id, advisor_id, risk_level
);
CREATE INDEX idx_mv_risk_summary_uni ON mv_risk_summary (university_id);
CREATE INDEX idx_mv_risk_summary_fac ON mv_risk_summary (university_id, faculty_id);
CREATE INDEX idx_mv_risk_summary_dept ON mv_risk_summary (university_id, faculty_id, department_id);
CREATE INDEX idx_mv_risk_summary_adv ON mv_risk_summary (advisor_id) WHERE advisor_id != 0;
