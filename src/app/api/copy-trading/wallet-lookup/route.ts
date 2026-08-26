import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userHasActiveAccess } from "@/lib/supabase/subscriptions";
import {
  fetchWalletActivity,
  fetchWalletPositions,
  fetchWalletValue,
  WALLET_ADDRESS_RE,
} from "@/lib/polymarket-data";
import type { WalletDailyFlowPoint, WalletLookupResult } from "@/lib/data/smart-money";
import type { WalletMovement as DataApiMovement } from "@/lib/polymarket-data";
import { formatRelativeTime } from "@/lib/supabase/analyses";

function shortLabel(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const RECENT_MOVEMENTS_SPLIT = 6;
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

/** Buckets the live activity feed into one net-flow point per calendar day
 * (sells minus buys) — the "graphique jour par jour (gains/pertes)" the
 * on-demand lookup shows, since there's no wallet_snapshots history for an
 * address nobody has tracked before. Oldest day first, so it reads
 * left-to-right like every other chart in the app. */
function buildDailyFlow(activity: DataApiMovement[]): WalletDailyFlowPoint[] {
  const byDay = new Map<string, number>();
  for (const movement of activity) {
    const day = movement.timestamp.slice(0, 10); // YYYY-MM-DD
    const signedAmount = movement.type === "Vente" ? movement.amount : -movement.amount;
    byDay.set(day, (byDay.get(day) ?? 0) + signedAmount);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({
      label: DAY_LABEL_FORMAT.format(new Date(`${day}T00:00:00Z`)),
      value: Math.round(value),
    }));
}

function toWalletMovement(m: DataApiMovement): WalletLookupResult["recentMovements"][number] {
  return {
    id: m.id,
    type: m.type,
    market: m.market,
    amount: m.amount,
    timeAgo: formatRelativeTime(m.timestamp),
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Connectez-vous pour continuer." },
      { status: 401 }
    );
  }

  // UI blur is not a security boundary — same subscription check every
  // other Copy Trading / Smart Money mutating endpoint runs server-side.
  if (!(await userHasActiveAccess(supabase, user.id))) {
    return NextResponse.json(
      {
        error: "subscription_required",
        message: "Cette fonctionnalité est réservée aux abonnés. Débutez pour 0,99 €.",
      },
      { status: 403 }
    );
  }

  let body: { address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", message: "Corps de requête JSON invalide." },
      { status: 400 }
    );
  }

  const address = (body.address ?? "").trim().toLowerCase();
  if (!WALLET_ADDRESS_RE.test(address)) {
    return NextResponse.json(
      {
        error: "invalid_address",
        message: "Adresse de portefeuille invalide. Format attendu : 0x suivi de 40 caractères hexadécimaux.",
      },
      { status: 400 }
    );
  }

  const [{ data: trackedRow }, positions, activity, liveValue] = await Promise.all([
    supabase
      .from("tracked_wallets")
      .select(
        "id, label, win_rate, roi_percent, consistency_score, category_diversity, avg_position_size, risk_level, track_record_days"
      )
      .eq("address", address)
      .maybeSingle(),
    fetchWalletPositions(address),
    fetchWalletActivity(address, 60),
    fetchWalletValue(address),
  ]);

  let isFollowed = false;
  if (trackedRow) {
    const { data: followRow } = await supabase
      .from("user_wallet_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("wallet_id", trackedRow.id as string)
      .maybeSingle();
    isFollowed = followRow !== null;
  }

  const movements = activity.map(toWalletMovement);

  const result: WalletLookupResult = {
    address,
    handle: (trackedRow?.label as string | undefined) ?? shortLabel(address),
    totalValue: liveValue,
    positions,
    recentMovements: movements.slice(0, RECENT_MOVEMENTS_SPLIT),
    history: movements.slice(RECENT_MOVEMENTS_SPLIT),
    dailyFlow: buildDailyFlow(activity),
    walletId: (trackedRow?.id as string | undefined) ?? null,
    isFollowed,
    winRate: trackedRow?.win_rate === undefined || trackedRow?.win_rate === null ? null : Number(trackedRow.win_rate),
    roiPercent:
      trackedRow?.roi_percent === undefined || trackedRow?.roi_percent === null
        ? null
        : Number(trackedRow.roi_percent),
    consistencyScore: (trackedRow?.consistency_score as number | null | undefined) ?? null,
    categoryDiversity: (trackedRow?.category_diversity as number | null | undefined) ?? null,
    avgPositionSize:
      trackedRow?.avg_position_size === undefined || trackedRow?.avg_position_size === null
        ? null
        : Number(trackedRow.avg_position_size),
    riskLevel: (trackedRow?.risk_level as WalletLookupResult["riskLevel"] | undefined) ?? null,
    trackRecordDays: (trackedRow?.track_record_days as number | null | undefined) ?? null,
  };

  return NextResponse.json(result);
}
