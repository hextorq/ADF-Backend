-- Migration: Add payment screenshot URL to chapter submissions
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS payment_screenshot_url VARCHAR(500);
