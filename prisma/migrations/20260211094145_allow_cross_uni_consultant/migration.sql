-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_university_id_consultant_id_fkey";

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultant"("consultant_id") ON DELETE SET NULL ON UPDATE CASCADE;
