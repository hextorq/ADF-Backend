-- Migration: 009_manuscript_formatter.sql
-- Description: Create tables for manuscript formatting configurations, sessions, and extend submissions

-- 1. Formatting Configurations (Versioned styling rules)
CREATE TABLE IF NOT EXISTS formatting_configurations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  general_settings JSONB NOT NULL DEFAULT '{}',
  typography_settings JSONB NOT NULL DEFAULT '{}',
  structure_settings JSONB NOT NULL DEFAULT '{}',
  table_settings JSONB NOT NULL DEFAULT '{}',
  figure_settings JSONB NOT NULL DEFAULT '{}',
  reference_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default ADF Format v1.0 configuration
INSERT INTO formatting_configurations (
  version,
  name,
  is_active,
  general_settings,
  typography_settings,
  structure_settings,
  table_settings,
  figure_settings,
  reference_settings
) VALUES (
  'ADF Format v1.0',
  'Official ADF Standard Academic Format',
  true,
  '{
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": { "top": 1440, "bottom": 1440, "left": 1440, "right": 1440 },
    "pageNumbering": { "enabled": true, "position": "bottom-right", "format": "arabic" }
  }',
  '{
    "bodyFont": "Times New Roman",
    "bodySizePt": 12,
    "lineSpacing": 480,
    "paragraphSpacing": { "before": 0, "after": 0 },
    "firstLineIndentDxa": 720,
    "heading1": { "font": "Times New Roman", "sizePt": 14, "bold": true, "spacingBefore": 240, "spacingAfter": 120 },
    "heading2": { "font": "Times New Roman", "sizePt": 13, "bold": true, "italic": true, "spacingBefore": 180, "spacingAfter": 60 },
    "heading3": { "font": "Times New Roman", "sizePt": 12, "bold": true, "italic": true, "spacingBefore": 120, "spacingAfter": 60 }
  }',
  '{
    "title": { "sizePt": 16, "bold": true, "alignment": "center", "spacingAfter": 240 },
    "authors": { "sizePt": 12, "alignment": "center", "spacingAfter": 120 },
    "affiliations": { "sizePt": 11, "italic": true, "alignment": "center", "spacingAfter": 240 },
    "abstract": { "required": true, "minWords": 150, "maxWords": 250, "heading": "Abstract", "headingBold": true },
    "keywords": { "required": true, "minCount": 5, "maxCount": 8, "prefix": "Keywords: " }
  }',
  '{
    "numberingStyle": "Table {N}: ",
    "captionPosition": "above",
    "captionBold": true,
    "fontSizePt": 10.5,
    "borderStyle": "academic-standard"
  }',
  '{
    "numberingStyle": "Figure {N}: ",
    "captionPosition": "below",
    "captionBold": true,
    "fontSizePt": 10,
    "alignment": "center"
  }',
  '{
    "style": "APA 7th",
    "fontSizePt": 12,
    "lineSpacing": 480,
    "hangingIndentDxa": 720,
    "alphabeticalSort": true
  }'
)
ON CONFLICT (version) DO NOTHING;

-- 2. Formatting Sessions (for live preview and tracking uploads)
CREATE TABLE IF NOT EXISTS manuscript_formatting_sessions (
  id VARCHAR(64) PRIMARY KEY,
  original_filename VARCHAR(255) NOT NULL,
  original_file_url VARCHAR(500) NOT NULL,
  formatted_file_url VARCHAR(500) NOT NULL,
  formatting_version VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Completed',
  detected_structure JSONB DEFAULT '{}',
  formatting_changes JSONB DEFAULT '[]',
  formatting_issues JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{}',
  author_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Extend chapter_submissions with formatting tracking
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS formatted_manuscript_url VARCHAR(500);
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS formatting_version VARCHAR(50);
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS formatting_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS formatting_issues JSONB DEFAULT '[]';
ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS author_confirmed_formatting BOOLEAN DEFAULT false;

-- 4. Extend literary_submissions with formatting tracking
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS formatted_manuscript_url VARCHAR(500);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS formatting_version VARCHAR(50);
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS formatting_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS formatting_issues JSONB DEFAULT '[]';
ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS author_confirmed_formatting BOOLEAN DEFAULT false;
