-- Update the trigger function to include birth_date from user metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, birth_date)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.raw_user_meta_data->>'birth_date')::date
  );
  return new;
end;
$$ language plpgsql security definer;
