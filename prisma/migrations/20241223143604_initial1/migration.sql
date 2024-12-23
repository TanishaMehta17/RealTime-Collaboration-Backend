/*
  Warnings:

  - You are about to drop the column `memberIds` on the `Team` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Team" DROP COLUMN "memberIds",
ADD COLUMN     "members" TEXT[];

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT[],
    "status" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "membersName" TEXT[],

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
