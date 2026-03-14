-- ============================================================
-- SCHOLR — Avatar System Migration
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Add avatar_config column to profiles
-- Stores the user's custom avatar as a JSON object
-- e.g. { "skin": "s1", "hair": "h2", "outfit": "o0", "accessory": "a0" }
alter table public.profiles
  add column if not exists avatar_config jsonb default null;

-- Index for any future queries filtering by avatar config
create index if not exists idx_profiles_avatar_config
  on public.profiles using gin(avatar_config);

-- ── Update the existing RLS policy to allow avatar_config updates ────────────
-- The existing "Users can update own profile" policy already covers all columns
-- so no policy change is needed. Just verify it exists:

-- Check: this should already exist from schema.sql
-- create policy "Users can update own profile"
--   on public.profiles for update using (auth.uid() = id);

-- ── Backfill: set a default avatar_config for existing users ─────────────────
-- Gives everyone a starting avatar so AvatarRenderer always has something to render
update public.profiles
set avatar_config = '{"skin":"s1","hair":"h1","outfit":"o0","accessory":null}'::jsonb
where avatar_config is null;

-- Make the column default to the basic config for all new signups
alter table public.profiles
  alter column avatar_config
  set default '{"skin":"s1","hair":"h1","outfit":"o0","accessory":null}'::jsonb;

-- ── Update handle_new_user() trigger to include avatar_config ────────────────
-- This ensures every new signup gets the default avatar automatically
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, avatar_config)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    '{"skin":"s1","hair":"h1","outfit":"o0","accessory":null}'::jsonb
  );
  return new;
end;
$$;

-- ── Verify the migration worked ───────────────────────────────────────────────
-- Run this select to confirm — you should see avatar_config populated for all rows:
-- select id, username, avatar_config from public.profiles limit 10;
