-- "Smart Wallets" universe: wallets/trades sourced from Fomo/Axiom-style
-- memecoin trading terminals (Solana SPL tokens), never Polymarket. This is
-- deliberately a separate table family from tracked_wallets /
-- copy_trading_strategies / copy_trading_suggestions (the existing
-- Polymarket-only Smart Money + Copy Trading feature, which this migration
-- does not touch): those tables constrain address to
-- '^0x[a-fA-F0-9]{40}$' (Ethereum/Polygon) and frame every trade as a
-- YES/NO Polymarket position, neither of which fits a Solana memecoin
-- wallet buying/selling SPL tokens. Same reasoning that kept the Sport
-- universe (sports_fixtures_cache, sports_bet_analyses, ...) off the
-- Polymarket tables it sits next to in the product.
--
-- data_source_mode is the load-bearing column of this whole migration: it
-- is how "real data" and "demonstration data" stay structurally impossible
-- to confuse (see the brief's non-negotiable rule against inventing
-- win rates / PnL / trades). Every row written by the current
-- sync-signal-wallets Edge Function is 'mock' because neither Fomo nor
-- Axiom expose a documented public/commercial API today — see that
-- function's file comment. A future 'live' provider writes 'live' rows
-- instead; the frontend always renders a demo-data banner for 'mock' rows
-- and never blends the two in one filtered view without labeling them.

create table if not exists public.signal_wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  chain text not null default 'solana',
  source text not null check (source in ('fomo', 'axiom')),
  label text not null,
  data_source_mode text not null default 'mock' check (data_source_mode in ('mock', 'live')),
  win_rate numeric,
  pnl_24h numeric,
  pnl_7d numeric,
  pnl_30d numeric,
  trades_count integer,
  polypips_score integer,
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  avg_hold_time_minutes integer,
  drawdown_percent numeric,
  tags jsonb not null default '[]'::jsonb,
  positions jsonb not null default '[]'::jsonb,
  recent_trades jsonb not null default '[]'::jsonb,
  discovered_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (address, chain)
);

create index if not exists signal_wallets_source_idx on public.signal_wallets (source);
create index if not exists signal_wallets_win_rate_idx on public.signal_wallets (win_rate desc);
create index if not exists signal_wallets_polypips_score_idx on public.signal_wallets (polypips_score desc);

alter table public.signal_wallets enable row level security;

create policy "Authenticated users can view signal wallets"
  on public.signal_wallets for select
  to authenticated
  using (true);

-- No insert/update/delete policy for anon/authenticated: rows are only
-- ever written by sync-signal-wallets (service role) — mirrors
-- tracked_wallets' own policy shape.

-- Individual trades a signal wallet has made — token BUY/SELL, never a
-- Polymarket YES/NO position. tx_hash + the unique constraint is how
-- sync-signal-wallets avoids re-processing the same on-chain trade twice
-- across runs (same dedupe pattern as copy_trading_suggestions'
-- (strategy_id, tx_hash)).
create table if not exists public.signal_wallet_trades (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.signal_wallets (id) on delete cascade,
  token_symbol text not null,
  token_address text,
  side text not null check (side in ('BUY', 'SELL')),
  amount_usd numeric not null,
  price numeric,
  market_cap numeric,
  liquidity numeric,
  volume_24h numeric,
  pnl numeric,
  tx_hash text not null,
  traded_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (wallet_id, tx_hash)
);

create index if not exists signal_wallet_trades_wallet_id_traded_at_idx
  on public.signal_wallet_trades (wallet_id, traded_at desc);

alter table public.signal_wallet_trades enable row level security;

create policy "Authenticated users can view signal wallet trades"
  on public.signal_wallet_trades for select
  to authenticated
  using (true);

-- Which signal wallets a given user follows — the user-scoped piece,
-- mirrors user_wallet_follows exactly.
create table if not exists public.user_signal_wallet_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.signal_wallets (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, wallet_id)
);

create index if not exists user_signal_wallet_follows_user_id_idx
  on public.user_signal_wallet_follows (user_id);

alter table public.user_signal_wallet_follows enable row level security;

create policy "Users can view their own signal wallet follows"
  on public.user_signal_wallet_follows for select
  using (auth.uid() = user_id);

create policy "Users can follow a signal wallet"
  on public.user_signal_wallet_follows for insert
  with check (auth.uid() = user_id);

create policy "Users can unfollow a signal wallet"
  on public.user_signal_wallet_follows for delete
  using (auth.uid() = user_id);

-- Per-user, per-wallet Copy Trading risk envelope. enabled=false until the
-- user explicitly hits "Activer le Copy Trading" — following a wallet
-- alone never turns this on. The Risk Engine (sync-signal-wallets) reads
-- these limits on every fresh trade and they are ALWAYS enforced,
-- independent of whatever the AI Engine's score says — see that
-- function's applyRiskEngine().
create table if not exists public.signal_copy_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.signal_wallets (id) on delete cascade,
  enabled boolean not null default false,
  max_position_amount numeric not null,
  position_percent numeric not null,
  max_daily_amount numeric not null,
  max_simultaneous_positions integer not null,
  max_slippage_percent numeric not null,
  excluded_tokens jsonb not null default '[]'::jsonb,
  max_loss_amount numeric,
  auto_stop boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_id)
);

create index if not exists signal_copy_settings_user_id_idx on public.signal_copy_settings (user_id);
create index if not exists signal_copy_settings_enabled_idx on public.signal_copy_settings (enabled);

alter table public.signal_copy_settings enable row level security;

create policy "Users can view their own copy settings"
  on public.signal_copy_settings for select
  using (auth.uid() = user_id);

create policy "Users can create their own copy settings"
  on public.signal_copy_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own copy settings"
  on public.signal_copy_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own copy settings"
  on public.signal_copy_settings for delete
  using (auth.uid() = user_id);

-- The full decision + lifecycle log for one wallet trade under Copy
-- Trading: AI Engine score, Risk Engine checks (always logged, even when
-- they weren't the deciding factor), COPY/IGNORE decision, and the
-- simulated position's status through to close. execution_mode is 'demo'
-- on every row today — there is no 'live' execution path wired up (no
-- official Fomo/Axiom API, no wallet-signing integration); see
-- sync-signal-wallets's file comment. This is never silently mixed with a
-- real order: the column exists precisely so a real integration later
-- can't be confused with what's here now.
create table if not exists public.signal_copy_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.signal_wallets (id) on delete cascade,
  settings_id uuid references public.signal_copy_settings (id) on delete set null,
  source_trade_id uuid references public.signal_wallet_trades (id) on delete set null,
  token_symbol text not null,
  token_address text,
  wallet_trade_side text not null check (wallet_trade_side in ('BUY', 'SELL')),
  wallet_trade_amount numeric not null,
  ai_score integer,
  ai_summary text,
  ai_positives jsonb not null default '[]'::jsonb,
  ai_risks jsonb not null default '[]'::jsonb,
  risk_checks jsonb not null default '[]'::jsonb,
  decision text not null check (decision in ('copie', 'ignore')),
  ignore_reason text,
  sized_amount numeric,
  entry_price numeric,
  status text not null default 'detection' check (
    status in ('detection', 'analyse', 'en_attente', 'copie', 'ignore', 'en_cours', 'ferme', 'echec')
  ),
  execution_mode text not null default 'demo' check (execution_mode in ('demo', 'live')),
  closed_pnl numeric,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (wallet_id, source_trade_id, user_id)
);

create index if not exists signal_copy_trades_user_id_created_at_idx
  on public.signal_copy_trades (user_id, created_at desc);
create index if not exists signal_copy_trades_status_idx
  on public.signal_copy_trades (status);

alter table public.signal_copy_trades enable row level security;

create policy "Users can view their own copy trades"
  on public.signal_copy_trades for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for anon/authenticated: every row is
-- written by sync-signal-wallets (service role) — the whole point of the
-- decision log is that it's the system's own record, not user-editable.

-- Analyse IA (Fomo/Axiom) results — the pasted-link/screenshot/manual
-- analysis feature on the Analyse IA page, mirrors sports_bet_analyses'
-- shape and its own separate daily quota.
create table if not exists public.signal_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('fomo', 'axiom')),
  input_mode text not null check (input_mode in ('link', 'image', 'manual')),
  link_url text,
  wallet_address text,
  token_symbol text,
  side text check (side in ('BUY', 'SELL')),
  amount_usd numeric,
  price numeric,
  market_cap numeric,
  liquidity numeric,
  volume_24h numeric,
  polypips_score integer not null,
  summary text not null,
  positives jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  key_data jsonb not null default '{}'::jsonb,
  conclusion text not null,
  decision text check (decision in ('copie', 'ignore')),
  created_at timestamptz not null default now()
);

create index if not exists signal_ai_analyses_user_id_created_at_idx
  on public.signal_ai_analyses (user_id, created_at desc);

alter table public.signal_ai_analyses enable row level security;

create policy "Users can view their own signal analyses"
  on public.signal_ai_analyses for select
  using (auth.uid() = user_id);

create policy "Users can create their own signal analyses"
  on public.signal_ai_analyses for insert
  with check (auth.uid() = user_id);

-- Dedupe for the plain "wallet you follow just traded" notification (no
-- Copy Trading configured) — mirrors wallet_follow_notifications' own
-- (user_id, wallet_id, tx_hash)-shaped uniqueness so a trade can't
-- double-notify the same follower across sync runs. Fully independent of
-- signal_copy_trades: a followed wallet with Copy Trading OFF only ever
-- gets this notification, never a copy decision log entry.
create table if not exists public.signal_wallet_follow_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.signal_wallets (id) on delete cascade,
  tx_hash text not null,
  notification_id uuid references public.notifications (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, wallet_id, tx_hash)
);

create index if not exists signal_wallet_follow_notifications_user_id_idx
  on public.signal_wallet_follow_notifications (user_id);

alter table public.signal_wallet_follow_notifications enable row level security;

create policy "Users can view their own signal wallet follow notifications"
  on public.signal_wallet_follow_notifications for select
  using (auth.uid() = user_id);
