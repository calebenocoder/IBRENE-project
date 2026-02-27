-- 1. Helper function to parse dates safely from any format
CREATE OR REPLACE FUNCTION public.safe_parse_date(d text)
RETURNS date AS $$
BEGIN
  IF d IS NULL OR d = '' THEN RETURN NULL; END IF;
  
  -- Try standard YYYY-MM-DD first
  BEGIN
    RETURN d::date;
  EXCEPTION WHEN OTHERS THEN
    -- Try DD/MM/YYYY format
    BEGIN
      RETURN to_date(d, 'DD/MM/YYYY');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL; -- Final fallback
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Updated trigger function using the safe parser
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, birth_date)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    public.safe_parse_date(new.raw_user_meta_data->>'birth_date')
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- TOTAL SAFETY: If anything else fails, still create the profile but skip risky fields
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
