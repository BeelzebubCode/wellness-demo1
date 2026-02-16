-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- DropForeignKey
ALTER TABLE "borrow_on_call_shift"
DROP CONSTRAINT "borrow_on_call_shift_consultant_university_id_consultant_i_fkey";

-- DropForeignKey
ALTER TABLE "borrow_on_call_shift"
DROP CONSTRAINT "borrow_on_call_shift_consultant_university_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_on_call_shift"
DROP CONSTRAINT "borrow_on_call_shift_created_by_account_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift"
DROP CONSTRAINT "borrow_shift_borrow_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift"
DROP CONSTRAINT "borrow_shift_university_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift"
DROP CONSTRAINT "borrow_shift_target_university_id_fkey";

-- DropIndex
DROP INDEX "borrow_assignment_borrow_on_call_shift_id_idx";

-- AlterTable
ALTER TABLE "borrow_assignment"
DROP COLUMN "borrow_on_call_shift_id";

-- AlterTable
ALTER TABLE "borrow_shift"
DROP COLUMN "university_id",
ADD COLUMN "borrow_plan_id" UUID NOT NULL,
ADD COLUMN "created_by_account_id" INTEGER,
ADD COLUMN "home_university_id" INTEGER NOT NULL,
ADD COLUMN "note" TEXT,
ADD COLUMN "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "borrow_on_call_shift";

-- DropEnum
DROP TYPE "BorrowOnCallStatus";

-- CreateIndex
CREATE INDEX "borrow_shift_borrow_plan_id_idx" ON "borrow_shift" ("borrow_plan_id");

-- CreateIndex
CREATE INDEX "borrow_shift_home_university_id_idx" ON "borrow_shift" ("home_university_id");

-- AddForeignKey
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_home_university_id_fkey" FOREIGN KEY ("home_university_id") REFERENCES "university" ("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_target_university_id_fkey" FOREIGN KEY ("target_university_id") REFERENCES "university" ("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_borrow_assignment_id_fkey" FOREIGN KEY ("borrow_assignment_id") REFERENCES "borrow_assignment" ("borrow_assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "account" ("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- [CUSTOM SQL START]

-- 1. Ensure end date is after start date
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_valid_range" CHECK (
    "shift_end_date" > "shift_start_date"
);

-- 2. Prevent overlapping active shifts for the same consultant
ALTER TABLE "borrow_shift"
ADD CONSTRAINT "borrow_shift_no_overlap_active" EXCLUDE USING gist (
    "consultant_id"
    WITH
        =,
        daterange (
            "shift_start_date",
            "shift_end_date",
            '[)'
        )
    WITH
        &&
)
WHERE ("status" = 'ACTIVE');

-- 3. Enforce maximum borrow days per plan via Trigger
CREATE OR REPLACE FUNCTION borrow_shift_enforce_plan_limit()
RETURNS trigger AS $$
DECLARE
  lim int;
  new_days int;
  used_days int;
BEGIN
  new_days := (NEW.shift_end_date - NEW.shift_start_date);
  IF new_days <= 0 THEN
    RAISE EXCEPTION 'Invalid borrow_shift range: end must be after start';
  END IF;

  -- policy days: target_university_id -> global -> 14
  SELECT COALESCE(
    (SELECT borrow_window_days FROM borrow_window_policy
      WHERE university_id = NEW.target_university_id AND is_active = true
      ORDER BY created_at DESC LIMIT 1),
    (SELECT borrow_window_days FROM borrow_window_policy
      WHERE university_id IS NULL AND is_active = true
      ORDER BY created_at DESC LIMIT 1),
    14
  ) INTO lim;

  IF new_days > lim THEN
    RAISE EXCEPTION 'Borrow segment exceeds limit days (% > %)', new_days, lim;
  END IF;

  -- used days in same plan (exclude cancelled; exclude current row if update)
  SELECT COALESCE(SUM(shift_end_date - shift_start_date), 0)
  INTO used_days
  FROM borrow_shift
  WHERE borrow_plan_id = NEW.borrow_plan_id
    AND status <> 'CANCELLED'
    AND (TG_OP <> 'UPDATE' OR borrow_shift_id <> NEW.borrow_shift_id);

  IF used_days + new_days > lim THEN
    RAISE EXCEPTION 'Borrow plan exceeds limit days (used % + new % > limit %)', used_days, new_days, lim;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_borrow_shift_plan_limit ON borrow_shift;

CREATE TRIGGER trg_borrow_shift_plan_limit
BEFORE INSERT OR UPDATE ON borrow_shift
FOR EACH ROW
EXECUTE FUNCTION borrow_shift_enforce_plan_limit();

-- [CUSTOM SQL END]