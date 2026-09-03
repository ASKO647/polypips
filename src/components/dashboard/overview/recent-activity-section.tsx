"use client";

import { Bell, BellOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NotificationItem } from "@/lib/data/notifications";
import { cn } from "@/lib/utils";

/** Mirrors SmartMoneyActivityPopup's card recipe exactly (icon pill +
 * uppercase eyebrow + message, rounded-2xl bordered card) — same
 * component family, just translated from the landing page's light tokens
 * to the dashboard's dark ones, and from a single floating toast to a
 * stacked list of cards instead of one at a time. */
export function RecentActivitySection({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const t = useTranslations("Dashboard.RecentActivitySection");

  return (
    <div className="rounded-2xl border border-dash-border bg-dash-surface p-5 sm:p-6">
      <h2 className="font-display text-base font-bold text-dash-text">
        {t("title")}
      </h2>

      {notifications.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-dash-border px-6 py-10 text-center">
          <BellOff className="h-5 w-5 text-dash-text-faint" />
          <p className="text-sm text-dash-text-quaternary">{t("empty")}</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {notifications.map((notification) => {
            const card = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-dash-border bg-dash-surface p-4 transition-colors duration-150",
                  notification.linkUrl && "hover:border-dash-border-strong hover:bg-dash-surface-hover"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    notification.read
                      ? "bg-dash-surface-strong text-dash-text-faint"
                      : "bg-brand-500/15 text-brand-400"
                  )}
                >
                  <Bell className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-dash-text-quaternary">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-dash-text">
                    {notification.description}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-dash-text-faint">
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
                    {card}
                  </a>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
