-- Restructures pricing from a single "decouverte"/"pro" unlimited tier
-- into 3 real recurring tiers (pro / pro_plus / ultimate) plus a
-- grandfathered "pro_legacy" entitlement for subscribers who were already
-- on the old unlimited Pro plan before this migration — see
-- src/lib/data/pricing.ts (PLAN_METADATA) and src/lib/plan-access.ts for
-- the application-level quota/gating numbers this schema now supports.
--
-- "pro_legacy" is assigned only by the one-time legacy-migration script
-- (scripts/migrate-legacy-pro.ts — run manually, not by this migration:
-- it must also update each subscription's Stripe metadata, which SQL
-- can't do), never picked at checkout.

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('decouverte', 'pro', 'pro_plus', 'ultimate', 'pro_legacy'));

-- ---------------------------------------------------------------------
-- Deep Analysis included credits (Pro+: 15/mo, Ultimate: 50/mo) — reset
-- (not accumulated) on each billing-cycle renewal, per the confirmed
-- product decision. `plan_credits_balance` tracks how much of the
-- CURRENT cycle's grant is still unspent; it always stays <= `balance`
-- (every included-credit consumption decrements both together, floor 0
-- on plan_credits_balance — see consume_deep_analysis_credit below) so a
-- renewal can always safely claw back exactly the unused remainder from
-- the single spendable `balance` without ever touching purchased/
-- referral/welcome credits mixed into the same balance.
-- ---------------------------------------------------------------------
alter table public.user_credits
  add column plan_credits_balance integer not null default 0,
  add constraint user_credits_plan_credits_balance_non_negative
    check (plan_credits_balance >= 0);

alter table public.credit_transactions
  drop constraint credit_transactions_type_check;

alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (type in (
    'purchase', 'consumption', 'refund', 'welcome', 'referral',
    'plan_grant', 'plan_reset'
  ));

alter table public.user_quota_cycles drop constraint if exists user_quota_cycles_feature_check;
alter table public.user_quota_cycles add constraint user_quota_cycles_feature_check
  check (feature in ('wallets', 'copy_trading', 'deep_analysis_credits'));

-- ---------------------------------------------------------------------
-- sync_plan_credits_cycle — the one place the monthly grant/reset
-- happens. service_role only (takes an arbitrary p_user_id) — called
-- from ensure_plan_credits_grant() (below, the authenticated-safe
-- wrapper for auth.uid()) and internally by consume_deep_analysis_credit
-- so a spend always sees an up-to-date grant regardless of whether the
-- user visited /dashboard/credits this cycle. No-ops (deliberately,
-- silently) for: no active/trialing subscription, a plan with 0 included
-- credits, no billing cycle to anchor to, or a cycle that was already
-- synced (user_quota_cycles.period_end already matches the live
-- current_period_end — see the same "sameCycle" pattern already used for
-- wallets in src/lib/supabase/quota-cycles.ts).
-- ---------------------------------------------------------------------
create or replace function public.sync_plan_credits_cycle(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_status text;
  v_cancel_at_period_end boolean;
  v_period_end timestamptz;
  v_included integer;
  v_anchor_period_end timestamptz;
  v_current_plan_credits integer;
begin
  select plan, status, cancel_at_period_end, current_period_end
    into v_plan, v_status, v_cancel_at_period_end, v_period_end
  from public.subscriptions
  where user_id = p_user_id;

  if v_plan is null or v_status not in ('active', 'trialing') or v_cancel_at_period_end
     or v_period_end is null then
    return;
  end if;

  -- Kept in sync by hand with PLAN_METADATA.includedDeepAnalysisCredits
  -- in src/lib/data/pricing.ts — same duplication pattern already
  -- accepted for the analyze-* Edge Functions' DAILY_ANALYSIS_LIMITS.
  v_included := case v_plan
    when 'pro_plus' then 15
    when 'ultimate' then 50
    else 0
  end;

  if v_included = 0 then
    return;
  end if;

  select period_end into v_anchor_period_end
  from public.user_quota_cycles
  where user_id = p_user_id and feature = 'deep_analysis_credits';

  if v_anchor_period_end is not null and v_anchor_period_end = v_period_end then
    -- Already granted for this exact billing cycle.
    return;
  end if;

  select coalesce(plan_credits_balance, 0) into v_current_plan_credits
  from public.user_credits
  where user_id = p_user_id;
  v_current_plan_credits := coalesce(v_current_plan_credits, 0);

  insert into public.user_credits (user_id, balance, plan_credits_balance, updated_at)
  values (p_user_id, greatest(v_included - v_current_plan_credits, 0), v_included, now())
  on conflict (user_id) do update
    set balance = greatest(public.user_credits.balance - v_current_plan_credits, 0) + v_included,
        plan_credits_balance = v_included,
        updated_at = now();

  if v_current_plan_credits > 0 then
    insert into public.credit_transactions (user_id, amount, type)
    values (p_user_id, -v_current_plan_credits, 'plan_reset');
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (p_user_id, v_included, 'plan_grant');

  insert into public.user_quota_cycles (user_id, feature, period_end, updated_at)
  values (p_user_id, 'deep_analysis_credits', v_period_end, now())
  on conflict (user_id, feature) do update
    set period_end = excluded.period_end,
        updated_at = now();
end;
$$;

revoke all on function public.sync_plan_credits_cycle(uuid) from public;
grant execute on function public.sync_plan_credits_cycle(uuid) to service_role;

-- Authenticated-safe wrapper — always operates on the caller's own
-- account (auth.uid()), so it's safe to expose directly to `authenticated`
-- the same way ensure_welcome_credits() already is. Called right before
-- reading the balance (see fetchCreditBalance in
-- src/lib/supabase/credits.ts) so /dashboard/credits and the sidebar
-- gauge always show a freshly-granted balance without needing a webhook
-- round-trip on renewal.
create or replace function public.ensure_plan_credits_grant()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  perform public.sync_plan_credits_cycle(v_user_id);
end;
$$;

revoke all on function public.ensure_plan_credits_grant() from public;
grant execute on function public.ensure_plan_credits_grant() to authenticated;

-- consume_deep_analysis_credit is redefined (not altered) to also sync
-- the plan-credits cycle first (so a spend right after a renewal always
-- sees the fresh grant even if the user never loaded /dashboard/credits
-- this cycle) and to decrement plan_credits_balance in lockstep with
-- balance, floored at 0 — bookkeeping only, it never gates the spend
-- itself, `balance` alone still does (unchanged from the original
-- credits-system migration).
create or replace function public.consume_deep_analysis_credit(
  p_user_id uuid,
  p_analysis_id text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
begin
  perform public.sync_plan_credits_cycle(p_user_id);

  update public.user_credits
     set balance = balance - 1,
         plan_credits_balance = greatest(plan_credits_balance - 1, 0),
         updated_at = now()
   where user_id = p_user_id
     and balance > 0
  returning balance into v_new_balance;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_transactions (user_id, amount, type, related_analysis_id)
  values (p_user_id, -1, 'consumption', p_analysis_id);

  return v_new_balance;
end;
$$;

revoke all on function public.consume_deep_analysis_credit(uuid, text) from public;
grant execute on function public.consume_deep_analysis_credit(uuid, text) to service_role;
