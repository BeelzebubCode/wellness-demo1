/*
  Warnings:

  - The primary key for the `booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `booking_assignment_assigned_at` on the `booking_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `booking_assignment_assigned_by_id` on the `booking_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `booking_assignment_assigned_to_id` on the `booking_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `booking_assignment_note` on the `booking_assignment` table. All the data in the column will be lost.
  - The primary key for the `booking_cancellation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `booking_outcome` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `student_point_wallet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `student_point_updated_at` on the `student_point_wallet` table. All the data in the column will be lost.
  - You are about to drop the column `student_first_name` on the `student_profile` table. All the data in the column will be lost.
  - You are about to drop the column `student_last_name` on the `student_profile` table. All the data in the column will be lost.
  - You are about to drop the column `student_nickname` on the `student_profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[university_id,student_id,time_slot_id]` on the table `booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,booking_id]` on the table `booking_assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,consultant_id]` on the table `consultant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,department_id]` on the table `department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,faculty_id]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,booking_id]` on the table `feedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_id]` on the table `student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_id]` on the table `student_academic` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_id,student_address_type]` on the table `student_address` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_id]` on the table `student_profile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,time_slot_id]` on the table `time_slot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `booking_service_mode` to the `booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assigned_by_account_id` to the `booking_assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultant_id` to the `booking_assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultant_university_id` to the `booking_assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `booking_assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `booking_cancellation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `booking_outcome` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `student_academic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `student_address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `student_point_wallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_first_name_th` to the `student_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_last_name_th` to the `student_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `student_profile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'ON_DUTY', 'OFF_DUTY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceMode" AS ENUM ('ONSITE', 'ONLINE');

-- CreateEnum
CREATE TYPE "OnlineChannel" AS ENUM ('LINE_CALL', 'GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "TimeSlotShiftStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BorrowOnCallStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsentSignStatus" AS ENUM ('SIGNED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ConsentSignatureMethod" AS ENUM ('CHECKBOX', 'DRAW', 'UPLOAD');

-- DropForeignKey
ALTER TABLE "advisor" DROP CONSTRAINT "advisor_department_id_fkey";

-- DropForeignKey
ALTER TABLE "advisor" DROP CONSTRAINT "advisor_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_student_id_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_time_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_assignment" DROP CONSTRAINT "booking_assignment_booking_assignment_assigned_by_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_assignment" DROP CONSTRAINT "booking_assignment_booking_assignment_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_assignment" DROP CONSTRAINT "booking_assignment_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_cancellation" DROP CONSTRAINT "booking_cancellation_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_outcome" DROP CONSTRAINT "booking_outcome_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "department" DROP CONSTRAINT "department_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_student_id_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "student_academic" DROP CONSTRAINT "student_academic_department_id_fkey";

-- DropForeignKey
ALTER TABLE "student_academic" DROP CONSTRAINT "student_academic_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "student_academic" DROP CONSTRAINT "student_academic_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_address" DROP CONSTRAINT "student_address_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_point_transaction" DROP CONSTRAINT "student_point_transaction_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "student_point_wallet" DROP CONSTRAINT "student_point_wallet_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_profile" DROP CONSTRAINT "student_profile_student_id_fkey";

-- DropIndex
DROP INDEX "advisor_department_id_idx";

-- DropIndex
DROP INDEX "advisor_faculty_id_idx";

-- DropIndex
DROP INDEX "booking_time_slot_id_idx";

-- DropIndex
DROP INDEX "booking_university_id_idx";

-- DropIndex
DROP INDEX "booking_assignment_booking_assignment_assigned_by_id_idx";

-- DropIndex
DROP INDEX "booking_assignment_booking_assignment_assigned_to_id_idx";

-- DropIndex
DROP INDEX "booking_assignment_booking_id_idx";

-- DropIndex
DROP INDEX "borrow_assignment_borrow_assigned_by_account_id_idx";

-- DropIndex
DROP INDEX "borrow_assignment_borrow_request_id_idx";

-- DropIndex
DROP INDEX "borrow_assignment_consultant_id_idx";

-- DropIndex
DROP INDEX "borrow_assignment_consultant_university_id_idx";

-- DropIndex
DROP INDEX "feedback_booking_id_key";

-- DropIndex
DROP INDEX "notification_booking_id_idx";

-- DropIndex
DROP INDEX "student_academic_department_id_idx";

-- DropIndex
DROP INDEX "student_academic_faculty_id_idx";

-- DropIndex
DROP INDEX "student_address_province_id_idx";

-- DropIndex
DROP INDEX "student_address_student_id_student_address_type_key";

-- DropIndex
DROP INDEX "student_point_transaction_booking_id_idx";

-- AlterTable
ALTER TABLE "booking" DROP CONSTRAINT "booking_pkey",
ADD COLUMN     "booking_online_channel" "OnlineChannel",
ADD COLUMN     "booking_service_mode" "ServiceMode" NOT NULL,
ADD CONSTRAINT "booking_pkey" PRIMARY KEY ("university_id", "booking_id");

-- AlterTable
ALTER TABLE "booking_assignment" DROP COLUMN "booking_assignment_assigned_at",
DROP COLUMN "booking_assignment_assigned_by_id",
DROP COLUMN "booking_assignment_assigned_to_id",
DROP COLUMN "booking_assignment_note",
ADD COLUMN     "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assigned_by_account_id" INTEGER NOT NULL,
ADD COLUMN     "assigned_note" TEXT,
ADD COLUMN     "borrow_assignment_id" INTEGER,
ADD COLUMN     "consultant_id" INTEGER NOT NULL,
ADD COLUMN     "consultant_university_id" INTEGER NOT NULL,
ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "booking_cancellation" DROP CONSTRAINT "booking_cancellation_pkey",
ADD COLUMN     "university_id" INTEGER NOT NULL,
ADD CONSTRAINT "booking_cancellation_pkey" PRIMARY KEY ("university_id", "booking_id");

-- AlterTable
ALTER TABLE "booking_outcome" DROP CONSTRAINT "booking_outcome_pkey",
ADD COLUMN     "university_id" INTEGER NOT NULL,
ADD CONSTRAINT "booking_outcome_pkey" PRIMARY KEY ("university_id", "booking_id");

-- AlterTable
ALTER TABLE "borrow_assignment" ADD COLUMN     "borrow_on_call_shift_id" INTEGER;

-- AlterTable
ALTER TABLE "faculty" ADD COLUMN     "education_field_group_id" INTEGER;

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "university_id" INTEGER;

-- AlterTable
ALTER TABLE "student_academic" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "student_address" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "student_point_transaction" ADD COLUMN     "booking_university_id" INTEGER;

-- AlterTable
ALTER TABLE "student_point_wallet" DROP CONSTRAINT "student_point_wallet_pkey",
DROP COLUMN "student_point_updated_at",
ADD COLUMN     "university_id" INTEGER NOT NULL,
ADD CONSTRAINT "student_point_wallet_pkey" PRIMARY KEY ("university_id", "student_id");

-- AlterTable
ALTER TABLE "student_profile" DROP COLUMN "student_first_name",
DROP COLUMN "student_last_name",
DROP COLUMN "student_nickname",
ADD COLUMN     "student_first_name_en" VARCHAR(100),
ADD COLUMN     "student_first_name_th" VARCHAR(100) NOT NULL,
ADD COLUMN     "student_last_name_en" VARCHAR(100),
ADD COLUMN     "student_last_name_th" VARCHAR(100) NOT NULL,
ADD COLUMN     "student_nickname_en" VARCHAR(20),
ADD COLUMN     "student_nickname_th" VARCHAR(20),
ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "university" ADD COLUMN     "university_latitude" DECIMAL(9,6),
ADD COLUMN     "university_longitude" DECIMAL(9,6);

-- CreateTable
CREATE TABLE "education_field_group" (
    "education_field_group_id" SERIAL NOT NULL,
    "isced_broad_field_code" VARCHAR(2) NOT NULL,
    "field_group_name_th" VARCHAR(150) NOT NULL,
    "field_group_name_en" VARCHAR(150) NOT NULL,

    CONSTRAINT "education_field_group_pkey" PRIMARY KEY ("education_field_group_id")
);

-- CreateTable
CREATE TABLE "time_slot_shift" (
    "time_slot_shift_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "time_slot_id" INTEGER NOT NULL,
    "consultant_shift_id" INTEGER NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "capacity_for_this_shift" INTEGER NOT NULL DEFAULT 1,
    "link_status" "TimeSlotShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slot_shift_pkey" PRIMARY KEY ("time_slot_shift_id")
);

-- CreateTable
CREATE TABLE "booking_session" (
    "booking_session_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "booking_session_mode" "ServiceMode" NOT NULL,
    "booking_session_online_channel" "OnlineChannel",
    "booking_session_join_url" TEXT,
    "booking_session_phone_number" VARCHAR(30),
    "booking_session_location_text" VARCHAR(200),
    "booking_session_extra_detail" TEXT,
    "provided_by_account_id" INTEGER,
    "provided_at" TIMESTAMPTZ(3),

    CONSTRAINT "booking_session_pkey" PRIMARY KEY ("booking_session_id")
);

-- CreateTable
CREATE TABLE "booking_consent_signature" (
    "booking_consent_signature_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "signed_by_account_id" INTEGER,
    "student_id" INTEGER,
    "signature_method" "ConsentSignatureMethod" NOT NULL DEFAULT 'CHECKBOX',
    "consent_doc_code" VARCHAR(50) NOT NULL,
    "consent_doc_version" INTEGER NOT NULL,
    "consent_doc_hash" VARCHAR(128) NOT NULL,
    "sign_status" "ConsentSignStatus" NOT NULL DEFAULT 'SIGNED',
    "signature_payload" JSONB,
    "signature_hash" VARCHAR(128),
    "verified_at" TIMESTAMPTZ(3),
    "signed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,

    CONSTRAINT "booking_consent_signature_pkey" PRIMARY KEY ("booking_consent_signature_id")
);

-- CreateTable
CREATE TABLE "borrow_on_call_shift" (
    "borrow_on_call_shift_id" SERIAL NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "consultant_university_id" INTEGER NOT NULL,
    "on_call_start_at" TIMESTAMPTZ(3) NOT NULL,
    "on_call_end_at" TIMESTAMPTZ(3) NOT NULL,
    "on_call_status" "BorrowOnCallStatus" NOT NULL DEFAULT 'SCHEDULED',
    "on_call_note" TEXT,
    "created_by_account_id" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "borrow_on_call_shift_pkey" PRIMARY KEY ("borrow_on_call_shift_id")
);

-- CreateTable
CREATE TABLE "borrow_window_policy" (
    "borrow_window_policy_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "borrow_window_days" INTEGER NOT NULL DEFAULT 14,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "borrow_window_policy_pkey" PRIMARY KEY ("borrow_window_policy_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "education_field_group_isced_broad_field_code_key" ON "education_field_group"("isced_broad_field_code");

-- CreateIndex
CREATE INDEX "time_slot_shift_university_id_time_slot_id_idx" ON "time_slot_shift"("university_id", "time_slot_id");

-- CreateIndex
CREATE INDEX "time_slot_shift_consultant_id_idx" ON "time_slot_shift"("consultant_id");

-- CreateIndex
CREATE INDEX "time_slot_shift_consultant_shift_id_idx" ON "time_slot_shift"("consultant_shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_shift_university_id_time_slot_id_consultant_shift_key" ON "time_slot_shift"("university_id", "time_slot_id", "consultant_shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_shift_university_id_time_slot_id_consultant_id_key" ON "time_slot_shift"("university_id", "time_slot_id", "consultant_id");

-- CreateIndex
CREATE INDEX "booking_session_provided_by_account_id_provided_at_idx" ON "booking_session"("provided_by_account_id", "provided_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_session_university_id_booking_id_key" ON "booking_session"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "booking_consent_signature_university_id_booking_id_idx" ON "booking_consent_signature"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "booking_consent_signature_signed_by_account_id_signed_at_idx" ON "booking_consent_signature"("signed_by_account_id", "signed_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_consent_signature_university_id_booking_id_consent__key" ON "booking_consent_signature"("university_id", "booking_id", "consent_doc_code", "consent_doc_version");

-- CreateIndex
CREATE INDEX "borrow_on_call_shift_consultant_university_id_on_call_start_idx" ON "borrow_on_call_shift"("consultant_university_id", "on_call_start_at");

-- CreateIndex
CREATE INDEX "borrow_on_call_shift_consultant_id_on_call_start_at_idx" ON "borrow_on_call_shift"("consultant_id", "on_call_start_at");

-- CreateIndex
CREATE UNIQUE INDEX "borrow_on_call_shift_consultant_id_on_call_start_at_on_call_key" ON "borrow_on_call_shift"("consultant_id", "on_call_start_at", "on_call_end_at");

-- CreateIndex
CREATE INDEX "borrow_window_policy_university_id_is_active_idx" ON "borrow_window_policy"("university_id", "is_active");

-- CreateIndex
CREATE INDEX "advisor_university_id_faculty_id_idx" ON "advisor"("university_id", "faculty_id");

-- CreateIndex
CREATE INDEX "advisor_university_id_department_id_idx" ON "advisor"("university_id", "department_id");

-- CreateIndex
CREATE INDEX "booking_university_id_time_slot_id_idx" ON "booking"("university_id", "time_slot_id");

-- CreateIndex
CREATE INDEX "booking_university_id_time_slot_id_booking_status_idx" ON "booking"("university_id", "time_slot_id", "booking_status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_university_id_student_id_time_slot_id_key" ON "booking"("university_id", "student_id", "time_slot_id");

-- CreateIndex
CREATE INDEX "booking_assignment_consultant_id_assigned_at_idx" ON "booking_assignment"("consultant_id", "assigned_at");

-- CreateIndex
CREATE INDEX "booking_assignment_borrow_assignment_id_idx" ON "booking_assignment"("borrow_assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_assignment_university_id_booking_id_key" ON "booking_assignment"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "booking_cancellation_booking_id_idx" ON "booking_cancellation"("booking_id");

-- CreateIndex
CREATE INDEX "booking_outcome_booking_id_idx" ON "booking_outcome"("booking_id");

-- CreateIndex
CREATE INDEX "borrow_assignment_consultant_id_borrow_assign_start_at_idx" ON "borrow_assignment"("consultant_id", "borrow_assign_start_at");

-- CreateIndex
CREATE INDEX "borrow_assignment_consultant_university_id_borrow_assign_st_idx" ON "borrow_assignment"("consultant_university_id", "borrow_assign_start_at");

-- CreateIndex
CREATE INDEX "borrow_assignment_borrow_on_call_shift_id_idx" ON "borrow_assignment"("borrow_on_call_shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_university_id_consultant_id_key" ON "consultant"("university_id", "consultant_id");

-- CreateIndex
CREATE INDEX "department_university_id_faculty_id_idx" ON "department"("university_id", "faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_university_id_department_id_key" ON "department"("university_id", "department_id");

-- CreateIndex
CREATE INDEX "faculty_education_field_group_id_idx" ON "faculty"("education_field_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_university_id_faculty_id_key" ON "faculty"("university_id", "faculty_id");

-- CreateIndex
CREATE INDEX "feedback_university_id_idx" ON "feedback"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_university_id_booking_id_key" ON "feedback"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "notification_university_id_booking_id_idx" ON "notification"("university_id", "booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_university_id_student_id_key" ON "student"("university_id", "student_id");

-- CreateIndex
CREATE INDEX "student_academic_university_id_faculty_id_idx" ON "student_academic"("university_id", "faculty_id");

-- CreateIndex
CREATE INDEX "student_academic_university_id_department_id_idx" ON "student_academic"("university_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_academic_university_id_student_id_key" ON "student_academic"("university_id", "student_id");

-- CreateIndex
CREATE INDEX "student_address_university_id_student_id_idx" ON "student_address"("university_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_address_university_id_student_id_student_address_ty_key" ON "student_address"("university_id", "student_id", "student_address_type");

-- CreateIndex
CREATE INDEX "student_point_transaction_booking_university_id_booking_id_idx" ON "student_point_transaction"("booking_university_id", "booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_university_id_student_id_key" ON "student_profile"("university_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_university_id_time_slot_id_key" ON "time_slot"("university_id", "time_slot_id");

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_address" ADD CONSTRAINT "student_address_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_university_id_faculty_id_fkey" FOREIGN KEY ("university_id", "faculty_id") REFERENCES "faculty"("university_id", "faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_university_id_department_id_fkey" FOREIGN KEY ("university_id", "department_id") REFERENCES "department"("university_id", "department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_education_field_group_id_fkey" FOREIGN KEY ("education_field_group_id") REFERENCES "education_field_group"("education_field_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_university_id_faculty_id_fkey" FOREIGN KEY ("university_id", "faculty_id") REFERENCES "faculty"("university_id", "faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_university_id_faculty_id_fkey" FOREIGN KEY ("university_id", "faculty_id") REFERENCES "faculty"("university_id", "faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_university_id_department_id_fkey" FOREIGN KEY ("university_id", "department_id") REFERENCES "department"("university_id", "department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slot_shift" ADD CONSTRAINT "time_slot_shift_university_id_time_slot_id_fkey" FOREIGN KEY ("university_id", "time_slot_id") REFERENCES "time_slot"("university_id", "time_slot_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slot_shift" ADD CONSTRAINT "time_slot_shift_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_university_id_consultant_id_fkey" FOREIGN KEY ("university_id", "consultant_id") REFERENCES "consultant"("university_id", "consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_university_id_time_slot_id_fkey" FOREIGN KEY ("university_id", "time_slot_id") REFERENCES "time_slot"("university_id", "time_slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_session" ADD CONSTRAINT "booking_session_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_session" ADD CONSTRAINT "booking_session_provided_by_account_id_fkey" FOREIGN KEY ("provided_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_consultant_university_id_consultant_id_fkey" FOREIGN KEY ("consultant_university_id", "consultant_id") REFERENCES "consultant"("university_id", "consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_consultant_university_id_fkey" FOREIGN KEY ("consultant_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_assigned_by_account_id_fkey" FOREIGN KEY ("assigned_by_account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_borrow_assignment_id_fkey" FOREIGN KEY ("borrow_assignment_id") REFERENCES "borrow_assignment"("borrow_assignment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_outcome" ADD CONSTRAINT "booking_outcome_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_consent_signature" ADD CONSTRAINT "booking_consent_signature_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_consent_signature" ADD CONSTRAINT "booking_consent_signature_signed_by_account_id_fkey" FOREIGN KEY ("signed_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_cancellation" ADD CONSTRAINT "booking_cancellation_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_university_id_consultant_id_fkey" FOREIGN KEY ("university_id", "consultant_id") REFERENCES "consultant"("university_id", "consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_wallet" ADD CONSTRAINT "student_point_wallet_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_transaction" ADD CONSTRAINT "student_point_transaction_booking_university_id_booking_id_fkey" FOREIGN KEY ("booking_university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_assignment" ADD CONSTRAINT "borrow_assignment_borrow_on_call_shift_id_fkey" FOREIGN KEY ("borrow_on_call_shift_id") REFERENCES "borrow_on_call_shift"("borrow_on_call_shift_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_on_call_shift" ADD CONSTRAINT "borrow_on_call_shift_consultant_university_id_consultant_i_fkey" FOREIGN KEY ("consultant_university_id", "consultant_id") REFERENCES "consultant"("university_id", "consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_on_call_shift" ADD CONSTRAINT "borrow_on_call_shift_consultant_university_id_fkey" FOREIGN KEY ("consultant_university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_on_call_shift" ADD CONSTRAINT "borrow_on_call_shift_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrow_window_policy" ADD CONSTRAINT "borrow_window_policy_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;
