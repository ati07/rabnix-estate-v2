-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- Backfill the new indexed columns from the existing `coordinates` JSON so every
-- listing that already has a saved pin becomes queryable by radius immediately.
-- Guards against the (0,0) "null island" and non-numeric values.
UPDATE "Property"
SET
  "latitude"  = ("coordinates" ->> 'lat')::double precision,
  "longitude" = ("coordinates" ->> 'lng')::double precision
WHERE "coordinates" IS NOT NULL
  AND jsonb_typeof(("coordinates")::jsonb -> 'lat') = 'number'
  AND jsonb_typeof(("coordinates")::jsonb -> 'lng') = 'number'
  AND NOT (
    ("coordinates" ->> 'lat')::double precision = 0
    AND ("coordinates" ->> 'lng')::double precision = 0
  );

-- CreateIndex
CREATE INDEX "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");
