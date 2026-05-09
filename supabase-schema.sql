-- =============================================
-- PAST QUESTIONS PORTAL — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Programmes table (e.g. MLS, Nursing, Pharmacy)
CREATE TABLE programmes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Levels table (e.g. 100L, 200L, 300L)
CREATE TABLE levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Sessions table (e.g. 2023/2024, 2022/2023)
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  programme_id INT REFERENCES programmes(id) ON DELETE CASCADE,
  level_id INT REFERENCES levels(id) ON DELETE CASCADE,
  UNIQUE(course_code, programme_id, level_id)
);

-- Past Questions table
CREATE TABLE past_questions (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  session_id INT REFERENCES sessions(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  download_count INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEED DATA — edit as needed
-- =============================================

INSERT INTO levels (name) VALUES ('100L'), ('200L'), ('300L'), ('400L'), ('500L');

INSERT INTO sessions (name) VALUES
  ('2023/2024'), ('2022/2023'), ('2021/2022'), ('2020/2021');

INSERT INTO programmes (name) VALUES
  ('MLS'), ('Nursing'), ('Pharmacy'), ('Medicine');

-- =============================================
-- STORAGE SETUP
-- Run these in Supabase SQL Editor
-- =============================================

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('past-questions', 'past-questions', true);

-- Allow public read access
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'past-questions');

-- Allow authenticated uploads (for admin)
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'past-questions');

-- Allow authenticated deletes (for admin)
CREATE POLICY "Authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'past-questions');

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_questions ENABLE ROW LEVEL SECURITY;

-- Public can read everything
CREATE POLICY "Public read" ON programmes FOR SELECT USING (true);
CREATE POLICY "Public read" ON levels FOR SELECT USING (true);
CREATE POLICY "Public read" ON sessions FOR SELECT USING (true);
CREATE POLICY "Public read" ON courses FOR SELECT USING (true);
CREATE POLICY "Public read" ON past_questions FOR SELECT USING (true);

-- Public can increment download count
CREATE POLICY "Public update download count" ON past_questions
  FOR UPDATE USING (true) WITH CHECK (true);
