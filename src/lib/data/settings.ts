export type NotificationPreference = {
  id: string;
  label: string;
  enabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    id: "new-opportunities",
    label: "Alertes nouvelles opportunités",
    enabled: true,
  },
  { id: "weekly-summary", label: "Résumé hebdomadaire", enabled: true },
  {
    id: "smart-money-moves",
    label: "Mouvements Smart Money importants",
    enabled: false,
  },
];
