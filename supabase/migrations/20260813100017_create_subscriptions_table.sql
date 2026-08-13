create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('decouverte', 'pro', 'pro-plus')),
  status text not null check (status in ('trialing', 'active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for anon/authenticated roles:
-- a user's subscription state only ever changes in reaction to a Stripe
-- event, so only the webhook route (using the service role key, which
-- bypasses RLS) may write here.
