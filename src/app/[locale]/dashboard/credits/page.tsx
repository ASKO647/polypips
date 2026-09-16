import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCreditBalance, fetchCreditTransactions } from "@/lib/supabase/credits";
import { CreditsPageContent } from "@/components/dashboard/credits/credits-page-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Credits");
  return { title: t("metaTitle") };
}

export default async function CreditsPage() {
  const supabase = await createClient();
  const [balance, transactions] = await Promise.all([
    fetchCreditBalance(supabase),
    fetchCreditTransactions(supabase),
  ]);

  return <CreditsPageContent balance={balance} transactions={transactions} />;
}
