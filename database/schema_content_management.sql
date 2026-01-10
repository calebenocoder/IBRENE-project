-- Database Schema for Course Content Management
-- Run this in your Supabase SQL Editor

-- 1. Modules Table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- 2. Lessons Table (combined lessons and tests)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'text', 'quiz')),
  text_content TEXT, -- Rich text content for lessons
  video_url TEXT, -- YouTube URL
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);

-- 3. Tests/Quizzes Table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_tests_lesson_id ON tests(lesson_id);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- Question text
  description TEXT, -- Optional additional context
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_questions_order ON questions(test_id, order_index);

-- 5. Alternatives Table
CREATE TABLE IF NOT EXISTS alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_alternatives_question_id ON alternatives(question_id);
CREATE INDEX idx_alternatives_order ON alternatives(question_id, order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read, admins to modify

-- Modules policies
CREATE POLICY "Public read access for modules" ON modules
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert modules" ON modules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update modules" ON modules
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete modules" ON modules
  FOR DELETE USING (auth.role() = 'authenticated');

-- Lessons policies
CREATE POLICY "Public read access for lessons" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert lessons" ON lessons
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update lessons" ON lessons
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete lessons" ON lessons
  FOR DELETE USING (auth.role() = 'authenticated');

-- Tests policies
CREATE POLICY "Public read access for tests" ON tests
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tests" ON tests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tests" ON tests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tests" ON tests
  FOR DELETE USING (auth.role() = 'authenticated');

-- Questions policies
CREATE POLICY "Public read access for questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update questions" ON questions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete questions" ON questions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Alternatives policies
CREATE POLICY "Public read access for alternatives" ON alternatives
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert alternatives" ON alternatives
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update alternatives" ON alternatives
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete alternatives" ON alternatives
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add updated_at trigger for modules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
