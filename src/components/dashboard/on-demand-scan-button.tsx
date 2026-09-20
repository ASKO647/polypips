"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { meetsPlan, upgradeTargetPlan } from "@/lib/plan-access";
import type { PlanId } from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

/** "Scanner maintenant" — Pro+/Ultimate perk on the 3 "Sélectionnés" pages
 * (Polymarket Marchés, Sport, Trading), forcing an immediate re-run of the
 * automatic scan instead of waiting for the next cron cycle. Pro/decouverte
 * users see the same button, disabled, with an upgrade hint — consistent
 * with the rest of the tier-gating UI (see TierLockedOverlay) even though
 * this one small control isn't worth a full blur overlay. */
export function OnDemandScanButton({
  feature,
  currentPlan,
}: {
  feature: "markets" | "sports" | "trading";
  currentPlan: PlanId | null;
}) {
  const t = useTranslations("Dashboard.OnDemandScan");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const unlocked = meetsPlan(currentPlan, "pro_plus");

  const handleUpgrade = async () => {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: upgradeTargetPlan("pro_plus"), locale }),
      });
      const data = await response.json();
      if (data.changed) {
        window.location.href = `/${locale}/dashboard/settings?checkout=success`;
        return;
      }
      if (!response.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setPending(false);
    }
  };

  const handleScan = async () => {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/scan/${feature}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || t("errors.unknown"));
        return;
      }
      setMessage(t("success"));
      router.refresh();
    } catch {
      setMessage(t("errors.unknown"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={unlocked ? handleScan : handleUpgrade}
        disabled={pending}
        title={unlocked ? undefined : t("lockedTooltip")}
        className={cn(
          "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
          unlocked
            ? "border-brand-400/40 bg-brand-500/10 text-brand-300 hover:border-brand-400/70"
            : "border-white/10 bg-white/[0.03] text-white/40"
        )}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} strokeWidth={2} />
        {pending ? t("scanning") : t("button")}
      </button>
      {message && <p className="text-[11px] text-white/40">{message}</p>}
    </div>
  );
}
