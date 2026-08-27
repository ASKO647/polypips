"use client";

import { CopiedTradesList } from "@/components/dashboard/copy-trading/copied-trades-list";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/providers/currency-provider";
import type { Suggestion } from "@/lib/data/copy-trading";
import type { CopiedTradeItem } from "@/lib/data/copied-trades";

function toItem(suggestion: Suggestion, formatAmount: (amountEur: number) => string): CopiedTradeItem {
  const isCopied = suggestion.decision === "copied";
  const edgeSuffix =
    suggestion.edge !== null ? ` · edge ${suggestion.edge >= 0 ? "+" : ""}${suggestion.edge.toFixed(1)}%` : "";

  return {
    id: suggestion.id,
    walletLabel: suggestion.walletLabel,
    walletBadge: null,
    subtitle: `${suggestion.marketQuestion} · ${suggestion.side}${edgeSuffix}`,
    decision: isCopied ? "copie" : "ignore",
    score: suggestion.opportunityScore,
    scoreLabel: "Score opportunité",
    amountLabel: isCopied ? "Montant suggéré" : "Montant wallet",
    amountValue: formatAmount(isCopied ? suggestion.amount : (suggestion.originalAmount ?? suggestion.amount)),
    status: suggestion.status,
    ignoreReason: suggestion.ignoreReason,
    createdAgo: suggestion.createdAgo,
    linkLabel: "Voir sur Polymarket",
  };
}

export function PolymarketTradesFlow({
  suggestions,
  hasActiveSubscription,
  cancelled,
}: {
  suggestions: Suggestion[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const { formatAmount } = useCurrency();
  const suggestionById = new Map(suggestions.map((s) => [s.id, s]));

  const handleOpen = async (item: CopiedTradeItem) => {
    const suggestion = suggestionById.get(item.id);
    if (!suggestion) return;
    if (item.status !== "lien_cliquee") {
      const supabase = createClient();
      await supabase.from("copy_trading_suggestions").update({ status: "lien_cliquee" }).eq("id", item.id);
    }
    window.open(suggestion.marketUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <CopiedTradesList
      title="Mes trades copiés"
      description="Chaque mouvement détecté sur un wallet Polymarket suivi et sa décision (copié ou ignoré selon vos filtres de risque). PolyPips ne trade jamais à votre place — cliquez une ligne pour ouvrir le marché sur Polymarket et décider vous-même."
      items={suggestions.map((s) => toItem(s, formatAmount))}
      hasActiveSubscription={hasActiveSubscription}
      cancelled={cancelled}
      lockedMessage={
        cancelled
          ? "Abonnement annulé — réabonnez-vous pour voir vos trades copiés."
          : "Débloquez le suivi de vos trades copiés. Débutez pour 0,99 €"
      }
      emptyMessage="Aucun trade copié pour le moment — activez une stratégie de Copy Trading sur un wallet Polymarket suivi pour commencer à en voir apparaître ici."
      onOpen={handleOpen}
    />
  );
}
