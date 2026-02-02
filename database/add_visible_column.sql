-- Add visible column to site_posts
alter table site_posts 
add column if not exists visible boolean default true;

-- Update existing posts to be visible
update site_posts set visible = true where visible is null;
