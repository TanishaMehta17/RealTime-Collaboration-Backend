/*
  Warnings:

  - A unique constraint covering the columns `[members]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Team_members_key" ON "Team"("members");
