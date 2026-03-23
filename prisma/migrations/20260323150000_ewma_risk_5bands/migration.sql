-- ═══════════════════════════════════════════════════════════════════════════════
-- EWMA Risk Scoring v2 — 5 Bands matching risk_level_category table
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
-- Risk Bands (ตรงกับ risk_level_category):
--   >= 4.5  → VERY_HIGH (สูงมาก)
--   >= 3.5  → HIGH      (สูง)
--   >= 2.5  → MEDIUM    (ปานกลาง)
--   >= 1.5  → LOW       (ต่ำ)
--   <  1.5  → VERY_LOW  (ต่ำมาก)
-- ═══════════════════════════════════════════════════════════════════════════════

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
            ) AS peak_recorded_at,
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
            AND bo.risk_level_id IS NOT NULL
            AND bo.risk_level_id > 0
    ),
    ewma_calc AS (
        SELECT
            university_id,
            student_id,
            faculty_id,
            department_id,
            advisor_id,
            lifetime_peak,
            peak_recorded_at,
            total_bookings_with_risk,
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
    -- EWMA score
    ROUND(
        (
            ewma_numerator / NULLIF(ewma_denominator, 0)
        )::numeric,
        3
    ) AS ewma_score,
    -- Peak decay score
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
    -- Final composite score
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
    -- 5-band classification matching risk_level_category
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
        ) >= 4.5 THEN 'VERY_HIGH'
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
        ) >= 3.5 THEN 'HIGH'
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
        ) >= 2.5 THEN 'MEDIUM'
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
        ) >= 1.5 THEN 'LOW'
        ELSE 'VERY_LOW'
    END AS risk_band,
    lifetime_peak,
    latest_risk,
    latest_recorded_at,
    total_bookings_with_risk::int AS total_assessments
FROM ewma_calc
WITH
    DATA;

-- Indexes
CREATE UNIQUE INDEX idx_mv_student_risk_pk ON mv_student_risk_score (university_id, student_id);

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