export type NotificationPreference = {
  id: "new-opportunities" | "weekly-summary" | "smart-money-moves";
  enabled: boolean;
};

/** Display labels live in messages/{locale}/profile.json under
 * Profile.ProfileTab.notifications.prefs, keyed by id — call
 * t(`notifications.prefs.${pref.id}`) with a translator scoped to
 * "Profile.ProfileTab" to render them. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  { id: "new-opportunities", enabled: true },
  { id: "weekly-summary", enabled: true },
  { id: "smart-money-moves", enabled: false },
];
