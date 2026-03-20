-- Drop borrow_assignment_note column from borrow_assignment table
ALTER TABLE "borrow_assignment"
DROP COLUMN IF EXISTS "borrow_assignment_note";