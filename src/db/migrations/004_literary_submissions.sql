-- Migration: Literary Submissions
-- Description: Create tables for publishing packages and literary submissions

CREATE TABLE IF NOT EXISTS literary_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  features TEXT NOT NULL, -- JSON array of features
  price DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default packages
INSERT INTO literary_packages (name, features, price) VALUES 
('Basic', '["ISBN Registration", "Basic Editing", "E-Certificate", "Digital Publication"]', 9999.00),
('Standard', '["ISBN Registration", "Professional Editing", "Custom Cover Design", "Formatting", "Paperback Publication"]', 19999.00),
('Premium', '["Everything in Standard", "Marketing Support", "Social Media Promotion", "Website Listing", "Print + Digital Publication"]', 39999.00);

CREATE TABLE IF NOT EXISTS literary_submissions (
  id VARCHAR(50) PRIMARY KEY, -- Generates something like 'SUB-2026-XXXX'
  
  -- Author Information
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_phone VARCHAR(50) NOT NULL,
  author_country VARCHAR(100) NOT NULL,
  author_address TEXT NOT NULL,
  author_bio TEXT,
  author_photo_url VARCHAR(500),
  
  -- Manuscript Information
  book_title VARCHAR(255) NOT NULL,
  book_subtitle VARCHAR(255),
  book_genre VARCHAR(100) NOT NULL,
  book_language VARCHAR(50) NOT NULL,
  word_count INT NOT NULL,
  page_count INT,
  synopsis TEXT NOT NULL,
  keywords VARCHAR(255),
  
  -- Uploaded Files
  manuscript_url VARCHAR(500) NOT NULL,
  cover_url VARCHAR(500),
  
  -- Package & Payment
  package_id INT,
  payment_status VARCHAR(50) DEFAULT 'Pending',
  transaction_id VARCHAR(255),
  
  -- Declarations (Boolean)
  agreed_original BOOLEAN DEFAULT false,
  agreed_copyright BOOLEAN DEFAULT false,
  agreed_not_published BOOLEAN DEFAULT false,
  agreed_policies BOOLEAN DEFAULT false,
  
  -- Tracking
  status VARCHAR(50) DEFAULT 'Submitted',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (package_id) REFERENCES literary_packages(id)
);
