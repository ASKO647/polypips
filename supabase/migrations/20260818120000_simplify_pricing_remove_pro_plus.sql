-- Pricing simplified to 2 tiers: "decouverte" (0,99€/3 days, full access)
-- and "pro" (29,99€/mois, full access). The old "pro-plus" (79€) tier is
-- retired — both remaining plans now grant identical unlimited access, so
-- there is no more paid-tier distinction to enforce anywhere.

-- Migrate any existing pro-plus subscribers onto pro before tightening the
-- check constraint, so no live row gets orphaned by the narrower check.
update public.subscriptions set plan = 'pro' where plan = 'pro-plus';

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('decouverte', 'pro'));

-- Communauté used to require plan in ('pro', 'pro-plus') on top of an
-- active/trialing status. With only one full-access tier structure left
-- (decouverte and pro both grant everything), that extra plan filter is
-- gone too — this now mirrors the same active/trialing check used
-- everywhere else in the app (see hasActiveAccess() in
-- src/lib/supabase/subscriptions.ts).
create or replace function public.has_community_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = target_user_id
      and status in ('active', 'trialing')
  );
$$;
