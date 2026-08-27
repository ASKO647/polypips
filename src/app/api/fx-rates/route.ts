import { NextResponse } from "next/server";

/** No-key public FX API — good enough for a display-only conversion (the
 * actual Stripe charge always stays in EUR, this only affects what the
 * dashboard shows). Falls back to EUR-only rather than erroring, but
 * flags `error` so the client can tell the user real conversion is
 * temporarily unavailable instead of silently mislabeling EUR as USD. */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR", {
      next: { revalidate: 21600 },
    });
    if (!res.ok) throw new Error(`FX rate fetch failed with status ${res.status}`);
    const data = await res.json();
    if (!data?.rates || typeof data.rates !== "object") {
      throw new Error("FX rate response missing rates");
    }
    return NextResponse.json({ rates: data.rates as Record<string, number> });
  } catch (error) {
    console.error("[api/fx-rates] failed to fetch live FX rates", error);
    return NextResponse.json({ rates: { EUR: 1 }, error: "fx_unavailable" });
  }
}
