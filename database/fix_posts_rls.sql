-- Fix RLS Policy for site_posts
-- The previous policy likely failed because it checked auth.jwt() ->> 'is_admin' directly
-- instead of checking inside user_metadata or querying auth.users.

drop policy if exists "Admin full access" on site_posts;

create policy "Admin full access"
  on site_posts for all
  using (
    auth.role() = 'authenticated' AND (
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
      OR
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    )
  )
  with check (
    auth.role() = 'authenticated' AND (
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
      OR
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    )
  );
