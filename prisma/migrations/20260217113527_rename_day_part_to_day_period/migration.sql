/*
  Warnings:

  - You are about to drop the column `day_part_id` on the `time_slot` table. All the data in the column will be lost.
  - You are about to drop the `day_part` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "day_part" DROP CONSTRAINT "day_part_university_id_fkey";

-- DropForeignKey
ALTER TABLE "time_slot" DROP CONSTRAINT "time_slot_day_part_id_fkey";

-- DropIndex
DROP INDEX "time_slot_university_id_day_part_id_time_slot_start_datetim_idx";

-- AlterTable
ALTER TABLE "time_slot" DROP COLUMN "day_part_id",
ADD COLUMN     "day_period_id" INTEGER;

-- DropTable
DROP TABLE "day_part";

-- CreateTable
CREATE TABLE "day_period" (
    "day_period_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "day_period_code" VARCHAR(30) NOT NULL,
    "day_period_name_th" VARCHAR(50) NOT NULL,
    "day_period_name_en" VARCHAR(50),
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "spans_midnight" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "day_period_pkey" PRIMARY KEY ("day_period_id")
);

-- CreateIndex
CREATE INDEX "day_period_university_id_is_active_idx" ON "day_period"("university_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "day_period_university_id_day_period_code_key" ON "day_period"("university_id", "day_period_code");

-- CreateIndex
CREATE INDEX "time_slot_university_id_day_period_id_time_slot_start_datet_idx" ON "time_slot"("university_id", "day_period_id", "time_slot_start_datetime");

-- AddForeignKey
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_day_period_id_fkey" FOREIGN KEY ("day_period_id") REFERENCES "day_period"("day_period_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_period" ADD CONSTRAINT "day_period_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;
