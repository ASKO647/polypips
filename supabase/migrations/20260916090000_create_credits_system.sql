-- Credits system for the "Analyse Approfondie" premium feature.
--
-- user_credits: one row per user, current balance. credit_transactions:
-- full audit trail (purchases, consumptions, refunds). Both tables are
-- writable ONLY through the RPCs below (service_role) or the Stripe
-- webhook (service_role) — never directly by an authenticated user, so a
-- client can never mint or restore credits by calling the REST API
-- directly. This mirrors the write-lockdown already used for
-- selected_sport_matches/selected_trading_analyses (service-role-only
-- writes, select-only RLS for authenticated).

create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_credits_balance_non_negative check (balance >= 0)
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Positive for purchase/refund, negative (-1) for consumption — signed
  -- so a running SUM(amount) per user always reconciles with balance.
  amount integer not null,
  type text not null check (type in ('purchase', 'consumption', 'refund')),
  -- Free-form: an analysis id (deep analysis consumption/refund) or null
  -- for a purchase. Not a foreign key — the analysis it points to lives in
  -- one of three different per-universe tables (analyses,
  -- sports_bet_analyses, trading_chart_analyses), so this stays a plain
  -- id, matched by hand when investigating.
  related_analysis_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- Idempotency for the credits Stripe webhook: a payment_intent can only
-- ever be recorded once. Partial index (not a table-level UNIQUE) since
-- consumption/refund rows never set this column.
create unique index credit_transactions_stripe_payment_intent_id_key
  on public.credit_transactions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

-- Select-only for authenticated — a user can read their own balance and
-- history, but every write (balance changes, transaction inserts) goes
-- through the SECURITY DEFINER RPCs below, granted to service_role only.
-- There is deliberately no insert/update/delete policy here at all.
create policy "user_credits_select_own"
  on public.user_credits for select
  to authenticated
  using (auth.uid() = user_id);

create policy "credit_transactions_select_own"
  on public.credit_transactions for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- credit_purchase — called by the Stripe webhook (service_role) after a
-- verified one-time credits payment. Idempotent: a retried webhook
-- delivery for the same payment_intent is a no-op, enforced by the
-- partial unique index above rather than a read-then-write check, so it
-- holds even under concurrent retries.
-- ---------------------------------------------------------------------
create or replace function public.credit_purchase(
  p_user_id uuid,
  p_amount integer,
  p_stripe_payment_intent_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  insert into public.credit_transactions (user_id, amount, type, stripe_payment_intent_id)
  values (p_user_id, p_amount, 'purchase', p_stripe_payment_intent_id)
  on conflict (stripe_payment_intent_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    -- Already recorded this exact Stripe payment_intent — idempotent no-op.
    return;
  end if;

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + excluded.balance,
        updated_at = now();
end;
$$;

revoke all on function public.credit_purchase(uuid, integer, text) from public;
grant execute on function public.credit_purchase(uuid, integer, text) to service_role;

-- ---------------------------------------------------------------------
-- consume_deep_analysis_credit — called by the analyze-* Edge Functions
-- (service_role client) right before starting a deep analysis. p_user_id
-- always comes from a verified JWT via supabase.auth.getUser() inside the
-- Edge Function — never from the request body — so this is safe to trust
-- despite taking it as a plain parameter. Atomic: the UPDATE ... WHERE
-- balance > 0 both checks and decrements in one statement, so two
-- concurrent calls for the same user can't both succeed against a
-- balance of 1 (Postgres serializes the row lock). Raises
-- insufficient_credits if the balance was already 0.
-- ---------------------------------------------------------------------
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
  update public.user_credits
     set balance = balance - 1,
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

-- ---------------------------------------------------------------------
-- refund_deep_analysis_credit — called by the same Edge Functions only
-- when a credit was consumed but the deep analysis then failed (AI
-- error) before producing a result, so the user isn't charged for a
-- failure outside their control. Granted to service_role only (NOT
-- authenticated) — if a plain user could call this directly, they could
-- mint free credits by calling it repeatedly with a fake analysis id.
-- ---------------------------------------------------------------------
create or replace function public.refund_deep_analysis_credit(
  p_user_id uuid,
  p_analysis_id text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_credits
     set balance = balance + 1,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, type, related_analysis_id)
  values (p_user_id, 1, 'refund', p_analysis_id);
end;
$$;

revoke all on function public.refund_deep_analysis_credit(uuid, text) from public;
grant execute on function public.refund_deep_analysis_credit(uuid, text) to service_role;
