import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import type { PipsTrackTopToken } from "@/lib/data/pips-tracks";
import { cn } from "@/lib/utils";

export function TopTokensPanel({ tokens }: { tokens: PipsTrackTopToken[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-sm font-bold text-white">Top tokens mentionnés</h2>

      {tokens.length === 0 ? (
        <p className="text-xs text-white/40">
          Aucun token mentionné dans le flux des dernières 24h pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tokens.map((token) => (
            <div key={token.tokenSymbol} className="flex items-center gap-2.5">
              {token.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={token.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <UserAvatar name={token.tokenSymbol} avatarUrl={null} size={28} className="text-[10px]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">${token.tokenSymbol}</p>
                <p className="text-[11px] text-white/40">{token.mentionCount} mentions</p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-bold",
                  token.changePercent === null
                    ? "text-white/25"
                    : token.changePercent >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                )}
              >
                {token.changePercent === null
                  ? "—"
                  : `${token.changePercent >= 0 ? "+" : ""}${token.changePercent.toFixed(2)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/smart-wallets/suivis"
        className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-400 transition-colors hover:text-brand-300"
      >
        Voir tous les tokens
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}
