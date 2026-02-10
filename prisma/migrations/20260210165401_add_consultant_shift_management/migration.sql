-- CreateEnum
CREATE TYPE "ConsultantShiftStatus" AS ENUM ('ACTIVE', 'ON_LOAN', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BorrowPeriodStatus" AS ENUM ('ACTIVE', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "consultant_shift" (
    "shift_id" SERIAL NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "shift_start_date" DATE NOT NULL,
    "shift_end_date" DATE NOT NULL,
    "days_worked" INTEGER NOT NULL DEFAULT 0,
    "days_remaining" INTEGER NOT NULL DEFAULT 14,
    "status" "ConsultantShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "consultant_shift_pkey" PRIMARY KEY ("shift_id")
);

-- CreateTable
CREATE TABLE "shift_borrow_period" (
    "period_id" SERIAL NOT NULL,
    "shift_id" INTEGER NOT NULL,
    "borrow_assignment_id" INTEGER,
    "borrowed_to_university_id" INTEGER NOT NULL,
    "borrow_start_date" DATE NOT NULL,
    "borrow_end_date" DATE NOT NULL,
    "actual_return_date" DATE,
    "status" "BorrowPeriodStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_borrow_period_pkey" PRIMARY KEY ("period_id")
);

-- CreateIndex
CREATE INDEX "consultant_shift_consultant_id_status_idx" ON "consultant_shift"("consultant_id", "status");

-- CreateIndex
CREATE INDEX "consultant_shift_shift_start_date_shift_end_date_idx" ON "consultant_shift"("shift_start_date", "shift_end_date");

-- CreateIndex
CREATE UNIQUE INDEX "shift_borrow_period_borrow_assignment_id_key" ON "shift_borrow_period"("borrow_assignment_id");

-- CreateIndex
CREATE INDEX "shift_borrow_period_shift_id_idx" ON "shift_borrow_period"("shift_id");

-- CreateIndex
CREATE INDEX "shift_borrow_period_status_idx" ON "shift_borrow_period"("status");

-- AddForeignKey
ALTER TABLE "consultant_shift" ADD CONSTRAINT "consultant_shift_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_shift" ADD CONSTRAINT "consultant_shift_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_borrow_period" ADD CONSTRAINT "shift_borrow_period_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "consultant_shift"("shift_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_borrow_period" ADD CONSTRAINT "shift_borrow_period_borrowed_to_university_id_fkey" FOREIGN KEY ("borrowed_to_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_borrow_period" ADD CONSTRAINT "shift_borrow_period_borrow_assignment_id_fkey" FOREIGN KEY ("borrow_assignment_id") REFERENCES "borrow_assignment"("borrow_assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;
