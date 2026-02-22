-- AlterTable: Add consultant_university_id to feedback (idempotent — safe to re-run)

-- Step 1: Add column as nullable (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'feedback' AND column_name = 'consultant_university_id'
  ) THEN
    ALTER TABLE "feedback" ADD COLUMN "consultant_university_id" INTEGER;
  END IF;
END $$;

-- Step 2: Backfill — existing records are all local, so consultant_university_id = university_id
UPDATE "feedback" SET "consultant_university_id" = "university_id" WHERE "consultant_university_id" IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE "feedback" ALTER COLUMN "consultant_university_id" SET NOT NULL;

-- Step 4: Drop old FK on (university_id, consultant_id) if exists
ALTER TABLE "feedback" DROP CONSTRAINT IF EXISTS "feedback_university_id_consultant_id_fkey";

-- Step 5: Add new FK (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'feedback_consultant_university_id_consultant_id_fkey'
  ) THEN
    ALTER TABLE "feedback" ADD CONSTRAINT "feedback_consultant_university_id_consultant_id_fkey"
      FOREIGN KEY ("consultant_university_id", "consultant_id")
      REFERENCES "consultant"("university_id", "consultant_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 6: Add index (skip if already exists)
CREATE INDEX IF NOT EXISTS "feedback_consultant_university_id_consultant_id_idx"
  ON "feedback"("consultant_university_id", "consultant_id");
