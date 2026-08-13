-- Shared pool of Polymarket wallets we track (like selected_markets, not
-- user-scoped) — some discovered automatically by sync-smart-money, some
-- added by a user via an address (source = 'user_added'), after which
-- they're tracked for everyone, not just the user who added them.
create table if not exists public.tracked_wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null unique check (address ~ '^0x[a-fA-F0-9]{40}$'),
  label text not null,
  source text not null default 'discovered' check (source in ('discovered', 'user_added')),
  added_by uuid references auth.users (id) on delete set null,
  total_value numeric not null default 0,
  change_percent numeric not null default 0,
  active_positions_count integer not null default 0,
  markets_tracked_count integer not null default 0,
  positions jsonb not null default '[]'::jsonb,
  recent_movements jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tracked_wallets_total_value_idx
  on public.tracked_wallets (total_value desc);

alter table public.tracked_wallets enable row level security;

create policy "Authenticated users can view tracked wallets"
  on public.tracked_wallets for select
  to authenticated
  using (true);

create policy "Authenticated users can add a wallet to track"
  on public.tracked_wallets for insert
  to authenticated
  with check (source = 'user_added' and added_by = auth.uid());

-- No update/delete policy for anon/authenticated: refreshing a wallet's
-- value/positions/movements only ever happens from sync-smart-money via
-- the service role key.

-- Time series of a tracked wallet's value, one row per sync — powers the
-- "évolution" chart and lets change_percent be computed against an actual
-- past value instead of guessed.
create table if not exists public.wallet_snapshots (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  total_value numeric not null,
  snapshotted_at timestamptz not null default now()
);

create index if not exists wallet_snapshots_wallet_id_snapshotted_at_idx
  on public.wallet_snapshots (wallet_id, snapshotted_at);

alter table public.wallet_snapshots enable row level security;

create policy "Authenticated users can view wallet snapshots"
  on public.wallet_snapshots for select
  to authenticated
  using (true);

-- Which wallets a given user follows — this is the one genuinely
-- user-scoped piece of Smart Money data.
create table if not exists public.user_wallet_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, wallet_id)
);

create index if not exists user_wallet_follows_user_id_idx
  on public.user_wallet_follows (user_id);

alter table public.user_wallet_follows enable row level security;

create policy "Users can view their own wallet follows"
  on public.user_wallet_follows for select
  using (auth.uid() = user_id);

create policy "Users can follow a wallet"
  on public.user_wallet_follows for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow a wallet"
  on public.user_wallet_follows for delete
  using (auth.uid() = user_id);
