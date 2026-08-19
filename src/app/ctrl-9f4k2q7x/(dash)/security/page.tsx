import type { Metadata } from "next";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { getOwnerAalStatus } from "@/lib/supabase/owner";
import { fetchOwnerAuditLog } from "@/lib/supabase/owner-security";
import { formatOwnerDateTime } from "@/lib/owner-format";
import { DisconnectSessionsButton } from "@/components/owner/disconnect-sessions-button";
import { disconnectAllOwnerSessions } from "./actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerSecurityPage() {
  const [aal, recentEvents] = await Promise.all([
    getOwnerAalStatus(),
    fetchOwnerAuditLog({ page: 1, pageSize: 15 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">Security</h1>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#12151b] p-5">
        {aal.hasVerifiedFactor ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-5 w-5" strokeWidth={2} />
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-white">
            Double authentification (TOTP)
          </p>
          <p className="text-xs text-slate-400">
            {aal.hasVerifiedFactor ? "Activée" : "Non activée"} — session actuelle :{" "}
            {aal.currentLevel === "aal2" ? "vérifiée (aal2)" : "non vérifiée"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#12151b] p-5">
        <p className="text-sm font-semibold text-white">Sessions</p>
        <p className="mt-1 text-xs text-slate-400">
          Révoque tous les jetons de rafraîchissement du compte OWNER, sur tous
          les appareils.
        </p>
        <div className="mt-4">
          <DisconnectSessionsButton action={disconnectAllOwnerSessions} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-white">Événements récents</p>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Événement</th>
                <th className="px-4 py-3 font-medium">Résultat</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.rows.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-200">{log.event}</td>
                  <td className="px-4 py-3 text-slate-400">{log.result}</td>
                  <td className="px-4 py-3 text-slate-400">{log.ip ?? "—"}</td>
                </tr>
              ))}
              {recentEvents.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aucun événement récent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
