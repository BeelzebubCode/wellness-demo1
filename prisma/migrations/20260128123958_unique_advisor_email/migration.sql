/*
  Warnings:

  - A unique constraint covering the columns `[advisor_email]` on the table `advisor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "advisor_advisor_email_key" ON "advisor"("advisor_email");
