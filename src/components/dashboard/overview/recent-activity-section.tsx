import { Bell, BellOff } from "lucide-react";
import type { NotificationItem } from "@/lib/data/notifications";
import { cn } from "@/lib/utils";

export function RecentActivitySection({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="font-display text-base font-bold text-white">
        Activité récente
      </h2>

      {notifications.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
          <BellOff className="h-5 w-5 text-white/25" />
          <p className="text-sm text-white/40">
            Aucune notification pour le moment.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {notifications.map((notification) => {
            const content = (
              <div className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                <span
                  className={cn(
                    "mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    notification.read
                      ? "bg-white/[0.05] text-white/30"
                      : "bg-brand-500/15 text-brand-400"
                  )}
                >
                  <Bell className="h-3 w-3" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  <p className="line-clamp-1 text-xs text-white/45">
                    {notification.description}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-white/30">
                  {notification.timeAgo}
                </span>
              </div>
            );

            return (
              <li key={notification.id}>
                {notification.linkUrl ? (
                  <a
                    href={notification.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
