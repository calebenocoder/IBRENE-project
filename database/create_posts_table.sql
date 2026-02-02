-- Create Posts Table
create table if not exists site_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  content text,
  image_url text, /* Background image for the card */
  category text, /* e.g. 'Jovens', 'Missões' */
  event_date timestamp with time zone, /* The date/time of the event */
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table site_posts enable row level security;

-- Policies
create policy "Public read access"
  on site_posts for select
  using ( true );

create policy "Admin full access"
  on site_posts for all
  using ( auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_admin')::boolean = true )
  with check ( auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_admin')::boolean = true );

-- Add storage policy update if needed (assuming 'site-assets' is already public visible/admin writable)
-- If not, ensure we can upload post images there.
