-- AlterTable
ALTER TABLE "time_slot" ADD COLUMN     "day_part_id" INTEGER;

-- CreateTable
CREATE TABLE "day_part" (
    "day_part_id" SERIAL NOT NULL,
    "university_id" INTEGER,
    "day_part_code" VARCHAR(30) NOT NULL,
    "day_part_name_th" VARCHAR(50) NOT NULL,
    "day_part_name_en" VARCHAR(50),
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "spans_midnight" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "day_part_pkey" PRIMARY KEY ("day_part_id")
);

-- CreateIndex
CREATE INDEX "day_part_university_id_is_active_idx" ON "day_part"("university_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "day_part_university_id_day_part_code_key" ON "day_part"("university_id", "day_part_code");

-- CreateIndex
CREATE INDEX "time_slot_university_id_day_part_id_time_slot_start_datetim_idx" ON "time_slot"("university_id", "day_part_id", "time_slot_start_datetime");

-- AddForeignKey
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_day_part_id_fkey" FOREIGN KEY ("day_part_id") REFERENCES "day_part"("day_part_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_part" ADD CONSTRAINT "day_part_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "university"("university_id") ON DELETE SET NULL ON UPDATE CASCADE;
