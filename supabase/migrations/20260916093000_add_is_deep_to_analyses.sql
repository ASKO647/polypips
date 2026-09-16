-- Marks a row as produced by "Analyse Approfondie" (Opus 5, extended
-- thinking, credit-gated) rather than the standard on-demand Analyse IA
-- (Haiku 4.5, unlimited on a paid plan) — same underlying tables and
-- frontend renderers, just more/richer content and a badge when true.
-- Defaults false so every existing row (and every write from code that
-- hasn't been updated to pass it) keeps its current meaning unchanged.

alter table public.analyses
  add column is_deep boolean not null default false;

alter table public.sports_bet_analyses
  add column is_deep boolean not null default false;

alter table public.trading_chart_analyses
  add column is_deep boolean not null default false;
