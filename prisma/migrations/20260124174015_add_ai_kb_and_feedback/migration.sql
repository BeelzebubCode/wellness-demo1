-- CreateEnum
CREATE TYPE "KbContentType" AS ENUM ('MARKDOWN', 'JSON');

-- CreateEnum
CREATE TYPE "KbVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KbIndexStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AiFeedbackType" AS ENUM ('CANT_ANSWER', 'LOW_CONFIDENCE', 'POLICY_BLOCK', 'PROVIDER_ERROR', 'USER_NEGATIVE');

-- CreateEnum
CREATE TYPE "AiFeedbackStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "ai_kb_document" (
    "ai_kb_document_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "ai_kb_document_key" VARCHAR(120) NOT NULL,
    "ai_kb_document_title" VARCHAR(200) NOT NULL,
    "ai_kb_document_category" VARCHAR(50),
    "ai_kb_document_url_hint" VARCHAR(200),
    "ai_kb_document_is_active" BOOLEAN NOT NULL DEFAULT true,
    "ai_kb_published_version_id" INTEGER,
    "ai_kb_document_created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_kb_document_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_kb_document_pkey" PRIMARY KEY ("ai_kb_document_id")
);

-- CreateTable
CREATE TABLE "ai_kb_document_role" (
    "ai_kb_document_id" INTEGER NOT NULL,
    "ai_actor_role" VARCHAR(30) NOT NULL,

    CONSTRAINT "ai_kb_document_role_pkey" PRIMARY KEY ("ai_kb_document_id","ai_actor_role")
);

-- CreateTable
CREATE TABLE "ai_kb_document_version" (
    "ai_kb_document_version_id" SERIAL NOT NULL,
    "ai_kb_document_id" INTEGER NOT NULL,
    "ai_kb_version_no" INTEGER NOT NULL,
    "ai_kb_content_type" "KbContentType" NOT NULL,
    "ai_kb_version_status" "KbVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "ai_kb_source_path" TEXT,
    "ai_kb_source_md" TEXT,
    "ai_kb_source_json" JSONB,
    "ai_kb_normalized_text" TEXT,
    "ai_kb_index_status" "KbIndexStatus" NOT NULL DEFAULT 'PENDING',
    "ai_kb_index_error" TEXT,
    "ai_kb_version_created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ai_kb_version_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_kb_document_version_pkey" PRIMARY KEY ("ai_kb_document_version_id")
);

-- CreateTable
CREATE TABLE "ai_kb_chunk" (
    "ai_kb_chunk_id" SERIAL NOT NULL,
    "ai_kb_document_id" INTEGER NOT NULL,
    "ai_kb_document_version_id" INTEGER NOT NULL,
    "ai_kb_chunk_index" INTEGER,
    "ai_kb_chunk_content_text" TEXT NOT NULL,
    "ai_kb_chunk_embedding" JSONB,
    "ai_kb_chunk_token_count" INTEGER,
    "university_id" INTEGER,
    "ai_kb_chunk_created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_kb_chunk_pkey" PRIMARY KEY ("ai_kb_chunk_id")
);

-- CreateTable
CREATE TABLE "ai_feedback_event" (
    "ai_feedback_event_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "account_id" INTEGER,
    "ai_user_role" VARCHAR(30),
    "ai_feedback_type" "AiFeedbackType" NOT NULL,
    "ai_user_question_text" TEXT NOT NULL,
    "ai_assistant_reply_excerpt" VARCHAR(500),
    "ai_top_document_keys" JSONB,
    "ai_debug_meta" JSONB,
    "ai_feedback_status" "AiFeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "ai_resolved_document_id" INTEGER,
    "ai_created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_event_pkey" PRIMARY KEY ("ai_feedback_event_id")
);

-- CreateIndex
CREATE INDEX "ai_kb_document_university_id_ai_kb_document_is_active_idx" ON "ai_kb_document"("university_id", "ai_kb_document_is_active");

-- CreateIndex
CREATE INDEX "ai_kb_document_ai_kb_document_category_idx" ON "ai_kb_document"("ai_kb_document_category");

-- CreateIndex
CREATE UNIQUE INDEX "ai_kb_document_university_id_ai_kb_document_key_key" ON "ai_kb_document"("university_id", "ai_kb_document_key");

-- CreateIndex
CREATE INDEX "ai_kb_document_version_ai_kb_index_status_idx" ON "ai_kb_document_version"("ai_kb_index_status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_kb_document_version_ai_kb_document_id_ai_kb_version_no_key" ON "ai_kb_document_version"("ai_kb_document_id", "ai_kb_version_no");

-- CreateIndex
CREATE INDEX "ai_kb_chunk_university_id_idx" ON "ai_kb_chunk"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_kb_chunk_ai_kb_document_version_id_ai_kb_chunk_index_key" ON "ai_kb_chunk"("ai_kb_document_version_id", "ai_kb_chunk_index");

-- CreateIndex
CREATE INDEX "ai_feedback_event_university_id_idx" ON "ai_feedback_event"("university_id");

-- CreateIndex
CREATE INDEX "ai_feedback_event_ai_feedback_type_idx" ON "ai_feedback_event"("ai_feedback_type");

-- CreateIndex
CREATE INDEX "ai_feedback_event_ai_feedback_status_idx" ON "ai_feedback_event"("ai_feedback_status");

-- AddForeignKey
ALTER TABLE "ai_kb_document" ADD CONSTRAINT "ai_kb_document_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_kb_document" ADD CONSTRAINT "ai_kb_document_ai_kb_published_version_id_fkey" FOREIGN KEY ("ai_kb_published_version_id") REFERENCES "ai_kb_document_version"("ai_kb_document_version_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_kb_document_role" ADD CONSTRAINT "ai_kb_document_role_ai_kb_document_id_fkey" FOREIGN KEY ("ai_kb_document_id") REFERENCES "ai_kb_document"("ai_kb_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_kb_document_version" ADD CONSTRAINT "ai_kb_document_version_ai_kb_document_id_fkey" FOREIGN KEY ("ai_kb_document_id") REFERENCES "ai_kb_document"("ai_kb_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_kb_chunk" ADD CONSTRAINT "ai_kb_chunk_ai_kb_document_id_fkey" FOREIGN KEY ("ai_kb_document_id") REFERENCES "ai_kb_document"("ai_kb_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_kb_chunk" ADD CONSTRAINT "ai_kb_chunk_ai_kb_document_version_id_fkey" FOREIGN KEY ("ai_kb_document_version_id") REFERENCES "ai_kb_document_version"("ai_kb_document_version_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_kb_chunk" ADD CONSTRAINT "ai_kb_chunk_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback_event" ADD CONSTRAINT "ai_feedback_event_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback_event" ADD CONSTRAINT "ai_feedback_event_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback_event" ADD CONSTRAINT "ai_feedback_event_ai_resolved_document_id_fkey" FOREIGN KEY ("ai_resolved_document_id") REFERENCES "ai_kb_document"("ai_kb_document_id") ON DELETE SET NULL ON UPDATE CASCADE;
