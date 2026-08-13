-- Public, read-only projection of real recent Smart Money movements for the
-- landing page's activity popup. tracked_wallets itself stays restricted to
-- authenticated users (see 20260813151635) — this SECURITY DEFINER function
-- exposes only the narrow slice an anonymous visitor should see (no wallet
-- total_value, positions, or anything beyond a single recent movement),
-- filtered to movements that are both recent and large enough to matter.
create or replace function public.get_public_smart_money_activity(
  min_amount numeric default 500,
  max_age_hours integer default 48,
  result_limit integer default 20
)
returns table (
  wallet_label text,
  market text,
  side text,
  movement_type text,
  amount numeric,
  occurred_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    tw.label as wallet_label,
    (m->>'market') as market,
    (m->>'side') as side,
    (m->>'type') as movement_type,
    (m->>'amount')::numeric as amount,
    (m->>'timestamp')::timestamptz as occurred_at
  from public.tracked_wallets tw
  cross join lateral jsonb_array_elements(tw.recent_movements) as m
  where (m->>'amount')::numeric >= min_amount
    and (m->>'timestamp')::timestamptz >= now() - (max_age_hours || ' hours')::interval
  order by occurred_at desc
  limit result_limit;
$$;

grant execute on function public.get_public_smart_money_activity(numeric, integer, integer)
  to anon, authenticated;
