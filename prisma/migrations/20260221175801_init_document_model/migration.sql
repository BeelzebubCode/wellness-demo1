-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'LATE', 'NO_SHOW', 'CANCELLED_BY_CONSULTANT');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisciplineEventType" AS ENUM ('LATE_CANCEL_PENALTY', 'NO_SHOW_PENALTY', 'EXCEPTION_APPROVED_ROLLBACK', 'MANUAL_UNLOCK');

-- DropForeignKey
ALTER TABLE "booking_assignment" DROP CONSTRAINT "booking_assignment_assigned_by_account_id_fkey";

-- DropIndex
DROP INDEX "booking_assignment_university_id_booking_id_key";

-- AlterTable
ALTER TABLE "booking_assignment" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_auto_assigned" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "assigned_by_account_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "student_trust_status" (
    "student_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "student_trust_term_code" VARCHAR(20),
    "student_trust_score" INTEGER NOT NULL DEFAULT 100,
    "student_trust_late_cancel_count" INTEGER NOT NULL DEFAULT 0,
    "student_trust_no_show_count" INTEGER NOT NULL DEFAULT 0,
    "student_trust_locked_until" TIMESTAMPTZ(3),
    "student_trust_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_trust_status_pkey" PRIMARY KEY ("university_id","student_id")
);

-- CreateTable
CREATE TABLE "booking_attendance" (
    "university_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "booking_attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "booking_attendance_checked_in_at" TIMESTAMPTZ(3),
    "booking_attendance_late_minutes" INTEGER,
    "booking_attendance_note" TEXT,
    "booking_attendance_marked_by_id" INTEGER,
    "booking_attendance_marked_at" TIMESTAMPTZ(3),

    CONSTRAINT "booking_attendance_pkey" PRIMARY KEY ("university_id","booking_id")
);

-- CreateTable
CREATE TABLE "booking_exception_request" (
    "booking_exception_request_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "booking_exception_reason_code" VARCHAR(50) NOT NULL,
    "booking_exception_reason_detail" TEXT NOT NULL,
    "booking_exception_status" "ExceptionStatus" NOT NULL DEFAULT 'DRAFT',
    "booking_exception_deadline_at" TIMESTAMPTZ(3),
    "booking_exception_requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booking_exception_submitted_at" TIMESTAMPTZ(3),
    "booking_exception_reviewed_by_id" INTEGER,
    "booking_exception_reviewed_at" TIMESTAMPTZ(3),
    "booking_exception_decision_note" TEXT,

    CONSTRAINT "booking_exception_request_pkey" PRIMARY KEY ("booking_exception_request_id")
);

-- CreateTable
CREATE TABLE "booking_exception_evidence" (
    "booking_exception_evidence_id" SERIAL NOT NULL,
    "booking_exception_request_id" INTEGER NOT NULL,
    "booking_exception_evidence_url" TEXT NOT NULL,
    "booking_exception_evidence_name" VARCHAR(255),
    "booking_exception_evidence_type" VARCHAR(50),
    "booking_exception_evidence_size" INTEGER,
    "booking_exception_evidence_uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_exception_evidence_pkey" PRIMARY KEY ("booking_exception_evidence_id")
);

-- CreateTable
CREATE TABLE "booking_discipline_log" (
    "booking_discipline_log_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "booking_discipline_event_type" "DisciplineEventType" NOT NULL,
    "booking_discipline_delta_score" INTEGER,
    "booking_discipline_delta_points" INTEGER,
    "booking_discipline_lock_until" TIMESTAMPTZ(3),
    "booking_discipline_note" TEXT,
    "booking_discipline_created_by_id" INTEGER,
    "booking_discipline_created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_discipline_log_pkey" PRIMARY KEY ("booking_discipline_log_id")
);

-- CreateTable
CREATE TABLE "document" (
    "document_id" SERIAL NOT NULL,
    "document_slug" VARCHAR(100) NOT NULL,
    "document_title" VARCHAR(200) NOT NULL,
    "document_content" TEXT NOT NULL,
    "document_is_active" BOOLEAN NOT NULL DEFAULT true,
    "document_order" INTEGER NOT NULL DEFAULT 0,
    "document_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE INDEX "student_trust_status_student_trust_locked_until_idx" ON "student_trust_status"("student_trust_locked_until");

-- CreateIndex
CREATE INDEX "booking_attendance_booking_attendance_status_idx" ON "booking_attendance"("booking_attendance_status");

-- CreateIndex
CREATE INDEX "booking_exception_request_booking_exception_status_booking__idx" ON "booking_exception_request"("booking_exception_status", "booking_exception_requested_at");

-- CreateIndex
CREATE INDEX "booking_exception_request_booking_exception_reviewed_by_id__idx" ON "booking_exception_request"("booking_exception_reviewed_by_id", "booking_exception_reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_exception_request_university_id_booking_id_key" ON "booking_exception_request"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "booking_exception_evidence_booking_exception_request_id_idx" ON "booking_exception_evidence"("booking_exception_request_id");

-- CreateIndex
CREATE INDEX "booking_discipline_log_university_id_student_id_idx" ON "booking_discipline_log"("university_id", "student_id");

-- CreateIndex
CREATE INDEX "booking_discipline_log_booking_discipline_event_type_bookin_idx" ON "booking_discipline_log"("booking_discipline_event_type", "booking_discipline_created_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_document_slug_key" ON "document"("document_slug");

-- CreateIndex
CREATE INDEX "booking_assignment_university_id_booking_id_idx" ON "booking_assignment"("university_id", "booking_id");

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_assigned_by_account_id_fkey" FOREIGN KEY ("assigned_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_trust_status" ADD CONSTRAINT "student_trust_status_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_attendance" ADD CONSTRAINT "booking_attendance_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_attendance" ADD CONSTRAINT "booking_attendance_booking_attendance_marked_by_id_fkey" FOREIGN KEY ("booking_attendance_marked_by_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_exception_request" ADD CONSTRAINT "booking_exception_request_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_exception_request" ADD CONSTRAINT "booking_exception_request_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_exception_request" ADD CONSTRAINT "booking_exception_request_booking_exception_reviewed_by_id_fkey" FOREIGN KEY ("booking_exception_reviewed_by_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_exception_evidence" ADD CONSTRAINT "booking_exception_evidence_booking_exception_request_id_fkey" FOREIGN KEY ("booking_exception_request_id") REFERENCES "booking_exception_request"("booking_exception_request_id") ON DELETE CASCADE ON UPDATE CASCADE;
