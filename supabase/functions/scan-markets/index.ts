import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  listCandidateMarkets,
  GammaUnavailableError,
  type GammaMarket,
} from "../analyze-market/gamma.ts";
import { analyzeMarket, AiServiceError } from "../analyze-market/anthropic-analysis.ts";

/**
 * Cost control: this function burns one Anthropic call per candidate on
 * every run, independent of actual user traffic. Keep this bounded rather
 * than scanning everything Gamma returns — see the task summary for the
 * cost/freshness discussion behind the default cron interval.
 */
const MAX_CANDIDATES_PER_RUN = 45;
/** Over-fetch before filtering/sorting so the volume/liquidity floor in
 * listCandidateMarkets still leaves enough candidates to pick from. Scales
 * with MAX_CANDIDATES_PER_RUN to keep the same ~2.4x margin as before. */
const CANDIDATE_FETCH_POOL = 110;
/** How many Anthropic calls run at once — bounded so a single run doesn't
 * hammer the API, while still finishing well inside an Edge Function's
 * execution time budget. Raised alongside MAX_CANDIDATES_PER_RUN (25→45)
 * so the run still does 5 sequential thinking-enabled rounds, same as
 * before, instead of nearly doubling to 9. */
const CONCURRENCY = 9;

/** A market only qualifies as a candidate for selection if it clears one of
 * these bars — either the model's own confidence in the opportunity, or a
 * large enough gap from the market's current price to be worth surfacing
 * regardless of the opportunity score. Both are deliberately named
 * constants, not magic numbers, so they're easy to retune later. */
const OPPORTUNITY_THRESHOLD = 55;
const MIN_ABS_EDGE = 8;

/** Every run keeps exactly this many markets, picked for category
 * diversity (see selectDiverseAcrossCategories below) rather than a raw
 * top-N by opportunity score — that used to let one high-scoring category
 * (e.g. Politique) monopolize every slot. If fewer than N qualify this
 * run in total, the table ends up with fewer than N rows rather than
 * padding it out with sub-threshold picks just to hit the round number. */
const SELECTION_SIZE = 10;

function confidenceLabel(value: string): "Faible" | "Moyenne" | "Élevée" {
  if (value === "Faible" || value === "Moyenne" || value === "Élevée") {
    return value;
  }
  return "Moyenne";
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

type SelectedMarketRow = {
  slug: string;
  market_url: string;
  question: string;
  category: string;
  decision: "YES" | "NO";
  ai_probability: number;
  market_probability: number;
  edge: number;
  opportunity_score: number;
  confidence: "Faible" | "Moyenne" | "Élevée";
  explanation: string;
  favorable_factors: string[];
  risks: string[];
  what_could_change: string;
  sources: { name: string; url: string }[];
  scanned_at: string;
};

type ScanOutcome =
  | { status: "qualified"; row: SelectedMarketRow }
  | { status: "rejected"; slug: string }
  | { status: "failed"; slug: string };

/**
 * Picks `size` markets out of the qualified pool with guaranteed category
 * diversity, instead of a raw top-N by opportunity score (which let one
 * high-scoring category monopolize every slot).
 *
 * Round-robin, fixed alphabetical category order: group qualified rows by
 * category, sort each category's rows by opportunity_score descending,
 * then repeatedly sweep the categories in alphabetical order taking one
 * (the next-best remaining) row from each category that still has one,
 * until `size` rows are picked or a full sweep picks nothing (every
 * category exhausted — fewer than `size` qualified in total this run, so
 * the result is left short rather than padded).
 *
 * Alphabetical order is deliberate, not "most candidates first": giving
 * leftover slots to whichever category has the deepest bench would just
 * recreate — more slowly — the same imbalance this function exists to
 * fix. Alphabetical order is stable across runs and gives every category
 * an equal shot at the remainder over time.
 */
function selectDiverseAcrossCategories(
  rows: SelectedMarketRow[],
  size: number
): SelectedMarketRow[] {
  const byCategory = new Map<string, SelectedMarketRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category);
    if (list) {
      list.push(row);
    } else {
      byCategory.set(row.category, [row]);
    }
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => b.opportunity_score - a.opportunity_score);
  }

  const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b));
  const nextIndex = new Map(categories.map((category) => [category, 0]));

  const selected: SelectedMarketRow[] = [];
  while (selected.length < size) {
    let pickedThisSweep = false;
    for (const category of categories) {
      if (selected.length >= size) break;
      const list = byCategory.get(category)!;
      const index = nextIndex.get(category)!;
      if (index >= list.length) continue;
      selected.push(list[index]);
      nextIndex.set(category, index + 1);
      pickedThisSweep = true;
    }
    if (!pickedThisSweep) break;
  }

  return selected.sort((a, b) => b.opportunity_score - a.opportunity_score);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is not meant to be called by end users — only by the
  // scheduled cron job (or a manual trigger for testing), both of which
  // authenticate with the project's service role key.
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

  let candidates: GammaMarket[];
  try {
    candidates = await listCandidateMarkets(CANDIDATE_FETCH_POOL);
  } catch (error) {
    console.error(
      "[scan-markets] failed to list candidate markets",
      error instanceof GammaUnavailableError ? error.message : error
    );
    return new Response(
      JSON.stringify({
        error: "gamma_unavailable",
        message: "Impossible de récupérer la liste des marchés Polymarket.",
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const toScan = candidates.slice(0, MAX_CANDIDATES_PER_RUN);
  const scannedAt = new Date().toISOString();

  // Evaluate every candidate first and hold the qualifying ones in memory —
  // nothing is written to selected_markets yet. Writing has to wait until
  // every verdict is in so the top SELECTION_SIZE can be picked from the
  // full qualifying pool, not just "whichever N happened to qualify first."
  const outcomes = await mapWithConcurrency(toScan, CONCURRENCY, async (market) => {
    const marketUrl = `https://polymarket.com/event/${market.slug}`;

    let verdict;
    try {
      verdict = await analyzeMarket(market, marketUrl);
    } catch (error) {
      console.error(
        `[scan-markets] analysis failed for ${market.slug}`,
        error instanceof AiServiceError ? error.message : error
      );
      return { status: "failed", slug: market.slug } satisfies ScanOutcome;
    }

    const marketProbabilityPct = Number.isFinite(market.outcomePrices[0])
      ? Math.round(market.outcomePrices[0] * 100)
      : 50;
    const aiProbability = Math.max(0, Math.min(100, Math.round(verdict.aiProbability)));
    const edge = aiProbability - marketProbabilityPct;
    const opportunityScore = Math.max(0, Math.min(100, Math.round(verdict.opportunityScore)));

    const qualifies = opportunityScore >= OPPORTUNITY_THRESHOLD || Math.abs(edge) >= MIN_ABS_EDGE;
    if (!qualifies) {
      return { status: "rejected", slug: market.slug } satisfies ScanOutcome;
    }

    return {
      status: "qualified",
      row: {
        slug: market.slug,
        market_url: marketUrl,
        question: market.question,
        category: market.category || "Marché",
        decision: verdict.decision,
        ai_probability: aiProbability,
        market_probability: marketProbabilityPct,
        edge,
        opportunity_score: opportunityScore,
        confidence: confidenceLabel(verdict.confidence),
        explanation: verdict.explanation,
        favorable_factors: verdict.favorableFactors,
        risks: verdict.risks,
        what_could_change: verdict.whatCouldChange,
        sources: [
          { name: "Polymarket — données de marché en temps réel", url: marketUrl },
        ],
        scanned_at: scannedAt,
      },
    } satisfies ScanOutcome;
  });

  const qualifiedRows = outcomes
    .filter((o): o is { status: "qualified"; row: SelectedMarketRow } => o.status === "qualified")
    .map((o) => o.row);

  const top = selectDiverseAcrossCategories(qualifiedRows, SELECTION_SIZE);

  // Full replace, not a cumulative upsert: this run's selection becomes the
  // *entire* table, so a market that qualified last run but isn't in this
  // run's top SELECTION_SIZE doesn't linger around. Delete-then-insert
  // (rather than diffing old vs new) briefly leaves the table empty
  // between the two statements — acceptable for a periodic background job
  // nobody is polling mid-run, and far simpler than reconstructing a safe
  // "not in the new set" delete filter.
  const { error: deleteError } = await supabase
    .from("selected_markets")
    .delete()
    .not("id", "is", null);
  if (deleteError) {
    console.error("[scan-markets] failed to clear previous selection", deleteError);
  }

  if (top.length > 0) {
    const { error: insertError } = await supabase.from("selected_markets").insert(top);
    if (insertError) {
      console.error("[scan-markets] failed to insert new selection", insertError);
    }
  }

  const selectedByCategory: Record<string, number> = {};
  for (const row of top) {
    selectedByCategory[row.category] = (selectedByCategory[row.category] ?? 0) + 1;
  }

  const summary = {
    scanned: outcomes.length,
    qualified: outcomes.filter((o) => o.status === "qualified").length,
    selected: top.length,
    selectedByCategory,
    rejected: outcomes.filter((o) => o.status === "rejected").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
  };
  console.log("[scan-markets] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
