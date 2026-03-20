-- ═══════════════════════════════════════════════════════════════════════════
-- Extend mv_booking_summary with booking_status + service_mode_code
-- This enables filter chips (booking status, service mode) to actually
-- filter the data in GenericBookingStory
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop old MV and all its indices (idempotent)
DROP MATERIALIZED VIEW IF EXISTS mv_booking_summary;

-- ─── Recreate mv_booking_summary with added dimensions ─────────────────────
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
    -- Booking status dimension (NEW — enables status filter)
    b.booking_status::text AS booking_status,
    -- Service mode dimension (NEW — enables service mode filter)
    COALESCE(smc.code, 'UNKNOWN') AS service_mode_code,
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
LEFT JOIN service_mode_category smc
    ON smc.service_mode_id = b.service_mode_id
GROUP BY
    b.university_id, sa.faculty_id, sa.department_id,
    COALESCE(sa.advisor_id, 0),
    TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM'),
    COALESCE(b.problem_category_id, 0),
    pc.problem_category_name_th,
    b.booking_status::text,
    COALESCE(smc.code, 'UNKNOWN')
WITH DATA;

-- Unique index for CONCURRENTLY refresh (includes new dimensions)
CREATE UNIQUE INDEX idx_mv_booking_summary_pk
ON mv_booking_summary (
    university_id, faculty_id, department_id, advisor_id,
    month, problem_category_id, booking_status, service_mode_code
);

-- Fast lookups
CREATE INDEX idx_mv_booking_summary_uni    ON mv_booking_summary (university_id);
CREATE INDEX idx_mv_booking_summary_fac    ON mv_booking_summary (university_id, faculty_id);
CREATE INDEX idx_mv_booking_summary_dept   ON mv_booking_summary (university_id, faculty_id, department_id);
CREATE INDEX idx_mv_booking_summary_adv    ON mv_booking_summary (advisor_id) WHERE advisor_id != 0;
CREATE INDEX idx_mv_booking_summary_month  ON mv_booking_summary (month);
CREATE INDEX idx_mv_booking_summary_status ON mv_booking_summary (booking_status);
CREATE INDEX idx_mv_booking_summary_svc    ON mv_booking_summary (service_mode_code);
