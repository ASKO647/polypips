-- ============================================================================
-- POLYPIPS — SCRIPT DE RATTRAPAGE PRODUCTION (iybhrrzllvggbwgwkufh)
-- ============================================================================
--
-- NE PAS appliquer automatiquement. À coller à la main dans le SQL Editor
-- Supabase. Reconstitue l'état final attendu du schéma `public` à partir de
-- la lecture intégrale, dans l'ordre, de toutes les migrations du dépôt
-- (supabase/migrations/), y compris :
--   - les colonnes/contraintes ajoutées ou modifiées après la création
--     initiale d'une table (ex: subscriptions.plan, credit_transactions.type,
--     analyses.decision) ;
--   - les tables/fonctions/buckets Coach IA et Communauté (v1 "groups" et v2
--     "community_*"), qui ont été créées puis explicitement supprimées par
--     20261021120000_drop_coach_and_community.sql — AUCUNE d'entre elles
--     n'est recréée ici, intentionnellement ;
--   - le contenu final (après ses propres corrections) de
--     20261022100000_add_whop_payment_provider.sql, repris à la fin de ce
--     fichier.
--
-- IDEMPOTENT : chaque instruction peut être rejouée sans erreur sur une base
-- déjà partiellement à jour — create table/add column/create index "if not
-- exists", "drop constraint/policy/trigger if exists" avant tout ajout,
-- fonctions en "create or replace", upserts sur les buckets de stockage,
-- garde explicite (bloc DO + test sur pg_publication_tables) avant tout
-- "alter publication ... add table" (cette instruction échoue si la table
-- est déjà membre de la publication — la seule opération de ce fichier qui
-- n'est pas nativement idempotente).
--
-- Chaque instruction DDL est individuellement sans danger à rejouer, mais la
-- transaction n'est PAS idempotente au sens strict si vous l'interrompez en
-- plein milieu puis la relancez entièrement : relancez-la simplement, chaque
-- ligne se comporte correctement face à l'état qu'elle trouve.
--
-- Testé localement (PostgreSQL 16) contre un schéma reconstituant au minimum
-- auth.users / storage.buckets / storage.objects / storage.foldername() /
-- la publication supabase_realtime — voir le rapport de livraison pour le
-- détail de ce qui a pu, et n'a pas pu, être vérifié de cette façon.
-- ============================================================================

begin;

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
-- Nécessaires au schéma (aucune planification de cron n'est créée ici — voir
-- la règle 5 de la demande : pas de job cron, pas de secret).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ============================================================================
-- 1. TABLES — forme d'origine (create table if not exists), puis colonnes
--    ajoutées plus tard (alter table add column if not exists). Les deux
--    sont systématiques même pour les tables déjà présentes en production :
--    "create table if not exists" ne touche pas une table déjà existante,
--    donc les colonnes ajoutées après coup doivent être rattrapées par des
--    ALTER explicites, qu'elle existe déjà ou qu'elle vienne d'être créée
--    ci-dessus dans la même transaction.
-- ============================================================================

-- --- analyses ----------------------------------------------------------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  category text not null default 'Marché',
  market_url text,
  decision text not null,
  ai_probability numeric not null,
  market_probability numeric not null,
  edge numeric not null,
  opportunity_score numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

alter table public.analyses enable row level security;

alter table public.analyses
  add column if not exists market_slug text,
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_outcome text,
  add column if not exists resolved_correct boolean,
  add column if not exists resolved_at timestamptz,
  add column if not exists outcomes text[] not null default '{}'::text[],
  add column if not exists is_deep boolean not null default false;

create index if not exists analyses_unresolved_idx
  on public.analyses (created_at)
  where resolved = false;

-- --- subscriptions -------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null,
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

alter table public.subscriptions
  add column if not exists converted_from_trial boolean not null default false,
  add column if not exists converted_at timestamptz;

-- --- selected_markets ------------------------------------------------------
create table if not exists public.selected_markets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  market_url text not null,
  question text not null,
  category text not null default 'Marché',
  decision text not null,
  ai_probability numeric not null,
  market_probability numeric not null,
  edge numeric not null,
  opportunity_score numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  sources jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists selected_markets_scanned_at_idx
  on public.selected_markets (scanned_at desc);
create index if not exists selected_markets_opportunity_score_idx
  on public.selected_markets (opportunity_score desc);

alter table public.selected_markets enable row level security;

alter table public.selected_markets
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_outcome text,
  add column if not exists resolved_correct boolean,
  add column if not exists resolved_at timestamptz,
  add column if not exists outcomes text[] not null default '{}'::text[];

create index if not exists selected_markets_unresolved_idx
  on public.selected_markets (scanned_at)
  where resolved = false;

-- --- tracked_wallets / wallet_snapshots / user_wallet_follows ---------------
create table if not exists public.tracked_wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null unique check (address ~ '^0x[a-fA-F0-9]{40}$'),
  label text not null,
  source text not null default 'discovered' check (source in ('discovered', 'user_added')),
  added_by uuid references auth.users (id) on delete set null,
  total_value numeric not null default 0,
  change_percent numeric,
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

alter table public.tracked_wallets
  add column if not exists win_rate numeric,
  add column if not exists roi_percent numeric,
  add column if not exists consistency_score integer,
  add column if not exists category_diversity integer,
  add column if not exists avg_position_size numeric,
  add column if not exists risk_level text,
  add column if not exists track_record_days integer;

alter table public.tracked_wallets alter column change_percent drop not null;
alter table public.tracked_wallets alter column change_percent drop default;

create table if not exists public.wallet_snapshots (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.tracked_wallets (id) on delete cascade,
  total_value numeric not null,
  snapshotted_at timestamptz not null default now()
);

create index if not exists wallet_snapshots_wallet_id_snapshotted_at_idx
  on public.wallet_snapshots (wallet_id, snapshotted_at);

alter table public.wallet_snapshots enable row level security;

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

-- --- notifications / copy_trading_strategies / copy_trading_suggestions ----
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

alter table public.copy_trading_strategies
  add column if not exists max_budget numeric not null default 500,
  add column if not exists risk_level text not null default 'medium';

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

alter table public.copy_trading_suggestions
  add column if not exists original_amount numeric,
  add column if not exists decision text not null default 'copied',
  add column if not exists ignore_reason text,
  add column if not exists entry_price_original numeric,
  add column if not exists entry_price_current numeric,
  add column if not exists market_probability numeric,
  add column if not exists ai_probability numeric,
  add column if not exists edge numeric,
  add column if not exists opportunity_score integer,
  add column if not exists confidence text;

create index if not exists copy_trading_suggestions_decision_idx
  on public.copy_trading_suggestions (strategy_id, decision);

-- --- user_quota_cycles -------------------------------------------------------
create table if not exists public.user_quota_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature)
);

create index if not exists user_quota_cycles_user_id_idx
  on public.user_quota_cycles (user_id);

alter table public.user_quota_cycles enable row level security;

-- --- wallet_follow_notifications --------------------------------------------
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

-- --- admin_audit_log ---------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  result text not null check (result in ('granted', 'denied', 'success', 'failure')),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  ip text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_user_id_idx
  on public.admin_audit_log (user_id);

alter table public.admin_audit_log enable row level security;

comment on table public.admin_audit_log is
  'Owner console audit trail: access attempts and sensitive actions. Written only by server-only owner code via the service-role client.';

-- --- signup_sources -----------------------------------------------------------
create table if not exists public.signup_sources (
  user_id uuid primary key references auth.users (id) on delete cascade,
  utm_source text not null default 'direct',
  utm_medium text,
  utm_campaign text,
  landing_path text,
  created_at timestamptz not null default now()
);

create index if not exists signup_sources_utm_source_idx
  on public.signup_sources (utm_source);

alter table public.signup_sources enable row level security;

-- --- influencers / influencer_referrals ---------------------------------------
create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code_promo text unique,
  tracking_slug text unique,
  commission_type text not null check (commission_type in ('percent', 'fixed')),
  commission_value numeric not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  constraint influencers_has_attribution_method
    check (code_promo is not null or tracking_slug is not null),
  constraint influencers_commission_value_sane
    check (
      (commission_type = 'percent' and commission_value > 0 and commission_value <= 100)
      or (commission_type = 'fixed' and commission_value > 0)
    ),
  constraint influencers_tracking_slug_format
    check (tracking_slug is null or tracking_slug ~ '^[a-z0-9-]+$')
);

alter table public.influencers enable row level security;

create table if not exists public.influencer_referrals (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  referred_via text not null check (referred_via in ('code', 'link')),
  converted_to_paid boolean not null default false,
  converted_at timestamptz,
  subscription_amount numeric,
  commission_amount numeric,
  commission_status text not null default 'pending' check (commission_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create index if not exists influencer_referrals_influencer_id_idx
  on public.influencer_referrals (influencer_id);

alter table public.influencer_referrals enable row level security;

-- --- sports_match_follows / sports_team_follows ------------------------------
create table if not exists public.sports_match_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists sports_match_follows_user_id_idx
  on public.sports_match_follows (user_id);

alter table public.sports_match_follows enable row level security;

create table if not exists public.sports_team_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

create index if not exists sports_team_follows_user_id_idx
  on public.sports_team_follows (user_id);

alter table public.sports_team_follows enable row level security;

-- --- sports_competitions_cache / sports_teams_cache / sports_fixtures_cache --
create table if not exists public.sports_competitions_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  search_term text,
  external_league_id bigint,
  name text,
  country text,
  logo_url text,
  flag_url text,
  season text,
  resolved_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists sports_competitions_cache_sport_idx
  on public.sports_competitions_cache (sport);

alter table public.sports_competitions_cache enable row level security;

-- search_term was NOT NULL + unique(sport, search_term) at creation, then
-- loosened once the catalog sync switched to keying by external_league_id —
-- both statements are safe to rerun regardless of which state is found.
alter table public.sports_competitions_cache
  drop constraint if exists sports_competitions_cache_sport_search_term_key;
alter table public.sports_competitions_cache
  alter column search_term drop not null;

create unique index if not exists sports_competitions_cache_sport_league_key
  on public.sports_competitions_cache (sport, external_league_id)
  where external_league_id is not null;

create table if not exists public.sports_teams_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  external_team_id bigint not null,
  name text not null,
  country text,
  logo_url text,
  synced_at timestamptz not null default now(),
  unique (sport, external_team_id)
);

create index if not exists sports_teams_cache_sport_idx
  on public.sports_teams_cache (sport);

alter table public.sports_teams_cache enable row level security;

create table if not exists public.sports_fixtures_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  external_fixture_id bigint not null,
  competition_id uuid not null references public.sports_competitions_cache (id) on delete cascade,
  home_team_external_id bigint not null,
  home_team_name text not null,
  home_team_logo_url text,
  away_team_external_id bigint not null,
  away_team_name text not null,
  away_team_logo_url text,
  kickoff_at timestamptz not null,
  status text not null default 'scheduled',
  synced_at timestamptz not null default now(),
  unique (sport, external_fixture_id)
);

create index if not exists sports_fixtures_cache_sport_kickoff_idx
  on public.sports_fixtures_cache (sport, kickoff_at);
create index if not exists sports_fixtures_cache_competition_idx
  on public.sports_fixtures_cache (competition_id);

alter table public.sports_fixtures_cache enable row level security;

-- --- sports_bet_analyses -------------------------------------------------------
create table if not exists public.sports_bet_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport text not null,
  participants text not null,
  bet_type text,
  selection text,
  bookmaker_odds text,
  ai_probability numeric not null,
  bookmaker_implied_probability numeric,
  edge numeric,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  created_at timestamptz not null default now()
);

create index if not exists sports_bet_analyses_user_id_created_at_idx
  on public.sports_bet_analyses (user_id, created_at desc);

alter table public.sports_bet_analyses enable row level security;

alter table public.sports_bet_analyses
  alter column bet_type drop not null,
  alter column selection drop not null,
  alter column bookmaker_odds drop not null,
  alter column bookmaker_implied_probability drop not null,
  alter column edge drop not null;

alter table public.sports_bet_analyses
  add column if not exists competition text,
  add column if not exists match_date timestamptz,
  add column if not exists predicted_winner text,
  add column if not exists secondary_markets jsonb not null default '[]'::jsonb,
  add column if not exists is_deep boolean not null default false;

-- --- signal_wallets / signal_wallet_trades / user_signal_wallet_follows /
--     signal_copy_settings / signal_copy_trades / signal_ai_analyses /
--     signal_wallet_follow_notifications -----------------------------------
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_id)
);

create index if not exists signal_copy_settings_user_id_idx on public.signal_copy_settings (user_id);
create index if not exists signal_copy_settings_enabled_idx on public.signal_copy_settings (enabled);

alter table public.signal_copy_settings enable row level security;

-- max_loss_amount/auto_stop existed only transiently (same migration that
-- introduced the simulated-position lifecycle this table never actually
-- grew into) — dropped here defensively in case an earlier partial apply
-- ever added them; a no-op otherwise.
alter table public.signal_copy_settings
  drop column if exists max_loss_amount,
  drop column if exists auto_stop;

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
  status text not null default 'nouvelle',
  created_at timestamptz not null default now(),
  unique (wallet_id, source_trade_id, user_id)
);

create index if not exists signal_copy_trades_user_id_created_at_idx
  on public.signal_copy_trades (user_id, created_at desc);
create index if not exists signal_copy_trades_status_idx
  on public.signal_copy_trades (status);

alter table public.signal_copy_trades enable row level security;

-- execution_mode/closed_pnl/opened_at/closed_at tracked a simulated
-- position's lifecycle that this table never kept — dropped defensively,
-- a no-op if they were never added.
alter table public.signal_copy_trades
  drop column if exists execution_mode,
  drop column if exists closed_pnl,
  drop column if exists opened_at,
  drop column if exists closed_at;

alter table public.signal_copy_trades alter column status set default 'nouvelle';

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

-- --- odds_api_competitions_cache / odds_api_matches_cache / football_odds_cache
create table if not exists public.odds_api_competitions_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  odds_api_sport_key text not null,
  circuit text not null,
  title text not null,
  active boolean not null default true,
  synced_at timestamptz not null default now(),
  unique (sport, odds_api_sport_key)
);

create index if not exists odds_api_competitions_cache_sport_idx
  on public.odds_api_competitions_cache (sport);

alter table public.odds_api_competitions_cache enable row level security;

create table if not exists public.odds_api_matches_cache (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  competition_id uuid not null references public.odds_api_competitions_cache (id) on delete cascade,
  odds_api_event_id text not null,
  player_home text not null,
  player_away text not null,
  commence_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'finished')),
  synced_at timestamptz not null default now(),
  unique (sport, odds_api_event_id)
);

create index if not exists odds_api_matches_cache_sport_commence_idx
  on public.odds_api_matches_cache (sport, commence_at);
create index if not exists odds_api_matches_cache_competition_idx
  on public.odds_api_matches_cache (competition_id);

alter table public.odds_api_matches_cache enable row level security;

create table if not exists public.football_odds_cache (
  id uuid primary key default gen_random_uuid(),
  external_fixture_id bigint not null unique,
  odds_api_event_id text not null,
  odds_api_sport_key text not null,
  commence_at timestamptz not null,
  bookmakers jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists football_odds_cache_commence_at_idx
  on public.football_odds_cache (commence_at);

alter table public.football_odds_cache enable row level security;

-- --- pips_track_events / user_pips_track_alerts ------------------------------
create table if not exists public.pips_track_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('fomo', 'axiom', 'x', 'news')),
  event_type text not null check (
    event_type in ('trade_buy', 'trade_sell', 'signal_ia', 'wallet_active', 'news', 'x_post')
  ),
  title text not null,
  description text not null default '',
  token_symbol text,
  wallet_address text,
  wallet_label text,
  amount_usd numeric,
  price numeric,
  ai_score integer,
  ai_win_rate numeric,
  ai_impact text check (ai_impact in ('eleve', 'moyen', 'faible')),
  external_url text,
  data_source_mode text not null default 'mock' check (data_source_mode in ('mock', 'live')),
  source_trade_id uuid references public.signal_wallet_trades (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists pips_track_events_occurred_at_idx
  on public.pips_track_events (occurred_at desc);
create index if not exists pips_track_events_source_idx
  on public.pips_track_events (source, occurred_at desc);
create index if not exists pips_track_events_token_symbol_idx
  on public.pips_track_events (token_symbol, occurred_at desc);
create unique index if not exists pips_track_events_source_trade_id_key
  on public.pips_track_events (source_trade_id) where source_trade_id is not null;
create unique index if not exists pips_track_events_news_external_url_key
  on public.pips_track_events (external_url) where event_type = 'news';

alter table public.pips_track_events enable row level security;

create table if not exists public.user_pips_track_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_symbol text,
  min_amount_usd numeric,
  created_at timestamptz not null default now()
);

create index if not exists user_pips_track_alerts_user_id_idx
  on public.user_pips_track_alerts (user_id);

alter table public.user_pips_track_alerts enable row level security;

-- --- trading_chart_analyses ----------------------------------------------------
create table if not exists public.trading_chart_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  instrument text,
  timeframe text,
  recommendation text not null check (recommendation in ('Acheter', 'Vendre', 'Attendre')),
  take_profit text,
  stop_loss text,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  trend_analysis text not null,
  key_levels jsonb not null default '[]'::jsonb,
  indicators_observed jsonb not null default '[]'::jsonb,
  explanation text not null,
  risks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trading_chart_analyses_user_id_created_at_idx
  on public.trading_chart_analyses (user_id, created_at desc);

alter table public.trading_chart_analyses enable row level security;

alter table public.trading_chart_analyses
  add column if not exists is_deep boolean not null default false;

-- --- selected_sport_matches / selected_trading_analyses ------------------------
create table if not exists public.selected_sport_matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('football', 'basketball', 'tennis')),
  home_team_name text not null,
  away_team_name text not null,
  competition text,
  kickoff_at timestamptz not null,
  predicted_winner text not null,
  ai_probability numeric not null,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  explanation text not null,
  favorable_factors jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  what_could_change text not null,
  secondary_markets jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists selected_sport_matches_scanned_at_idx
  on public.selected_sport_matches (scanned_at desc);
create index if not exists selected_sport_matches_kickoff_at_idx
  on public.selected_sport_matches (kickoff_at asc);

alter table public.selected_sport_matches enable row level security;

create table if not exists public.selected_trading_analyses (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  display_symbol text not null,
  instrument text,
  timeframe text,
  recommendation text not null check (recommendation in ('Acheter', 'Vendre', 'Attendre')),
  take_profit text,
  stop_loss text,
  confidence text not null check (confidence in ('Faible', 'Moyenne', 'Élevée')),
  trend_analysis text not null,
  key_levels jsonb not null default '[]'::jsonb,
  indicators_observed jsonb not null default '[]'::jsonb,
  explanation text not null,
  risks jsonb not null default '[]'::jsonb,
  scanned_at timestamptz not null default now()
);

create index if not exists selected_trading_analyses_scanned_at_idx
  on public.selected_trading_analyses (scanned_at desc);

alter table public.selected_trading_analyses enable row level security;

-- --- user_credits / credit_transactions -----------------------------------------
create table if not exists public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_credits_balance_non_negative check (balance >= 0)
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  related_analysis_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_stripe_payment_intent_id_key
  on public.credit_transactions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

alter table public.user_credits
  add column if not exists plan_credits_balance integer not null default 0;

-- ============================================================================
-- 2. user_referral_links / user_referrals / tiktok_clip_submissions
-- ============================================================================
create table if not exists public.user_referral_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint user_referral_links_slug_format check (slug ~ '^[a-z0-9]+$')
);

alter table public.user_referral_links enable row level security;

create table if not exists public.user_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users (id) on delete cascade,
  referred_user_id uuid not null unique references auth.users (id) on delete cascade,
  referral_code text not null,
  converted_to_paid boolean not null default false,
  converted_at timestamptz,
  commission_amount numeric,
  commission_status text not null default 'pending' check (commission_status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  constraint user_referrals_no_self_referral check (referrer_user_id != referred_user_id)
);

create index if not exists user_referrals_referrer_user_id_idx
  on public.user_referrals (referrer_user_id);

alter table public.user_referrals enable row level security;

alter table public.user_referrals
  add column if not exists referrer_credited_at timestamptz;

create table if not exists public.tiktok_clip_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tiktok_url text not null,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'paid')),
  verified_views integer,
  rejection_reason text,
  payment_amount numeric,
  paid_at timestamptz
);

create index if not exists tiktok_clip_submissions_user_id_idx
  on public.tiktok_clip_submissions (user_id);

alter table public.tiktok_clip_submissions enable row level security;

-- ============================================================================
-- 3. user_settings
-- ============================================================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- ============================================================================
-- 4. ai_usage_events (margin protection — étape 4, cf. 20261022091000)
-- ============================================================================
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  function_name text not null,
  model text not null,
  kind text not null check (kind in ('standard', 'deep', 'scan', 'image_extraction')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric not null default 0,
  credit_source text not null check (credit_source in ('included', 'purchased', 'none')),
  analysis_id text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_id_created_at_idx
  on public.ai_usage_events (user_id, created_at desc);
create index if not exists ai_usage_events_created_at_idx
  on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_kind_idx
  on public.ai_usage_events (kind);

alter table public.ai_usage_events enable row level security;
-- Aucune policy pour authenticated/anon par conception — service role
-- uniquement (voir le commentaire de la migration d'origine).

-- ============================================================================
-- 5. CORRECTIFS DE DONNÉES (idempotents — DELETE/UPDATE sans effet si déjà
--    appliqués)
-- ============================================================================

-- Les deux seuls paliers payants restants avant la restructuration à 3 tiers
-- étaient 'decouverte'/'pro' ; toute ligne encore sur l'ancien tiers
-- 'pro-plus' (avec un trait d'union, supprimé depuis) doit être migrée vers
-- 'pro' avant que la contrainte finale (plus bas) ne la rejette.
update public.subscriptions set plan = 'pro' where plan = 'pro-plus';

delete from public.sports_fixtures_cache where sport = 'baseball';
delete from public.sports_teams_cache where sport = 'baseball';
delete from public.sports_competitions_cache where sport = 'baseball';

delete from public.odds_api_matches_cache
  where competition_id in (
    select id from public.odds_api_competitions_cache where sport in ('boxing', 'mma')
  );
delete from public.odds_api_competitions_cache where sport in ('boxing', 'mma');

delete from public.sports_competitions_cache
where season is not null
  and substring(season from '\d{4}') is not null
  and substring(season from '\d{4}')::int <= extract(year from now())::int - 2;

-- ============================================================================
-- 6. CONTRAINTES — toujours "drop constraint if exists" avant "add
--    constraint" avec le même nom final, pour rester rejouable quel que
--    soit l'état de départ.
-- ============================================================================

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('decouverte', 'pro', 'pro_plus', 'ultimate', 'pro_legacy'));

alter table public.analyses drop constraint if exists analyses_decision_check;
alter table public.analyses drop constraint if exists analyses_decision_not_empty;
alter table public.analyses add constraint analyses_decision_not_empty check (decision <> '');

alter table public.analyses drop constraint if exists analyses_resolved_outcome_check;
alter table public.analyses drop constraint if exists analyses_resolved_outcome_not_empty;
alter table public.analyses add constraint analyses_resolved_outcome_not_empty
  check (resolved_outcome is null or resolved_outcome <> '');

alter table public.selected_markets drop constraint if exists selected_markets_decision_check;
alter table public.selected_markets drop constraint if exists selected_markets_decision_not_empty;
alter table public.selected_markets add constraint selected_markets_decision_not_empty
  check (decision <> '');

alter table public.selected_markets drop constraint if exists selected_markets_resolved_outcome_check;
alter table public.selected_markets drop constraint if exists selected_markets_resolved_outcome_not_empty;
alter table public.selected_markets add constraint selected_markets_resolved_outcome_not_empty
  check (resolved_outcome is null or resolved_outcome <> '');

alter table public.credit_transactions drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions add constraint credit_transactions_type_check
  check (type in (
    'purchase', 'consumption', 'refund', 'welcome', 'referral',
    'plan_grant', 'plan_reset'
  ));

create unique index if not exists credit_transactions_one_welcome_per_user
  on public.credit_transactions (user_id)
  where type = 'welcome';

alter table public.user_credits drop constraint if exists user_credits_plan_credits_balance_non_negative;
alter table public.user_credits add constraint user_credits_plan_credits_balance_non_negative
  check (plan_credits_balance >= 0);

alter table public.user_quota_cycles drop constraint if exists user_quota_cycles_feature_check;
alter table public.user_quota_cycles add constraint user_quota_cycles_feature_check
  check (feature in ('wallets', 'copy_trading', 'deep_analysis_credits'));

alter table public.signal_copy_trades drop constraint if exists signal_copy_trades_status_check;
alter table public.signal_copy_trades add constraint signal_copy_trades_status_check
  check (status in ('nouvelle', 'vue', 'lien_cliquee'));

-- ============================================================================
-- 7. FONCTIONS — définitions finales uniquement.
-- ============================================================================

-- Public, read-only Smart Money activity feed (landing page).
create or replace function public.get_public_smart_money_activity(
  min_amount numeric default 500,
  max_age_hours integer default 48,
  result_limit integer default 20
)
returns table (
  wallet_label text,
  market text,
  side text,
  movement_type text,
  amount numeric,
  occurred_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    tw.label as wallet_label,
    (m->>'market') as market,
    (m->>'side') as side,
    (m->>'type') as movement_type,
    (m->>'amount')::numeric as amount,
    (m->>'timestamp')::timestamptz as occurred_at
  from public.tracked_wallets tw
  cross join lateral jsonb_array_elements(tw.recent_movements) as m
  where (m->>'amount')::numeric >= min_amount
    and (m->>'timestamp')::timestamptz >= now() - (max_age_hours || ' hours')::interval
  order by occurred_at desc
  limit result_limit;
$$;

grant execute on function public.get_public_smart_money_activity(numeric, integer, integer)
  to anon, authenticated;

-- Owner console: paginated user directory.
create or replace function public.owner_list_users(
  p_search text default null,
  p_status text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  plan text,
  status text,
  current_period_end timestamptz,
  analyses_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    s.plan,
    s.status,
    s.current_period_end,
    coalesce(a.cnt, 0) as analyses_count,
    count(*) over() as total_count
  from auth.users u
  left join public.subscriptions s on s.user_id = u.id
  left join (
    select user_id, count(*) as cnt from public.analyses group by user_id
  ) a on a.user_id = u.id
  where
    (p_search is null or p_search = '' or u.email ilike '%' || p_search || '%')
    and (
      p_status is null or p_status = 'all'
      or (p_status = 'decouverte' and s.plan = 'decouverte' and s.status = 'trialing')
      or (p_status = 'pro' and s.plan = 'pro' and s.status in ('active', 'trialing'))
      or (p_status = 'active' and s.status in ('active', 'trialing'))
      or (p_status = 'canceled' and s.status = 'canceled')
      or (p_status = 'expired' and s.status = 'past_due')
    )
  order by u.created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.owner_list_users(text, text, int, int) from public;
grant execute on function public.owner_list_users(text, text, int, int) to service_role;

create or replace function public.owner_users_summary(p_since timestamptz default null)
returns table (total_users bigint, new_users bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    (select count(*) from auth.users) as total_users,
    (select count(*) from auth.users where p_since is null or created_at >= p_since) as new_users;
$$;

revoke all on function public.owner_users_summary(timestamptz) from public;
grant execute on function public.owner_users_summary(timestamptz) to service_role;

create or replace function public.owner_influencer_referrals(p_influencer_id uuid)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  referred_via text,
  converted_to_paid boolean,
  converted_at timestamptz,
  subscription_amount numeric,
  commission_amount numeric,
  commission_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    r.id,
    r.user_id,
    u.email,
    r.referred_via,
    r.converted_to_paid,
    r.converted_at,
    r.subscription_amount,
    r.commission_amount,
    r.commission_status,
    r.created_at
  from public.influencer_referrals r
  join auth.users u on u.id = r.user_id
  where r.influencer_id = p_influencer_id
  order by r.created_at desc;
$$;

revoke all on function public.owner_influencer_referrals(uuid) from public;
grant execute on function public.owner_influencer_referrals(uuid) to service_role;

create or replace function public.owner_user_referrals()
returns table (
  id uuid,
  referrer_user_id uuid,
  referrer_email text,
  referred_user_id uuid,
  referred_email text,
  referral_code text,
  converted_to_paid boolean,
  converted_at timestamptz,
  commission_amount numeric,
  commission_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    r.id,
    r.referrer_user_id,
    ru.email,
    r.referred_user_id,
    fu.email,
    r.referral_code,
    r.converted_to_paid,
    r.converted_at,
    r.commission_amount,
    r.commission_status,
    r.created_at
  from public.user_referrals r
  join auth.users ru on ru.id = r.referrer_user_id
  join auth.users fu on fu.id = r.referred_user_id
  order by r.created_at desc;
$$;

revoke all on function public.owner_user_referrals() from public;
grant execute on function public.owner_user_referrals() to service_role;

create or replace function public.owner_tiktok_clip_submissions()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  tiktok_url text,
  submitted_at timestamptz,
  status text,
  verified_views integer,
  rejection_reason text,
  payment_amount numeric,
  paid_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    s.id,
    s.user_id,
    u.email,
    s.tiktok_url,
    s.submitted_at,
    s.status,
    s.verified_views,
    s.rejection_reason,
    s.payment_amount,
    s.paid_at
  from public.tiktok_clip_submissions s
  join auth.users u on u.id = s.user_id
  order by s.submitted_at desc;
$$;

revoke all on function public.owner_tiktok_clip_submissions() from public;
grant execute on function public.owner_tiktok_clip_submissions() to service_role;

-- Pips Tracks ingestion trigger + composite reads.
create or replace function public.pips_track_ingest_signal_trade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.signal_wallets;
  v_label text;
  v_prior_traded_at timestamptz;
  v_platform_url text;
begin
  select * into v_wallet from public.signal_wallets where id = new.wallet_id;
  if v_wallet is null then
    return new;
  end if;

  v_label := coalesce(nullif(v_wallet.label, ''), left(v_wallet.address, 6) || '...' || right(v_wallet.address, 4));
  v_platform_url := case when v_wallet.source = 'fomo' then 'https://fomo.family' else 'https://axiom.trade' end;

  insert into public.pips_track_events (
    source, event_type, title, description, token_symbol,
    wallet_address, wallet_label, amount_usd, price,
    external_url, data_source_mode, source_trade_id, occurred_at
  )
  values (
    v_wallet.source,
    case when new.side = 'BUY' then 'trade_buy' else 'trade_sell' end,
    case when new.side = 'BUY' then 'Achat important détecté' else 'Vente importante détectée' end,
    format('Le wallet %s a %s $%s pour %s $',
      v_label,
      case when new.side = 'BUY' then 'acheté' else 'vendu' end,
      new.token_symbol,
      to_char(round(new.amount_usd), 'FM999G999G999')),
    new.token_symbol,
    v_wallet.address, v_wallet.label, new.amount_usd, new.price,
    v_platform_url, v_wallet.data_source_mode, new.id, new.traded_at
  )
  on conflict (source_trade_id) where source_trade_id is not null do nothing;

  if v_wallet.polypips_score is not null and v_wallet.polypips_score >= 65 then
    insert into public.pips_track_events (
      source, event_type, title, description, token_symbol,
      wallet_address, wallet_label, amount_usd,
      ai_score, ai_win_rate, ai_impact,
      external_url, data_source_mode, occurred_at
    )
    values (
      v_wallet.source, 'signal_ia', 'Signal IA généré',
      format('%s sur $%s par un wallet à %s%% de Win Rate.',
        case when new.side = 'BUY' then 'Achat détecté' else 'Vente détectée' end,
        new.token_symbol, round(coalesce(v_wallet.win_rate, 0))),
      new.token_symbol, v_wallet.address, v_wallet.label, new.amount_usd,
      v_wallet.polypips_score, v_wallet.win_rate,
      case
        when v_wallet.polypips_score >= 80 then 'eleve'
        when v_wallet.polypips_score >= 65 then 'moyen'
        else 'faible'
      end,
      v_platform_url, v_wallet.data_source_mode, new.traded_at
    );
  end if;

  select max(traded_at) into v_prior_traded_at
  from public.signal_wallet_trades
  where wallet_id = new.wallet_id and id <> new.id and traded_at < new.traded_at;

  if v_prior_traded_at is not null and new.traded_at - v_prior_traded_at >= interval '3 days' then
    insert into public.pips_track_events (
      source, event_type, title, description,
      wallet_address, wallet_label, ai_score,
      external_url, data_source_mode, occurred_at
    )
    values (
      v_wallet.source, 'wallet_active', 'Nouveau wallet suivi actif',
      format('Le wallet %s redevient actif après %s jours d''inactivité.',
        v_label, floor(extract(epoch from (new.traded_at - v_prior_traded_at)) / 86400)),
      v_wallet.address, v_wallet.label, v_wallet.polypips_score,
      v_platform_url, v_wallet.data_source_mode, new.traded_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists pips_track_ingest_signal_trade_trigger on public.signal_wallet_trades;
create trigger pips_track_ingest_signal_trade_trigger
  after insert on public.signal_wallet_trades
  for each row execute function public.pips_track_ingest_signal_trade();

create or replace function public.pips_tracks_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'eventsToday', (select count(*) from public.pips_track_events where occurred_at >= date_trunc('day', now())),
    'signalsToday', (select count(*) from public.pips_track_events where event_type = 'signal_ia' and occurred_at >= date_trunc('day', now())),
    'buysToday', (select count(*) from public.pips_track_events where event_type = 'trade_buy' and occurred_at >= date_trunc('day', now())),
    'sellsToday', (select count(*) from public.pips_track_events where event_type = 'trade_sell' and occurred_at >= date_trunc('day', now())),
    'activeWallets', (
      select count(distinct wallet_address) from public.pips_track_events
      where wallet_address is not null and occurred_at >= now() - interval '24 hours'
    )
  );
$$;

grant execute on function public.pips_tracks_summary() to authenticated;

create or replace function public.pips_tracks_top_tokens(p_limit integer default 5)
returns table (token_symbol text, mention_count bigint)
language sql
stable
set search_path = public
as $$
  select token_symbol, count(*) as mention_count
  from public.pips_track_events
  where token_symbol is not null and occurred_at >= now() - interval '24 hours'
  group by token_symbol
  order by mention_count desc, token_symbol asc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.pips_tracks_top_tokens(integer) to authenticated;

-- user_settings.updated_at trigger.
create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_user_settings_updated_at();

-- --- Crédits — définitions FINALES (margin protection) -------------------------

-- ensure_welcome_credits() : 0 crédit offert (était 15) — voir
-- 20261022090000_defer_referral_bonus_and_zero_welcome_credits.sql.
create or replace function public.ensure_welcome_credits()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer;
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

-- record_user_referral() : n'accorde plus de crédit à l'inscription —
-- enregistre seulement la relation (voir record_user_referral_conversion).
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

  insert into public.user_referrals (referrer_user_id, referred_user_id, referral_code)
  values (v_referrer_id, v_user_id, p_slug)
  on conflict (referred_user_id) do nothing;
end;
$$;

revoke all on function public.record_user_referral(text) from public;
grant execute on function public.record_user_referral(text) to authenticated;

-- record_user_referral_conversion() : accorde les DEUX bonus (filleul +5,
-- parrain +10) au premier vrai paiement du filleul — jamais à l'inscription.
create or replace function public.record_user_referral_conversion(p_referred_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
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
    return;
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (p_referred_user_id, v_referred_bonus, 'referral');

  insert into public.user_credits (user_id, balance, updated_at)
  values (p_referred_user_id, v_referred_bonus, now())
  on conflict (user_id) do update
    set balance = public.user_credits.balance + v_referred_bonus,
        updated_at = now();

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

-- sync_plan_credits_cycle() / ensure_plan_credits_grant() — reset (pas
-- cumul) des crédits inclus à chaque renouvellement de cycle.
create or replace function public.sync_plan_credits_cycle(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_status text;
  v_cancel_at_period_end boolean;
  v_period_end timestamptz;
  v_included integer;
  v_anchor_period_end timestamptz;
  v_current_plan_credits integer;
begin
  select plan, status, cancel_at_period_end, current_period_end
    into v_plan, v_status, v_cancel_at_period_end, v_period_end
  from public.subscriptions
  where user_id = p_user_id;

  if v_plan is null or v_status not in ('active', 'trialing') or v_cancel_at_period_end
     or v_period_end is null then
    return;
  end if;

  v_included := case v_plan
    when 'pro_plus' then 15
    when 'ultimate' then 50
    else 0
  end;

  if v_included = 0 then
    return;
  end if;

  select period_end into v_anchor_period_end
  from public.user_quota_cycles
  where user_id = p_user_id and feature = 'deep_analysis_credits';

  if v_anchor_period_end is not null and v_anchor_period_end = v_period_end then
    return;
  end if;

  select coalesce(plan_credits_balance, 0) into v_current_plan_credits
  from public.user_credits
  where user_id = p_user_id;
  v_current_plan_credits := coalesce(v_current_plan_credits, 0);

  insert into public.user_credits (user_id, balance, plan_credits_balance, updated_at)
  values (p_user_id, greatest(v_included - v_current_plan_credits, 0), v_included, now())
  on conflict (user_id) do update
    set balance = greatest(public.user_credits.balance - v_current_plan_credits, 0) + v_included,
        plan_credits_balance = v_included,
        updated_at = now();

  if v_current_plan_credits > 0 then
    insert into public.credit_transactions (user_id, amount, type)
    values (p_user_id, -v_current_plan_credits, 'plan_reset');
  end if;

  insert into public.credit_transactions (user_id, amount, type)
  values (p_user_id, v_included, 'plan_grant');

  insert into public.user_quota_cycles (user_id, feature, period_end, updated_at)
  values (p_user_id, 'deep_analysis_credits', v_period_end, now())
  on conflict (user_id, feature) do update
    set period_end = excluded.period_end,
        updated_at = now();
end;
$$;

revoke all on function public.sync_plan_credits_cycle(uuid) from public;
grant execute on function public.sync_plan_credits_cycle(uuid) to service_role;

create or replace function public.ensure_plan_credits_grant()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  perform public.sync_plan_credits_cycle(v_user_id);
end;
$$;

revoke all on function public.ensure_plan_credits_grant() from public;
grant execute on function public.ensure_plan_credits_grant() to authenticated;

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
  perform public.sync_plan_credits_cycle(p_user_id);

  update public.user_credits
     set balance = balance - 1,
         plan_credits_balance = greatest(plan_credits_balance - 1, 0),
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

-- ============================================================================
-- 8. POLITIQUES RLS — "drop policy if exists" avant chaque "create policy"
--    pour rester rejouable.
-- ============================================================================

drop policy if exists "Users can view their own analyses" on public.analyses;
create policy "Users can view their own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own analyses" on public.analyses;
create policy "Users can insert their own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can view selected markets" on public.selected_markets;
create policy "Authenticated users can view selected markets"
  on public.selected_markets for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view tracked wallets" on public.tracked_wallets;
create policy "Authenticated users can view tracked wallets"
  on public.tracked_wallets for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can add a wallet to track" on public.tracked_wallets;
create policy "Authenticated users can add a wallet to track"
  on public.tracked_wallets for insert
  to authenticated
  with check (source = 'user_added' and added_by = auth.uid());

drop policy if exists "Authenticated users can view wallet snapshots" on public.wallet_snapshots;
create policy "Authenticated users can view wallet snapshots"
  on public.wallet_snapshots for select
  to authenticated
  using (true);

drop policy if exists "Users can view their own wallet follows" on public.user_wallet_follows;
create policy "Users can view their own wallet follows"
  on public.user_wallet_follows for select
  using (auth.uid() = user_id);

drop policy if exists "Users can follow a wallet" on public.user_wallet_follows;
create policy "Users can follow a wallet"
  on public.user_wallet_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow a wallet" on public.user_wallet_follows;
create policy "Users can unfollow a wallet"
  on public.user_wallet_follows for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own strategies" on public.copy_trading_strategies;
create policy "Users can view their own strategies"
  on public.copy_trading_strategies for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own strategies" on public.copy_trading_strategies;
create policy "Users can create their own strategies"
  on public.copy_trading_strategies for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own strategies" on public.copy_trading_strategies;
create policy "Users can update their own strategies"
  on public.copy_trading_strategies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own strategies" on public.copy_trading_strategies;
create policy "Users can delete their own strategies"
  on public.copy_trading_strategies for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own suggestions" on public.copy_trading_suggestions;
create policy "Users can view their own suggestions"
  on public.copy_trading_suggestions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update the status of their own suggestions" on public.copy_trading_suggestions;
create policy "Users can update the status of their own suggestions"
  on public.copy_trading_suggestions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own quota cycles" on public.user_quota_cycles;
create policy "Users can view their own quota cycles"
  on public.user_quota_cycles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can set their own quota cycle anchor" on public.user_quota_cycles;
create policy "Users can set their own quota cycle anchor"
  on public.user_quota_cycles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quota cycle anchor" on public.user_quota_cycles;
create policy "Users can update their own quota cycle anchor"
  on public.user_quota_cycles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own wallet follow notifications" on public.wallet_follow_notifications;
create policy "Users can view their own wallet follow notifications"
  on public.wallet_follow_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own signup source" on public.signup_sources;
create policy "Users can insert their own signup source"
  on public.signup_sources for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own signup source" on public.signup_sources;
create policy "Users can view their own signup source"
  on public.signup_sources for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own referral row" on public.influencer_referrals;
create policy "Users can insert their own referral row"
  on public.influencer_referrals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own match follows" on public.sports_match_follows;
create policy "Users can view their own match follows"
  on public.sports_match_follows for select
  using (auth.uid() = user_id);

drop policy if exists "Users can follow a match" on public.sports_match_follows;
create policy "Users can follow a match"
  on public.sports_match_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow a match" on public.sports_match_follows;
create policy "Users can unfollow a match"
  on public.sports_match_follows for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own team follows" on public.sports_team_follows;
create policy "Users can view their own team follows"
  on public.sports_team_follows for select
  using (auth.uid() = user_id);

drop policy if exists "Users can follow a team" on public.sports_team_follows;
create policy "Users can follow a team"
  on public.sports_team_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow a team" on public.sports_team_follows;
create policy "Users can unfollow a team"
  on public.sports_team_follows for delete
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can view cached competitions" on public.sports_competitions_cache;
create policy "Authenticated users can view cached competitions"
  on public.sports_competitions_cache for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view cached teams" on public.sports_teams_cache;
create policy "Authenticated users can view cached teams"
  on public.sports_teams_cache for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view cached fixtures" on public.sports_fixtures_cache;
create policy "Authenticated users can view cached fixtures"
  on public.sports_fixtures_cache for select
  to authenticated
  using (true);

drop policy if exists "Users can view their own sports bet analyses" on public.sports_bet_analyses;
create policy "Users can view their own sports bet analyses"
  on public.sports_bet_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own sports bet analyses" on public.sports_bet_analyses;
create policy "Users can insert their own sports bet analyses"
  on public.sports_bet_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can view signal wallets" on public.signal_wallets;
create policy "Authenticated users can view signal wallets"
  on public.signal_wallets for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view signal wallet trades" on public.signal_wallet_trades;
create policy "Authenticated users can view signal wallet trades"
  on public.signal_wallet_trades for select
  to authenticated
  using (true);

drop policy if exists "Users can view their own signal wallet follows" on public.user_signal_wallet_follows;
create policy "Users can view their own signal wallet follows"
  on public.user_signal_wallet_follows for select
  using (auth.uid() = user_id);

drop policy if exists "Users can follow a signal wallet" on public.user_signal_wallet_follows;
create policy "Users can follow a signal wallet"
  on public.user_signal_wallet_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow a signal wallet" on public.user_signal_wallet_follows;
create policy "Users can unfollow a signal wallet"
  on public.user_signal_wallet_follows for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own copy settings" on public.signal_copy_settings;
create policy "Users can view their own copy settings"
  on public.signal_copy_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own copy settings" on public.signal_copy_settings;
create policy "Users can create their own copy settings"
  on public.signal_copy_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own copy settings" on public.signal_copy_settings;
create policy "Users can update their own copy settings"
  on public.signal_copy_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own copy settings" on public.signal_copy_settings;
create policy "Users can delete their own copy settings"
  on public.signal_copy_settings for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own copy trades" on public.signal_copy_trades;
create policy "Users can view their own copy trades"
  on public.signal_copy_trades for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update the status of their own copy trades" on public.signal_copy_trades;
create policy "Users can update the status of their own copy trades"
  on public.signal_copy_trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own signal analyses" on public.signal_ai_analyses;
create policy "Users can view their own signal analyses"
  on public.signal_ai_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own signal analyses" on public.signal_ai_analyses;
create policy "Users can create their own signal analyses"
  on public.signal_ai_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own signal wallet follow notifications" on public.signal_wallet_follow_notifications;
create policy "Users can view their own signal wallet follow notifications"
  on public.signal_wallet_follow_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can view cached odds-api competitions" on public.odds_api_competitions_cache;
create policy "Authenticated users can view cached odds-api competitions"
  on public.odds_api_competitions_cache for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view cached odds-api matches" on public.odds_api_matches_cache;
create policy "Authenticated users can view cached odds-api matches"
  on public.odds_api_matches_cache for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view cached football odds" on public.football_odds_cache;
create policy "Authenticated users can view cached football odds"
  on public.football_odds_cache for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read the Pips Tracks feed" on public.pips_track_events;
create policy "Authenticated users can read the Pips Tracks feed"
  on public.pips_track_events for select
  to authenticated
  using (true);

drop policy if exists "Users can view their own Pips Tracks alerts" on public.user_pips_track_alerts;
create policy "Users can view their own Pips Tracks alerts"
  on public.user_pips_track_alerts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own Pips Tracks alerts" on public.user_pips_track_alerts;
create policy "Users can create their own Pips Tracks alerts"
  on public.user_pips_track_alerts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Pips Tracks alerts" on public.user_pips_track_alerts;
create policy "Users can delete their own Pips Tracks alerts"
  on public.user_pips_track_alerts for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own trading chart analyses" on public.trading_chart_analyses;
create policy "Users can view their own trading chart analyses"
  on public.trading_chart_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own trading chart analyses" on public.trading_chart_analyses;
create policy "Users can insert their own trading chart analyses"
  on public.trading_chart_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can view selected sport matches" on public.selected_sport_matches;
create policy "Authenticated users can view selected sport matches"
  on public.selected_sport_matches for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can view selected trading analyses" on public.selected_trading_analyses;
create policy "Authenticated users can view selected trading analyses"
  on public.selected_trading_analyses for select
  to authenticated
  using (true);

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own"
  on public.user_credits for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own"
  on public.credit_transactions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own referral link" on public.user_referral_links;
create policy "Users can view their own referral link"
  on public.user_referral_links for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own referral link" on public.user_referral_links;
create policy "Users can create their own referral link"
  on public.user_referral_links for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert their own referral row" on public.user_referrals;
create policy "Users can insert their own referral row"
  on public.user_referrals for insert
  with check (auth.uid() = referred_user_id);

drop policy if exists "Referrers can view their own referral history" on public.user_referrals;
create policy "Referrers can view their own referral history"
  on public.user_referrals for select
  using (auth.uid() = referrer_user_id);

drop policy if exists "Users can view their own TikTok submissions" on public.tiktok_clip_submissions;
create policy "Users can view their own TikTok submissions"
  on public.tiktok_clip_submissions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can submit their own TikTok clips" on public.tiktok_clip_submissions;
create policy "Users can submit their own TikTok clips"
  on public.tiktok_clip_submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 9. REALTIME — "alter publication ... add table" échoue si la table est
--    déjà membre : gardé par un bloc DO testant pg_publication_tables.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_credits'
  ) then
    alter publication supabase_realtime add table public.user_credits;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pips_track_events'
  ) then
    alter publication supabase_realtime add table public.pips_track_events;
  end if;
end $$;

-- ============================================================================
-- 10. STORAGE — bucket avatars (profil utilisateur). Aucun bucket Coach IA /
--     Communauté n'est recréé.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 11. WHOP — contenu de 20261022100000_add_whop_payment_provider.sql,
--     repris tel quel (déjà idempotent, DROP FUNCTION avant la nouvelle
--     signature de credit_purchase déjà inclus) — voir ce fichier pour
--     le détail de chaque choix.
-- ============================================================================

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe'
    check (provider in ('stripe', 'whop'));

alter table public.subscriptions
  add column if not exists whop_membership_id text unique;

alter table public.subscriptions
  add column if not exists whop_plan_id text;

alter table public.subscriptions
  add column if not exists whop_member_id text;

alter table public.subscriptions
  add column if not exists disputed boolean not null default false;

create index if not exists subscriptions_whop_membership_id_idx
  on public.subscriptions (whop_membership_id);

alter table public.credit_transactions
  add column if not exists whop_payment_id text;

create unique index if not exists credit_transactions_whop_payment_id_key
  on public.credit_transactions (whop_payment_id)
  where whop_payment_id is not null;

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

-- ============================================================================
-- 12. Rafraîchir le cache de schéma PostgREST.
-- ============================================================================
NOTIFY pgrst, 'reload schema';

commit;
