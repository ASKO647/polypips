-- Fixes a real correctness bug: `decision`/`resolved_outcome` were
-- hard-constrained to the literal strings 'YES'/'NO', but most Polymarket
-- markets ARE Yes/No while a real minority — crypto price markets ("Up"/
-- "Down"), and others — use different outcome-label pairs on the exact
-- same binary (always-2-outcomes) market shape. Forcing every AI verdict
-- into YES/NO on a market that never offered those as options was
-- presenting a literally wrong label to the user. The application layer
-- (analyze-market, scan-markets, resolve-markets) now stores whichever two
-- real labels Gamma's `outcomes` field returned for that specific market
-- and picks one of them — this migration just stops the database from
-- rejecting anything other than the old hardcoded pair.

alter table public.analyses drop constraint if exists analyses_decision_check;
alter table public.analyses drop constraint if exists analyses_resolved_outcome_check;
alter table public.selected_markets drop constraint if exists selected_markets_decision_check;
alter table public.selected_markets drop constraint if exists selected_markets_resolved_outcome_check;

alter table public.analyses
  add constraint analyses_decision_not_empty check (decision <> '');
alter table public.analyses
  add constraint analyses_resolved_outcome_not_empty check (resolved_outcome is null or resolved_outcome <> '');
alter table public.selected_markets
  add constraint selected_markets_decision_not_empty check (decision <> '');
alter table public.selected_markets
  add constraint selected_markets_resolved_outcome_not_empty check (resolved_outcome is null or resolved_outcome <> '');

-- The market's own two real outcome labels, in Gamma's order (index 0 is
-- what `decision`/`resolved_outcome` are compared against to decide
-- "primary" vs "secondary" for styling — see
-- src/lib/data/analysis.ts's isPrimaryDecision). Empty array for any row
-- written before this deploy — those already-analyzed markets keep
-- working (decision still renders as plain text), they just fall back to
-- "primary" styling since there's nothing to compare positions against.
alter table public.analyses
  add column if not exists outcomes text[] not null default '{}'::text[];
alter table public.selected_markets
  add column if not exists outcomes text[] not null default '{}'::text[];
