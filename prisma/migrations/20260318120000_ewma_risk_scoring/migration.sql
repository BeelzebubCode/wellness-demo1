-- ═══════════════════════════════════════════════════════════════════════════════
-- EWMA + Peak Memory Risk Scoring — Per-Student
-- ═══════════════════════════════════════════════════════════════════════════════
-- สูตร: student_risk = MAX(ewma_score, peak_score * decay_factor)
--
-- EWMA (Exponentially Weighted Moving Average):
--   α = 0.3  → น้ำหนัก booking ล่าสุดสูงกว่า booking เก่า
--   ewma = Σ (α * (1 - α)^i * risk_i)  โดย i = 0 คือล่าสุด
--
-- Peak Memory:
--   peak = ค่า risk สูงสุดที่เคยได้
--   decay = 0.9 ^ months_since_peak  → จางลง 10% ต่อเดือน
--
-- Risk Bands:
--   >= 3.5  → วิกฤต (CRITICAL)
--   >= 2.5  → สูง (HIGH)
--   >= 1.5  → ปานกลาง (MEDIUM)
--   < 1.5   → ปกติ (NORMAL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop old MV if exists (idempotent)
DROP MATERIALIZED VIEW IF EXISTS mv_student_risk_score;

CREATE MATERIALIZED VIEW mv_student_risk_score AS
WITH
    ranked_outcomes AS (
        -- Get all completed bookings with risk level, ranked by recency per student
        SELECT
            b.university_id,
            b.student_id,
            sa.faculty_id,
            sa.department_id,
            COALESCE(sa.advisor_id, 0) AS advisor_id,
            bo.booking_outcome_risk_level AS risk_level,
            bo.booking_outcome_recorded_at AS recorded_at,
            ROW_NUMBER() OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
                ORDER BY bo.booking_outcome_recorded_at DESC
            ) AS rn,
            -- Peak info
            MAX(bo.booking_outcome_risk_level) OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
            ) AS lifetime_peak,
            -- When was the peak recorded?
            FIRST_VALUE(
                bo.booking_outcome_recorded_at
            ) OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
                ORDER BY bo.booking_outcome_risk_level DESC, bo.booking_outcome_recorded_at DESC
            ) AS peak_recorded_at,
            -- Total bookings with risk for this student
            COUNT(*) OVER (
                PARTITION BY
                    b.university_id,
                    b.student_id
            ) AS total_bookings_with_risk
        FROM
            booking b
            JOIN student_academic sa ON sa.student_id = b.student_id
            AND sa.university_id = b.university_id
            JOIN booking_outcome bo ON bo.booking_id = b.booking_id
            AND bo.university_id = b.university_id
        WHERE
            b.booking_status = 'COMPLETED'
            AND bo.booking_outcome_risk_level IS NOT NULL
            AND bo.booking_outcome_risk_level > 0
    ),
    ewma_calc AS (
        -- Calculate EWMA: Σ α(1-α)^i × risk_i, normalized by Σ α(1-α)^i
        -- α = 0.3, (1-α) = 0.7
        SELECT
            university_id,
            student_id,
            faculty_id,
            department_id,
            advisor_id,
            lifetime_peak,
            peak_recorded_at,
            total_bookings_with_risk,
            -- EWMA numerator: Σ 0.3 × 0.7^(rn-1) × risk_level
            SUM(
                0.3 * POWER(0.7, rn - 1) * risk_level
            ) AS ewma_numerator,
            -- EWMA denominator: Σ 0.3 × 0.7^(rn-1)  (for normalization)
            SUM(0.3 * POWER(0.7, rn - 1)) AS ewma_denominator,
            -- Latest booking info
            MAX(
                CASE
                    WHEN rn = 1 THEN risk_level
                END
            ) AS latest_risk,
            MAX(
                CASE
                    WHEN rn = 1 THEN recorded_at
                END
            ) AS latest_recorded_at
        FROM ranked_outcomes
        GROUP BY
            university_id,
            student_id,
            faculty_id,
            department_id,
            advisor_id,
            lifetime_peak,
            peak_recorded_at,
            total_bookings_with_risk
    )
SELECT
    university_id,
    student_id,
    faculty_id,
    department_id,
    advisor_id,
    -- EWMA score (time-weighted average)
    ROUND(
        (
            ewma_numerator / NULLIF(ewma_denominator, 0)
        )::numeric,
        3
    ) AS ewma_score,
    -- Peak with decay: peak × 0.9^months_since_peak
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
    -- Final composite score = MAX(ewma, peak_decay)
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
    -- Risk band classification
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
    -- Metadata
    lifetime_peak,
    latest_risk,
    latest_recorded_at,
    total_bookings_with_risk::int AS total_assessments
FROM ewma_calc
WITH
    DATA;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_student_risk_pk ON mv_student_risk_score (university_id, student_id);

-- Fast lookups by scope
CREATE INDEX idx_mv_student_risk_uni ON mv_student_risk_score (university_id);

CREATE INDEX idx_mv_student_risk_fac ON mv_student_risk_score (university_id, faculty_id);

CREATE INDEX idx_mv_student_risk_dept ON mv_student_risk_score (
    university_id,
    faculty_id,
    department_id
);

CREATE INDEX idx_mv_student_risk_adv ON mv_student_risk_score (advisor_id)
WHERE
    advisor_id != 0;

CREATE INDEX idx_mv_student_risk_band ON mv_student_risk_score (risk_band);

CREATE INDEX idx_mv_student_risk_score_idx ON mv_student_risk_score (risk_score DESC);