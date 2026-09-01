-- The Sport universe's "Analyse IA" was rebuilt (product decision) from
-- "evaluate a specific bet the user already placed/found at a bookmaker"
-- (sport/participants/bet_type/selection/bookmaker_odds — always required)
-- into "search two teams, pick one of the next 3 real head-to-head
-- fixtures, get the AI's own prediction" — there is no bookmaker odds
-- input in that flow at all, so those columns can no longer be required on
-- every row. Kept (not dropped) rather than replaced by a new table so
-- "Mes analyses" stays one unified history across both eras rather than
-- needing to query two tables — a row from either era just leaves the
-- other era's columns null.
alter table public.sports_bet_analyses
  alter column bet_type drop not null,
  alter column selection drop not null,
  alter column bookmaker_odds drop not null,
  alter column bookmaker_implied_probability drop not null,
  alter column edge drop not null;

-- New columns the fixture-based flow populates instead: which real
-- competition/kickoff time the picked fixture has (both null for an
-- old-era row, which never had a real fixture behind it), which
-- participant ai_probability/decision text actually names as the more
-- likely winner (participants already holds "Team A vs Team B" for
-- display; predicted_winner is specifically which of the two), and the
-- 2-3 secondary markets on the same match the AI judged relevant
-- alongside its main pick (point 5's "autres marchés connexes" — same-
-- match variants, e.g. over/under buts, BTTS, score exact — confirmed
-- with the user, not other fixtures).
alter table public.sports_bet_analyses
  add column if not exists competition text,
  add column if not exists match_date timestamptz,
  add column if not exists predicted_winner text,
  add column if not exists secondary_markets jsonb not null default '[]'::jsonb;
