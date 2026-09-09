-- Migration: 010_campaign_submissions.sql
-- Description: Add campaign metadata to literary_submissions table

ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS submission_type VARCHAR(100);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS author_instagram VARCHAR(100);
