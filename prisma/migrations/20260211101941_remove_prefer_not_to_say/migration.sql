/*
  Warnings:

  - The values [PREFER_NOT_TO_SAY] on the enum `StudentGender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudentGender_new" AS ENUM ('MALE', 'FEMALE', 'LGBTQ_PLUS');
ALTER TABLE "student_profile" ALTER COLUMN "student_gender" TYPE "StudentGender_new" USING ("student_gender"::text::"StudentGender_new");
ALTER TYPE "StudentGender" RENAME TO "StudentGender_old";
ALTER TYPE "StudentGender_new" RENAME TO "StudentGender";
DROP TYPE "StudentGender_old";
COMMIT;
