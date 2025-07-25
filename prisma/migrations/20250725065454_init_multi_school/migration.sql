/*
  Warnings:

  - You are about to drop the column `description` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,courseId,schoolId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,schoolId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_teacherId_fkey";

-- DropIndex
DROP INDEX "Unit_number_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "description",
DROP COLUMN "dueDate",
DROP COLUMN "score",
DROP COLUMN "status",
DROP COLUMN "studentId",
ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "unitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "description",
DROP COLUMN "number",
DROP COLUMN "teacherId",
DROP COLUMN "title",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "schoolId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- DropTable
DROP TABLE "Question";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CoreSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coreSubjectId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CoreSubject_name_key" ON "CoreSubject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_schoolId_key" ON "Course"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_courseId_schoolId_key" ON "Unit"("name", "courseId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_schoolId_key" ON "User"("email", "schoolId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_coreSubjectId_fkey" FOREIGN KEY ("coreSubjectId") REFERENCES "CoreSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
