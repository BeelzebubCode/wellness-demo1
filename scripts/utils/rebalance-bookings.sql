-- scripts/rebalance-bookings.sql
-- Non-transactional step-by-step rebalancing
\timing on

-- ─── STEP 0: TARGETS (persistent temp tables) ───
DROP TABLE IF EXISTS _uni_targets CASCADE;

DROP TABLE IF EXISTS _students_keep CASCADE;

DROP TABLE IF EXISTS _bd CASCADE;

CREATE TABLE _uni_targets (
    university_id INT PRIMARY KEY,
    target_pct NUMERIC(5, 3)
);

INSERT INTO
    _uni_targets
VALUES (126, 0.07),
    (127, 0.07),
    (128, 0.07),
    (129, 0.07),
    (130, 0.07),
    (131, 0.07),
    (132, 0.07),
    (133, 0.07),
    (134, 0.07),
    (135, 0.07),
    (150, 0.07),
    (151, 0.07),
    (152, 0.07),
    (153, 0.07),
    (154, 0.07),
    (136, 0.025),
    (137, 0.025),
    (138, 0.025),
    (139, 0.025),
    (140, 0.025),
    (141, 0.025),
    (142, 0.025),
    (143, 0.025),
    (144, 0.025),
    (145, 0.025),
    (146, 0.025),
    (147, 0.025),
    (148, 0.025),
    (149, 0.025);

-- ─── STEP 1: RANDOM STUDENTS TO KEEP ───
CREATE TABLE _students_keep ( university_id INT, student_id INT );

DO $$
DECLARE
  r RECORD;
  keep_count INT;
BEGIN
  FOR r IN SELECT university_id, target_pct FROM _uni_targets ORDER BY university_id LOOP
    SELECT CEIL(COUNT(DISTINCT student_id) * r.target_pct)::INT INTO keep_count
    FROM booking WHERE university_id = r.university_id;
    RAISE NOTICE 'Uni %: keeping % students', r.university_id, keep_count;
    INSERT INTO _students_keep (university_id, student_id)
    SELECT r.university_id, s.student_id
    FROM (
      SELECT student_id FROM (
        SELECT DISTINCT student_id FROM booking WHERE university_id = r.university_id
      ) d ORDER BY random() LIMIT keep_count
    ) s;
  END LOOP;
END $$;

CREATE INDEX idx_sk ON _students_keep (university_id, student_id);

ANALYZE _students_keep;

-- ─── STEP 2: BOOKINGS TO DELETE ───
CREATE TABLE _bd ( university_id INT, booking_id INT );

INSERT INTO
    _bd
SELECT b.university_id, b.booking_id
FROM booking b
    JOIN _uni_targets t ON t.university_id = b.university_id
WHERE
    NOT EXISTS (
        SELECT 1
        FROM _students_keep k
        WHERE
            k.university_id = b.university_id
            AND k.student_id = b.student_id
    );

CREATE INDEX idx_bd ON _bd (university_id, booking_id);

ANALYZE _bd;

SELECT 'To delete: ' || COUNT(*)::TEXT AS info FROM _bd;

-- ─── STEP 3a: student_point_transaction ───
\echo '>>> Deleting student_point_transaction...'
DELETE FROM student_point_transaction spt
USING _bd d WHERE spt.booking_university_id = d.university_id AND spt.booking_id = d.booking_id;

-- ─── STEP 3b: notification ───
\echo '>>> Deleting notification...'
DELETE FROM notification n
USING _bd d WHERE n.university_id = d.university_id AND n.booking_id = d.booking_id;

-- ─── STEP 3c: feedback_comment ───
\echo '>>> Deleting feedback_comment...'
DELETE FROM feedback_comment fc
USING feedback f, _bd d
WHERE fc.university_id = f.university_id AND fc.feedback_id = f.feedback_id
  AND f.university_id = d.university_id AND f.booking_id = d.booking_id;

-- ─── STEP 3d: feedback_rating ───
\echo '>>> Deleting feedback_rating...'
DELETE FROM feedback_rating fr
USING feedback f, _bd d
WHERE fr.university_id = f.university_id AND fr.feedback_id = f.feedback_id
  AND f.university_id = d.university_id AND f.booking_id = d.booking_id;

-- ─── STEP 3e: feedback ───
\echo '>>> Deleting feedback...'
DELETE FROM feedback f
USING _bd d WHERE f.university_id = d.university_id AND f.booking_id = d.booking_id;

-- ─── STEP 3f: booking_session ───
\echo '>>> Deleting booking_session...'
DELETE FROM booking_session bs
USING _bd d WHERE bs.university_id = d.university_id AND bs.booking_id = d.booking_id;

-- ─── STEP 3g: booking_outcome ───
\echo '>>> Deleting booking_outcome...'
DELETE FROM booking_outcome bo
USING _bd d WHERE bo.university_id = d.university_id AND bo.booking_id = d.booking_id;

-- ─── STEP 3h: booking_exception_evidence ───
\echo '>>> Deleting booking_exception_evidence...'
DELETE FROM booking_exception_evidence bee
USING booking_exception_request ber, _bd d
WHERE bee.university_id = ber.university_id
  AND bee.booking_exception_request_id = ber.booking_exception_request_id
  AND ber.university_id = d.university_id AND ber.booking_id = d.booking_id;

-- ─── STEP 3i: booking_exception_request ───
\echo '>>> Deleting booking_exception_request...'
DELETE FROM booking_exception_request ber
USING _bd d WHERE ber.university_id = d.university_id AND ber.booking_id = d.booking_id;

-- ─── STEP 3j: booking_cancellation ───
\echo '>>> Deleting booking_cancellation...'
DELETE FROM booking_cancellation bc
USING _bd d WHERE bc.university_id = d.university_id AND bc.booking_id = d.booking_id;

-- ─── STEP 3k: booking_attendance ───
\echo '>>> Deleting booking_attendance...'
DELETE FROM booking_attendance ba
USING _bd d WHERE ba.university_id = d.university_id AND ba.booking_id = d.booking_id;

-- ─── STEP 3l: booking_assignment ───
\echo '>>> Deleting booking_assignment...'
DELETE FROM booking_assignment baa
USING _bd d WHERE baa.university_id = d.university_id AND baa.booking_id = d.booking_id;

-- ─── STEP 3m: booking_agreement_signature ───
\echo '>>> Deleting booking_agreement_signature...'
DELETE FROM booking_agreement_signature bas
USING _bd d WHERE bas.university_id = d.university_id AND bas.booking_id = d.booking_id;

-- ─── STEP 3n: booking_discipline_log ───
\echo '>>> Deleting booking_discipline_log...'
DELETE FROM booking_discipline_log bdl
USING _bd d WHERE bdl.university_id = d.university_id AND bdl.booking_id = d.booking_id;

-- ─── STEP 4: DELETE BOOKINGS ───
\echo '>>> Deleting bookings...'
DELETE FROM booking b
USING _bd d WHERE b.university_id = d.university_id AND b.booking_id = d.booking_id;

-- ─── STEP 5: ADJUST RISK LEVELS ───
\echo '>>> Adjusting risk levels (4+5 → ~10%)...'
UPDATE booking_outcome
SET booking_outcome_risk_level = 1 + floor(random() * 3)::int
WHERE booking_outcome_risk_level IN (4, 5) AND random() < 0.63;

-- ─── CLEANUP ───
DROP TABLE IF EXISTS _bd;

DROP TABLE IF EXISTS _students_keep;

DROP TABLE IF EXISTS _uni_targets;

\echo '=== REBALANCE COMPLETE ==='