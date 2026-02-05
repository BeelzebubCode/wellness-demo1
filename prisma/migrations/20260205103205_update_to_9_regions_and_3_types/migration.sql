/*
  Warnings:

  - The values [NORTH,NORTHEAST,CENTRAL,WEST,SOUTH] on the enum `RegionCode` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[account_id]` on the table `advisor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UniversityType" AS ENUM ('SUPERVISED', 'PUBLIC', 'PRIVATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccountRole" ADD VALUE 'ADVISOR';
ALTER TYPE "AccountRole" ADD VALUE 'MINISTRY';

-- AlterEnum
BEGIN;
CREATE TYPE "RegionCode_new" AS ENUM ('UPPER_NORTH', 'LOWER_NORTH', 'UPPER_NORTHEAST', 'LOWER_NORTHEAST', 'UPPER_CENTRAL', 'LOWER_CENTRAL', 'EAST', 'UPPER_SOUTH', 'LOWER_SOUTH');
ALTER TABLE "region" ALTER COLUMN "region_code" TYPE "RegionCode_new" USING ("region_code"::text::"RegionCode_new");
ALTER TYPE "RegionCode" RENAME TO "RegionCode_old";
ALTER TYPE "RegionCode_new" RENAME TO "RegionCode";
DROP TYPE "RegionCode_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UniversityAccessRole" ADD VALUE 'ADVISOR';

-- AlterTable
ALTER TABLE "advisor" ADD COLUMN     "account_id" INTEGER;

-- AlterTable
ALTER TABLE "university" ADD COLUMN     "university_type" "UniversityType" DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "university_connection" (
    "connection_id" SERIAL NOT NULL,
    "source_university_id" INTEGER NOT NULL,
    "target_university_id" INTEGER NOT NULL,
    "distance_km" DECIMAL(8,2) NOT NULL,
    "connection_rank" INTEGER NOT NULL,
    "connection_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_connection_pkey" PRIMARY KEY ("connection_id")
);

-- CreateIndex
CREATE INDEX "university_connection_source_university_id_idx" ON "university_connection"("source_university_id");

-- CreateIndex
CREATE INDEX "university_connection_target_university_id_idx" ON "university_connection"("target_university_id");

-- CreateIndex
CREATE UNIQUE INDEX "university_connection_source_university_id_target_universit_key" ON "university_connection"("source_university_id", "target_university_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_account_id_key" ON "advisor"("account_id");

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_connection" ADD CONSTRAINT "university_connection_source_university_id_fkey" FOREIGN KEY ("source_university_id") REFERENCES "university"("university_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_connection" ADD CONSTRAINT "university_connection_target_university_id_fkey" FOREIGN KEY ("target_university_id") REFERENCES "university"("university_id") ON DELETE CASCADE ON UPDATE CASCADE;
