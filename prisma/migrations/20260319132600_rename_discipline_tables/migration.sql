-- Migration: Rename discipline tables, clean columns, add direction
-- Strategy: RENAME TABLE + RENAME COLUMN (data preserved, zero downtime)

-- ================================================================
-- STEP 1: Rename discipline_event_type_category → discipline_action_type
-- ================================================================

ALTER TABLE discipline_event_type_category
RENAME TO discipline_action_type;

-- Rename columns
ALTER TABLE discipline_action_type
RENAME COLUMN discipline_event_type_id TO action_type_id;

ALTER TABLE discipline_action_type RENAME COLUMN code TO action_code;

-- Add direction column
ALTER TABLE discipline_action_type
ADD COLUMN direction VARCHAR(10) NOT NULL DEFAULT 'PENALTY';

-- ================================================================
-- STEP 2: Update code values (shorter, direction-neutral)
-- ================================================================

UPDATE discipline_action_type
SET
    action_code = 'LATE_CANCEL',
    direction = 'PENALTY'
WHERE
    action_code = 'LATE_CANCEL_PENALTY';

UPDATE discipline_action_type
SET
    action_code = 'NO_SHOW',
    direction = 'PENALTY'
WHERE
    action_code = 'NO_SHOW_PENALTY';

UPDATE discipline_action_type
SET
    action_code = 'EXCEPTION_APPROVED',
    direction = 'REVERSAL'
WHERE
    action_code = 'EXCEPTION_APPROVED_ROLLBACK';

UPDATE discipline_action_type
SET
    action_code = 'MANUAL_UNLOCK',
    direction = 'REVERSAL'
WHERE
    action_code = 'MANUAL_UNLOCK';

-- ================================================================
-- STEP 3: Rename booking_punishment_log → discipline_log
-- ================================================================

ALTER TABLE booking_punishment_log RENAME TO discipline_log;

-- Rename columns
ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_log_id TO discipline_log_id;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_event_type TO action_type_code;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_delta_score TO delta_score;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_delta_points TO delta_points;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_lock_until TO lock_until;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_note TO note;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_created_by_id TO created_by_id;

ALTER TABLE discipline_log
RENAME COLUMN booking_discipline_created_at TO created_at;

-- ================================================================
-- STEP 4: Update FK references in discipline_log (code values)
-- ================================================================

-- Update existing log data to use new code values
UPDATE discipline_log
SET
    action_type_code = 'LATE_CANCEL'
WHERE
    action_type_code = 'LATE_CANCEL_PENALTY';

UPDATE discipline_log
SET
    action_type_code = 'NO_SHOW'
WHERE
    action_type_code = 'NO_SHOW_PENALTY';

UPDATE discipline_log
SET
    action_type_code = 'EXCEPTION_APPROVED'
WHERE
    action_type_code = 'EXCEPTION_APPROVED_ROLLBACK';
-- MANUAL_UNLOCK stays the same

-- ================================================================
-- STEP 5: Drop old FK and recreate with new names
-- ================================================================

-- Drop old FK (from previous migration)
ALTER TABLE discipline_log
DROP CONSTRAINT IF EXISTS fk_discipline_event_type_category;

-- Recreate FK with new table/column names
ALTER TABLE discipline_log
ADD CONSTRAINT fk_discipline_action_type FOREIGN KEY (action_type_code) REFERENCES discipline_action_type (action_code);

-- ================================================================
-- STEP 6: Rename indexes (optional but clean)
-- ================================================================

-- The old indexes still work after RENAME, but let's rename for clarity
ALTER INDEX IF EXISTS "booking_discipline_log_booking_discipline_event_type_bookin_idx"
RENAME TO "discipline_log_action_type_code_created_at_idx";

ALTER INDEX IF EXISTS "booking_punishment_log_booking_discipline_event_type_bookin_idx"
RENAME TO "discipline_log_action_type_code_created_at_idx2";

ALTER INDEX IF EXISTS "booking_punishment_log_booking_discipline_created_by_id_idx"
RENAME TO "discipline_log_created_by_id_idx";