/*
  Warnings:

  - The values [CHECKBOX,UPLOAD] on the enum `ConsentSignatureMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `consent_doc_code` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `consent_doc_hash` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `consent_doc_version` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `sign_status` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `signature_hash` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `signed_at` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `signed_by_account_id` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `verified_at` on the `booking_consent_signature` table. All the data in the column will be lost.
  - You are about to drop the column `accountAccount_id` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the `borrow_shift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `time_slot_shift` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[university_id,booking_id]` on the table `booking_consent_signature` will be added. If there are existing duplicate values, this will fail.
  - Made the column `student_id` on table `booking_consent_signature` required. This step will fail if there are existing NULL values in that column.
  - Made the column `signature_payload` on table `booking_consent_signature` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BorrowOnCallStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BorrowAvailabilityStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "ConsentSignatureMethod_new" AS ENUM ('DRAW');
ALTER TABLE "booking_consent_signature" ALTER COLUMN "signature_method" DROP DEFAULT;
ALTER TABLE "booking_consent_signature" ALTER COLUMN "signature_method" TYPE "ConsentSignatureMethod_new" USING ("signature_method"::text::"ConsentSignatureMethod_new");
ALTER TYPE "ConsentSignatureMethod" RENAME TO "ConsentSignatureMethod_old";
ALTER TYPE "ConsentSignatureMethod_new" RENAME TO "ConsentSignatureMethod";
DROP TYPE "ConsentSignatureMethod_old";
ALTER TABLE "booking_consent_signature" ALTER COLUMN "signature_method" SET DEFAULT 'DRAW';
COMMIT;

-- DropForeignKey
ALTER TABLE "booking_consent_signature" DROP CONSTRAINT "booking_consent_signature_signed_by_account_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift" DROP CONSTRAINT "borrow_shift_borrow_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift" DROP CONSTRAINT "borrow_shift_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift" DROP CONSTRAINT "borrow_shift_created_by_account_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift" DROP CONSTRAINT "borrow_shift_home_university_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_shift" DROP CONSTRAINT "borrow_shift_target_university_id_fkey";

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_accountAccount_id_fkey";

-- DropForeignKey
ALTER TABLE "time_slot_shift" DROP CONSTRAINT "time_slot_shift_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "time_slot_shift" DROP CONSTRAINT "time_slot_shift_university_id_time_slot_id_fkey";

-- DropIndex
DROP INDEX "booking_consent_signature_signed_by_account_id_signed_at_idx";

-- DropIndex
DROP INDEX "booking_consent_signature_university_id_booking_id_consent__key";

-- DropIndex
DROP INDEX "booking_consent_signature_university_id_booking_id_idx";

-- AlterTable
ALTER TABLE "booking_consent_signature" DROP COLUMN "consent_doc_code",
DROP COLUMN "consent_doc_hash",
DROP COLUMN "consent_doc_version",
DROP COLUMN "ip_address",
DROP COLUMN "sign_status",
DROP COLUMN "signature_hash",
DROP COLUMN "signed_at",
DROP COLUMN "signed_by_account_id",
DROP COLUMN "user_agent",
DROP COLUMN "verified_at",
ALTER COLUMN "student_id" SET NOT NULL,
ALTER COLUMN "signature_method" SET DEFAULT 'DRAW',
ALTER COLUMN "signature_payload" SET NOT NULL;

-- AlterTable
ALTER TABLE "faculty" DROP COLUMN "accountAccount_id";

-- AlterTable
ALTER TABLE "university" ADD COLUMN     "rector_account_id" INTEGER;

-- DropTable
DROP TABLE "borrow_shift";

-- DropTable
DROP TABLE "time_slot_shift";

-- DropEnum
DROP TYPE "BorrowShiftStatus";

-- DropEnum
DROP TYPE "TimeSlotShiftStatus";

-- CreateTable
CREATE TABLE "consultant_borrow_availability" (
    "consultant_borrow_availability_id" SERIAL NOT NULL,
    "borrow_plan_id" UUID NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "home_university_id" INTEGER NOT NULL,
    "target_university_id" INTEGER NOT NULL,
    "borrow_assignment_id" INTEGER,
    "availability_start_date" DATE NOT NULL,
    "availability_end_date" DATE NOT NULL,
    "status" "BorrowAvailabilityStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "created_by_account_id" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "consultant_borrow_availability_pkey" PRIMARY KEY ("consultant_borrow_availability_id")
);

-- CreateIndex
CREATE INDEX "consultant_borrow_availability_borrow_plan_id_idx" ON "consultant_borrow_availability"("borrow_plan_id");

-- CreateIndex
CREATE INDEX "consultant_borrow_availability_target_university_id_availab_idx" ON "consultant_borrow_availability"("target_university_id", "availability_start_date");

-- CreateIndex
CREATE INDEX "consultant_borrow_availability_consultant_id_availability_s_idx" ON "consultant_borrow_availability"("consultant_id", "availability_start_date");

-- CreateIndex
CREATE INDEX "consultant_borrow_availability_status_idx" ON "consultant_borrow_availability"("status");

-- CreateIndex
CREATE INDEX "booking_consent_signature_university_id_student_id_idx" ON "booking_consent_signature"("university_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_consent_signature_university_id_booking_id_key" ON "booking_consent_signature"("university_id", "booking_id");

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_rector_account_id_fkey" FOREIGN KEY ("rector_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_consent_signature" ADD CONSTRAINT "booking_consent_signature_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_availability" ADD CONSTRAINT "consultant_borrow_availability_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_availability" ADD CONSTRAINT "consultant_borrow_availability_home_university_id_fkey" FOREIGN KEY ("home_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_availability" ADD CONSTRAINT "consultant_borrow_availability_target_university_id_fkey" FOREIGN KEY ("target_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_availability" ADD CONSTRAINT "consultant_borrow_availability_borrow_assignment_id_fkey" FOREIGN KEY ("borrow_assignment_id") REFERENCES "borrow_assignment"("borrow_assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_availability" ADD CONSTRAINT "consultant_borrow_availability_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;
