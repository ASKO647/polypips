-- Adds Whop as a second payment provider alongside Stripe, without
-- touching a single existing Stripe row. Every new column is nullable
-- and every existing row keeps provider='stripe' (the column default),
-- so this is purely additive. Nothing here removes Stripe support — see
-- PAYMENT_PROVIDER in src/lib/payments/config.ts for the runtime switch.
--
-- NOT applied automatically — review and run by hand (Supabase SQL editor
-- or `supabase db push`), in the order the 3 new migration files are
-- numbered (this one has no ordering dependency on the other two from
-- the previous delivery, 20261022090000/091000/092000, but must run
-- before the Whop webhook/checkout code is deployed).

-- ---------------------------------------------------------------------
-- subscriptions: which provider this row came from, plus Whop's own ids.
-- stripe_customer_id/stripe_subscription_id stay exactly as they are
-- (still unique, still nullable) — a Whop row simply leaves them null,
-- and a Stripe row leaves the new whop_* columns null. Postgres unique
-- constraints never collide on multiple NULLs, so both kinds of rows
-- coexist safely under the existing unique constraints.
-- ---------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists provider text not null default 'stripe'
    check (provider in ('stripe', 'whop'));

alter table public.subscriptions
  add column if not exists whop_membership_id text unique;

alter table public.subscriptions
  add column if not exists whop_plan_id text;

-- Whop's own user id for this member (distinct from our auth.users id,
-- which lives in user_id already) — kept for traceability when
-- investigating a webhook payload by hand, never used for access logic.
alter table public.subscriptions
  add column if not exists whop_member_id text;

-- "marque le compte" for a dispute, per the task's own instruction — the
-- owner console surfaces this; no automatic access change follows from
-- it alone (see the Whop webhook's dispute.created handler comment).
alter table public.subscriptions
  add column if not exists disputed boolean not null default false;

create index if not exists subscriptions_whop_membership_id_idx
  on public.subscriptions (whop_membership_id);

-- ---------------------------------------------------------------------
-- credit_transactions: same idempotency pattern as
-- stripe_payment_intent_id, for Whop credit-pack purchases.
-- ---------------------------------------------------------------------
alter table public.credit_transactions
  add column if not exists whop_payment_id text;

create unique index if not exists credit_transactions_whop_payment_id_key
  on public.credit_transactions (whop_payment_id)
  where whop_payment_id is not null;

-- credit_purchase gains an optional p_whop_payment_id parameter (default
-- null) rather than a second function — every existing call site
-- (Stripe's webhook) keeps working unchanged since it never passes this
-- new argument. Exactly one of the two id parameters is expected to be
-- non-null per call; the idempotency guard below covers whichever one is
-- actually provided.
--
-- The old 3-parameter signature must be dropped first: Postgres
-- identifies a function by name + parameter TYPES, so adding a 4th
-- parameter (even with a default) creates a distinct overload rather
-- than replacing the old one — left in place, the old 3-arg function and
-- the new 4-arg-with-defaults one would both match a plain 3-argument
-- call and Postgres would raise "function is not unique". Dropping it
-- here keeps exactly one version, so every existing 3-argument call site
-- keeps resolving unambiguously.
drop function if exists public.credit_purchase(uuid, integer, text);

create or replace function public.credit_purchase(
  p_user_id uuid,
  p_amount integer,
  p_stripe_payment_intent_id text default null,
  p_whop_payment_id text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if p_stripe_payment_intent_id is not null then
    insert into public.credit_transactions (user_id, amount, type, stripe_payment_intent_id)
    values (p_user_id, p_amount, 'purchase', p_stripe_payment_intent_id)
    on conflict (stripe_payment_intent_id) do nothing;
  elsif p_whop_payment_id is not null then
    insert into public.credit_transactions (user_id, amount, type, whop_payment_id)
    values (p_user_id, p_amount, 'purchase', p_whop_payment_id)
    on conflict (whop_payment_id) do nothing;
  else
    raise exception 'credit_purchase requires either p_stripe_payment_intent_id or p_whop_payment_id';
  end if;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    -- Already recorded this exact payment id — idempotent no-op.
    return;
  end if;

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + excluded.balance,
        updated_at = now();
end;
$$;

revoke all on function public.credit_purchase(uuid, integer, text, text) from public;
grant execute on function public.credit_purchase(uuid, integer, text, text) to service_role;

-- ---------------------------------------------------------------------
-- whop_webhook_events: idempotency ledger for the Whop webhook (Stripe's
-- own webhook has no equivalent table — it relies on the idempotency of
-- each individual RPC/upsert instead; Whop gets an explicit ledger here
-- since the task calls for deduplication by webhook-id specifically).
-- Also doubles as the owner console's local record of real Whop payment/
-- refund/dispute events (src/lib/supabase/owner-whop-reports.ts reads
-- this), since there is no Whop-equivalent of Stripe's
-- charges.list()/refunds.list() wired up here (see the delivery report).
-- RLS enabled with NO policies at all — service-role only, same pattern
-- as ai_usage_events.
-- ---------------------------------------------------------------------
create table if not exists public.whop_webhook_events (
  webhook_id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists whop_webhook_events_type_idx
  on public.whop_webhook_events (type);

create index if not exists whop_webhook_events_received_at_idx
  on public.whop_webhook_events (received_at desc);

alter table public.whop_webhook_events enable row level security;
