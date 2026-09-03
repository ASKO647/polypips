"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Dashboard-only (sidebar, Paramètres > Mot de passe, header profile
 * menu) — raw dash-native styling rather than the marketing Button
 * component, which is locked to the site's forced-light tokens and
 * doesn't adapt to the dashboard's own theme toggle. */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Auth.SignOut");

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-full border border-dash-border-strong text-sm font-semibold text-dash-text-secondary transition-colors hover:border-dash-text-quaternary hover:text-dash-text disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {loading ? t("loading") : t("cta")}
    </button>
  );
}
