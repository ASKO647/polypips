import { SettingsToggle } from "@/components/dashboard/settings/settings-toggle";
import type { NotificationPreference } from "@/lib/data/settings";

export function NotificationsTab({
  notifications,
  onToggle,
}: {
  notifications: NotificationPreference[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          Choisissez les notifications que vous recevez dans la cloche du
          tableau de bord.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <SettingsToggle
            key={notification.id}
            label={notification.label}
            checked={notification.enabled}
            onChange={() => onToggle(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
