-- Margin protection, step 4: real per-call AI cost tracking, feeding both
-- the per-customer monthly spend cap (supabase/functions/_shared/
-- ai-budget.ts) and the owner console's "Coûts IA" section
-- (src/lib/supabase/owner-ai-costs.ts).
--
-- One row per Anthropic API call, written best-effort by every Edge
-- Function that calls Anthropic (analyze-market, analyze-sport-match,
-- analyze-trading-chart, scan-markets, scan-sport-matches,
-- scan-trading-pairs) via _shared/ai-pricing.ts's logAiUsageEvent — see
-- that function's own comment for why a logging failure never fails the
-- analysis itself.
--
-- This migration is NOT applied automatically — run it by hand against
-- the Supabase project when ready.

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  -- null for an automated scan (scan-markets/scan-sport-matches/
  -- scan-trading-pairs) — no individual user's quota/budget is being
  -- spent by those. Never a foreign key to auth.users with ON DELETE
  -- CASCADE: cost history for a deleted account should stay auditable in
  -- the owner console rather than silently vanish with the account.
  user_id uuid references auth.users(id) on delete set null,
  function_name text not null,
  model text not null,
  kind text not null check (kind in ('standard', 'deep', 'scan', 'image_extraction')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_creation_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cost_usd numeric not null default 0,
  -- 'included' = drew from this cycle's plan-granted Deep Analysis
  -- credits (counts toward the user's monthly AI spend cap); 'purchased'
  -- = drew from a bought credit pack (already paid for separately, never
  -- counted toward the cap); 'none' = no credit involved at all
  -- (standard analysis, scan, or image extraction).
  credit_source text not null check (credit_source in ('included', 'purchased', 'none')),
  -- Free-form, not a foreign key — same reasoning as
  -- credit_transactions.related_analysis_id (the analysis it points to
  -- lives in one of three different per-universe tables, or has no row
  -- at all for a scan/image-extraction call).
  analysis_id text,
  created_at timestamptz not null default now()
);

-- Powers the owner console's monthly/per-user aggregations and the
-- per-user spend-cap check in _shared/ai-budget.ts.
create index ai_usage_events_user_id_created_at_idx
  on public.ai_usage_events (user_id, created_at desc);
create index ai_usage_events_created_at_idx
  on public.ai_usage_events (created_at desc);
create index ai_usage_events_kind_idx
  on public.ai_usage_events (kind);

alter table public.ai_usage_events enable row level security;

-- No access for authenticated or anon users at all — this table only
-- ever holds internal cost data, never surfaced to the end user (their
-- own credit balance/history already comes from user_credits/
-- credit_transactions, which keep their own existing RLS policies
-- unchanged). Writes go through the service-role client inside
-- logAiUsageEvent; reads go through the service-role admin client the
-- owner console already uses (src/lib/supabase/admin.ts) — deliberately
-- no policy is created here for `authenticated`, so even a logged-in
-- paying user can never SELECT this table over the REST API.
