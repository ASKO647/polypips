-- Real performance tracking: whether the AI's own decision (YES/NO) on a
-- market matched what actually happened, independent of whether the user
-- placed a real bet. resolve-markets (a new, AI-free Edge Function — it
-- only calls the free public Gamma API) fills these in once a market
-- genuinely closes with a confident binary outcome; until then every row
-- stays resolved = false and the frontend shows an honest empty state
-- rather than a fabricated number.

-- --- analyses ----------------------------------------------------------
-- market_slug is new: the analyze-market Edge Function historically only
-- stored market_url, and only for the "paste a link" flow (never for the
-- "upload a screenshot" flow, where marketUrl stays null) — see that
-- function's own change alongside this migration. Rows created before
-- this deploy may have market_slug null (screenshot-originated: no way to
-- ever recover a market identifier for them) or recoverable only via
-- market_url (link-originated: resolve-markets does a one-time lazy
-- backfill for those, parsing the stored URL the same way analyze-market
-- itself did at creation time).
alter table public.analyses
  add column if not exists market_slug text,
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_outcome text check (resolved_outcome in ('YES', 'NO')),
  add column if not exists resolved_correct boolean,
  add column if not exists resolved_at timestamptz;

-- Powers resolve-markets' "give me everything still worth checking" scan
-- — partial so it stays small regardless of how large `analyses` grows,
-- and naturally excludes rows with no market identifier at all (nothing
-- to check) once both market_slug and market_url are null.
create index if not exists analyses_unresolved_idx
  on public.analyses (created_at)
  where resolved = false;

-- --- selected_markets ---------------------------------------------------
-- slug already exists (not null, unique) — no legacy backfill problem here.
alter table public.selected_markets
  add column if not exists resolved boolean not null default false,
  add column if not exists resolved_outcome text check (resolved_outcome in ('YES', 'NO')),
  add column if not exists resolved_correct boolean,
  add column if not exists resolved_at timestamptz;

create index if not exists selected_markets_unresolved_idx
  on public.selected_markets (scanned_at)
  where resolved = false;

-- No RLS policy changes needed: resolve-markets only ever runs with the
-- service role key (bypasses RLS), same as scan-markets and
-- sync-smart-money already do for their own writes to these tables.
