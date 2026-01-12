-- Database Schema for Site Management
-- Run this in your Supabase SQL Editor

-- 1. Site Settings Table (Single Row)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_bg_image TEXT,
  service_hours JSONB DEFAULT '[]'::jsonb, -- Array of { day: string, time: string, label: string }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Public read access
CREATE POLICY "Public read access for site_settings" ON site_settings
  FOR SELECT USING (true);

-- Authenticated users can update (admins)
CREATE POLICY "Authenticated users can update site_settings" ON site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can insert (only if row doesn't exist, though strictly prevented by id=1 check but good for initialization)
CREATE POLICY "Authenticated users can insert site_settings" ON site_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Initial Seed
INSERT INTO site_settings (id, hero_bg_image, service_hours)
VALUES (1, NULL, '[
  {"day": "Domingo", "time": "09:00", "label": "Escola Bíblica"},
  {"day": "Domingo", "time": "18:00", "label": "Culto de Adoração"},
  {"day": "Quarta-feira", "time": "19:30", "label": "Culto de Oração"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
