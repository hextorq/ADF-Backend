CREATE TABLE IF NOT EXISTS academic_programmes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- FDP, Workshop, Training, Webinar, etc.
  date DATE NOT NULL,
  duration VARCHAR(100) NOT NULL,
  speaker VARCHAR(255) NOT NULL,
  mode VARCHAR(50) NOT NULL, -- Online, Hybrid, On-campus
  seats INT NOT NULL DEFAULT 0,
  google_form_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
