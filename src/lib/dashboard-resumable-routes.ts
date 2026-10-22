/** Dashboard routes "Reprendre ma dernière session" is allowed to send a
 * user back to. Deliberately an allow-list, not a deny-list: a route
 * missing from here is simply never resumed into, which is the safe
 * failure mode — new sensitive routes (or ones that get removed later,
 * like the old /dashboard/coach and /dashboard/community/*) don't need
 * to be remembered and added to an exclusion list to stay safe.
 *
 * Deliberately excluded: /dashboard itself (resuming "into" the page
 * you're already resuming from is meaningless), /dashboard/settings
 * (don't ambush the user back into Paramètres), /dashboard/subscription
 * and anything billing/auth/onboarding-shaped (never silently resume
 * into a page that asks for money or credentials).
 */
export const RESUMABLE_DASHBOARD_ROUTES: readonly string[] = [
  "/dashboard/analyse-ia",
  "/dashboard/markets",
  "/dashboard/copy-trading",
  "/dashboard/sports",
  "/dashboard/sports/selection",
  "/dashboard/sports/mes-analyses",
  "/dashboard/trading",
  "/dashboard/trading/selection",
  "/dashboard/trading/mes-analyses",
  "/dashboard/credits",
];

export function isResumableDashboardRoute(pathname: string): boolean {
  return RESUMABLE_DASHBOARD_ROUTES.includes(pathname);
}
