-- Extends Copy Trading with the "Smart Copy" decision pipeline: position
-- sizing against a real budget, a categorical risk level, and a logged
-- reason for every fresh movement — copied or ignored, never silently
-- dropped. Also extends tracked_wallets with a persisted quality profile
-- (win rate, ROI, consistency, diversification, risk level, track record)
-- so wallet cards/strategy cards can show more than raw portfolio value.
-- None of this changes what Copy Trading fundamentally is: alert +
-- suggestion, never an executed order — see the original migration's
-- comment on copy_trading_suggestions.

-- --- tracked_wallets: persisted quality profile -----------------------------
-- All nullable: populated by sync-smart-money on each refresh, but a wallet
-- that hasn't synced yet (or whose activity/positions came back empty) has
-- nothing to compute these from — the frontend renders null as "—", never
-- a fake 0.
alter table public.tracked_wallets
  add column if not exists win_rate numeric,
  add column if not exists roi_percent numeric,
  add column if not exists consistency_score integer,
  add column if not exists category_diversity integer,
  add column if not exists avg_position_size numeric,
  add column if not exists risk_level text check (risk_level in ('low', 'medium', 'high')),
  add column if not exists track_record_days integer;

-- --- copy_trading_strategies: budget + categorical risk ---------------------
-- max_budget is the new top-level cap position sizing is computed against
-- (see sync-smart-money) — max_position_amount and max_exposure_percent
-- keep their existing roles (per-trade cap, and % of max_budget respected
-- at once) rather than being replaced. risk_level is purely a user-facing
-- label today (no automatic parameter derivation), stored so the strategy
-- card can show it without recomputing.
alter table public.copy_trading_strategies
  add column if not exists max_budget numeric not null default 500,
  add column if not exists risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high'));

-- --- copy_trading_suggestions: sizing, decision, and Smart Copy analysis ----
-- `amount` keeps its column name but its meaning narrows: from here on it's
-- always the *sized* copy amount actually suggested to the user (never the
-- wallet's raw trade size) — original_amount is the new column for that.
-- decision + ignore_reason are what make every fresh movement explainable:
-- previously an ignored movement was never written anywhere, so a user had
-- no way to know Polypips had even seen it.
alter table public.copy_trading_suggestions
  add column if not exists original_amount numeric,
  add column if not exists decision text not null default 'copied'
    check (decision in ('copied', 'ignored')),
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
