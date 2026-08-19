import type { Metadata } from "next";
import Link from "next/link";
import { fetchOwnerUsers, type OwnerUserStatusFilter } from "@/lib/supabase/owner-users";
import { formatOwnerDateTime } from "@/lib/owner-format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS_OPTIONS: { value: OwnerUserStatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "decouverte", label: "Découverte" },
  { value: "pro", label: "Pro" },
  { value: "active", label: "Actif" },
  { value: "canceled", label: "Annulé" },
  { value: "expired", label: "Expiré" },
];

const PAGE_SIZE = 25;

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status: statusParam, page: pageParam } = await searchParams;
  const status = (STATUS_OPTIONS.some((s) => s.value === statusParam)
    ? statusParam
    : "all") as OwnerUserStatusFilter;
  const page = Math.max(Number(pageParam) || 1, 1);

  const { rows, total } = await fetchOwnerUsers({ search: q, status, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Users</h1>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par email..."
          className="h-10 w-64 rounded-lg border border-white/10 bg-[#12151b] px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/60"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-white/10 bg-[#12151b] px-3 text-sm text-white outline-none focus:border-cyan-500/60"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-[#0b0d10] hover:bg-cyan-400"
        >
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12151b]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Inscrit le</th>
              <th className="px-4 py-3 font-medium">Dernière activité</th>
              <th className="px-4 py-3 font-medium">Offre</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Analyses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-slate-200">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(u.createdAt)}</td>
                <td className="px-4 py-3 text-slate-400">{formatOwnerDateTime(u.lastSignInAt)}</td>
                <td className="px-4 py-3 text-slate-400">{u.plan ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      u.status === "active" || u.status === "trialing"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : u.status === "past_due"
                          ? "bg-amber-500/10 text-amber-300"
                          : u.status === "canceled"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-white/5 text-slate-400"
                    )}
                  >
                    {u.status ?? "aucun"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{u.analysesCount}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aucun utilisateur ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {total} utilisateur{total > 1 ? "s" : ""} — page {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`?q=${q ?? ""}&status=${status}&page=${page - 1}`}
              className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
            >
              Précédent
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`?q=${q ?? ""}&status=${status}&page=${page + 1}`}
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
