-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "templateId" TEXT;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
