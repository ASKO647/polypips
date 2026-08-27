import { Lock, Users } from "lucide-react";
import { UserAvatar } from "@/components/dashboard/user-avatar";

export function GroupCard({
  name,
  description,
  avatarUrl,
  isPrivate,
  memberCount,
  badge,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
}: {
  name: string;
  description: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  memberCount: number | null;
  badge?: string;
  actionLabel: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-3">
        <UserAvatar name={name} avatarUrl={avatarUrl} size={44} className="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            {isPrivate && <Lock className="h-3 w-3 shrink-0 text-white/40" strokeWidth={2.5} />}
          </div>
          {memberCount !== null && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
              <Users className="h-3 w-3" strokeWidth={2} />
              {memberCount} membre{memberCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-400">
            {badge}
          </span>
        )}
      </div>

      <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-white/50">
        {description || "Aucune description."}
      </p>

      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled || actionLoading}
        className="flex h-10 w-full items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white transition-colors hover:border-white/25 disabled:pointer-events-none disabled:opacity-50"
      >
        {actionLoading ? "..." : actionLabel}
      </button>
    </div>
  );
}
