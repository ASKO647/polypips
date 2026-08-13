-- Generic notification inbox, reused by the header bell for any
-- notification type (copy-trading suggestions today, others later).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  link_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No insert policy for anon/authenticated: notifications are only ever
-- created by sync-smart-money (service role) today.

-- One strategy = one followed wallet a user has configured risk
-- parameters for and turned on/off. Copy trading here means suggestion +
-- alert, never automatic execution — see copy_trading_suggestions.
create table if not exists public.copy_trading_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused')),
  max_position_amount numeric not null,
  max_exposure_percent numeric not null,
  max_simultaneous_positions integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_id)
);

create index if not exists copy_trading_strategies_user_id_idx
  on public.copy_trading_strategies (user_id);

create index if not exists copy_trading_strategies_status_idx
  on public.copy_trading_strategies (status);

alter table public.copy_trading_strategies enable row level security;

create policy "Users can view their own strategies"
  on public.copy_trading_strategies for select
  using (auth.uid() = user_id);

create policy "Users can create their own strategies"
  on public.copy_trading_strategies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own strategies"
  on public.copy_trading_strategies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own strategies"
  on public.copy_trading_strategies for delete
  using (auth.uid() = user_id);

-- A system-generated alert: "this wallet made a move matching your
-- strategy's risk parameters" — never an executed trade. tx_hash + the
-- unique constraint below is how sync-smart-money avoids re-alerting on
-- the same on-chain move every time it runs.
create table if not exists public.copy_trading_suggestions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.copy_trading_strategies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  market_question text not null,
  market_url text not null,
  side text not null check (side in ('YES', 'NO')),
  amount numeric not null,
  tx_hash text not null,
  status text not null default 'nouvelle' check (status in ('nouvelle', 'vue', 'lien_cliquee')),
  notification_id uuid references public.notifications (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (strategy_id, tx_hash)
);

create index if not exists copy_trading_suggestions_strategy_id_created_at_idx
  on public.copy_trading_suggestions (strategy_id, created_at desc);

alter table public.copy_trading_suggestions enable row level security;

create policy "Users can view their own suggestions"
  on public.copy_trading_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can update the status of their own suggestions"
  on public.copy_trading_suggestions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No insert policy for anon/authenticated: suggestions are only ever
-- created by sync-smart-money (service role).
