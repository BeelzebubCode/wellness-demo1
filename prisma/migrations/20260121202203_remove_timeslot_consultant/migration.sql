/*
  Warnings:

  - A unique constraint covering the columns `[university_id,department_code]` on the table `department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,faculty_code]` on the table `faculty` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,student_code]` on the table `student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[university_id,time_slot_start_datetime,time_slot_end_datetime]` on the table `time_slot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `university_id` to the `advisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `consultant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `faculty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_id` to the `province` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `university_id` to the `time_slot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UniversityAccessRole" AS ENUM ('STUDENT', 'CONSULTANT', 'HEAD_CONSULTANT', 'RECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "RegionCode" AS ENUM ('NORTH', 'NORTHEAST', 'CENTRAL', 'EAST', 'WEST', 'SOUTH');

-- CreateEnum
CREATE TYPE "PointTxnType" AS ENUM ('EARN', 'REDEEM', 'ADJUST', 'EXPIRE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccountRole" ADD VALUE 'RECTOR';
ALTER TYPE "AccountRole" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "booking_student_id_time_slot_id_key";

-- DropIndex
DROP INDEX "department_department_code_key";

-- DropIndex
DROP INDEX "faculty_faculty_code_key";

-- DropIndex
DROP INDEX "student_student_code_key";

-- DropIndex
DROP INDEX "time_slot_time_slot_start_datetime_time_slot_end_datetime_idx";

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "account_home_university_id" INTEGER;

-- AlterTable
ALTER TABLE "advisor" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "consultant" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "department" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "faculty" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "province" ADD COLUMN     "region_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "student" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "time_slot" ADD COLUMN     "university_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "region" (
    "region_id" SERIAL NOT NULL,
    "region_code" "RegionCode" NOT NULL,
    "region_name_th" VARCHAR(50) NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("region_id")
);

-- CreateTable
CREATE TABLE "university" (
    "university_id" SERIAL NOT NULL,
    "university_code" VARCHAR(20) NOT NULL,
    "university_name_th" VARCHAR(200) NOT NULL,
    "university_name_en" VARCHAR(200),
    "province_id" INTEGER NOT NULL,
    "university_is_active" BOOLEAN NOT NULL DEFAULT true,
    "university_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_pkey" PRIMARY KEY ("university_id")
);

-- CreateTable
CREATE TABLE "account_university_access" (
    "account_university_access_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "access_role" "UniversityAccessRole" NOT NULL DEFAULT 'STUDENT',
    "access_granted_by_account_id" INTEGER,
    "access_granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_revoked_at" TIMESTAMP(3),

    CONSTRAINT "account_university_access_pkey" PRIMARY KEY ("account_university_access_id")
);

-- CreateTable
CREATE TABLE "point_rule" (
    "point_rule_id" SERIAL NOT NULL,
    "point_rule_code" VARCHAR(50) NOT NULL,
    "point_rule_name_th" VARCHAR(200) NOT NULL,
    "point_rule_points" INTEGER NOT NULL,
    "point_rule_is_active" BOOLEAN NOT NULL DEFAULT true,
    "point_rule_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_rule_pkey" PRIMARY KEY ("point_rule_id")
);

-- CreateTable
CREATE TABLE "student_point_wallet" (
    "student_id" INTEGER NOT NULL,
    "student_point_balance" INTEGER NOT NULL DEFAULT 0,
    "student_point_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_point_wallet_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_point_transaction" (
    "student_point_transaction_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "point_rule_id" INTEGER,
    "booking_id" INTEGER,
    "student_point_txn_type" "PointTxnType" NOT NULL,
    "student_point_amount" INTEGER NOT NULL,
    "student_point_note" TEXT,
    "student_point_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_point_transaction_pkey" PRIMARY KEY ("student_point_transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "region_region_code_key" ON "region"("region_code");

-- CreateIndex
CREATE UNIQUE INDEX "university_university_code_key" ON "university"("university_code");

-- CreateIndex
CREATE INDEX "university_province_id_idx" ON "university"("province_id");

-- CreateIndex
CREATE INDEX "university_university_is_active_idx" ON "university"("university_is_active");

-- CreateIndex
CREATE INDEX "account_university_access_university_id_idx" ON "account_university_access"("university_id");

-- CreateIndex
CREATE INDEX "account_university_access_access_role_idx" ON "account_university_access"("access_role");

-- CreateIndex
CREATE INDEX "account_university_access_access_granted_by_account_id_idx" ON "account_university_access"("access_granted_by_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_university_access_account_id_university_id_key" ON "account_university_access"("account_id", "university_id");

-- CreateIndex
CREATE UNIQUE INDEX "point_rule_point_rule_code_key" ON "point_rule"("point_rule_code");

-- CreateIndex
CREATE INDEX "point_rule_point_rule_is_active_idx" ON "point_rule"("point_rule_is_active");

-- CreateIndex
CREATE INDEX "student_point_transaction_student_id_idx" ON "student_point_transaction"("student_id");

-- CreateIndex
CREATE INDEX "student_point_transaction_booking_id_idx" ON "student_point_transaction"("booking_id");

-- CreateIndex
CREATE INDEX "student_point_transaction_point_rule_id_idx" ON "student_point_transaction"("point_rule_id");

-- CreateIndex
CREATE INDEX "student_point_transaction_student_point_txn_type_idx" ON "student_point_transaction"("student_point_txn_type");

-- CreateIndex
CREATE INDEX "account_account_role_idx" ON "account"("account_role");

-- CreateIndex
CREATE INDEX "account_account_home_university_id_idx" ON "account"("account_home_university_id");

-- CreateIndex
CREATE INDEX "advisor_university_id_idx" ON "advisor"("university_id");

-- CreateIndex
CREATE INDEX "booking_university_id_idx" ON "booking"("university_id");

-- CreateIndex
CREATE INDEX "consultant_university_id_idx" ON "consultant"("university_id");

-- CreateIndex
CREATE INDEX "department_university_id_idx" ON "department"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_university_id_department_code_key" ON "department"("university_id", "department_code");

-- CreateIndex
CREATE INDEX "faculty_university_id_idx" ON "faculty"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_university_id_faculty_code_key" ON "faculty"("university_id", "faculty_code");

-- CreateIndex
CREATE INDEX "province_region_id_idx" ON "province"("region_id");

-- CreateIndex
CREATE INDEX "student_university_id_idx" ON "student"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_university_id_student_code_key" ON "student"("university_id", "student_code");

-- CreateIndex
CREATE INDEX "time_slot_university_id_time_slot_start_datetime_idx" ON "time_slot"("university_id", "time_slot_start_datetime");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_university_id_time_slot_start_datetime_time_slot__key" ON "time_slot"("university_id", "time_slot_start_datetime", "time_slot_end_datetime");

-- AddForeignKey
ALTER TABLE "province" ADD CONSTRAINT "province_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("region_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "province"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_access" ADD CONSTRAINT "account_university_access_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_access" ADD CONSTRAINT "account_university_access_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_access" ADD CONSTRAINT "account_university_access_access_granted_by_account_id_fkey" FOREIGN KEY ("access_granted_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_account_home_university_id_fkey" FOREIGN KEY ("account_home_university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_wallet" ADD CONSTRAINT "student_point_wallet_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_transaction" ADD CONSTRAINT "student_point_transaction_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_transaction" ADD CONSTRAINT "student_point_transaction_point_rule_id_fkey" FOREIGN KEY ("point_rule_id") REFERENCES "point_rule"("point_rule_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_point_transaction" ADD CONSTRAINT "student_point_transaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;
