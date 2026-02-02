-- Add columns for Visit Section customization to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS visit_title TEXT,
ADD COLUMN IF NOT EXISTS visit_text TEXT;

-- Update the existing row (id=1) with default values
UPDATE site_settings
SET
  visit_title = COALESCE(visit_title, 'Estamos ansiosos em te conhecer'),
  visit_text = COALESCE(visit_text, 'Não importa onde você esteja em sua jornada espiritual, você é bem-vindo aqui. Temos atividades para todas as idades.')
WHERE id = 1;
