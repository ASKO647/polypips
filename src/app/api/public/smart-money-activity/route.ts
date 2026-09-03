import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public, unauthenticated endpoint — powers the landing page's activity
// popup. Reads through get_public_smart_money_activity (see the
// 20260813200000 migration), a SECURITY DEFINER function that exposes only
// a narrow, filtered slice of tracked_wallets.recent_movements rather than
// the table itself.
export const dynamic = "force-dynamic";

const MIN_AMOUNT_EUR = 500;
const MAX_AGE_HOURS = 48;
const RESULT_LIMIT = 20;

type ActivityRow = {
  wallet_label: string;
  market: string;
  side: string;
  movement_type: string;
  amount: number;
  occurred_at: string;
};

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_smart_money_activity", {
    min_amount: MIN_AMOUNT_EUR,
    max_age_hours: MAX_AGE_HOURS,
    result_limit: RESULT_LIMIT,
  });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Returns raw fields rather than a pre-built sentence so the client can
  // render the message in the active locale via SmartMoneyPopup.message —
  // this route has no locale context of its own.
  const movements = ((data ?? []) as ActivityRow[]).map((row) => ({
    id: `${row.wallet_label}-${row.occurred_at}-${row.market}`,
    wallet: row.wallet_label,
    action: row.movement_type === "Vente" ? ("sell" as const) : ("buy" as const),
    amount: Math.round(row.amount),
    market: row.market,
    occurredAt: row.occurred_at,
  }));

  return NextResponse.json({ movements });
}
