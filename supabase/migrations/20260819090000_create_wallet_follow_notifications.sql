-- Tracks which on-chain moves have already been turned into a "wallet you
-- follow just traded" notification, independent of Copy Trading — a plain
-- follow (user_wallet_follows) now gets notified on every fresh movement
-- from sync-smart-money, with no strategy/risk-parameter configuration
-- required. Mirrors copy_trading_suggestions' own (strategy_id, tx_hash)
-- dedupe pattern so a wallet's move can't double-notify the same follower
-- across runs, but is otherwise fully independent of the copy-trading
-- tables — deleting or pausing a strategy must never affect this.
create table if not exists public.wallet_follow_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  tx_hash text not null,
  notification_id uuid references public.notifications (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, wallet_id, tx_hash)
);

create index if not exists wallet_follow_notifications_user_id_idx
  on public.wallet_follow_notifications (user_id);

alter table public.wallet_follow_notifications enable row level security;

create policy "Users can view their own wallet follow notifications"
  on public.wallet_follow_notifications for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for anon/authenticated: rows are only
-- ever created by sync-smart-money via the service role key.
