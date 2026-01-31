/*
  Warnings:

  - The values [AVAILABLE,BOOKED,LOCKED] on the enum `TimeSlotStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TimeSlotStatus_new" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED', 'FULL');
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_status" DROP DEFAULT;
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_status" TYPE "TimeSlotStatus_new" USING ("time_slot_status"::text::"TimeSlotStatus_new");
ALTER TYPE "TimeSlotStatus" RENAME TO "TimeSlotStatus_old";
ALTER TYPE "TimeSlotStatus_new" RENAME TO "TimeSlotStatus";
DROP TYPE "TimeSlotStatus_old";
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_status" SET DEFAULT 'OPEN';

-- rename old enum
ALTER TYPE "TimeSlotStatus" RENAME TO "TimeSlotStatus_old";

-- new enum
CREATE TYPE "TimeSlotStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED', 'FULL');

-- drop default
ALTER TABLE "time_slot" ALTER COLUMN "time_slot_status" DROP DEFAULT;

-- convert + map values
ALTER TABLE "time_slot"
  ALTER COLUMN "time_slot_status" TYPE "TimeSlotStatus"
  USING (
    CASE "time_slot_status"::text
      WHEN 'AVAILABLE' THEN 'OPEN'::"TimeSlotStatus"
      WHEN 'LOCKED'    THEN 'CLOSED'::"TimeSlotStatus"
      WHEN 'BOOKED'    THEN 'FULL'::"TimeSlotStatus"
      WHEN 'CANCELLED' THEN 'CANCELLED'::"TimeSlotStatus"
      ELSE 'OPEN'::"TimeSlotStatus"
    END
  );

-- set new default
ALTER TABLE "time_slot"
  ALTER COLUMN "time_slot_status" SET DEFAULT 'OPEN';

-- drop old enum
DROP TYPE "TimeSlotStatus_old";
