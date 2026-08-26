import { cn } from "@/lib/utils";

type ConnectionRow = {
  label: string;
  connected: boolean;
  note: string;
};

/** Every row is computed honestly, never hardcoded green: Axiom and Fomo
 * are always false (no real integration exists — see
 * lib/data/fomo-axiom-connect.ts), "Wallet de trading" is always false
 * (no wallet-connect/signing flow is built, which is exactly what real
 * execution would require), and only Copy Trading reflects real state
 * (whether the user has at least one enabled signal_copy_settings row). */
export function ConnectionsStatusCard({ hasActiveCopyTrading }: { hasActiveCopyTrading: boolean }) {
  const rows: ConnectionRow[] = [
    { label: "Axiom", connected: false, note: "Aucune API officielle disponible" },
    { label: "Fomo", connected: false, note: "Aucune API officielle disponible" },
    {
      label: "Wallet de trading",
      connected: false,
      note: "Nécessaire pour l'exécution réelle — pas encore disponible",
    },
    {
      label: "Copy Trading (démo)",
      connected: hasActiveCopyTrading,
      note: hasActiveCopyTrading
        ? "Actif sur au moins un Smart Wallet suivi"
        : "Aucun Copy Trading activé pour le moment",
    },
  ];

  const allReady = rows.every((r) => r.connected);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">État de la connexion</h2>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold",
            allReady ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/45"
          )}
        >
          {allReady ? "PolyPips est prêt" : "Connexions incomplètes"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{row.label}</p>
              <p className="mt-0.5 text-[11px] text-white/40">{row.note}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                row.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              )}
            >
              {row.connected ? "🟢 Connecté" : "🔴 Non connecté"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
