import Link from "next/link";
import { cn } from "@/lib/utils";
import { OWNER_PERIODS, type OwnerPeriod } from "@/lib/owner-period";

/** Pure server component — period switches are plain links to
 * `?period=...` on the same path, so filtering happens via a fresh
 * server-rendered request (server-side filtering, no client fetch). */
export function PeriodFilter({
  basePath,
  active,
}: {
  basePath: string;
  active: OwnerPeriod;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OWNER_PERIODS.map((p) => (
        <Link
          key={p.value}
          href={p.value === "30d" ? basePath : `${basePath}?period=${p.value}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            p.value === active
              ? "bg-cyan-500/15 text-cyan-300"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
