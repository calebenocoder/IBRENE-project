-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  email text, -- Cached/Public email if needed, or just link by ID
  phone text,
  birth_date date,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Add role column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table public.profiles enable row level security;

-- Drop existing generic policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- 1. Privacy (LGPD): Only admins can see all profiles. Users can see their own.
create policy "Users can view own profile or admins all"
  on profiles for select
  using ( auth.uid() = id OR is_admin() );

-- 2. Limited Public View (Optional): If you need to show names on a forum/etc
-- create policy "Public can see only names"
--   on profiles for select
--   using ( true )
--   with check ( false ); -- Cannot write via this policy

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile or admins all"
  on profiles for update
  using ( auth.uid() = id OR is_admin() );

-- Variable to auto-update updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure moddatetime (updated_at);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- It copies the metadata provided at sign up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
