/*
  Warnings:

  - Made the column `ai_kb_chunk_index` on table `ai_kb_chunk` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ai_kb_chunk" ALTER COLUMN "ai_kb_chunk_index" SET NOT NULL;

-- AlterTable
ALTER TABLE "region" ADD COLUMN     "region_name_en" VARCHAR(50);
