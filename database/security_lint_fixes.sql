-- # SECURITY FIXES: RESOLVING LINT CRITICAL ITEMS

-- 1. FIX: RLS references user metadata (Insecure)
-- Table: public.site_posts
-- Problem: Policy checked user_metadata (editable by end users).
-- Fix: Query the profiles table directly to check for 'admin' role.

DROP POLICY IF EXISTS "Admin full access" ON public.site_posts;

CREATE POLICY "Admin full access"
  ON public.site_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 2. FIX: Function Search Path Mutable (Security Risk)
-- Function: public.handle_new_user
-- Fix: Set search_path explicitly to 'public'.

ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 3. FIX: Function Search Path Mutable (Security Risk)
-- Function: public.update_updated_at_column
-- Fix: Set search_path explicitly to 'public'.

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- NOTE FOR ITEM 4 (Auth Settings):
-- The "Leaked password protection" must be enabled manually in the Supabase Dashboard:
-- Path: Auth > Settings > Security > Enable "Leaked password protection"
