import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SIGNAL_COPY_SETTINGS, type SignalCopySettings, type SignalCopyTrade } from "@/lib/data/signal-copy-trading";
import { formatRelativeTime } from "@/lib/supabase/analyses";

export async function fetchSignalCopySettings(
  supabase: SupabaseClient,
  userId: string,
  walletId: string
): Promise<SignalCopySettings> {
  const { data } = await supabase
    .from("signal_copy_settings")
    .select(
      "id, enabled, max_position_amount, position_percent, max_daily_amount, max_simultaneous_positions, max_slippage_percent, excluded_tokens"
    )
    .eq("user_id", userId)
    .eq("wallet_id", walletId)
    .maybeSingle();

  if (!data) {
    return { id: null, walletId, ...DEFAULT_SIGNAL_COPY_SETTINGS };
  }

  return {
    id: data.id as string,
    walletId,
    enabled: data.enabled as boolean,
    maxPositionAmount: Number(data.max_position_amount),
    positionPercent: Number(data.position_percent),
    maxDailyAmount: Number(data.max_daily_amount),
    maxSimultaneousPositions: data.max_simultaneous_positions as number,
    maxSlippagePercent: Number(data.max_slippage_percent),
    excludedTokens: (data.excluded_tokens as string[]) ?? [],
  };
}

/** All (walletId -> settings) for wallets the user follows, one query per
 * page load rather than one per wallet card. */
export async function fetchAllSignalCopySettings(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, SignalCopySettings>> {
  const { data } = await supabase
    .from("signal_copy_settings")
    .select(
      "id, wallet_id, enabled, max_position_amount, position_percent, max_daily_amount, max_simultaneous_positions, max_slippage_percent, excluded_tokens"
    )
    .eq("user_id", userId);

  const map = new Map<string, SignalCopySettings>();
  for (const row of data ?? []) {
    map.set(row.wallet_id as string, {
      id: row.id as string,
      walletId: row.wallet_id as string,
      enabled: row.enabled as boolean,
      maxPositionAmount: Number(row.max_position_amount),
      positionPercent: Number(row.position_percent),
      maxDailyAmount: Number(row.max_daily_amount),
      maxSimultaneousPositions: row.max_simultaneous_positions as number,
      maxSlippagePercent: Number(row.max_slippage_percent),
      excludedTokens: (row.excluded_tokens as string[]) ?? [],
    });
  }
  return map;
}

export async function fetchSignalCopyTrades(
  supabase: SupabaseClient,
  userId: string,
  limit = 60
): Promise<SignalCopyTrade[]> {
  const { data, error } = await supabase
    .from("signal_copy_trades")
    .select(
      "id, wallet_id, token_symbol, wallet_trade_side, wallet_trade_amount, ai_score, ai_summary, ai_positives, ai_risks, risk_checks, decision, ignore_reason, sized_amount, entry_price, status, created_at, signal_wallets ( label, source )"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((row) => {
    const wallet = row.signal_wallets as { label: string; source: "fomo" | "axiom" } | null;
    return {
      id: row.id as string,
      walletId: row.wallet_id as string,
      walletLabel: wallet?.label ?? "Wallet inconnu",
      walletSource: wallet?.source ?? "fomo",
      tokenSymbol: row.token_symbol as string,
      walletTradeSide: row.wallet_trade_side as "BUY" | "SELL",
      walletTradeAmount: Number(row.wallet_trade_amount),
      aiScore: row.ai_score === null ? null : Number(row.ai_score),
      aiSummary: row.ai_summary as string | null,
      aiPositives: (row.ai_positives as string[]) ?? [],
      aiRisks: (row.ai_risks as string[]) ?? [],
      riskChecks: (row.risk_checks as SignalCopyTrade["riskChecks"]) ?? [],
      decision: row.decision as "copie" | "ignore",
      ignoreReason: row.ignore_reason as string | null,
      sizedAmount: row.sized_amount === null ? null : Number(row.sized_amount),
      entryPrice: row.entry_price === null ? null : Number(row.entry_price),
      status: row.status as SignalCopyTrade["status"],
      createdAgo: formatRelativeTime(row.created_at as string),
    } satisfies SignalCopyTrade;
  });
}
