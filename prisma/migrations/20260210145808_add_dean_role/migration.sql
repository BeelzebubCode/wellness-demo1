-- AlterEnum
ALTER TYPE "UniversityAccessRole" ADD VALUE 'DEAN';

-- DropIndex
DROP INDEX "booking_university_id_student_id_time_slot_id_key";

-- AlterTable
ALTER TABLE "faculty" ADD COLUMN     "accountAccount_id" INTEGER,
ADD COLUMN     "dean_account_id" INTEGER;

-- CreateIndex
CREATE INDEX "booking_university_id_problem_category_id_idx" ON "booking"("university_id", "problem_category_id");

-- CreateIndex
CREATE INDEX "faculty_dean_account_id_idx" ON "faculty"("dean_account_id");

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_dean_account_id_fkey" FOREIGN KEY ("dean_account_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_accountAccount_id_fkey" FOREIGN KEY ("accountAccount_id") REFERENCES "account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;
