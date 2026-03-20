-- ═══════════════════════════════════════════════════════════════════════════════
-- Extend Dashboard MVs with Demographic + Attendance Dimensions
-- Enables full filtering (Gender, Income, etc.) across all charts
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Extend mv_booking_summary
DROP MATERIALIZED VIEW IF EXISTS mv_booking_summary;

CREATE MATERIALIZED VIEW mv_booking_summary AS
SELECT
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0) AS advisor_id,
    -- Time dimension
    TO_CHAR(
        ts.time_slot_start_datetime,
        'YYYY-MM'
    ) AS month,
    -- Problem dimension
    COALESCE(b.problem_category_id, 0) AS problem_category_id,
    COALESCE(
        pc.problem_category_name_th,
        'ไม่ระบุ'
    ) AS problem_category_name_th,
    -- Booking status dimension
    b.booking_status::text AS booking_status,
    -- Service mode dimension
    COALESCE(smc.code, 'UNKNOWN') AS service_mode_code,
    -- Attendance status dimension (NEW)
    COALESCE(
        ba.booking_attendance_status::text,
        'PENDING'
    ) AS attendance_status,
    -- Demographic dimensions (NEW)
    COALESCE(gc.code, 'UNKNOWN') AS gender_code,
    COALESCE(ibc.code, 'UNKNOWN') AS income_bracket_code,
    COALESCE(psc.code, 'UNKNOWN') AS parental_status_code,
    COALESCE(bgc.code, 'UNKNOWN') AS blood_group_code,
    -- Metrics
    COUNT(b.booking_id)::int AS total_bookings
FROM
    booking b
    JOIN student_academic sa ON sa.student_id = b.student_id
    AND sa.university_id = b.university_id
    JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id
    AND ts.university_id = b.university_id
    LEFT JOIN student_profile sp ON sp.student_id = sa.student_id
    AND sp.university_id = sa.university_id
    LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
    LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
    LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
    LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
    LEFT JOIN booking_attendance ba ON ba.booking_id = b.booking_id
    AND ba.university_id = b.university_id
    LEFT JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id
    LEFT JOIN service_mode_category smc ON smc.service_mode_id = b.service_mode_id
GROUP BY
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0),
    TO_CHAR(
        ts.time_slot_start_datetime,
        'YYYY-MM'
    ),
    COALESCE(b.problem_category_id, 0),
    pc.problem_category_name_th,
    b.booking_status,
    COALESCE(smc.code, 'UNKNOWN'),
    COALESCE(
        ba.booking_attendance_status::text,
        'PENDING'
    ),
    COALESCE(gc.code, 'UNKNOWN'),
    COALESCE(ibc.code, 'UNKNOWN'),
    COALESCE(psc.code, 'UNKNOWN'),
    COALESCE(bgc.code, 'UNKNOWN')
WITH
    DATA;

CREATE UNIQUE INDEX idx_mv_booking_summary_pk_v2 ON mv_booking_summary (
    university_id,
    faculty_id,
    department_id,
    advisor_id,
    month,
    problem_category_id,
    booking_status,
    service_mode_code,
    attendance_status,
    gender_code,
    income_bracket_code,
    parental_status_code,
    blood_group_code
);

-- 2. Extend mv_student_risk_score
DROP MATERIALIZED VIEW IF EXISTS mv_student_risk_score;

CREATE MATERIALIZED VIEW mv_student_risk_score AS
WITH
    ranked_outcomes AS (
        SELECT
            b.university_id,
            b.student_id,
            sa.faculty_id,
            sa.department_id,
            COALESCE(sa.advisor_id, 0) AS advisor_id,
            bo.risk_level_id AS risk_level,
            bo.booking_outcome_recorded_at AS recorded_at,
            ROW_NUMBER() OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
                ORDER BY bo.booking_outcome_recorded_at DESC
            ) AS rn,
            MAX(bo.risk_level_id) OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
            ) AS lifetime_peak,
            FIRST_VALUE(
                bo.booking_outcome_recorded_at
            ) OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
                ORDER BY bo.risk_level_id DESC, bo.booking_outcome_recorded_at DESC
            ) AS peak_recorded_at
        FROM
            booking b
            JOIN student_academic sa ON sa.student_id = b.student_id
            AND sa.university_id = b.university_id
            JOIN booking_outcome bo ON bo.booking_id = b.booking_id
            AND bo.university_id = b.university_id
        WHERE
            b.booking_status = 'COMPLETED'
            AND bo.risk_level_id IS NOT NULL
            AND bo.risk_level_id > 0
    ),
    ewma_calc AS (
        SELECT
            ro.university_id,
            ro.student_id,
            ro.faculty_id,
            ro.department_id,
            ro.advisor_id,
            ro.lifetime_peak,
            ro.peak_recorded_at,
            SUM(
                0.3 * POWER(0.7, rn - 1) * risk_level
            ) AS ewma_numerator,
            SUM(0.3 * POWER(0.7, rn - 1)) AS ewma_denominator,
            MAX(
                CASE
                    WHEN rn = 1 THEN risk_level
                END
            ) AS latest_risk,
            MAX(
                CASE
                    WHEN rn = 1 THEN recorded_at
                END
            ) AS latest_recorded_at,
            -- Demographics (NEW)
            COALESCE(gc.code, 'UNKNOWN') AS gender_code,
            COALESCE(ibc.code, 'UNKNOWN') AS income_bracket_code,
            COALESCE(psc.code, 'UNKNOWN') AS parental_status_code,
            COALESCE(bgc.code, 'UNKNOWN') AS blood_group_code
        FROM
            ranked_outcomes ro
            LEFT JOIN student_profile sp ON sp.student_id = ro.student_id
            AND sp.university_id = ro.university_id
            LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
            LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
            LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
            LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
        GROUP BY
            ro.university_id,
            ro.student_id,
            ro.faculty_id,
            ro.department_id,
            ro.advisor_id,
            ro.lifetime_peak,
            ro.peak_recorded_at,
            gc.code,
            ibc.code,
            psc.code,
            bgc.code
    )
SELECT
    university_id,
    student_id,
    faculty_id,
    department_id,
    advisor_id,
    gender_code,
    income_bracket_code,
    parental_status_code,
    blood_group_code,
    ROUND(
        (
            ewma_numerator / NULLIF(ewma_denominator, 0)
        )::numeric,
        3
    ) AS ewma_score,
    ROUND(
        (
            lifetime_peak * POWER(
                0.9,
                GREATEST(
                    EXTRACT(
                        EPOCH
                        FROM (NOW() - peak_recorded_at)
                    ) / (30.0 * 86400),
                    0
                )
            )
        )::numeric,
        3
    ) AS peak_decay_score,
    ROUND(
        GREATEST(
            (
                ewma_numerator / NULLIF(ewma_denominator, 0)
            ),
            lifetime_peak * POWER(
                0.9,
                GREATEST(
                    EXTRACT(
                        EPOCH
                        FROM (NOW() - peak_recorded_at)
                    ) / (30.0 * 86400),
                    0
                )
            )
        )::numeric,
        3
    ) AS risk_score,
    CASE
        WHEN GREATEST(
            (
                ewma_numerator / NULLIF(ewma_denominator, 0)
            ),
            lifetime_peak * POWER(
                0.9,
                GREATEST(
                    EXTRACT(
                        EPOCH
                        FROM (NOW() - peak_recorded_at)
                    ) / (30.0 * 86400),
                    0
                )
            )
        ) >= 3.5 THEN 'CRITICAL'
        WHEN GREATEST(
            (
                ewma_numerator / NULLIF(ewma_denominator, 0)
            ),
            lifetime_peak * POWER(
                0.9,
                GREATEST(
                    EXTRACT(
                        EPOCH
                        FROM (NOW() - peak_recorded_at)
                    ) / (30.0 * 86400),
                    0
                )
            )
        ) >= 2.5 THEN 'HIGH'
        WHEN GREATEST(
            (
                ewma_numerator / NULLIF(ewma_denominator, 0)
            ),
            lifetime_peak * POWER(
                0.9,
                GREATEST(
                    EXTRACT(
                        EPOCH
                        FROM (NOW() - peak_recorded_at)
                    ) / (30.0 * 86400),
                    0
                )
            )
        ) >= 1.5 THEN 'MEDIUM'
        ELSE 'NORMAL'
    END AS risk_band,
    latest_recorded_at
FROM ewma_calc
WITH
    DATA;

CREATE UNIQUE INDEX idx_mv_student_risk_full_pk ON mv_student_risk_score (university_id, student_id);

CREATE INDEX idx_mv_student_risk_full_demo ON mv_student_risk_score (
    gender_code,
    income_bracket_code,
    parental_status_code,
    blood_group_code
);

-- 3. Extend mv_risk_summary
DROP MATERIALIZED VIEW IF EXISTS mv_risk_summary;

CREATE MATERIALIZED VIEW mv_risk_summary AS
SELECT
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0) AS advisor_id,
    COALESCE(
        bo.risk_level_id::text,
        'UNKNOWN'
    ) AS risk_level,
    -- Demographic dimensions (NEW)
    COALESCE(gc.code, 'UNKNOWN') AS gender_code,
    COALESCE(ibc.code, 'UNKNOWN') AS income_bracket_code,
    COALESCE(psc.code, 'UNKNOWN') AS parental_status_code,
    COALESCE(bgc.code, 'UNKNOWN') AS blood_group_code,
    COUNT(DISTINCT b.booking_id)::int AS count
FROM
    booking b
    JOIN student_academic sa ON sa.student_id = b.student_id
    AND sa.university_id = b.university_id
    LEFT JOIN student_profile sp ON sp.student_id = sa.student_id
    AND sp.university_id = sa.university_id
    LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
    LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
    LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
    LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
    LEFT JOIN booking_outcome bo ON bo.booking_id = b.booking_id
    AND bo.university_id = b.university_id
WHERE
    b.booking_status = 'COMPLETED'
GROUP BY
    b.university_id,
    sa.faculty_id,
    sa.department_id,
    COALESCE(sa.advisor_id, 0),
    COALESCE(
        bo.risk_level_id::text,
        'UNKNOWN'
    ),
    gc.code,
    ibc.code,
    psc.code,
    bgc.code
WITH
    DATA;

CREATE UNIQUE INDEX idx_mv_risk_summary_full_pk ON mv_risk_summary (
    university_id,
    faculty_id,
    department_id,
    advisor_id,
    risk_level,
    gender_code,
    income_bracket_code,
    parental_status_code,
    blood_group_code
);