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

/** A market only gets saved if it clears one of these bars — either the
 * model's own confidence in the opportunity, or a large enough gap from
 * the market's current price to be worth surfacing regardless of the
 * opportunity score. Both are deliberately named constants, not magic
 * numbers, so they're easy to retune later. */
const OPPORTUNITY_THRESHOLD = 55;
const MIN_ABS_EDGE = 8;

/** Rows not refreshed by a run in this long are pruned — generous enough
 * to survive a few missed/failed runs at the default 6h schedule without
 * wiping the table, while still keeping the list current. */
const STALE_AFTER_HOURS = 24;

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

type ScanOutcome =
  | { status: "selected"; slug: string }
  | { status: "rejected"; slug: string }
  | { status: "failed"; slug: string };

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

    const { error: upsertError } = await supabase.from("selected_markets").upsert(
      {
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
        scanned_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    if (upsertError) {
      console.error(`[scan-markets] upsert failed for ${market.slug}`, upsertError);
      return { status: "failed", slug: market.slug } satisfies ScanOutcome;
    }

    return { status: "selected", slug: market.slug } satisfies ScanOutcome;
  });

  const staleCutoff = new Date(Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000).toISOString();
  const { error: pruneError } = await supabase
    .from("selected_markets")
    .delete()
    .lt("scanned_at", staleCutoff);
  if (pruneError) {
    console.error("[scan-markets] failed to prune stale rows", pruneError);
  }

  const summary = {
    scanned: outcomes.length,
    selected: outcomes.filter((o) => o.status === "selected").length,
    rejected: outcomes.filter((o) => o.status === "rejected").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
  };
  console.log("[scan-markets] run complete", summary);

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
