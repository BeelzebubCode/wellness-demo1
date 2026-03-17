-- AlterTable: Add is_special_zone column to province
ALTER TABLE "province" ADD COLUMN "is_special_zone" BOOLEAN NOT NULL DEFAULT false;

-- Seed: Mark Bangkok (กรุงเทพมหานคร) as special zone
UPDATE "province" SET "is_special_zone" = true
WHERE "province_code" = 'BKK';
