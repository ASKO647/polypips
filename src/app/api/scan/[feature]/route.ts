import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/supabase/subscriptions";
import { meetsPlan } from "@/lib/plan-access";
import { fetchLastMarketsSyncedAt } from "@/lib/supabase/selected-markets";
import { fetchLastSportMatchesSyncedAt } from "@/lib/supabase/selected-sport-matches";
import { fetchLastTradingSyncedAt } from "@/lib/supabase/selected-trading-analyses";

/**
 * On-demand "Scanner maintenant" trigger for the 3 "Sélectionnés" pages
 * (Polymarket Marchés, Sport, Trading) — Pro+/Ultimate perk, forcing an
 * immediate re-run of the same scan-* Edge Function the cron job calls
 * periodically, instead of waiting for the next automatic run. The scan
 * itself is a shared, global selection (not per-user) — see each scan-*
 * Edge Function's own file comment — so this genuinely refreshes it for
 * every user, gated here by rate limit + plan.
 */

export const maxDuration = 60;

const FEATURE_CONFIG = {
  markets: { functionName: "scan-markets", cooldownMinutes: 30 },
  sports: { functionName: "scan-sport-matches", cooldownMinutes: 30 },
  trading: { functionName: "scan-trading-pairs", cooldownMinutes: 30 },
} as const;

type Feature = keyof typeof FEATURE_CONFIG;

function isFeature(value: string): value is Feature {
  return value in FEATURE_CONFIG;
}

async function fetchLastSyncedAt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  feature: Feature
): Promise<string | null> {
  if (feature === "markets") return fetchLastMarketsSyncedAt(supabase);
  if (feature === "sports") return fetchLastSportMatchesSyncedAt(supabase);
  return fetchLastTradingSyncedAt(supabase);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ feature: string }> }
) {
  const { feature: featureParam } = await params;
  const t = await getTranslations("Dashboard.OnDemandScan");

  if (!isFeature(featureParam)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const feature = featureParam;
  const config = FEATURE_CONFIG[feature];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: t("errors.unauthorized") },
      { status: 401 }
    );
  }

  const plan = await getEffectivePlan(supabase, user.id);
  if (!meetsPlan(plan.id, "pro_plus")) {
    return NextResponse.json(
      { error: "plan_required", message: t("errors.planRequired") },
      { status: 403 }
    );
  }

  const lastSyncedAt = await fetchLastSyncedAt(supabase, feature);
  if (lastSyncedAt) {
    const elapsedMinutes = (Date.now() - new Date(lastSyncedAt).getTime()) / 60_000;
    if (elapsedMinutes < config.cooldownMinutes) {
      const waitMinutes = Math.ceil(config.cooldownMinutes - elapsedMinutes);
      return NextResponse.json(
        { error: "cooldown", message: t("errors.cooldown", { minutes: waitMinutes }) },
        { status: 429 }
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[scan/trigger] missing Supabase env config");
    return NextResponse.json(
      { error: "unknown", message: t("errors.unknown") },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${config.functionName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`[scan/trigger] ${config.functionName} responded ${response.status}`, body);
      return NextResponse.json(
        { error: "unknown", message: t("errors.unknown") },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error(`[scan/trigger] failed to invoke ${config.functionName}`, error);
    return NextResponse.json(
      { error: "unknown", message: t("errors.unknown") },
      { status: 502 }
    );
  }

  return NextResponse.json({ triggered: true });
}
