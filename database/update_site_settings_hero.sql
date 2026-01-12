-- Add columns for Hero customization to site_settings
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_bg_position TEXT DEFAULT 'center top';

-- Update the existing row (id=1) with default values if they are null
-- This ensures the frontend doesn't break and has some initial data to work with
UPDATE site_settings
SET 
  hero_title = COALESCE(hero_title, 'Bem-vindo a IBRENE'),
  hero_subtitle = COALESCE(hero_subtitle, 'Um lugar de fé, esperança e amor.'),
  hero_bg_position = COALESCE(hero_bg_position, 'center top')
WHERE id = 1;
