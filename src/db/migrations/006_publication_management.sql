-- Migration: Publication Management
-- Description: Create tables for chapter publications, submissions, and extend literary submissions

-- 1. Chapter Volumes (Open Calls)
CREATE TABLE IF NOT EXISTS chapter_volumes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  theme TEXT,
  description TEXT,
  submission_deadline DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, closed, published
  cover_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chapter Submissions
CREATE TABLE IF NOT EXISTS chapter_submissions (
  id VARCHAR(50) PRIMARY KEY, -- Generates something like 'CHAP-2026-XXXX'
  volume_id INT NOT NULL REFERENCES chapter_volumes(id) ON DELETE CASCADE,
  
  -- Chapter Details
  chapter_title VARCHAR(255) NOT NULL,
  abstract TEXT NOT NULL,
  keywords VARCHAR(255) NOT NULL,
  manuscript_url VARCHAR(500) NOT NULL,
  
  -- Package & Payment
  package_id INT, -- Assuming it links to a package table or we can keep it as string
  payment_status VARCHAR(50) DEFAULT 'Pending',
  transaction_id VARCHAR(255),
  
  -- Workflow / Tracking
  stage VARCHAR(50) DEFAULT 'Submitted', -- Submitted -> Editorial Screening -> Peer Review -> Revision -> Accepted -> Payment Verified -> Formatting -> ISBN/DOI -> Published
  review_status VARCHAR(50) DEFAULT 'Pending',
  editor_assigned VARCHAR(255),
  
  -- Declarations
  agreed_policies BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chapter Authors (Supports multiple authors per chapter)
CREATE TABLE IF NOT EXISTS chapter_authors (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(50) NOT NULL REFERENCES chapter_submissions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  institution VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Extend literary_submissions table
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS editor_assigned VARCHAR(255);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) DEFAULT 'Submitted'; -- Submitted -> Editorial Review -> Editing -> Author Approval -> ISBN -> Cover Design -> Publication -> Book Store
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS isbn VARCHAR(50);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS book_store_id BIGINT; -- Links to the `books` table once published
