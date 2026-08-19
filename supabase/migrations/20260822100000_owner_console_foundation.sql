-- Foundation for the private OWNER-only business console. Nothing here is
-- reachable by anon/authenticated roles: every object below is either
-- RLS-locked with no policies for those roles, or a SECURITY DEFINER
-- function whose EXECUTE grant is revoked from public/anon/authenticated
-- and given only to service_role. The app-side gate (isOwnerUserId +
-- AAL2 check, see src/lib/supabase/owner.ts) is what decides who reaches
-- the code that calls these — this migration's job is to make sure even a
-- direct PostgREST/RPC call from a normal logged-in user is refused at the
-- database layer too, not just the app layer.

-- Records access attempts and sensitive actions in the owner console: who,
-- what, whether it succeeded, and from where. Powers the Logs and Security
-- pages. Nothing here is user-facing.
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  result text not null check (result in ('granted', 'denied', 'success', 'failure')),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  ip text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_user_id_idx
  on public.admin_audit_log (user_id);

alter table public.admin_audit_log enable row level security;

-- Deliberately no policy for anon/authenticated: this table is written and
-- read exclusively via the service-role client from server-only owner
-- console code (see src/lib/supabase/owner-audit.ts).

-- The webhook overwrites subscriptions.plan from 'decouverte' to 'pro' in
-- place the moment a discovery trial converts to a real charge (see
-- handleSubscriptionUpdated's justConvertedFromTrial branch) — which means
-- the fact that a given Pro row *started* as a Découverte trial was
-- previously lost the instant it happened. These two columns capture that
-- transition permanently so "conversions Découverte→Pro" can be a real,
-- queryable metric instead of an inferred guess.
alter table public.subscriptions
  add column if not exists converted_from_trial boolean not null default false;

alter table public.subscriptions
  add column if not exists converted_at timestamptz;

-- Paginated, searchable, filterable user directory for the owner console's
-- Users page. auth.users is not exposed via PostgREST, so this is the only
-- way to join it with public.subscriptions/public.analyses in one
-- server-side query instead of pulling every user client-side. p_status
-- mirrors the filter values the Users page UI offers.
create or replace function public.owner_list_users(
  p_search text default null,
  p_status text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  plan text,
  status text,
  current_period_end timestamptz,
  analyses_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    s.plan,
    s.status,
    s.current_period_end,
    coalesce(a.cnt, 0) as analyses_count,
    count(*) over() as total_count
  from auth.users u
  left join public.subscriptions s on s.user_id = u.id
  left join (
    select user_id, count(*) as cnt from public.analyses group by user_id
  ) a on a.user_id = u.id
  where
    (p_search is null or p_search = '' or u.email ilike '%' || p_search || '%')
    and (
      p_status is null or p_status = 'all'
      or (p_status = 'decouverte' and s.plan = 'decouverte' and s.status = 'trialing')
      or (p_status = 'pro' and s.plan = 'pro' and s.status in ('active', 'trialing'))
      or (p_status = 'active' and s.status in ('active', 'trialing'))
      or (p_status = 'canceled' and s.status = 'canceled')
      or (p_status = 'expired' and s.status = 'past_due')
    )
  order by u.created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.owner_list_users(text, text, int, int) from public;
grant execute on function public.owner_list_users(text, text, int, int) to service_role;

-- Total + newly-created user counts for the Overview page's period filter.
-- Separate from owner_list_users since Overview needs a single cheap
-- aggregate, not a page of rows.
create or replace function public.owner_users_summary(p_since timestamptz default null)
returns table (total_users bigint, new_users bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    (select count(*) from auth.users) as total_users,
    (select count(*) from auth.users where p_since is null or created_at >= p_since) as new_users;
$$;

revoke all on function public.owner_users_summary(timestamptz) from public;
grant execute on function public.owner_users_summary(timestamptz) to service_role;

comment on table public.admin_audit_log is
  'Owner console audit trail: access attempts and sensitive actions. Written only by server-only owner code via the service-role client.';
