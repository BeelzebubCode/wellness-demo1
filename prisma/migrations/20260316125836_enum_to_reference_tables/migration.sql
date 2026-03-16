/*
  Warnings:

  - You are about to drop the column `ai_debug_meta` on the `ai_feedback_event` table. All the data in the column will be lost.
  - You are about to drop the column `ai_top_document_keys` on the `ai_feedback_event` table. All the data in the column will be lost.
  - You are about to drop the column `booking_service_mode` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `booking_session_mode` on the `booking_session` table. All the data in the column will be lost.
  - You are about to drop the column `education_field_group_id` on the `faculty` table. All the data in the column will be lost.
  - You are about to drop the column `student_address_type` on the `student_address` table. All the data in the column will be lost.
  - You are about to drop the column `student_blood_group` on the `student_profile` table. All the data in the column will be lost.
  - You are about to drop the column `student_gender` on the `student_profile` table. All the data in the column will be lost.
  - You are about to drop the column `university_type` on the `university` table. All the data in the column will be lost.
  - You are about to drop the `account_university_access` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking_consent_signature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `booking_discipline_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `borrow_window_policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `education_field_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_trust_status` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[university_id,student_id,address_type_id]` on the table `student_address` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `service_mode_id` to the `booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_mode_id` to the `booking_session` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `region_code` on the `region` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `address_type_id` to the `student_address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AccountRole" ADD VALUE 'HEAD_DEPARTMENT';

-- AlterEnum
ALTER TYPE "UniversityAccessRole" ADD VALUE 'HEAD_DEPARTMENT';

-- DropForeignKey
ALTER TABLE "account_university_access" DROP CONSTRAINT "account_university_access_access_granted_by_account_id_fkey";

-- DropForeignKey
ALTER TABLE "account_university_access" DROP CONSTRAINT "account_university_access_account_id_fkey";

-- DropForeignKey
ALTER TABLE "account_university_access" DROP CONSTRAINT "account_university_access_university_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_consent_signature" DROP CONSTRAINT "booking_consent_signature_university_id_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_consent_signature" DROP CONSTRAINT "booking_consent_signature_university_id_student_id_fkey";

-- DropForeignKey
ALTER TABLE "borrow_window_policy" DROP CONSTRAINT "borrow_window_policy_university_id_fkey";

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_education_field_group_id_fkey";

-- DropForeignKey
ALTER TABLE "student_trust_status" DROP CONSTRAINT "student_trust_status_university_id_student_id_fkey";

-- DropIndex
DROP INDEX "faculty_education_field_group_id_idx";

-- DropIndex
DROP INDEX "student_address_university_id_student_id_student_address_ty_key";

-- AlterTable
ALTER TABLE "ai_feedback_event" DROP COLUMN "ai_debug_meta",
DROP COLUMN "ai_top_document_keys";

-- AlterTable
ALTER TABLE "booking" DROP COLUMN "booking_service_mode",
ADD COLUMN     "academic_term_id" INTEGER,
ADD COLUMN     "season_id" INTEGER,
ADD COLUMN     "service_mode_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "booking_exception_request" ADD COLUMN     "exception_reason_id" INTEGER;

-- AlterTable
ALTER TABLE "booking_session" DROP COLUMN "booking_session_mode",
ADD COLUMN     "service_mode_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "consultant" ADD COLUMN     "consultantShiftTeamShift_team_id" INTEGER,
ADD COLUMN     "shift_team_id" INTEGER;

-- AlterTable
ALTER TABLE "department" ADD COLUMN     "head_account_id" INTEGER;

-- AlterTable
ALTER TABLE "faculty" DROP COLUMN "education_field_group_id",
ADD COLUMN     "subject_group_category_id" INTEGER;

-- AlterTable
ALTER TABLE "region" DROP COLUMN "region_code",
ADD COLUMN     "region_code" VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE "student_academic" ADD COLUMN     "education_level_id" INTEGER,
ADD COLUMN     "expected_graduation_year" INTEGER,
ADD COLUMN     "program_duration_years" INTEGER;

-- AlterTable
ALTER TABLE "student_address" DROP COLUMN "student_address_type",
ADD COLUMN     "address_type_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "student_profile" DROP COLUMN "student_blood_group",
DROP COLUMN "student_gender",
ADD COLUMN     "birth_order" INTEGER,
ADD COLUMN     "blood_group_id" INTEGER,
ADD COLUMN     "country_id" INTEGER,
ADD COLUMN     "gender_category_id" INTEGER,
ADD COLUMN     "income_bracket_id" INTEGER,
ADD COLUMN     "parental_status_id" INTEGER,
ADD COLUMN     "sibling_count" INTEGER;

-- AlterTable
ALTER TABLE "university" DROP COLUMN "university_type",
ADD COLUMN     "university_type_id" INTEGER;

-- DropTable
DROP TABLE "account_university_access";

-- DropTable
DROP TABLE "booking_consent_signature";

-- DropTable
DROP TABLE "booking_discipline_log";

-- DropTable
DROP TABLE "borrow_window_policy";

-- DropTable
DROP TABLE "document";

-- DropTable
DROP TABLE "education_field_group";

-- DropTable
DROP TABLE "student_trust_status";

-- DropEnum
DROP TYPE "RegionCode";

-- DropEnum
DROP TYPE "ServiceMode";

-- DropEnum
DROP TYPE "StudentAddressType";

-- DropEnum
DROP TYPE "StudentGender";

-- DropEnum
DROP TYPE "UniversityType";

-- CreateTable
CREATE TABLE "account_university_permission" (
    "account_university_permission_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "access_role" "UniversityAccessRole" NOT NULL DEFAULT 'STUDENT',
    "access_granted_by_account_id" INTEGER,
    "access_granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_revoked_at" TIMESTAMP(3),

    CONSTRAINT "account_university_permission_pkey" PRIMARY KEY ("account_university_permission_id")
);

-- CreateTable
CREATE TABLE "subject_group_category" (
    "subject_group_category_id" SERIAL NOT NULL,
    "isced_broad_field_code" VARCHAR(2) NOT NULL,
    "field_group_name_th" VARCHAR(150) NOT NULL,
    "field_group_name_en" VARCHAR(150) NOT NULL,

    CONSTRAINT "subject_group_category_pkey" PRIMARY KEY ("subject_group_category_id")
);

-- CreateTable
CREATE TABLE "consultant_shift_team" (
    "shift_team_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "team_name" VARCHAR(50) NOT NULL,
    "team_order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "consultant_shift_team_pkey" PRIMARY KEY ("shift_team_id")
);

-- CreateTable
CREATE TABLE "booking_agreement_signature" (
    "booking_agreement_signature_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "signature_method" "ConsentSignatureMethod" NOT NULL DEFAULT 'DRAW',
    "signature_payload" JSONB NOT NULL,

    CONSTRAINT "booking_agreement_signature_pkey" PRIMARY KEY ("booking_agreement_signature_id")
);

-- CreateTable
CREATE TABLE "student_behavior_status" (
    "student_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "student_trust_term_code" VARCHAR(20),
    "student_trust_late_cancel_count" INTEGER NOT NULL DEFAULT 0,
    "student_trust_no_show_count" INTEGER NOT NULL DEFAULT 0,
    "student_trust_locked_until" TIMESTAMPTZ(3),
    "student_trust_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_behavior_status_pkey" PRIMARY KEY ("university_id","student_id")
);

-- CreateTable
CREATE TABLE "exception_reason" (
    "exception_reason_id" SERIAL NOT NULL,
    "exception_reason_code" VARCHAR(30) NOT NULL,
    "exception_reason_name_th" VARCHAR(100) NOT NULL,
    "exception_reason_name_en" VARCHAR(100),
    "exception_reason_description" TEXT,
    "exception_reason_is_active" BOOLEAN NOT NULL DEFAULT true,
    "exception_reason_sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exception_reason_pkey" PRIMARY KEY ("exception_reason_id")
);

-- CreateTable
CREATE TABLE "booking_punishment_log" (
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

    CONSTRAINT "booking_punishment_log_pkey" PRIMARY KEY ("booking_discipline_log_id")
);

-- CreateTable
CREATE TABLE "consultant_borrow_policy" (
    "borrow_window_policy_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "borrow_window_days" INTEGER NOT NULL DEFAULT 14,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_borrow_policy_pkey" PRIMARY KEY ("borrow_window_policy_id")
);

-- CreateTable
CREATE TABLE "guidebook_document" (
    "document_id" SERIAL NOT NULL,
    "document_slug" VARCHAR(100) NOT NULL,
    "document_title" VARCHAR(200) NOT NULL,
    "document_content" TEXT NOT NULL,
    "document_is_active" BOOLEAN NOT NULL DEFAULT true,
    "document_order" INTEGER NOT NULL DEFAULT 0,
    "document_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guidebook_document_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "season" (
    "season_id" SERIAL NOT NULL,
    "season_code" VARCHAR(20) NOT NULL,
    "season_name_th" VARCHAR(50) NOT NULL,
    "season_name_en" VARCHAR(50),
    "month_start" INTEGER NOT NULL,
    "month_end" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "season_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "country" (
    "country_id" SERIAL NOT NULL,
    "country_code_alpha2" VARCHAR(2) NOT NULL,
    "country_code_alpha3" VARCHAR(3) NOT NULL,
    "country_name_th" VARCHAR(100) NOT NULL,
    "country_name_en" VARCHAR(100) NOT NULL,
    "nationality_type_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "country_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "academic_term_type" (
    "academic_term_type_id" SERIAL NOT NULL,
    "academic_term_type_code" VARCHAR(20) NOT NULL,
    "academic_term_type_name_th" VARCHAR(100) NOT NULL,
    "academic_term_type_name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "academic_term_type_pkey" PRIMARY KEY ("academic_term_type_id")
);

-- CreateTable
CREATE TABLE "academic_term" (
    "term_id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "academic_term_type_id" INTEGER NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "term_start_date" DATE NOT NULL,
    "term_end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "academic_term_pkey" PRIMARY KEY ("term_id")
);

-- CreateTable
CREATE TABLE "academic_period" (
    "period_id" SERIAL NOT NULL,
    "term_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "academic_period_type_id" INTEGER NOT NULL,
    "period_name_th" VARCHAR(100) NOT NULL,
    "period_name_en" VARCHAR(100),
    "period_start_date" DATE NOT NULL,
    "period_end_date" DATE NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "academic_period_pkey" PRIMARY KEY ("period_id")
);

-- CreateTable
CREATE TABLE "gender_category" (
    "gender_category_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "gender_category_pkey" PRIMARY KEY ("gender_category_id")
);

-- CreateTable
CREATE TABLE "blood_group_category" (
    "blood_group_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "blood_group_category_pkey" PRIMARY KEY ("blood_group_id")
);

-- CreateTable
CREATE TABLE "income_bracket_category" (
    "income_bracket_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "income_bracket_category_pkey" PRIMARY KEY ("income_bracket_id")
);

-- CreateTable
CREATE TABLE "parental_status_category" (
    "parental_status_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parental_status_category_pkey" PRIMARY KEY ("parental_status_id")
);

-- CreateTable
CREATE TABLE "education_level_category" (
    "education_level_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "education_level_category_pkey" PRIMARY KEY ("education_level_id")
);

-- CreateTable
CREATE TABLE "address_type_category" (
    "address_type_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "address_type_category_pkey" PRIMARY KEY ("address_type_id")
);

-- CreateTable
CREATE TABLE "nationality_type_category" (
    "nationality_type_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "nationality_type_category_pkey" PRIMARY KEY ("nationality_type_id")
);

-- CreateTable
CREATE TABLE "academic_period_type_category" (
    "academic_period_type_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "academic_period_type_category_pkey" PRIMARY KEY ("academic_period_type_id")
);

-- CreateTable
CREATE TABLE "service_mode_category" (
    "service_mode_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_mode_category_pkey" PRIMARY KEY ("service_mode_id")
);

-- CreateTable
CREATE TABLE "university_type_category" (
    "university_type_id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name_th" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "university_type_category_pkey" PRIMARY KEY ("university_type_id")
);

-- CreateTable
CREATE TABLE "chronic_condition_category" (
    "condition_category_id" SERIAL NOT NULL,
    "condition_code" VARCHAR(30) NOT NULL,
    "condition_name_th" VARCHAR(100) NOT NULL,
    "condition_name_en" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chronic_condition_category_pkey" PRIMARY KEY ("condition_category_id")
);

-- CreateTable
CREATE TABLE "student_chronic_condition" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "university_id" INTEGER NOT NULL,
    "condition_category_id" INTEGER NOT NULL,
    "condition_detail" VARCHAR(200),

    CONSTRAINT "student_chronic_condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_university_permission_university_id_idx" ON "account_university_permission"("university_id");

-- CreateIndex
CREATE INDEX "account_university_permission_access_role_idx" ON "account_university_permission"("access_role");

-- CreateIndex
CREATE INDEX "account_university_permission_access_granted_by_account_id_idx" ON "account_university_permission"("access_granted_by_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_university_permission_account_id_university_id_key" ON "account_university_permission"("account_id", "university_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_group_category_isced_broad_field_code_key" ON "subject_group_category"("isced_broad_field_code");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_shift_team_university_id_team_name_key" ON "consultant_shift_team"("university_id", "team_name");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_shift_team_university_id_team_order_key" ON "consultant_shift_team"("university_id", "team_order");

-- CreateIndex
CREATE INDEX "booking_agreement_signature_university_id_student_id_idx" ON "booking_agreement_signature"("university_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_agreement_signature_university_id_booking_id_key" ON "booking_agreement_signature"("university_id", "booking_id");

-- CreateIndex
CREATE INDEX "student_behavior_status_student_trust_locked_until_idx" ON "student_behavior_status"("student_trust_locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "exception_reason_exception_reason_code_key" ON "exception_reason"("exception_reason_code");

-- CreateIndex
CREATE INDEX "exception_reason_exception_reason_is_active_exception_reaso_idx" ON "exception_reason"("exception_reason_is_active", "exception_reason_sort_order");

-- CreateIndex
CREATE INDEX "booking_punishment_log_university_id_student_id_idx" ON "booking_punishment_log"("university_id", "student_id");

-- CreateIndex
CREATE INDEX "booking_punishment_log_booking_discipline_event_type_bookin_idx" ON "booking_punishment_log"("booking_discipline_event_type", "booking_discipline_created_at");

-- CreateIndex
CREATE INDEX "consultant_borrow_policy_university_id_is_active_idx" ON "consultant_borrow_policy"("university_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "guidebook_document_document_slug_key" ON "guidebook_document"("document_slug");

-- CreateIndex
CREATE UNIQUE INDEX "season_season_code_key" ON "season"("season_code");

-- CreateIndex
CREATE UNIQUE INDEX "country_country_code_alpha2_key" ON "country"("country_code_alpha2");

-- CreateIndex
CREATE UNIQUE INDEX "country_country_code_alpha3_key" ON "country"("country_code_alpha3");

-- CreateIndex
CREATE UNIQUE INDEX "academic_term_type_academic_term_type_code_key" ON "academic_term_type"("academic_term_type_code");

-- CreateIndex
CREATE INDEX "academic_term_university_id_is_active_idx" ON "academic_term"("university_id", "is_active");

-- CreateIndex
CREATE INDEX "academic_term_academic_term_type_id_idx" ON "academic_term"("academic_term_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_term_university_id_academic_term_type_id_academic__key" ON "academic_term"("university_id", "academic_term_type_id", "academic_year");

-- CreateIndex
CREATE INDEX "academic_period_university_id_period_start_date_period_end__idx" ON "academic_period"("university_id", "period_start_date", "period_end_date");

-- CreateIndex
CREATE INDEX "academic_period_term_id_idx" ON "academic_period"("term_id");

-- CreateIndex
CREATE UNIQUE INDEX "gender_category_code_key" ON "gender_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "blood_group_category_code_key" ON "blood_group_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "income_bracket_category_code_key" ON "income_bracket_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "parental_status_category_code_key" ON "parental_status_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "education_level_category_code_key" ON "education_level_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "address_type_category_code_key" ON "address_type_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "nationality_type_category_code_key" ON "nationality_type_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_period_type_category_code_key" ON "academic_period_type_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_mode_category_code_key" ON "service_mode_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "university_type_category_code_key" ON "university_type_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "chronic_condition_category_condition_code_key" ON "chronic_condition_category"("condition_code");

-- CreateIndex
CREATE INDEX "student_chronic_condition_condition_category_id_idx" ON "student_chronic_condition"("condition_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_chronic_condition_student_id_university_id_conditio_key" ON "student_chronic_condition"("student_id", "university_id", "condition_category_id");

-- CreateIndex
CREATE INDEX "booking_booking_status_university_id_student_id_idx" ON "booking"("booking_status", "university_id", "student_id");

-- CreateIndex
CREATE INDEX "booking_season_id_idx" ON "booking"("season_id");

-- CreateIndex
CREATE INDEX "booking_academic_term_id_idx" ON "booking"("academic_term_id");

-- CreateIndex
CREATE INDEX "booking_service_mode_id_idx" ON "booking"("service_mode_id");

-- CreateIndex
CREATE INDEX "booking_exception_request_exception_reason_id_idx" ON "booking_exception_request"("exception_reason_id");

-- CreateIndex
CREATE INDEX "department_head_account_id_idx" ON "department"("head_account_id");

-- CreateIndex
CREATE INDEX "faculty_subject_group_category_id_idx" ON "faculty"("subject_group_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "region_region_code_key" ON "region"("region_code");

-- CreateIndex
CREATE INDEX "student_academic_education_level_id_idx" ON "student_academic"("education_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_address_university_id_student_id_address_type_id_key" ON "student_address"("university_id", "student_id", "address_type_id");

-- CreateIndex
CREATE INDEX "student_profile_country_id_idx" ON "student_profile"("country_id");

-- CreateIndex
CREATE INDEX "student_profile_gender_category_id_idx" ON "student_profile"("gender_category_id");

-- CreateIndex
CREATE INDEX "student_profile_blood_group_id_idx" ON "student_profile"("blood_group_id");

-- CreateIndex
CREATE INDEX "student_profile_income_bracket_id_idx" ON "student_profile"("income_bracket_id");

-- CreateIndex
CREATE INDEX "student_profile_parental_status_id_idx" ON "student_profile"("parental_status_id");

-- CreateIndex
CREATE INDEX "university_university_type_id_idx" ON "university"("university_type_id");

-- AddForeignKey
ALTER TABLE "university" ADD CONSTRAINT "university_university_type_id_fkey" FOREIGN KEY ("university_type_id") REFERENCES "university_type_category"("university_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_permission" ADD CONSTRAINT "account_university_permission_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_permission" ADD CONSTRAINT "account_university_permission_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_university_permission" ADD CONSTRAINT "account_university_permission_access_granted_by_account_id_fkey" FOREIGN KEY ("access_granted_by_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("country_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_gender_category_id_fkey" FOREIGN KEY ("gender_category_id") REFERENCES "gender_category"("gender_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_blood_group_id_fkey" FOREIGN KEY ("blood_group_id") REFERENCES "blood_group_category"("blood_group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_income_bracket_id_fkey" FOREIGN KEY ("income_bracket_id") REFERENCES "income_bracket_category"("income_bracket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_parental_status_id_fkey" FOREIGN KEY ("parental_status_id") REFERENCES "parental_status_category"("parental_status_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_address" ADD CONSTRAINT "student_address_address_type_id_fkey" FOREIGN KEY ("address_type_id") REFERENCES "address_type_category"("address_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_level_category"("education_level_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_subject_group_category_id_fkey" FOREIGN KEY ("subject_group_category_id") REFERENCES "subject_group_category"("subject_group_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_head_account_id_fkey" FOREIGN KEY ("head_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_consultantShiftTeamShift_team_id_fkey" FOREIGN KEY ("consultantShiftTeamShift_team_id") REFERENCES "consultant_shift_team"("shift_team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_shift_team" ADD CONSTRAINT "consultant_shift_team_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_term"("term_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_service_mode_id_fkey" FOREIGN KEY ("service_mode_id") REFERENCES "service_mode_category"("service_mode_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_session" ADD CONSTRAINT "booking_session_service_mode_id_fkey" FOREIGN KEY ("service_mode_id") REFERENCES "service_mode_category"("service_mode_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_agreement_signature" ADD CONSTRAINT "booking_agreement_signature_university_id_booking_id_fkey" FOREIGN KEY ("university_id", "booking_id") REFERENCES "booking"("university_id", "booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_agreement_signature" ADD CONSTRAINT "booking_agreement_signature_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_behavior_status" ADD CONSTRAINT "student_behavior_status_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_exception_request" ADD CONSTRAINT "booking_exception_request_exception_reason_id_fkey" FOREIGN KEY ("exception_reason_id") REFERENCES "exception_reason"("exception_reason_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_borrow_policy" ADD CONSTRAINT "consultant_borrow_policy_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country" ADD CONSTRAINT "country_nationality_type_id_fkey" FOREIGN KEY ("nationality_type_id") REFERENCES "nationality_type_category"("nationality_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_term" ADD CONSTRAINT "academic_term_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_term" ADD CONSTRAINT "academic_term_academic_term_type_id_fkey" FOREIGN KEY ("academic_term_type_id") REFERENCES "academic_term_type"("academic_term_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_period" ADD CONSTRAINT "academic_period_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "academic_term"("term_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_period" ADD CONSTRAINT "academic_period_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_period" ADD CONSTRAINT "academic_period_academic_period_type_id_fkey" FOREIGN KEY ("academic_period_type_id") REFERENCES "academic_period_type_category"("academic_period_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_chronic_condition" ADD CONSTRAINT "student_chronic_condition_university_id_student_id_fkey" FOREIGN KEY ("university_id", "student_id") REFERENCES "student_profile"("university_id", "student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_chronic_condition" ADD CONSTRAINT "student_chronic_condition_condition_category_id_fkey" FOREIGN KEY ("condition_category_id") REFERENCES "chronic_condition_category"("condition_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;
