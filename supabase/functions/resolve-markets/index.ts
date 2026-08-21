import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  extractSlugFromUrl,
  fetchMarketBySlug,
  MarketNotFoundError,
  GammaUnavailableError,
  type GammaMarket,
} from "../analyze-market/gamma.ts";

/**
 * Real performance tracking, not AI opportunity-scanning: this function
 * never calls Anthropic, only Polymarket's free public Gamma API — so a
 * frequent cron is cheap. It checks every unresolved `analyses` and
 * `selected_markets` row to see if its market has actually closed, and if
 * so, whether the AI's own decision (the market's real outcome label —
 * usually "Yes"/"No" but not always, e.g. "Up"/"Down" on a crypto price
 * market — never a hardcoded pair) matched the real outcome.
 * "Resolved" here always means "we now know whether the AI call was right
 * or wrong," independent of whether any user placed a real bet on it.
 */

/** Bounds this run's Gamma API call volume — distinct markets checked via
 * their known market_slug (the common, fast path). */
const MAX_SLUG_LOOKUPS_PER_RUN = 150;
/** Separate, smaller budget for the legacy backfill path (rows that only
 * have a market_url, predating the market_slug column) — each of these
 * costs its own Gamma call since the slug isn't known until after the
 * fetch, so they can't be deduped the way the fast path is. */
const MAX_LEGACY_LOOKUPS_PER_RUN = 50;
const CONCURRENCY = 8;

/** A market being `closed` isn't by itself enough to trust as a clean
 * binary win/loss — Polymarket can close a market for reasons other than
 * a decisive resolution (disputes, void markets), and a still-ambiguous
 * price near 50¢ is a sign of that. Outcome price must clear this margin
 * on one side or the other before it's trusted; otherwise this run leaves
 * the row unresolved and tries again on a later run rather than guessing. */
const RESOLUTION_CONFIDENCE_MARGIN = 0.1;

/** Every Polymarket market is a binary (exactly 2 outcomes) — see
 * anthropic-analysis.ts's effectiveOutcomes comment — but the two labels
 * vary per market ("Yes"/"No", "Up"/"Down", ...). Their prices always sum
 * to ~1, so whichever of the two is confidently above 0.5 is the real
 * winning label as Gamma itself named it for THIS market — no need to
 * special-case any particular wording. Returns that label text (not a
 * hardcoded YES/NO) or null if the market isn't decisively resolved yet. */
function resolveOutcomeFromMarket(market: GammaMarket): string | null {
  if (!market.closed) return null;
  if (market.outcomes.length < 2) return null;
  const price = market.outcomePrices[0];
  if (!Number.isFinite(price)) return null;
  if (price >= 0.5 + RESOLUTION_CONFIDENCE_MARGIN) return market.outcomes[0];
  if (price <= 0.5 - RESOLUTION_CONFIDENCE_MARGIN) return market.outcomes[1];
  return null;
}

/** Case/whitespace-insensitive: `decision` was stored verbatim from an AI
 * verdict at analysis time, `outcome` comes from a fresh Gamma fetch here
 * — comparing them as literal strings would false-negative on a market
 * whose label wording drifted by casing alone (e.g. Gamma returning "Yes"
 * at one point and "YES" at another) even though they mean the same real
 * outcome. */
function labelsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchOutcomeForSlug(slug: string): Promise<string | null> {
  try {
    const market = await fetchMarketBySlug(slug, null);
    return resolveOutcomeFromMarket(market);
  } catch (error) {
    if (error instanceof MarketNotFoundError) return null;
    console.error(
      `[resolve-markets] lookup failed for slug "${slug}"`,
      error instanceof GammaUnavailableError ? error.message : error
    );
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Cette fonction ne peut être déclenchée qu'avec la clé service role.",
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const nowIso = new Date().toISOString();

  // --- 1. Fast path: rows that already have a market_slug ------------------
  const { data: analysesWithSlug } = await supabase
    .from("analyses")
    .select("id, decision, market_slug")
    .eq("resolved", false)
    .not("market_slug", "is", null)
    .order("created_at", { ascending: true })
    .limit(MAX_SLUG_LOOKUPS_PER_RUN);

  const { data: selectedMarketRows } = await supabase
    .from("selected_markets")
    .select("id, decision, slug")
    .eq("resolved", false)
    .order("scanned_at", { ascending: true })
    .limit(MAX_SLUG_LOOKUPS_PER_RUN);

  const slugSet = new Set<string>();
  for (const row of analysesWithSlug ?? []) slugSet.add(row.market_slug as string);
  for (const row of selectedMarketRows ?? []) slugSet.add(row.slug as string);
  const slugs = Array.from(slugSet).slice(0, MAX_SLUG_LOOKUPS_PER_RUN);

  const slugOutcomes = new Map<string, string>();
  const slugResults = await mapWithConcurrency(slugs, CONCURRENCY, async (slug) => ({
    slug,
    outcome: await fetchOutcomeForSlug(slug),
  }));
  for (const { slug, outcome } of slugResults) {
    if (outcome) slugOutcomes.set(slug, outcome);
  }

  let analysesResolved = 0;
  for (const row of analysesWithSlug ?? []) {
    const outcome = slugOutcomes.get(row.market_slug as string);
    if (!outcome) continue;
    const { error } = await supabase
      .from("analyses")
      .update({
        resolved: true,
        resolved_outcome: outcome,
        resolved_correct: labelsMatch(row.decision as string, outcome),
        resolved_at: nowIso,
      })
      .eq("id", row.id);
    if (!error) analysesResolved++;
  }

  let selectedMarketsResolved = 0;
  for (const row of selectedMarketRows ?? []) {
    const outcome = slugOutcomes.get(row.slug as string);
    if (!outcome) continue;
    const { error } = await supabase
      .from("selected_markets")
      .update({
        resolved: true,
        resolved_outcome: outcome,
        resolved_correct: labelsMatch(row.decision as string, outcome),
        resolved_at: nowIso,
      })
      .eq("id", row.id);
    if (!error) selectedMarketsResolved++;
  }

  // --- 2. Legacy backfill: analyses with a market_url but no market_slug --
  // Predates the market_slug column (screenshot-flow rows never had a URL
  // at all and can't be recovered here — see the migration's own comment).
  // Each of these costs its own Gamma call, so it gets a separate, smaller
  // budget instead of competing with the fast path above.
  const { data: legacyRows } = await supabase
    .from("analyses")
    .select("id, decision, market_url")
    .eq("resolved", false)
    .is("market_slug", null)
    .not("market_url", "is", null)
    .order("created_at", { ascending: true })
    .limit(MAX_LEGACY_LOOKUPS_PER_RUN);

  let legacyBackfilled = 0;
  let legacyResolved = 0;
  await mapWithConcurrency(legacyRows ?? [], CONCURRENCY, async (row) => {
    const parsed = extractSlugFromUrl(row.market_url as string);
    if (!parsed) return;

    let market: GammaMarket;
    try {
      market = await fetchMarketBySlug(parsed.eventSlug, parsed.marketSlug);
    } catch (error) {
      if (!(error instanceof MarketNotFoundError)) {
        console.error(
          `[resolve-markets] legacy lookup failed for "${row.market_url}"`,
          error instanceof GammaUnavailableError ? error.message : error
        );
      }
      return;
    }

    // Backfill the slug either way — even if the market isn't resolved
    // yet, this row joins the fast path for every future run instead of
    // paying the URL-parsing cost again.
    const outcome = resolveOutcomeFromMarket(market);
    const { error: updateError } = await supabase
      .from("analyses")
      .update(
        outcome
          ? {
              market_slug: market.slug,
              resolved: true,
              resolved_outcome: outcome,
              resolved_correct: labelsMatch(row.decision as string, outcome),
              resolved_at: nowIso,
            }
          : { market_slug: market.slug }
      )
      .eq("id", row.id);

    if (!updateError) {
      legacyBackfilled++;
      if (outcome) legacyResolved++;
    }
  });

  const summary = {
    slugsChecked: slugs.length,
    analysesChecked: (analysesWithSlug ?? []).length,
    analysesResolved,
    selectedMarketsChecked: (selectedMarketRows ?? []).length,
    selectedMarketsResolved,
    legacyRowsChecked: (legacyRows ?? []).length,
    legacyBackfilled,
    legacyResolved,
  };
  console.log("[resolve-markets] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
