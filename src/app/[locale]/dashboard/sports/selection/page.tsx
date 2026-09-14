import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SportSelectionFlow } from "@/components/dashboard/sports/sport-selection-flow";
import { createClient } from "@/lib/supabase/server";
import { fetchSubscription, hasActiveAccess } from "@/lib/supabase/subscriptions";
import {
  fetchLastSportMatchesSyncedAt,
  fetchSelectedSportMatches,
} from "@/lib/supabase/selected-sport-matches";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sport.Selection");
  return { title: t("metaTitle") };
}

export default async function SportSelectionPage() {
  const supabase = await createClient();
  const [subscription, matches, lastSyncedAt] = await Promise.all([
    fetchSubscription(supabase),
    fetchSelectedSportMatches(supabase),
    fetchLastSportMatchesSyncedAt(supabase),
  ]);

  return (
    <SportSelectionFlow
      matches={matches}
      hasActiveSubscription={hasActiveAccess(subscription)}
      lastSyncedAt={lastSyncedAt}
    />
  );
}
