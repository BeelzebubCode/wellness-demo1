-- CreateTable
CREATE TABLE `account` (
    `account_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_username` VARCHAR(50) NOT NULL,
    `account_password` VARCHAR(255) NOT NULL,
    `account_role` ENUM('STUDENT', 'CONSULTANT', 'HEAD_CONSULTANT') NOT NULL,
    `account_line_id` VARCHAR(100) NULL,
    `account_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `account_last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `account_account_username_key`(`account_username`),
    UNIQUE INDEX `account_account_line_id_key`(`account_line_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
    `student_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `student_status_id` INTEGER NOT NULL,
    `student_code` VARCHAR(20) NULL,

    UNIQUE INDEX `student_account_id_key`(`account_id`),
    UNIQUE INDEX `student_student_code_key`(`student_code`),
    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_status` (
    `student_status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_status_code` VARCHAR(20) NOT NULL,
    `student_status_detail` TEXT NULL,

    UNIQUE INDEX `student_status_student_status_code_key`(`student_status_code`),
    PRIMARY KEY (`student_status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_profile` (
    `student_id` INTEGER NOT NULL,
    `student_prefix` VARCHAR(10) NULL,
    `student_first_name` VARCHAR(100) NOT NULL,
    `student_last_name` VARCHAR(100) NOT NULL,
    `student_nickname` VARCHAR(20) NULL,
    `student_gender` ENUM('MALE', 'FEMALE', 'LGBTQ_PLUS', 'PREFER_NOT_TO_SAY') NULL,
    `student_birthday` DATE NULL,
    `student_nationality` VARCHAR(50) NULL,
    `student_religion` VARCHAR(50) NULL,
    `student_blood_group` VARCHAR(10) NULL,
    `student_phone_number` VARCHAR(20) NULL,
    `student_email` VARCHAR(100) NULL,

    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_address` (
    `student_address_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `province_id` INTEGER NOT NULL,
    `student_address_type` ENUM('PERMANENT', 'CURRENT', 'DORMITORY') NOT NULL,
    `student_address_detail` VARCHAR(200) NULL,
    `student_address_sub_district` VARCHAR(100) NULL,
    `student_address_district` VARCHAR(100) NULL,
    `student_address_postal_code` VARCHAR(10) NOT NULL,

    UNIQUE INDEX `student_address_index_0`(`student_id`, `student_address_type`),
    PRIMARY KEY (`student_address_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `province` (
    `province_id` INTEGER NOT NULL AUTO_INCREMENT,
    `province_code` VARCHAR(10) NOT NULL,
    `province_name_th` VARCHAR(100) NOT NULL,
    `province_name_en` VARCHAR(100) NULL,

    UNIQUE INDEX `province_province_code_key`(`province_code`),
    PRIMARY KEY (`province_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_academic` (
    `student_id` INTEGER NOT NULL,
    `faculty_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `advisor_id` INTEGER NULL,
    `student_program` VARCHAR(50) NULL,
    `student_degree` VARCHAR(50) NULL,
    `student_degree_name` VARCHAR(100) NULL,
    `student_admit_academic_year` INTEGER NULL,

    PRIMARY KEY (`student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faculty` (
    `faculty_id` INTEGER NOT NULL AUTO_INCREMENT,
    `faculty_code` VARCHAR(10) NOT NULL,
    `faculty_name_th` VARCHAR(100) NOT NULL,
    `faculty_name_en` VARCHAR(100) NULL,

    UNIQUE INDEX `faculty_faculty_code_key`(`faculty_code`),
    PRIMARY KEY (`faculty_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department` (
    `department_id` INTEGER NOT NULL AUTO_INCREMENT,
    `faculty_id` INTEGER NOT NULL,
    `department_code` VARCHAR(10) NOT NULL,
    `department_name_th` VARCHAR(100) NOT NULL,
    `department_name_en` VARCHAR(100) NULL,

    UNIQUE INDEX `department_department_code_key`(`department_code`),
    PRIMARY KEY (`department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advisor` (
    `advisor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `faculty_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `advisor_academic_rank` VARCHAR(50) NULL,
    `advisor_prefix` VARCHAR(50) NULL,
    `advisor_first_name` VARCHAR(100) NOT NULL,
    `advisor_last_name` VARCHAR(100) NOT NULL,
    `advisor_email` VARCHAR(100) NULL,
    `advisor_phone_number` VARCHAR(50) NULL,
    `advisor_office_location` VARCHAR(100) NULL,

    PRIMARY KEY (`advisor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultant` (
    `consultant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `consultant_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `consultant_account_id_key`(`account_id`),
    PRIMARY KEY (`consultant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultant_profile` (
    `consultant_id` INTEGER NOT NULL,
    `consultant_prefix` VARCHAR(50) NULL,
    `consultant_first_name` VARCHAR(100) NOT NULL,
    `consultant_last_name` VARCHAR(100) NOT NULL,
    `consultant_nickname` VARCHAR(50) NULL,
    `consultant_gender` VARCHAR(20) NULL,
    `consultant_nationality` VARCHAR(50) NULL,
    `consultant_phone_number` VARCHAR(20) NULL,
    `consultant_email` VARCHAR(100) NULL,

    PRIMARY KEY (`consultant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultant_language` (
    `consultant_language_id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultant_id` INTEGER NOT NULL,
    `consultant_language_code` VARCHAR(10) NOT NULL,
    `consultant_language_fluency_level` VARCHAR(20) NULL,

    UNIQUE INDEX `consultant_language_index_1`(`consultant_id`, `consultant_language_code`),
    PRIMARY KEY (`consultant_language_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultant_specialization` (
    `consultant_specialization_id` INTEGER NOT NULL AUTO_INCREMENT,
    `consultant_id` INTEGER NOT NULL,
    `consultant_specialization_topic` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `consultant_specialization_index_2`(`consultant_id`, `consultant_specialization_topic`),
    PRIMARY KEY (`consultant_specialization_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `organization_id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_name` VARCHAR(100) NOT NULL,
    `organization_type` VARCHAR(50) NULL,

    UNIQUE INDEX `organization_organization_name_key`(`organization_name`),
    PRIMARY KEY (`organization_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_slot` (
    `time_slot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `time_slot_start_datetime` DATETIME(3) NOT NULL,
    `time_slot_end_datetime` DATETIME(3) NOT NULL,
    `time_slot_max_capacity` INTEGER NOT NULL DEFAULT 1,
    `time_slot_status` ENUM('AVAILABLE', 'BOOKED', 'LOCKED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',

    INDEX `time_slot_index_3`(`time_slot_start_datetime`, `time_slot_end_datetime`),
    PRIMARY KEY (`time_slot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking` (
    `booking_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `consultant_id` INTEGER NULL,
    `problem_category_id` INTEGER NOT NULL,
    `booking_detail_text` TEXT NULL,
    `booking_status` ENUM('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    `booking_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `booking_updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_index_4`(`booking_status`),
    INDEX `booking_index_5`(`student_id`),
    INDEX `booking_index_6`(`consultant_id`),
    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_category` (
    `problem_category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `problem_category_code` VARCHAR(20) NOT NULL,
    `problem_category_name_th` VARCHAR(100) NOT NULL,
    `problem_category_name_en` VARCHAR(100) NULL,
    `problem_category_description` TEXT NULL,

    UNIQUE INDEX `problem_category_problem_category_code_key`(`problem_category_code`),
    PRIMARY KEY (`problem_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_slot` (
    `booking_id` INTEGER NOT NULL,
    `time_slot_id` INTEGER NOT NULL,

    PRIMARY KEY (`booking_id`, `time_slot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_assignment` (
    `booking_assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `booking_assignment_assigned_by_id` INTEGER NOT NULL,
    `booking_assignment_assigned_to_id` INTEGER NOT NULL,
    `booking_assignment_note` TEXT NULL,
    `booking_assignment_assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_assignment_index_7`(`booking_id`),
    PRIMARY KEY (`booking_assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_outcome` (
    `booking_id` INTEGER NOT NULL,
    `booking_outcome_consultant_note` TEXT NOT NULL,
    `booking_outcome_next_step` TEXT NULL,
    `booking_outcome_risk_level` INTEGER NULL,
    `booking_outcome_recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_cancellation` (
    `booking_id` INTEGER NOT NULL,
    `booking_cancellation_cancelled_by_id` INTEGER NOT NULL,
    `booking_cancellation_reason` TEXT NOT NULL,
    `booking_cancellation_cancelled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`booking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `feedback_id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `student_id` INTEGER NOT NULL,
    `consultant_id` INTEGER NOT NULL,
    `feedback_is_anonymous` BOOLEAN NOT NULL DEFAULT true,
    `feedback_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `feedback_booking_id_key`(`booking_id`),
    PRIMARY KEY (`feedback_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluation_criterion` (
    `evaluation_criterion_id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluation_criterion_topic_th` VARCHAR(100) NOT NULL,
    `evaluation_criterion_topic_en` VARCHAR(100) NULL,
    `evaluation_criterion_weight` DECIMAL(3, 2) NOT NULL DEFAULT 1,
    `evaluation_criterion_display_order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`evaluation_criterion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_rating` (
    `feedback_rating_id` INTEGER NOT NULL AUTO_INCREMENT,
    `feedback_id` INTEGER NOT NULL,
    `evaluation_criterion_id` INTEGER NOT NULL,
    `feedback_rating_score` INTEGER NOT NULL,

    UNIQUE INDEX `feedback_rating_index_8`(`feedback_id`, `evaluation_criterion_id`),
    PRIMARY KEY (`feedback_rating_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_comment` (
    `feedback_id` INTEGER NOT NULL,
    `feedback_comment_text` TEXT NULL,
    `feedback_comment_admin_reply` TEXT NULL,
    `feedback_comment_replied_by_id` INTEGER NULL,
    `feedback_comment_replied_at` DATETIME(3) NULL,

    PRIMARY KEY (`feedback_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_template` (
    `notification_template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `notification_template_code` VARCHAR(50) NOT NULL,
    `notification_template_title` VARCHAR(200) NULL,
    `notification_template_body` TEXT NULL,
    `notification_template_format` VARCHAR(20) NOT NULL DEFAULT 'TEXT',

    UNIQUE INDEX `notification_template_notification_template_code_key`(`notification_template_code`),
    PRIMARY KEY (`notification_template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `notification_template_id` INTEGER NOT NULL,
    `booking_id` INTEGER NULL,
    `notification_channel` VARCHAR(20) NOT NULL DEFAULT 'LINE',
    `notification_data` JSON NULL,
    `notification_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `notification_sent_at` DATETIME(3) NULL,
    `notification_error_message` TEXT NULL,
    `notification_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_index_9`(`account_id`),
    INDEX `notification_index_10`(`notification_status`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account`(`account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_student_status_id_fkey` FOREIGN KEY (`student_status_id`) REFERENCES `student_status`(`student_status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profile` ADD CONSTRAINT `student_profile_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_address` ADD CONSTRAINT `student_address_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_address` ADD CONSTRAINT `student_address_province_id_fkey` FOREIGN KEY (`province_id`) REFERENCES `province`(`province_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic` ADD CONSTRAINT `student_academic_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic` ADD CONSTRAINT `student_academic_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`faculty_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic` ADD CONSTRAINT `student_academic_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic` ADD CONSTRAINT `student_academic_advisor_id_fkey` FOREIGN KEY (`advisor_id`) REFERENCES `advisor`(`advisor_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`faculty_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advisor` ADD CONSTRAINT `advisor_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculty`(`faculty_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advisor` ADD CONSTRAINT `advisor_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant` ADD CONSTRAINT `consultant_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account`(`account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant` ADD CONSTRAINT `consultant_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`organization_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_profile` ADD CONSTRAINT `consultant_profile_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_language` ADD CONSTRAINT `consultant_language_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultant_specialization` ADD CONSTRAINT `consultant_specialization_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking` ADD CONSTRAINT `booking_problem_category_id_fkey` FOREIGN KEY (`problem_category_id`) REFERENCES `problem_category`(`problem_category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_slot` ADD CONSTRAINT `booking_slot_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_slot` ADD CONSTRAINT `booking_slot_time_slot_id_fkey` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slot`(`time_slot_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_assignment` ADD CONSTRAINT `booking_assignment_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_assignment` ADD CONSTRAINT `booking_assignment_booking_assignment_assigned_by_id_fkey` FOREIGN KEY (`booking_assignment_assigned_by_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_assignment` ADD CONSTRAINT `booking_assignment_booking_assignment_assigned_to_id_fkey` FOREIGN KEY (`booking_assignment_assigned_to_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_outcome` ADD CONSTRAINT `booking_outcome_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_cancellation` ADD CONSTRAINT `booking_cancellation_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_cancellation` ADD CONSTRAINT `booking_cancellation_booking_cancellation_cancelled_by_id_fkey` FOREIGN KEY (`booking_cancellation_cancelled_by_id`) REFERENCES `account`(`account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_consultant_id_fkey` FOREIGN KEY (`consultant_id`) REFERENCES `consultant`(`consultant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_rating` ADD CONSTRAINT `feedback_rating_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`feedback_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_rating` ADD CONSTRAINT `feedback_rating_evaluation_criterion_id_fkey` FOREIGN KEY (`evaluation_criterion_id`) REFERENCES `evaluation_criterion`(`evaluation_criterion_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_comment` ADD CONSTRAINT `feedback_comment_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`feedback_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_comment` ADD CONSTRAINT `feedback_comment_feedback_comment_replied_by_id_fkey` FOREIGN KEY (`feedback_comment_replied_by_id`) REFERENCES `account`(`account_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account`(`account_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_notification_template_id_fkey` FOREIGN KEY (`notification_template_id`) REFERENCES `notification_template`(`notification_template_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `booking`(`booking_id`) ON DELETE SET NULL ON UPDATE CASCADE;
