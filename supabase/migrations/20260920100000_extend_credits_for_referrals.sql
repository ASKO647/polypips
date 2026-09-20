-- Extends the credits system (20260916090000_create_credits_system.sql)
-- with welcome credits and a referral-driven credit reward, reusing the
-- existing user_referral_links/user_referrals tables (from
-- 20260829090000_create_referral_and_tiktok_tables.sql, a schema that was
-- migrated but never wired to any application code — no commission-payout
-- flow is touched here, only the new credit-reward path).

alter table public.credit_transactions
  drop constraint credit_transactions_type_check;

alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (type in ('purchase', 'consumption', 'refund', 'welcome', 'referral'));

-- At most one 'welcome' transaction per user — the idempotency guard for
-- ensure_welcome_credits() below, so a user can never be granted the
-- signup bonus twice no matter how many times (or how concurrently) the
-- RPC is called.
create unique index credit_transactions_one_welcome_per_user
  on public.credit_transactions (user_id)
  where type = 'welcome';

-- Idempotency guard for the referrer's reward: set exactly once, by
-- record_user_referral_conversion() below, in the same atomic UPDATE that
-- flips converted_to_paid — never by the referred user themselves.
alter table public.user_referrals
  add column referrer_credited_at timestamptz;

-- ---------------------------------------------------------------------
-- ensure_welcome_credits — every new signup gets 15 credits, regardless
-- of referral. Callable by the signed-in user themselves (auth.uid()),
-- from the same two call sites already used for recordInfluencerReferral
-- (signup-form.tsx's immediate-session branch, /auth/callback) — safe to
-- expose to `authenticated` because it can only ever credit the caller's
-- own account, and the partial unique index above caps it at once.
-- ---------------------------------------------------------------------
create or replace function public.ensure_welcome_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (v_user_id, 15, 'welcome')
  on conflict (user_id) where type = 'welcome' do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return;
  end if;

  insert into public.user_credits (user_id, balance, updated_at)
  values (v_user_id, 15, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + 15,
        updated_at = now();
end;
$$;

revoke all on function public.ensure_welcome_credits() from public;
grant execute on function public.ensure_welcome_credits() to authenticated;

-- ---------------------------------------------------------------------
-- record_user_referral — called once, right after a referred signup
-- completes (same call sites as ensure_welcome_credits). p_slug comes
-- from the polypips_referral cookie set by /r/[slug]. Grants +5 credits
-- to the referred user (the caller) on top of their 15 welcome credits —
-- 20 total, matching the confirmed spec. Silently no-ops on an unknown
-- slug, a self-referral attempt, or a user who was already referred
-- (user_referrals.referred_user_id is unique — first touch wins, no
-- double bonus on a retried call).
-- ---------------------------------------------------------------------
create or replace function public.record_user_referral(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select user_id into v_referrer_id
  from public.user_referral_links
  where slug = p_slug;

  if v_referrer_id is null or v_referrer_id = v_user_id then
    return;
  end if;

  insert into public.user_referrals (referrer_user_id, referred_user_id, referral_code)
  values (v_referrer_id, v_user_id, p_slug)
  on conflict (referred_user_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return;
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (v_user_id, 5, 'referral');

  insert into public.user_credits (user_id, balance, updated_at)
  values (v_user_id, 5, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + 5,
        updated_at = now();
end;
$$;

revoke all on function public.record_user_referral(text) from public;
grant execute on function public.record_user_referral(text) to authenticated;

-- ---------------------------------------------------------------------
-- record_user_referral_conversion — called from the Stripe webhook's
-- checkout.session.completed handler (service_role, right next to the
-- existing recordInfluencerConversion call) once a referred user's
-- subscription payment actually goes through. Grants +10 credits to the
-- REFERRER, never to the user who just paid. Atomic and idempotent: the
-- single UPDATE ... WHERE referrer_credited_at IS NULL both checks and
-- claims the reward in one statement, so a redelivered webhook event (or
-- a later resubscription) can never credit the referrer twice.
-- ---------------------------------------------------------------------
create or replace function public.record_user_referral_conversion(p_referred_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
begin
  update public.user_referrals
     set converted_to_paid = true,
         converted_at = now(),
         referrer_credited_at = now()
   where referred_user_id = p_referred_user_id
     and referrer_credited_at is null
  returning referrer_user_id into v_referrer_id;

  if v_referrer_id is null then
    return;
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (v_referrer_id, 10, 'referral');

  insert into public.user_credits (user_id, balance, updated_at)
  values (v_referrer_id, 10, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + 10,
        updated_at = now();
end;
$$;

revoke all on function public.record_user_referral_conversion(uuid) from public;
grant execute on function public.record_user_referral_conversion(uuid) to service_role;

-- Realtime for the sidebar credit gauge — RLS (select-only, own row) is
-- enforced automatically on postgres_changes for authenticated clients,
-- same as every other realtime-enabled table in this codebase.
alter publication supabase_realtime add table public.user_credits;
