/*
  Warnings:

  - You are about to drop the column `booking_online_channel` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `booking_session_online_channel` on the `booking_session` table. All the data in the column will be lost.
  - You are about to drop the `consultant_shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shift_borrow_period` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BorrowShiftStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "consultant_shift" DROP CONSTRAINT "consultant_shift_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "consultant_shift" DROP CONSTRAINT "consultant_shift_university_id_fkey";

-- DropForeignKey
ALTER TABLE "shift_borrow_period" DROP CONSTRAINT "shift_borrow_period_borrow_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "shift_borrow_period" DROP CONSTRAINT "shift_borrow_period_borrowed_to_university_id_fkey";

-- DropForeignKey
ALTER TABLE "shift_borrow_period" DROP CONSTRAINT "shift_borrow_period_shift_id_fkey";

-- AlterTable
ALTER TABLE "booking" DROP COLUMN "booking_online_channel",
ADD COLUMN     "online_channel_category_id" INTEGER;

-- AlterTable
ALTER TABLE "booking_session" DROP COLUMN "booking_session_online_channel",
ADD COLUMN     "online_channel_category_id" INTEGER;

-- DropTable
DROP TABLE "consultant_shift";

-- DropTable
DROP TABLE "shift_borrow_period";

-- DropEnum
DROP TYPE "BorrowPeriodStatus";

-- DropEnum
DROP TYPE "ConsultantShiftStatus";

-- DropEnum
DROP TYPE "OnlineChannel";

-- CreateTable
CREATE TABLE "online_channel_category" (
    "online_channel_category_id" SERIAL NOT NULL,
    "online_channel_code" VARCHAR(50) NOT NULL,
    "online_channel_name_th" VARCHAR(100) NOT NULL,
    "online_channel_name_en" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "online_channel_category_pkey" PRIMARY KEY ("online_channel_category_id")
);

-- CreateTable
CREATE TABLE "borrow_shift" (
    "borrow_shift_id" SERIAL NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "target_university_id" INTEGER NOT NULL,
    "borrow_assignment_id" INTEGER,
    "shift_start_date" DATE NOT NULL,
    "shift_end_date" DATE NOT NULL,
    "status" "BorrowShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "borrow_shift_pkey" PRIMARY KEY ("borrow_shift_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_channel_category_online_channel_code_key" ON "online_channel_category"("online_channel_code");

-- CreateIndex
CREATE UNIQUE INDEX "borrow_shift_borrow_assignment_id_key" ON "borrow_shift"("borrow_assignment_id");

-- CreateIndex
CREATE INDEX "borrow_shift_consultant_id_status_idx" ON "borrow_shift"("consultant_id", "status");

-- CreateIndex
CREATE INDEX "borrow_shift_shift_start_date_shift_end_date_idx" ON "borrow_shift"("shift_start_date", "shift_end_date");

-- CreateIndex
CREATE INDEX "borrow_shift_target_university_id_idx" ON "borrow_shift"("target_university_id");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_online_channel_category_id_fkey" FOREIGN KEY ("online_channel_category_id") REFERENCES "online_channel_category"("online_channel_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_session" ADD CONSTRAINT "booking_session_online_channel_category_id_fkey" FOREIGN KEY ("online_channel_category_id") REFERENCES "online_channel_category"("online_channel_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift" ADD CONSTRAINT "borrow_shift_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift" ADD CONSTRAINT "borrow_shift_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift" ADD CONSTRAINT "borrow_shift_target_university_id_fkey" FOREIGN KEY ("target_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_shift" ADD CONSTRAINT "borrow_shift_borrow_assignment_id_fkey" FOREIGN KEY ("borrow_assignment_id") REFERENCES "borrow_assignment"("borrow_assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;
