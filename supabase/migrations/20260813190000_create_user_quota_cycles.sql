-- Anchors the "locked monthly quota" mechanism for Smart Money wallets and
-- Copy Trading strategies: while a user's stored period_end for a feature
-- still matches their subscription's live current_period_end, their
-- selection for that feature is locked at whatever count they've reached.
-- The moment the subscription actually renews (current_period_end moves
-- forward), the next check sees a mismatch, wipes the user's selection for
-- that feature, and re-anchors period_end to the new cycle — see
-- src/lib/supabase/quota-cycles.ts for the read/reset logic. Users with no
-- real Stripe subscription (no current_period_end to anchor to) never get
-- a row here and the lock is skipped entirely, since there's no real
-- renewal date to lock against or display.
create table if not exists public.user_quota_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in ('wallets', 'copy_trading')),
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature)
);

create index if not exists user_quota_cycles_user_id_idx
  on public.user_quota_cycles (user_id);

alter table public.user_quota_cycles enable row level security;

create policy "Users can view their own quota cycles"
  on public.user_quota_cycles for select
  using (auth.uid() = user_id);

create policy "Users can set their own quota cycle anchor"
  on public.user_quota_cycles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quota cycle anchor"
  on public.user_quota_cycles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
