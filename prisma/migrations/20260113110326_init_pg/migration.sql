-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('STUDENT', 'CONSULTANT', 'HEAD_CONSULTANT');

-- CreateEnum
CREATE TYPE "StudentGender" AS ENUM ('MALE', 'FEMALE', 'LGBTQ_PLUS', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "StudentAddressType" AS ENUM ('PERMANENT', 'CURRENT', 'DORMITORY');

-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "account" (
    "account_id" SERIAL NOT NULL,
    "account_username" VARCHAR(50) NOT NULL,
    "account_password" VARCHAR(255) NOT NULL,
    "account_role" "AccountRole" NOT NULL,
    "account_line_id" VARCHAR(100),
    "account_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_last_login_at" TIMESTAMP(3),

    CONSTRAINT "account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "student" (
    "student_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "student_status_id" INTEGER NOT NULL,
    "student_code" VARCHAR(20),

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_status" (
    "student_status_id" SERIAL NOT NULL,
    "student_status_code" VARCHAR(20) NOT NULL,
    "student_status_detail" TEXT,

    CONSTRAINT "student_status_pkey" PRIMARY KEY ("student_status_id")
);

-- CreateTable
CREATE TABLE "student_profile" (
    "student_id" INTEGER NOT NULL,
    "student_prefix" VARCHAR(10),
    "student_first_name" VARCHAR(100) NOT NULL,
    "student_last_name" VARCHAR(100) NOT NULL,
    "student_nickname" VARCHAR(20),
    "student_gender" "StudentGender",
    "student_birthday" DATE,
    "student_nationality" VARCHAR(50),
    "student_religion" VARCHAR(50),
    "student_blood_group" VARCHAR(10),
    "student_phone_number" VARCHAR(20),
    "student_email" VARCHAR(100),

    CONSTRAINT "student_profile_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_address" (
    "student_address_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "province_id" INTEGER NOT NULL,
    "student_address_type" "StudentAddressType" NOT NULL,
    "student_address_detail" VARCHAR(200),
    "student_address_sub_district" VARCHAR(100),
    "student_address_district" VARCHAR(100),
    "student_address_postal_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "student_address_pkey" PRIMARY KEY ("student_address_id")
);

-- CreateTable
CREATE TABLE "province" (
    "province_id" SERIAL NOT NULL,
    "province_code" VARCHAR(10) NOT NULL,
    "province_name_th" VARCHAR(100) NOT NULL,
    "province_name_en" VARCHAR(100),

    CONSTRAINT "province_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "student_academic" (
    "student_id" INTEGER NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "advisor_id" INTEGER,
    "student_program" VARCHAR(50),
    "student_degree" VARCHAR(50),
    "student_degree_name" VARCHAR(100),
    "student_admit_academic_year" INTEGER,

    CONSTRAINT "student_academic_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "faculty" (
    "faculty_id" SERIAL NOT NULL,
    "faculty_code" VARCHAR(10) NOT NULL,
    "faculty_name_th" VARCHAR(100) NOT NULL,
    "faculty_name_en" VARCHAR(100),

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("faculty_id")
);

-- CreateTable
CREATE TABLE "department" (
    "department_id" SERIAL NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "department_code" VARCHAR(10) NOT NULL,
    "department_name_th" VARCHAR(100) NOT NULL,
    "department_name_en" VARCHAR(100),

    CONSTRAINT "department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "advisor" (
    "advisor_id" SERIAL NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "advisor_academic_rank" VARCHAR(50),
    "advisor_prefix" VARCHAR(50),
    "advisor_first_name" VARCHAR(100) NOT NULL,
    "advisor_last_name" VARCHAR(100) NOT NULL,
    "advisor_email" VARCHAR(100),
    "advisor_phone_number" VARCHAR(50),
    "advisor_office_location" VARCHAR(100),

    CONSTRAINT "advisor_pkey" PRIMARY KEY ("advisor_id")
);

-- CreateTable
CREATE TABLE "consultant" (
    "consultant_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "consultant_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_pkey" PRIMARY KEY ("consultant_id")
);

-- CreateTable
CREATE TABLE "consultant_profile" (
    "consultant_id" INTEGER NOT NULL,
    "consultant_prefix" VARCHAR(50),
    "consultant_first_name" VARCHAR(100) NOT NULL,
    "consultant_last_name" VARCHAR(100) NOT NULL,
    "consultant_nickname" VARCHAR(50),
    "consultant_gender" VARCHAR(20),
    "consultant_nationality" VARCHAR(50),
    "consultant_phone_number" VARCHAR(20),
    "consultant_email" VARCHAR(100),

    CONSTRAINT "consultant_profile_pkey" PRIMARY KEY ("consultant_id")
);

-- CreateTable
CREATE TABLE "consultant_language" (
    "consultant_language_id" SERIAL NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "consultant_language_code" VARCHAR(10) NOT NULL,
    "consultant_language_fluency_level" VARCHAR(20),

    CONSTRAINT "consultant_language_pkey" PRIMARY KEY ("consultant_language_id")
);

-- CreateTable
CREATE TABLE "consultant_specialization" (
    "consultant_specialization_id" SERIAL NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "consultant_specialization_topic" VARCHAR(100) NOT NULL,

    CONSTRAINT "consultant_specialization_pkey" PRIMARY KEY ("consultant_specialization_id")
);

-- CreateTable
CREATE TABLE "organization" (
    "organization_id" SERIAL NOT NULL,
    "organization_name" VARCHAR(100) NOT NULL,
    "organization_type" VARCHAR(50),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "time_slot" (
    "time_slot_id" SERIAL NOT NULL,
    "time_slot_start_datetime" TIMESTAMP(3) NOT NULL,
    "time_slot_end_datetime" TIMESTAMP(3) NOT NULL,
    "time_slot_max_capacity" INTEGER NOT NULL DEFAULT 1,
    "time_slot_status" "TimeSlotStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "time_slot_pkey" PRIMARY KEY ("time_slot_id")
);

-- CreateTable
CREATE TABLE "booking" (
    "booking_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "consultant_id" INTEGER,
    "time_slot_id" INTEGER NOT NULL,
    "problem_category_id" INTEGER NOT NULL,
    "booking_detail_text" TEXT,
    "booking_status" "BookingStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "booking_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booking_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "problem_category" (
    "problem_category_id" SERIAL NOT NULL,
    "problem_category_code" VARCHAR(20) NOT NULL,
    "problem_category_name_th" VARCHAR(100) NOT NULL,
    "problem_category_name_en" VARCHAR(100),
    "problem_category_description" TEXT,

    CONSTRAINT "problem_category_pkey" PRIMARY KEY ("problem_category_id")
);

-- CreateTable
CREATE TABLE "booking_assignment" (
    "booking_assignment_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "booking_assignment_assigned_by_id" INTEGER NOT NULL,
    "booking_assignment_assigned_to_id" INTEGER NOT NULL,
    "booking_assignment_note" TEXT,
    "booking_assignment_assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_assignment_pkey" PRIMARY KEY ("booking_assignment_id")
);

-- CreateTable
CREATE TABLE "booking_outcome" (
    "booking_id" INTEGER NOT NULL,
    "booking_outcome_consultant_note" TEXT NOT NULL,
    "booking_outcome_next_step" TEXT,
    "booking_outcome_risk_level" INTEGER,
    "booking_outcome_recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_outcome_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "booking_cancellation" (
    "booking_id" INTEGER NOT NULL,
    "booking_cancellation_cancelled_by_id" INTEGER NOT NULL,
    "booking_cancellation_reason" TEXT NOT NULL,
    "booking_cancellation_cancelled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_cancellation_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "feedback_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "consultant_id" INTEGER NOT NULL,
    "feedback_is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "feedback_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "evaluation_criterion" (
    "evaluation_criterion_id" SERIAL NOT NULL,
    "evaluation_criterion_topic_th" VARCHAR(100) NOT NULL,
    "evaluation_criterion_topic_en" VARCHAR(100),
    "evaluation_criterion_weight" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    "evaluation_criterion_display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "evaluation_criterion_pkey" PRIMARY KEY ("evaluation_criterion_id")
);

-- CreateTable
CREATE TABLE "feedback_rating" (
    "feedback_rating_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "evaluation_criterion_id" INTEGER NOT NULL,
    "feedback_rating_score" INTEGER NOT NULL,

    CONSTRAINT "feedback_rating_pkey" PRIMARY KEY ("feedback_rating_id")
);

-- CreateTable
CREATE TABLE "feedback_comment" (
    "feedback_id" INTEGER NOT NULL,
    "feedback_comment_text" TEXT,
    "feedback_comment_admin_reply" TEXT,
    "feedback_comment_replied_by_id" INTEGER,
    "feedback_comment_replied_at" TIMESTAMP(3),

    CONSTRAINT "feedback_comment_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "notification_template_id" SERIAL NOT NULL,
    "notification_template_code" VARCHAR(50) NOT NULL,
    "notification_template_title" VARCHAR(200),
    "notification_template_body" TEXT,
    "notification_template_format" VARCHAR(20) NOT NULL DEFAULT 'TEXT',

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("notification_template_id")
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "notification_template_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "notification_channel" VARCHAR(20) NOT NULL DEFAULT 'LINE',
    "notification_data" JSONB,
    "notification_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "notification_sent_at" TIMESTAMP(3),
    "notification_error_message" TEXT,
    "notification_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_account_username_key" ON "account"("account_username");

-- CreateIndex
CREATE UNIQUE INDEX "account_account_line_id_key" ON "account"("account_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_account_id_key" ON "student"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_student_code_key" ON "student"("student_code");

-- CreateIndex
CREATE INDEX "student_student_status_id_idx" ON "student"("student_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_status_student_status_code_key" ON "student_status"("student_status_code");

-- CreateIndex
CREATE INDEX "student_address_province_id_idx" ON "student_address"("province_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_address_student_id_student_address_type_key" ON "student_address"("student_id", "student_address_type");

-- CreateIndex
CREATE UNIQUE INDEX "province_province_code_key" ON "province"("province_code");

-- CreateIndex
CREATE INDEX "student_academic_advisor_id_idx" ON "student_academic"("advisor_id");

-- CreateIndex
CREATE INDEX "student_academic_department_id_idx" ON "student_academic"("department_id");

-- CreateIndex
CREATE INDEX "student_academic_faculty_id_idx" ON "student_academic"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_faculty_code_key" ON "faculty"("faculty_code");

-- CreateIndex
CREATE UNIQUE INDEX "department_department_code_key" ON "department"("department_code");

-- CreateIndex
CREATE INDEX "department_faculty_id_idx" ON "department"("faculty_id");

-- CreateIndex
CREATE INDEX "advisor_department_id_idx" ON "advisor"("department_id");

-- CreateIndex
CREATE INDEX "advisor_faculty_id_idx" ON "advisor"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_account_id_key" ON "consultant"("account_id");

-- CreateIndex
CREATE INDEX "consultant_organization_id_idx" ON "consultant"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_language_consultant_id_consultant_language_code_key" ON "consultant_language"("consultant_id", "consultant_language_code");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_specialization_consultant_id_consultant_speciali_key" ON "consultant_specialization"("consultant_id", "consultant_specialization_topic");

-- CreateIndex
CREATE UNIQUE INDEX "organization_organization_name_key" ON "organization"("organization_name");

-- CreateIndex
CREATE INDEX "time_slot_time_slot_start_datetime_time_slot_end_datetime_idx" ON "time_slot"("time_slot_start_datetime", "time_slot_end_datetime");

-- CreateIndex
CREATE INDEX "booking_time_slot_id_idx" ON "booking"("time_slot_id");

-- CreateIndex
CREATE INDEX "booking_booking_status_idx" ON "booking"("booking_status");

-- CreateIndex
CREATE INDEX "booking_student_id_idx" ON "booking"("student_id");

-- CreateIndex
CREATE INDEX "booking_consultant_id_idx" ON "booking"("consultant_id");

-- CreateIndex
CREATE INDEX "booking_problem_category_id_idx" ON "booking"("problem_category_id");

-- CreateIndex
CREATE INDEX "booking_student_id_booking_status_idx" ON "booking"("student_id", "booking_status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_student_id_time_slot_id_key" ON "booking"("student_id", "time_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "problem_category_problem_category_code_key" ON "problem_category"("problem_category_code");

-- CreateIndex
CREATE INDEX "booking_assignment_booking_id_idx" ON "booking_assignment"("booking_id");

-- CreateIndex
CREATE INDEX "booking_assignment_booking_assignment_assigned_by_id_idx" ON "booking_assignment"("booking_assignment_assigned_by_id");

-- CreateIndex
CREATE INDEX "booking_assignment_booking_assignment_assigned_to_id_idx" ON "booking_assignment"("booking_assignment_assigned_to_id");

-- CreateIndex
CREATE INDEX "booking_cancellation_booking_cancellation_cancelled_by_id_idx" ON "booking_cancellation"("booking_cancellation_cancelled_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_booking_id_key" ON "feedback"("booking_id");

-- CreateIndex
CREATE INDEX "feedback_consultant_id_idx" ON "feedback"("consultant_id");

-- CreateIndex
CREATE INDEX "feedback_student_id_idx" ON "feedback"("student_id");

-- CreateIndex
CREATE INDEX "feedback_rating_evaluation_criterion_id_idx" ON "feedback_rating"("evaluation_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_rating_feedback_id_evaluation_criterion_id_key" ON "feedback_rating"("feedback_id", "evaluation_criterion_id");

-- CreateIndex
CREATE INDEX "feedback_comment_feedback_comment_replied_by_id_idx" ON "feedback_comment"("feedback_comment_replied_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_notification_template_code_key" ON "notification_template"("notification_template_code");

-- CreateIndex
CREATE INDEX "notification_account_id_idx" ON "notification"("account_id");

-- CreateIndex
CREATE INDEX "notification_notification_status_idx" ON "notification"("notification_status");

-- CreateIndex
CREATE INDEX "notification_booking_id_idx" ON "notification"("booking_id");

-- CreateIndex
CREATE INDEX "notification_notification_template_id_idx" ON "notification"("notification_template_id");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_student_status_id_fkey" FOREIGN KEY ("student_status_id") REFERENCES "student_status"("student_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_address" ADD CONSTRAINT "student_address_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "province"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_address" ADD CONSTRAINT "student_address_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "advisor"("advisor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic" ADD CONSTRAINT "student_academic_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("faculty_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_profile" ADD CONSTRAINT "consultant_profile_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_language" ADD CONSTRAINT "consultant_language_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_specialization" ADD CONSTRAINT "consultant_specialization_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slot"("time_slot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_problem_category_id_fkey" FOREIGN KEY ("problem_category_id") REFERENCES "problem_category"("problem_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_booking_assignment_assigned_by_id_fkey" FOREIGN KEY ("booking_assignment_assigned_by_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_booking_assignment_assigned_to_id_fkey" FOREIGN KEY ("booking_assignment_assigned_to_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_assignment" ADD CONSTRAINT "booking_assignment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_outcome" ADD CONSTRAINT "booking_outcome_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_cancellation" ADD CONSTRAINT "booking_cancellation_booking_cancellation_cancelled_by_id_fkey" FOREIGN KEY ("booking_cancellation_cancelled_by_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_cancellation" ADD CONSTRAINT "booking_cancellation_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_rating" ADD CONSTRAINT "feedback_rating_evaluation_criterion_id_fkey" FOREIGN KEY ("evaluation_criterion_id") REFERENCES "evaluation_criterion"("evaluation_criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_rating" ADD CONSTRAINT "feedback_rating_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("feedback_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comment" ADD CONSTRAINT "feedback_comment_feedback_comment_replied_by_id_fkey" FOREIGN KEY ("feedback_comment_replied_by_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comment" ADD CONSTRAINT "feedback_comment_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("feedback_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_notification_template_id_fkey" FOREIGN KEY ("notification_template_id") REFERENCES "notification_template"("notification_template_id") ON DELETE RESTRICT ON UPDATE CASCADE;
