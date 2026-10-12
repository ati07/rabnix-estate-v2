-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "city" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_city_idx" ON "Subscription"("city");
