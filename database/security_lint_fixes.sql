-- # SECURITY FIXES: RESOLVING LINT CRITICAL ITEMS AND LGPD COMPLIANCE

-- 1. CENTRALIZED SECURITY HELPERS
-- These functions provide a single source of truth for authorization.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- 1. Check JWT metadata (fastest, set during login)
  IF (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true THEN
    RETURN true;
  END IF;

  IF (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- 2. fallback: Check profiles table (source of truth)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. FIX: Standardize Admin Access for site_posts
-- Table: public.site_posts

DROP POLICY IF EXISTS "Admin full access" ON public.site_posts;
DROP POLICY IF EXISTS "Anyone can view visible posts" ON public.site_posts;

CREATE POLICY "Admins have full access to site_posts"
  ON public.site_posts FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view visible site_posts"
  ON public.site_posts FOR SELECT
  USING (visible = true OR is_admin());

-- 3. FIX: Function Search Path Mutable (Security Risk)
-- Set search_path explicitly for existing functions

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- NOTE FOR ITEM 4 (Auth Settings):
-- The "Leaked password protection" must be enabled manually in the Supabase Dashboard:
-- Path: Auth > Settings > Security > Enable "Leaked password protection"
