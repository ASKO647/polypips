import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Per-model Anthropic pricing, USD per million tokens — the ONE place
 * every Edge Function reads from to cost an API call. Verified against
 * the official, live Anthropic pricing page on 2026-10-22:
 * https://platform.claude.com/docs/en/about-claude/pricing (table under
 * "Model pricing"). Only the two models this app actually calls are
 * listed; add a row here (with its own source/date) before ever calling a
 * different model.
 *
 * cacheWrite5m/cacheRead are included for completeness/future use even
 * though no call site in this codebase sets cache_control yet — see
 * _shared/ai-budget.ts's prompt-caching note for why (every system prompt
 * here is far below each model's minimum cacheable prefix).
 */
export type ModelPricing = {
  /** USD per 1,000,000 input tokens. */
  input: number;
  /** USD per 1,000,000 output tokens. */
  output: number;
  /** USD per 1,000,000 tokens for a 5-minute prompt-cache write. */
  cacheWrite5m: number;
  /** USD per 1,000,000 tokens for a prompt-cache read/hit. */
  cacheRead: number;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Source: https://platform.claude.com/docs/en/about-claude/pricing,
  // "Claude Haiku 4.5" row, fetched 2026-10-22.
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheWrite5m: 1.25, cacheRead: 0.1 },
  // Source: same page, "Claude Opus 5" row, fetched 2026-10-22.
  "claude-opus-5": { input: 5.0, output: 25.0, cacheWrite5m: 6.25, cacheRead: 0.5 },
};

/** Model-agnostic shape of what every Anthropic SDK response's `.usage`
 * exposes — each anthropic-*.ts module reads this straight off
 * `response.usage` and hands it to logAiUsageEvent below. */
export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};

/** USD cost of one API call from its token usage, using MODEL_PRICING
 * above. Returns 0 (rather than throwing) for an unrecognized model id —
 * logAiUsageEvent still records the raw token counts either way, so the
 * gap is visible/fixable in the data rather than silently crashing an
 * analysis over a cost-accounting miss. */
export function computeCostUsd(model: string, usage: AiUsage): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.error(`[ai-pricing] unknown model "${model}" — logging 0 cost, token counts still recorded`);
    return 0;
  }
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;
  const cacheWriteCost = (usage.cacheCreationTokens / 1_000_000) * pricing.cacheWrite5m;
  const cacheReadCost = (usage.cacheReadTokens / 1_000_000) * pricing.cacheRead;
  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export type AiUsageEventKind = "standard" | "deep" | "scan" | "image_extraction";
export type AiCreditSource = "included" | "purchased" | "none";

/** Passed into every analyzeX()/extractX() function alongside its normal
 * arguments so it can log its own ai_usage_events row right after the
 * Anthropic call — kept as one small bag of context rather than adding 4
 * separate parameters to every function signature. `analysisId` is the
 * same id already generated up front for consumeDeepAnalysisCredit (see
 * each index.ts), or null for a scan (no single analyses-table row this
 * usage event is "for"). */
export type AiTelemetry = {
  functionName: string;
  userId: string | null;
  analysisId: string | null;
  kind: AiUsageEventKind;
  creditSource: AiCreditSource;
};

export type AiUsageEventInput = {
  /** null for an automated scan (scan-markets/scan-sport-matches/
   * scan-trading-pairs) — nobody's own quota/budget is being spent. */
  userId: string | null;
  functionName: string;
  model: string;
  kind: AiUsageEventKind;
  usage: AiUsage;
  /** Which balance a deep-analysis credit consumption drew from — see
   * _shared/ai-budget.ts's wouldConsumeIncludedCredit. "none" for every
   * standard/scan/image_extraction call (no credit involved at all). */
  creditSource: AiCreditSource;
  analysisId?: string | null;
};

function serviceRoleClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Records one ai_usage_events row for cost tracking / the owner console's
 * "Coûts IA" section and the monthly spend-cap checks in
 * _shared/ai-budget.ts. ALWAYS best-effort: a logging failure is caught
 * and logged to the function's own console, never rethrown — losing one
 * cost-tracking row must never fail the analysis the user is waiting on.
 */
export async function logAiUsageEvent(input: AiUsageEventInput): Promise<void> {
  try {
    const costUsd = computeCostUsd(input.model, input.usage);
    const { error } = await serviceRoleClient().from("ai_usage_events").insert({
      user_id: input.userId,
      function_name: input.functionName,
      model: input.model,
      kind: input.kind,
      input_tokens: input.usage.inputTokens,
      output_tokens: input.usage.outputTokens,
      cache_creation_tokens: input.usage.cacheCreationTokens,
      cache_read_tokens: input.usage.cacheReadTokens,
      cost_usd: costUsd,
      credit_source: input.creditSource,
      analysis_id: input.analysisId ?? null,
    });
    if (error) {
      console.error("[ai-pricing] failed to log ai_usage_events row", error);
    }
  } catch (error) {
    console.error("[ai-pricing] unexpected error logging ai_usage_events row", error);
  }
}

/** Reads the 4 raw usage fields off an Anthropic SDK response in one
 * place — every anthropic-*.ts module calls this instead of touching
 * `response.usage` fields by hand, so a future SDK field rename only
 * needs fixing here. */
export function usageFromResponse(response: { usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
} }): AiUsage {
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };
}
