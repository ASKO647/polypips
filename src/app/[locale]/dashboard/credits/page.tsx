import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCreditBalance, fetchCreditTransactions } from "@/lib/supabase/credits";
import { ensureReferralSlug } from "@/lib/supabase/user-referrals";
import { CreditsPageContent } from "@/components/dashboard/credits/credits-page-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Credits");
  return { title: t("metaTitle") };
}

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [balance, transactions, referralSlug] = await Promise.all([
    fetchCreditBalance(supabase),
    fetchCreditTransactions(supabase),
    user ? ensureReferralSlug(supabase, user.id) : Promise.resolve(null),
  ]);

  return (
    <CreditsPageContent balance={balance} transactions={transactions} referralSlug={referralSlug} />
  );
}
