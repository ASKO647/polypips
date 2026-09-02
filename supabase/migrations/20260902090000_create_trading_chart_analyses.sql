-- The new "Trading" universe's "Analyse IA" — the user drops a screenshot
-- of a trading chart (any platform: TradingView, MT5, ...) and gets an AI
-- read (recommendation + TP/SL levels + reasoning), reusing the same
-- Claude vision approach already used to read a Polymarket screenshot
-- (analyze-market) — but its own table, same pattern as
-- sports_bet_analyses: a distinct product surface gets its own history +
-- its own daily-quota counter, never sharing one with an unrelated
-- feature. No bookmaker/position-size data here at all, by design — see
-- this table's own "never a money amount" constraint below.
create table if not exists public.trading_chart_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Best-effort read from the chart (e.g. "EUR/USD", "BTC/USD") — null
  -- when the instrument couldn't be confidently identified from the image,
  -- never guessed.
  instrument text,
  timeframe text,
  recommendation text not null check (recommendation in ('Acheter', 'Vendre', 'Attendre')),
  -- Price level ("1.0950") or a percentage from entry ("+2.5%") — never a
  -- money amount or position/lot size. Nullable: "Attendre" often has
  -- nothing concrete to propose yet.
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

create policy "Users can view their own trading chart analyses"
  on public.trading_chart_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trading chart analyses"
  on public.trading_chart_analyses for insert
  with check (auth.uid() = user_id);
