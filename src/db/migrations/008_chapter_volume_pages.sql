-- Migration: Add pages column to chapter_volumes
ALTER TABLE chapter_volumes ADD COLUMN IF NOT EXISTS pages INT DEFAULT 0;
