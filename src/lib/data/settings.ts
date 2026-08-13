/**
 * Subscription is mocked pending Stripe integration - planId references
 * the real lib/data/pricing.ts entry so the displayed price/features never
 * drift from what's actually sold on the pricing page.
 */

export type SubscriptionStatus = "active" | "canceled";

export type MockSubscription = {
  planId: string;
  status: SubscriptionStatus;
  renewalDate: string;
};

export const MOCK_SUBSCRIPTION: MockSubscription = {
  planId: "pro",
  status: "active",
  renewalDate: "12 septembre 2026",
};

/** Mocked pending real per-plan usage tracking. */
export const MOCK_USAGE = {
  analysesToday: 7,
};

/** Only relevant when MOCK_SUBSCRIPTION.planId === "decouverte". */
export const MOCK_TRIAL_DAYS_REMAINING = 3;

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
