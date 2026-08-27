"use client";

import { CopiedTradesList } from "@/components/dashboard/copy-trading/copied-trades-list";
import { createClient } from "@/lib/supabase/client";
import type { SignalCopyTrade } from "@/lib/data/signal-copy-trading";
import { SIGNAL_SOURCE_LABELS } from "@/lib/data/signal-wallets";
import type { CopiedTradeItem } from "@/lib/data/copied-trades";

/** Mirrors sync-signal-wallets/index.ts's own buildPlatformUrl() exactly
 * — that Edge Function (Deno) and this frontend (Next.js) don't share a
 * module, so this trivial mapping is duplicated rather than imported.
 * Update both together if a confirmed per-token URL format ever replaces
 * the homepage fallback. */
function platformUrl(source: "fomo" | "axiom"): string {
  return source === "axiom" ? "https://axiom.trade" : "https://fomo.family";
}

function toItem(trade: SignalCopyTrade): CopiedTradeItem {
  return {
    id: trade.id,
    walletLabel: trade.walletLabel,
    walletBadge: SIGNAL_SOURCE_LABELS[trade.walletSource],
    subtitle: `${trade.tokenSymbol} • ${trade.walletTradeSide === "BUY" ? "Achat" : "Vente"} wallet : ${trade.walletTradeAmount.toLocaleString("fr-FR")} $`,
    decision: trade.decision,
    score: trade.aiScore,
    scoreLabel: "Score IA",
    amountLabel: "Montant estimé",
    amountValue: trade.sizedAmount !== null ? `${trade.sizedAmount.toLocaleString("fr-FR")} $` : "—",
    status: trade.status,
    ignoreReason: trade.ignoreReason,
    createdAgo: trade.createdAgo,
    linkLabel: `Voir sur ${SIGNAL_SOURCE_LABELS[trade.walletSource]}`,
  };
}

export function PositionsFlow({
  trades,
  hasActiveSubscription,
  cancelled,
}: {
  trades: SignalCopyTrade[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const tradeById = new Map(trades.map((t) => [t.id, t]));

  const handleOpen = async (item: CopiedTradeItem) => {
    const trade = tradeById.get(item.id);
    if (!trade) return;
    if (item.status !== "lien_cliquee") {
      const supabase = createClient();
      await supabase.from("signal_copy_trades").update({ status: "lien_cliquee" }).eq("id", item.id);
    }
    window.open(platformUrl(trade.walletSource), "_blank", "noopener,noreferrer");
  };

  return (
    <CopiedTradesList
      title="Mes trades copiés"
      description="Chaque trade détecté sur un Smart Wallet suivi et sa décision (copié ou ignoré selon vos filtres de risque). PolyPips ne trade jamais à votre place — cliquez une ligne pour ouvrir la plateforme concernée et décider vous-même."
      items={trades.map(toItem)}
      hasActiveSubscription={hasActiveSubscription}
      cancelled={cancelled}
      lockedMessage={
        cancelled
          ? "Abonnement annulé — réabonnez-vous pour voir vos trades copiés."
          : "Débloquez le suivi de vos trades copiés. Débutez pour 0,99 €"
      }
      emptyMessage="Aucun trade copié pour le moment — activez le Copy Trading sur un Smart Wallet suivi pour commencer à en voir apparaître ici."
      onOpen={handleOpen}
    />
  );
}
