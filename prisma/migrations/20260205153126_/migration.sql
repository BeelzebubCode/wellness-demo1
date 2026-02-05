-- DropIndex
DROP INDEX "idx_account_username";

-- DropIndex
DROP INDEX "idx_booking_timeslot_status";

-- DropIndex
DROP INDEX "idx_booking_university_status_created";

-- DropIndex
DROP INDEX "idx_student_university_account";

-- AlterTable
ALTER TABLE "booking_session" ADD COLUMN     "booking_session_is_link_visible" BOOLEAN NOT NULL DEFAULT true;
