-- Fix RLS policies for courses table
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled on courses table
-- If policies don't exist, create them

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated insert courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated update courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated delete courses" ON courses;
DROP POLICY IF EXISTS "Public read access for courses" ON courses;

-- Enable RLS on courses table (if not already enabled)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses table

-- Allow anyone to read published courses
CREATE POLICY "Public read access for courses" ON courses
  FOR SELECT USING (true);

-- Allow authenticated users (admins) to insert courses
CREATE POLICY "Allow authenticated insert courses" ON courses
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to update courses
CREATE POLICY "Allow authenticated update courses" ON courses
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users (admins) to delete courses
CREATE POLICY "Allow authenticated delete courses" ON courses
  FOR DELETE 
  USING (auth.role() = 'authenticated');
