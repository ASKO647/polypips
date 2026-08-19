import type { Metadata } from "next";
import Link from "next/link";
import { fetchOwnerAuditLog } from "@/lib/supabase/owner-security";
import { formatOwnerDateTime } from "@/lib/owner-format";
import { OWNER_BASE_PATH } from "@/lib/owner-path";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PAGE_SIZE = 40;

export default async function OwnerLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);
  const { rows, total } = await fetchOwnerAuditLog({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Logs</h1>
      <p className="text-sm text-slate-400">
        Accès et actions sensibles de la console propriétaire — connexions,
        tentatives échouées, déconnexions forcées.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Événement</th>
              <th className="px-4 py-3 font-medium">Résultat</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(log.createdAt)}</td>
                <td className="px-4 py-3 text-slate-200">{log.event}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      log.result === "granted" || log.result === "success"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    )}
                  >
                    {log.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{log.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{log.ip ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Aucun événement enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {total} événement{total > 1 ? "s" : ""} — page {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`${OWNER_BASE_PATH}/logs?page=${page - 1}`}
              className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
            >
              Précédent
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`${OWNER_BASE_PATH}/logs?page=${page + 1}`}
              className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
            >
              Suivant
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
