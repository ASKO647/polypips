"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import type { NotificationItem } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function NotificationsBell({
  notifications: initialNotifications,
}: {
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [open]);

  const handleSelect = async (notification: NotificationItem) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notification.id);
    }
    if (notification.linkUrl) {
      window.open(notification.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-transform duration-150 ease-out hover:scale-105 hover:text-white active:scale-95"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 max-w-[calc(100vw-2.5rem)] animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-[#160b0c] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.6)]"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-bold text-white">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff className="h-6 w-6 text-white/25" />
              <p className="text-sm text-white/40">
                Aucune notification pour le moment.
              </p>
            </div>
          ) : (
            <ul className="flex max-h-80 flex-col overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-white/5 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(notification)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        notification.read ? "bg-transparent" : "bg-brand-500"
                      )}
                    />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/50">
                        {notification.description}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/30">
                        {notification.timeAgo}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
