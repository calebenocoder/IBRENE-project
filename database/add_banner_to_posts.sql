-- Adicionar coluna de banner (opcional) na tabela de postagens
ALTER TABLE site_posts ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
