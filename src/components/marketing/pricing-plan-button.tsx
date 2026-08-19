"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, ButtonIcon } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { PlanId } from "@/lib/stripe/plans";

export function PricingPlanButton({
  planId,
  label,
  variant,
  className,
}: {
  planId: PlanId;
  label: string;
  variant: "primary" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/signup?plan=${planId}`);
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, locale }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.message || "Checkout indisponible.");
      }
      window.location.href = data.url;
    } catch {
      setError("Impossible de démarrer le paiement. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        size="lg"
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Redirection..." : label}
        <ButtonIcon variant={variant}>→</ButtonIcon>
      </Button>
      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
