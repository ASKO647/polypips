import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TradingAnalysesHistory } from "@/components/dashboard/trading/trading-analyses-history";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentTradingAnalyses } from "@/lib/supabase/trading-analyses";

export const metadata: Metadata = {
  title: "Trading — Mes analyses — Polypips",
};

export default async function TradingMesAnalysesPage() {
  const t = await getTranslations("Trading.History");
  const supabase = await createClient();
  const analyses = await fetchRecentTradingAnalyses(supabase, 50);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-white/45">{t("pageDescription")}</p>
      </div>
      <TradingAnalysesHistory analyses={analyses} />
    </div>
  );
}
