-- Migration: fix_consultant_shift_team_and_punishment_log_relations
-- Date: 2026-03-17
-- Description:
--   1) Remove duplicate column consultantShiftTeamShift_team_id from consultant
--   2) Wire shift_team_id FK properly
--   3) Add FK constraints to booking_punishment_log (referential integrity)
--   4) Add missing indexes

-- =============================================
-- 1) Fix Consultant: drop duplicate column + add proper FK
-- =============================================

-- Migrate data: if consultantShiftTeamShift_team_id has data but shift_team_id is null, copy it
UPDATE "consultant"
SET "shift_team_id" = "consultantShiftTeamShift_team_id"
WHERE "shift_team_id" IS NULL
  AND "consultantShiftTeamShift_team_id" IS NOT NULL;

-- Drop the auto-generated column
ALTER TABLE "consultant" DROP COLUMN IF EXISTS "consultantShiftTeamShift_team_id";

-- Add FK constraint on shift_team_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'consultant_shift_team_id_fkey'
  ) THEN
    ALTER TABLE "consultant"
      ADD CONSTRAINT "consultant_shift_team_id_fkey"
      FOREIGN KEY ("shift_team_id")
      REFERENCES "consultant_shift_team"("shift_team_id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add index on shift_team_id
CREATE INDEX IF NOT EXISTS "consultant_shift_team_id_idx" ON "consultant"("shift_team_id");


-- =============================================
-- 2) BookingPunishmentLog: add FK constraints + indexes
-- =============================================

-- FK: university_id -> university
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_punishment_log_university_id_fkey'
  ) THEN
    ALTER TABLE "booking_punishment_log"
      ADD CONSTRAINT "booking_punishment_log_university_id_fkey"
      FOREIGN KEY ("university_id")
      REFERENCES "university"("university_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: (university_id, student_id) -> student
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_punishment_log_university_id_student_id_fkey'
  ) THEN
    ALTER TABLE "booking_punishment_log"
      ADD CONSTRAINT "booking_punishment_log_university_id_student_id_fkey"
      FOREIGN KEY ("university_id", "student_id")
      REFERENCES "student"("university_id", "student_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: (university_id, booking_id) -> booking (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_punishment_log_university_id_booking_id_fkey'
  ) THEN
    ALTER TABLE "booking_punishment_log"
      ADD CONSTRAINT "booking_punishment_log_university_id_booking_id_fkey"
      FOREIGN KEY ("university_id", "booking_id")
      REFERENCES "booking"("university_id", "booking_id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: created_by -> account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_punishment_log_created_by_fkey'
  ) THEN
    ALTER TABLE "booking_punishment_log"
      ADD CONSTRAINT "booking_punishment_log_created_by_fkey"
      FOREIGN KEY ("booking_discipline_created_by_id")
      REFERENCES "account"("account_id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "booking_punishment_log_booking_id_idx"
  ON "booking_punishment_log"("booking_id");

CREATE INDEX IF NOT EXISTS "booking_punishment_log_created_by_idx"
  ON "booking_punishment_log"("booking_discipline_created_by_id");
