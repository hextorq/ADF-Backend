-- Migration: 013_abstract_submissions.sql
-- Description: Create abstract_submissions table for Interdisciplinary Horizons Call for Abstracts

CREATE TABLE IF NOT EXISTS abstract_submissions (
  id VARCHAR(50) PRIMARY KEY,
  author_name VARCHAR(255) NOT NULL,
  author_type VARCHAR(100) NOT NULL,
  department VARCHAR(255),
  institution VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  research_area_id VARCHAR(100) NOT NULL,
  research_area_name VARCHAR(255) NOT NULL,
  abstract_title VARCHAR(500) NOT NULL,
  abstract_text TEXT NOT NULL,
  word_count INT NOT NULL,
  keywords VARCHAR(500) NOT NULL,
  is_sole_author BOOLEAN DEFAULT true,
  payment_status VARCHAR(50) DEFAULT 'Pending',
  payment_ref VARCHAR(255),
  payment_screenshot_url VARCHAR(500),
  manuscript_url VARCHAR(500),
  review_status VARCHAR(50) DEFAULT 'Pending Review',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_abstract_submissions_area ON abstract_submissions(research_area_id);
CREATE INDEX IF NOT EXISTS idx_abstract_submissions_status ON abstract_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_abstract_submissions_payment ON abstract_submissions(payment_status);

