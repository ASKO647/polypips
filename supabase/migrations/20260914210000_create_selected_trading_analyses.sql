-- The Trading universe's "Sélection du jour" (see the scan-trading-pairs
-- Edge Function) — same shared/global, no-user_id shape as
-- selected_markets/selected_sport_matches: the AI's own periodic scan of
-- a fixed crypto watchlist (real Binance candles, not a screenshot), not
-- any individual user's analysis history (that stays in
-- trading_chart_analyses). Same "never a money amount" constraint on
-- take_profit/stop_loss as trading_chart_analyses.
create table if not exists public.selected_trading_analyses (
  id uuid primary key default gen_random_uuid(),
  -- Binance's own ticker, e.g. "BTCUSDT" — kept alongside display_symbol
  -- ("BTC/USDT") so a future re-scan or lookup can address the pair
  -- unambiguously without re-parsing the display string.
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

create policy "Authenticated users can view selected trading analyses"
  on public.selected_trading_analyses for select
  to authenticated
  using (true);

-- Deliberately no insert/update/delete policy for anon/authenticated: this
-- table only ever changes from the scan-trading-pairs Edge Function's
-- periodic run, which uses the service role key (bypasses RLS) — see that
-- function's own Authorization check for who may trigger it.
