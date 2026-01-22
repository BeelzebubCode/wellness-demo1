-- AlterTable
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_start_datetime" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "time_slot_end_datetime" SET DATA TYPE TIMESTAMPTZ(3);
