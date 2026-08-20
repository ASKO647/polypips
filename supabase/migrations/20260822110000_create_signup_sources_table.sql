-- First-touch acquisition attribution, one row per user. Written once by
-- the app (signup-form.tsx's immediate-session branch, and
-- /auth/callback for OAuth + email-confirmation signups) right after a
-- brand-new auth.users row is created — see
-- src/lib/supabase/signup-sources.ts. user_id is the primary key so a
-- second write attempt for the same user (re-clicked confirmation email,
-- an existing user logging back in via Google) is a harmless upsert
-- no-op rather than overwriting the real first-touch source.
create table if not exists public.signup_sources (
  user_id uuid primary key references auth.users (id) on delete cascade,
  utm_source text not null default 'direct',
  utm_medium text,
  utm_campaign text,
  landing_path text,
  created_at timestamptz not null default now()
);

create index if not exists signup_sources_utm_source_idx
  on public.signup_sources (utm_source);

alter table public.signup_sources enable row level security;

-- The owner console reads this table via the service role client (see
-- lib/supabase/owner-acquisition.ts), which bypasses RLS entirely — these
-- policies only govern the regular authenticated user, who may record
-- their own first-touch source once and never anyone else's.
create policy "Users can insert their own signup source"
  on public.signup_sources for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own signup source"
  on public.signup_sources for select
  using (auth.uid() = user_id);

-- Deliberately no update/delete policy: first-touch attribution is
-- immutable by design once recorded, for anyone other than the service role.
