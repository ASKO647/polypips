import { FlaskConical } from "lucide-react";

/** Shown wherever Smart Wallets data is rendered — every wallet/trade row
 * synced today carries data_source_mode='mock' because neither Fomo nor
 * Axiom expose a documented public/commercial API yet (see
 * sync-signal-wallets' file comment). This banner is the UI half of that
 * guarantee: a viewer must never mistake this for real trading history. */
export function DemoDataBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
      <FlaskConical className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
      <p className="text-xs leading-relaxed text-amber-200/90">
        Données de démonstration — aucune API publique Fomo/Axiom n&apos;est encore connectée. Ces
        wallets et trades sont générés pour illustrer le fonctionnement du Copy Trading, pas de
        vraies performances.
      </p>
    </div>
  );
}
