-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "Property_state_idx" ON "Property"("state");
