-- Rename term_id to academic_term_id in academic_term table (PK)
ALTER TABLE "academic_term"
RENAME COLUMN "term_id" TO "academic_term_id";

-- Rename term_id to academic_term_id in academic_period table (FK)
ALTER TABLE "academic_period"
RENAME COLUMN "term_id" TO "academic_term_id";