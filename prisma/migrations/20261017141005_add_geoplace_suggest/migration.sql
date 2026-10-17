-- CreateTable
CREATE TABLE "GeoPlace" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'locality',
    "parentId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'osm',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoPlace_city_kind_idx" ON "GeoPlace"("city", "kind");

-- CreateIndex
CREATE INDEX "GeoPlace_parentId_idx" ON "GeoPlace"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "GeoPlace_city_name_kind_key" ON "GeoPlace"("city", "name", "kind");

-- AddForeignKey
ALTER TABLE "GeoPlace" ADD CONSTRAINT "GeoPlace_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GeoPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
