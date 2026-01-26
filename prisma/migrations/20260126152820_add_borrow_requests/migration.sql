-- CreateEnum
CREATE TYPE "BorrowRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "borrow_request" (
    "borrow_request_id" SERIAL NOT NULL,
    "from_university_id" INTEGER NOT NULL,
    "requested_by_account_id" INTEGER NOT NULL,
    "borrow_request_title" VARCHAR(200) NOT NULL,
    "borrow_request_reason" TEXT NOT NULL,
    "borrow_request_detail" TEXT,
    "borrow_needed_from" TIMESTAMPTZ(3),
    "borrow_needed_to" TIMESTAMPTZ(3),
    "borrow_needed_count" INTEGER NOT NULL DEFAULT 1,
    "borrow_request_status" "BorrowRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "borrow_submitted_at" TIMESTAMPTZ(3),
    "borrow_submitted_by_account_id" INTEGER,
    "borrow_submit_note" TEXT,
    "borrow_approved_at" TIMESTAMPTZ(3),
    "borrow_approved_by_account_id" INTEGER,
    "borrow_rejected_at" TIMESTAMPTZ(3),
    "borrow_rejected_by_account_id" INTEGER,
    "borrow_reject_reason" TEXT,
    "borrow_request_created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "borrow_request_updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "borrow_request_pkey" PRIMARY KEY ("borrow_request_id")
);

-- CreateTable
CREATE TABLE "borrow_assignment" (
    "borrow_assignment_id" SERIAL NOT NULL,
    "borrow_request_id" INTEGER NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "consultant_university_id" INTEGER NOT NULL,
    "borrow_assign_start_at" TIMESTAMPTZ(3) NOT NULL,
    "borrow_assign_end_at" TIMESTAMPTZ(3) NOT NULL,
    "borrow_assigned_by_account_id" INTEGER NOT NULL,
    "borrow_assignment_note" TEXT,
    "borrow_assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "borrow_assignment_pkey" PRIMARY KEY ("borrow_assignment_id")
);

-- CreateIndex
CREATE INDEX "borrow_request_from_university_id_idx" ON "borrow_request"("from_university_id");

-- CreateIndex
CREATE INDEX "borrow_request_requested_by_account_id_idx" ON "borrow_request"("requested_by_account_id");

-- CreateIndex
CREATE INDEX "borrow_request_borrow_request_status_idx" ON "borrow_request"("borrow_request_status");

-- CreateIndex
CREATE INDEX "borrow_request_borrow_request_created_at_idx" ON "borrow_request"("borrow_request_created_at");

-- CreateIndex
CREATE INDEX "borrow_assignment_borrow_request_id_idx" ON "borrow_assignment"("borrow_request_id");

-- CreateIndex
CREATE INDEX "borrow_assignment_consultant_id_idx" ON "borrow_assignment"("consultant_id");

-- CreateIndex
CREATE INDEX "borrow_assignment_consultant_university_id_idx" ON "borrow_assignment"("consultant_university_id");

-- CreateIndex
CREATE INDEX "borrow_assignment_borrow_assigned_by_account_id_idx" ON "borrow_assignment"("borrow_assigned_by_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrow_assignment_borrow_request_id_consultant_id_key" ON "borrow_assignment"("borrow_request_id", "consultant_id");

-- AddForeignKey
ALTER TABLE "borrow_request" ADD CONSTRAINT "borrow_request_from_university_id_fkey" FOREIGN KEY ("from_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request" ADD CONSTRAINT "borrow_request_requested_by_account_id_fkey" FOREIGN KEY ("requested_by_account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request" ADD CONSTRAINT "borrow_request_borrow_submitted_by_account_id_fkey" FOREIGN KEY ("borrow_submitted_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request" ADD CONSTRAINT "borrow_request_borrow_approved_by_account_id_fkey" FOREIGN KEY ("borrow_approved_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_request" ADD CONSTRAINT "borrow_request_borrow_rejected_by_account_id_fkey" FOREIGN KEY ("borrow_rejected_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_assignment" ADD CONSTRAINT "borrow_assignment_borrow_request_id_fkey" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_request"("borrow_request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_assignment" ADD CONSTRAINT "borrow_assignment_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_assignment" ADD CONSTRAINT "borrow_assignment_consultant_university_id_fkey" FOREIGN KEY ("consultant_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_assignment" ADD CONSTRAINT "borrow_assignment_borrow_assigned_by_account_id_fkey" FOREIGN KEY ("borrow_assigned_by_account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
