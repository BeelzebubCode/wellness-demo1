-- Migration: Extract 5 enums to reference tables
-- Strategy: Create reference tables, convert enum columns to VARCHAR with FK on code
-- Data is preserved: existing enum values become the initial seed data
-- Note: UniversityAccessRole removed (redundant with AccountRole, shares same table)

-- ================================================================
-- STEP 1: Create 5 new reference tables
-- ================================================================

-- 1. account_role_category
CREATE TABLE IF NOT EXISTS account_role_category (
    account_role_id SERIAL PRIMARY KEY,
    code            VARCHAR(30) UNIQUE NOT NULL,
    name_th         VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    description     TEXT,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true
);

-- 2. point_txn_type_category
CREATE TABLE IF NOT EXISTS point_txn_type_category (
    point_txn_type_id SERIAL PRIMARY KEY,
    code              VARCHAR(30) UNIQUE NOT NULL,
    name_th           VARCHAR(100) NOT NULL,
    name_en           VARCHAR(100),
    sort_order        INT DEFAULT 0,
    is_active         BOOLEAN DEFAULT true
);

-- 3. discipline_event_type_category
CREATE TABLE IF NOT EXISTS discipline_event_type_category (
    discipline_event_type_id SERIAL PRIMARY KEY,
    code                     VARCHAR(30) UNIQUE NOT NULL,
    name_th                  VARCHAR(100) NOT NULL,
    name_en                  VARCHAR(100),
    description              TEXT,
    sort_order               INT DEFAULT 0,
    is_active                BOOLEAN DEFAULT true
);

-- 4. ai_feedback_type_category
CREATE TABLE IF NOT EXISTS ai_feedback_type_category (
    ai_feedback_type_id SERIAL PRIMARY KEY,
    code                VARCHAR(30) UNIQUE NOT NULL,
    name_th             VARCHAR(100) NOT NULL,
    name_en             VARCHAR(100),
    sort_order          INT DEFAULT 0,
    is_active           BOOLEAN DEFAULT true
);

-- 5. kb_content_type_category
CREATE TABLE IF NOT EXISTS kb_content_type_category (
    kb_content_type_id SERIAL PRIMARY KEY,
    code               VARCHAR(30) UNIQUE NOT NULL,
    name_th            VARCHAR(100) NOT NULL,
    name_en            VARCHAR(100),
    sort_order         INT DEFAULT 0,
    is_active          BOOLEAN DEFAULT true
);

-- ================================================================
-- STEP 2: Seed initial data from existing enum values
-- ================================================================

INSERT INTO account_role_category (code, name_th, name_en, sort_order) VALUES
    ('STUDENT',          'นิสิต/นักศึกษา',           'Student',              1),
    ('CONSULTANT',       'ผู้ให้คำปรึกษา',           'Consultant',           2),
    ('HEAD_CONSULTANT',  'หัวหน้าผู้ให้คำปรึกษา',     'Head Consultant',      3),
    ('ADVISOR',          'อาจารย์ที่ปรึกษา',          'Advisor',              4),
    ('DEAN',             'คณบดี',                    'Dean',                 5),
    ('HEAD_DEPARTMENT',  'หัวหน้าภาควิชา',            'Head of Department',   6),
    ('RECTOR',           'อธิการบดี',                 'Rector',               7),
    ('SUPER_ADMIN',      'ผู้ดูแลระบบ',               'Super Admin',          8),
    ('MINISTRY',         'กระทรวง',                   'Ministry',             9),
    ('ADMIN',            'แอดมิน',                   'Admin',               10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO point_txn_type_category (code, name_th, name_en, sort_order) VALUES
    ('EARN',    'ได้รับ',     'Earn',    1),
    ('REDEEM',  'แลก',       'Redeem',  2),
    ('ADJUST',  'ปรับแต่ง',   'Adjust',  3),
    ('EXPIRE',  'หมดอายุ',    'Expire',  4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO discipline_event_type_category (code, name_th, name_en, sort_order) VALUES
    ('LATE_CANCEL_PENALTY',          'ยกเลิกนัดสาย',                     'Late Cancel Penalty',              1),
    ('NO_SHOW_PENALTY',              'ไม่มาตามนัด',                      'No Show Penalty',                  2),
    ('EXCEPTION_APPROVED_ROLLBACK',  'อนุมัติข้อยกเว้น (ย้อนกลับ)',         'Exception Approved Rollback',      3),
    ('MANUAL_UNLOCK',                'ปลดล็อคด้วยตนเอง',                  'Manual Unlock',                    4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO ai_feedback_type_category (code, name_th, name_en, sort_order) VALUES
    ('CANT_ANSWER',     'ตอบไม่ได้',                     'Cannot Answer',      1),
    ('LOW_CONFIDENCE',  'ไม่มั่นใจ',                      'Low Confidence',     2),
    ('POLICY_BLOCK',    'ถูกบล็อกโดยนโยบาย',              'Policy Block',       3),
    ('PROVIDER_ERROR',  'ผู้ให้บริการขัดข้อง',              'Provider Error',     4),
    ('USER_NEGATIVE',   'ผู้ใช้ให้คะแนนติดลบ',             'User Negative',      5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO kb_content_type_category (code, name_th, name_en, sort_order) VALUES
    ('MARKDOWN', 'มาร์กดาวน์', 'Markdown', 1),
    ('JSON',     'JSON',       'JSON',     2)
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- STEP 3: Convert enum columns to VARCHAR (preserving data)
-- ================================================================

-- 3a. account.account_role: enum -> varchar
ALTER TABLE account
    ALTER COLUMN account_role TYPE VARCHAR(30) USING account_role::text;

-- 3b. account_university_permission.access_role: enum -> varchar (reuses account_role_category)
ALTER TABLE account_university_permission
    ALTER COLUMN access_role TYPE VARCHAR(30) USING access_role::text;

-- 3c. student_point_transaction.student_point_txn_type: enum -> varchar
ALTER TABLE student_point_transaction
    ALTER COLUMN student_point_txn_type TYPE VARCHAR(30) USING student_point_txn_type::text;

-- 3d. booking_punishment_log.booking_discipline_event_type: enum -> varchar
ALTER TABLE booking_punishment_log
    ALTER COLUMN booking_discipline_event_type TYPE VARCHAR(30) USING booking_discipline_event_type::text;

-- 3e. ai_feedback_event.ai_feedback_type: enum -> varchar
ALTER TABLE ai_feedback_event
    ALTER COLUMN ai_feedback_type TYPE VARCHAR(30) USING ai_feedback_type::text;

-- 3f. ai_kb_document_version.ai_kb_content_type: enum -> varchar
ALTER TABLE ai_kb_document_version
    ALTER COLUMN ai_kb_content_type TYPE VARCHAR(30) USING ai_kb_content_type::text;

-- ================================================================
-- STEP 4: Add FK constraints (column -> reference table code)
-- ================================================================

ALTER TABLE account
    ADD CONSTRAINT fk_account_role_category
    FOREIGN KEY (account_role) REFERENCES account_role_category(code);

ALTER TABLE account_university_permission
    ADD CONSTRAINT fk_access_role_category
    FOREIGN KEY (access_role) REFERENCES account_role_category(code);

ALTER TABLE student_point_transaction
    ADD CONSTRAINT fk_point_txn_type_category
    FOREIGN KEY (student_point_txn_type) REFERENCES point_txn_type_category(code);

ALTER TABLE booking_punishment_log
    ADD CONSTRAINT fk_discipline_event_type_category
    FOREIGN KEY (booking_discipline_event_type) REFERENCES discipline_event_type_category(code);

ALTER TABLE ai_feedback_event
    ADD CONSTRAINT fk_ai_feedback_type_category
    FOREIGN KEY (ai_feedback_type) REFERENCES ai_feedback_type_category(code);

ALTER TABLE ai_kb_document_version
    ADD CONSTRAINT fk_kb_content_type_category
    FOREIGN KEY (ai_kb_content_type) REFERENCES kb_content_type_category(code);

-- ================================================================
-- STEP 5: Drop old enum types (they are no longer used)
-- ================================================================

DROP TYPE IF EXISTS "AccountRole" CASCADE;
DROP TYPE IF EXISTS "UniversityAccessRole" CASCADE;
DROP TYPE IF EXISTS "PointTxnType" CASCADE;
DROP TYPE IF EXISTS "DisciplineEventType" CASCADE;
DROP TYPE IF EXISTS "AiFeedbackType" CASCADE;
DROP TYPE IF EXISTS "KbContentType" CASCADE;
