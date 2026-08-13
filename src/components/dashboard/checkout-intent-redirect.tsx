"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isPlanId } from "@/lib/stripe/plans";

/**
 * Picks up a `?checkout=<plan>` intent left by the pricing section when a
 * logged-out user had to go through /signup first (see
 * pricing-plan-button.tsx and signup-form.tsx), and resumes the Checkout
 * flow the moment they land back here signed in.
 */
export function CheckoutIntentRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = searchParams.get("checkout");
  const plan = planParam && isPlanId(planParam) ? planParam : null;

  useEffect(() => {
    if (!plan) return;

    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.url) {
          throw new Error(data.message || "Checkout indisponible.");
        }
        window.location.href = data.url;
      })
      .catch(() => {
        // Drop the broken param so the dashboard renders normally instead
        // of retrying forever.
        router.replace("/dashboard");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-[#0d0607]/95">
      <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      <p className="text-sm font-medium text-white/70">
        Redirection vers le paiement...
      </p>
    </div>
  );
}
