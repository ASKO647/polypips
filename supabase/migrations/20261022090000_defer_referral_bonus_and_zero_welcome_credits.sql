-- Margin protection, step 1: stop giving away AI budget before a customer
-- has ever paid anything.
--
-- 1. ensure_welcome_credits() now grants 0 credits (WELCOME_CREDITS in
--    src/lib/data/pricing.ts) instead of 15. Still inserts the idempotent
--    'welcome' credit_transactions row (amount 0) so the existing
--    call sites (signup-form.tsx, /auth/callback) and the credit-history
--    UI ("Bonus de bienvenue") keep working unchanged — a new user is
--    still marked "welcomed" exactly once, it just no longer moves their
--    balance. Does NOT touch any existing user's balance.
--
-- 2. record_user_referral(p_slug) — called right at signup — no longer
--    grants the referred user's +5 credits. It still records the
--    user_referrals row (referrer_user_id/referred_user_id/referral_code),
--    which the Stripe webhook needs at payment time to know who referred
--    whom; it just stops paying out immediately.
--
-- 3. record_user_referral_conversion(p_referred_user_id) — called from
--    the Stripe webhook's checkout.session.completed handler, i.e. the
--    referred user's first real payment — now grants BOTH bonuses at
--    once: +5 to the referred user (moved here from step 2) and +10 to
--    the referrer (unchanged). Both grants happen inside the same
--    atomic `UPDATE ... WHERE referrer_credited_at IS NULL ... RETURNING`
--    already used to make the referrer's reward idempotent, so a
--    redelivered webhook event still can't double-credit either side.
--
-- This migration is NOT applied automatically — run it by hand against
-- the Supabase project (SQL editor or `supabase db push`) when ready.

create or replace function public.ensure_welcome_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer;
  -- WELCOME_CREDITS = 0 (src/lib/data/pricing.ts) — was 15.
  v_welcome_credits constant integer := 0;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (v_user_id, v_welcome_credits, 'welcome')
  on conflict (user_id) where type = 'welcome' do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 or v_welcome_credits = 0 then
    return;
  end if;

  insert into public.user_credits (user_id, balance, updated_at)
  values (v_user_id, v_welcome_credits, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + v_welcome_credits,
        updated_at = now();
end;
$$;

revoke all on function public.ensure_welcome_credits() from public;
grant execute on function public.ensure_welcome_credits() to authenticated;

create or replace function public.record_user_referral(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
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

  -- Records the relationship only — no credit here anymore. The referred
  -- user's +5 bonus now happens in record_user_referral_conversion,
  -- below, on their first real payment.
  insert into public.user_referrals (referrer_user_id, referred_user_id, referral_code)
  values (v_referrer_id, v_user_id, p_slug)
  on conflict (referred_user_id) do nothing;
end;
$$;

revoke all on function public.record_user_referral(text) from public;
grant execute on function public.record_user_referral(text) to authenticated;

create or replace function public.record_user_referral_conversion(p_referred_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  -- REFERRAL_REFERRED_USER_BONUS_CREDITS / REFERRAL_REFERRER_BONUS_CREDITS
  -- in src/lib/data/pricing.ts.
  v_referred_bonus constant integer := 5;
  v_referrer_bonus constant integer := 10;
begin
  update public.user_referrals
     set converted_to_paid = true,
         converted_at = now(),
         referrer_credited_at = now()
   where referred_user_id = p_referred_user_id
     and referrer_credited_at is null
  returning referrer_user_id into v_referrer_id;

  if v_referrer_id is null then
    -- Unknown referral, or already credited by an earlier delivery of
    -- this same webhook event — idempotent no-op either way.
    return;
  end if;

  -- Referred user's own bonus — now paid here (first real payment),
  -- never at signup.
  insert into public.credit_transactions (user_id, amount, type)
  values (p_referred_user_id, v_referred_bonus, 'referral');

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_referred_user_id, v_referred_bonus, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + v_referred_bonus,
        updated_at = now();

  -- Referrer's reward — unchanged from before.
  insert into public.credit_transactions (user_id, amount, type)
  values (v_referrer_id, v_referrer_bonus, 'referral');

  insert into public.user_credits (user_id, balance, updated_at)
  values (v_referrer_id, v_referrer_bonus, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + v_referrer_bonus,
        updated_at = now();
end;
$$;

revoke all on function public.record_user_referral_conversion(uuid) from public;
grant execute on function public.record_user_referral_conversion(uuid) to service_role;
