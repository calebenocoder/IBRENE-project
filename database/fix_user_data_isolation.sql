-- # USER DATA ISOLATION AND ADMIN AUDIT
-- Enforcing strict isolation for personal progress and certification data.

-- 1. user_progress isolation
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR ALL -- Covers INSERT/UPDATE/DELETE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_progress;
CREATE POLICY "Admins can view all progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (is_admin());

-- 2. certificates admin access
-- (Users can already view their own from create_certificates_table.sql)

DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;
CREATE POLICY "Admins can view all certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (is_admin());

-- 3. Cleanup: Ensure is_admin() is used consistently
-- Check if any other sensitive tables are missing admin view logic
