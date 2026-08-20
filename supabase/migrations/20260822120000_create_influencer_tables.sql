-- Influencer collaboration tracking: one row per influencer, one row per
-- user they bring in. Both tables follow the same access model as the
-- rest of the owner console foundation (see 20260822100000): RLS-locked,
-- reachable only via the service-role client from server-only owner
-- console / webhook code — except influencer_referrals' insert policy
-- below, which the app needs a real signed-in user to satisfy at signup
-- (mirrors public.signup_sources' own insert policy exactly).

create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code_promo text unique,
  tracking_slug text unique,
  commission_type text not null check (commission_type in ('percent', 'fixed')),
  commission_value numeric not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  -- An influencer needs at least one way to be attributed — see
  -- src/app/ctrl-9f4k2q7x/(dash)/influencers/actions.ts, which enforces
  -- the same rule at the form layer before this is ever the error path.
  constraint influencers_has_attribution_method
    check (code_promo is not null or tracking_slug is not null),
  -- Sane bounds independent of app-layer validation: a percent commission
  -- can't exceed the subscription amount itself, and neither type can be
  -- zero/negative (that's just "no commission", i.e. don't create the row).
  constraint influencers_commission_value_sane
    check (
      (commission_type = 'percent' and commission_value > 0 and commission_value <= 100)
      or (commission_type = 'fixed' and commission_value > 0)
    ),
  -- Matches the slugify step in the create/edit actions — lowercase
  -- alnum + hyphen only, safe to drop straight into /i/[slug] with no
  -- further encoding.
  constraint influencers_tracking_slug_format
    check (tracking_slug is null or tracking_slug ~ '^[a-z0-9-]+$')
);

alter table public.influencers enable row level security;
-- Deliberately no policy for anon/authenticated: only the service-role
-- client reads/writes this table (owner console pages/actions, the /i/
-- link route, and the promo-code check action all run server-side and use
-- createAdminClient()) — nothing here is ever queried with a user's own
-- session, so there's no legitimate RLS-governed access pattern to allow.

create table if not exists public.influencer_referrals (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers (id) on delete cascade,
  -- unique, not just indexed: a user can only ever have one first-touch
  -- referral, ever — see recordInfluencerReferral's upsert(...,
  -- {onConflict: "user_id", ignoreDuplicates: true}), which relies on this
  -- constraint to make a re-triggered insert (re-clicked confirmation
  -- email, re-login via Google) a harmless no-op.
  user_id uuid not null unique references auth.users (id) on delete cascade,
  referred_via text not null check (referred_via in ('code', 'link')),
  converted_to_paid boolean not null default false,
  converted_at timestamptz,
  subscription_amount numeric,
  commission_amount numeric,
  commission_status text not null default 'pending' check (commission_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create index if not exists influencer_referrals_influencer_id_idx
  on public.influencer_referrals (influencer_id);

alter table public.influencer_referrals enable row level security;

-- The one exception to "service-role only" in this migration: the app
-- itself has to write this row at the moment a brand-new user signs up,
-- authenticated as that exact user (see signup-form.tsx's immediate-session
-- branch and /auth/callback) — same reasoning and shape as
-- public.signup_sources' insert policy.
create policy "Users can insert their own referral row"
  on public.influencer_referrals for insert
  with check (auth.uid() = user_id);

-- Deliberately no select/update/delete policy for anon/authenticated: the
-- Stripe webhook (service role) is the only writer past the initial
-- insert, and only the owner console (service role) ever reads this table
-- back out.

-- Joins influencer_referrals with auth.users for the influencer detail
-- page's referral history (email per referred user) — same reasoning as
-- owner_list_users in the owner console foundation migration: auth.users
-- isn't exposed via PostgREST, so a SECURITY DEFINER function is the only
-- way to join it server-side in one query.
create or replace function public.owner_influencer_referrals(p_influencer_id uuid)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  referred_via text,
  converted_to_paid boolean,
  converted_at timestamptz,
  subscription_amount numeric,
  commission_amount numeric,
  commission_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    r.id,
    r.user_id,
    u.email,
    r.referred_via,
    r.converted_to_paid,
    r.converted_at,
    r.subscription_amount,
    r.commission_amount,
    r.commission_status,
    r.created_at
  from public.influencer_referrals r
  join auth.users u on u.id = r.user_id
  where r.influencer_id = p_influencer_id
  order by r.created_at desc;
$$;

revoke all on function public.owner_influencer_referrals(uuid) from public;
grant execute on function public.owner_influencer_referrals(uuid) to service_role;
