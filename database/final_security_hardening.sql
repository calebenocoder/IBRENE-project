begin;

-- Keep the trusted app metadata and profile-role checks, but ignore user-editable metadata.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true then
    return true;
  end if;

  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- Keep the profile fields used by the site editable, but protect the admin role.
revoke insert, update on table public.profiles from anon, authenticated;
grant insert (id, full_name, avatar_url, updated_at, email, phone, birth_date)
  on table public.profiles to authenticated;
grant update (id, full_name, avatar_url, updated_at, email, phone, birth_date)
  on table public.profiles to authenticated;

-- The public bucket still serves existing URLs; only admins may list its objects.
alter policy "Public Access" on storage.objects
  to authenticated
  using (bucket_id = 'site-assets' and (select public.is_admin()));

alter policy "Admin Upload" on storage.objects
  with check (bucket_id = 'site-assets' and (select public.is_admin()));

alter policy "Admin Update" on storage.objects
  using (bucket_id = 'site-assets' and (select public.is_admin()));

alter policy "Admin Delete" on storage.objects
  using (bucket_id = 'site-assets' and (select public.is_admin()));

-- Both functions use only PostgreSQL built-ins, which remain available via pg_catalog.
alter function public.safe_parse_date(text) set search_path = '';
alter function public.update_updated_at_column() set search_path = '';

commit;
