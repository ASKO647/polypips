"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

type CheckoutStatus = { plan: string | null; status: string | null; cancelAtPeriodEnd: boolean };

/**
 * Shown right after a Whop checkout redirect (?checkout=pending — see
 * src/lib/payments/whop/subscription-checkout.ts's redirect_url). Access
 * is granted ONLY by the webhook, never by this redirect itself (same
 * rule as Stripe), so this component grants nothing — it only polls the
 * read-only /api/checkout/status endpoint until the webhook has visibly
 * updated the subscription row, then refreshes the page so the real
 * server-rendered state takes over. Gives up after ~60s with a message
 * telling the user their payment may still be processing.
 */
export function CheckoutPendingBanner({
  baselinePlan,
  baselineStatus,
}: {
  baselinePlan: string | null;
  baselineStatus: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const pending = searchParams.get("checkout") === "pending";
  const [timedOut, setTimedOut] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!pending) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > 20) {
        clearInterval(interval);
        if (!cancelled) setTimedOut(true);
        return;
      }
      try {
        const response = await fetch("/api/checkout/status");
        if (!response.ok) return;
        const data: CheckoutStatus = await response.json();
        const changed = data.plan !== baselinePlan || data.status !== baselineStatus;
        if (changed && !cancelled) {
          clearInterval(interval);
          router.replace("/dashboard/settings?checkout=success");
          router.refresh();
        }
      } catch {
        // Transient network hiccup — the next tick retries.
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!pending) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-400/30 bg-brand-500/[0.06] px-4 py-3.5 text-sm text-dash-text-secondary">
      {!timedOut ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-400" />
          <p>
            {locale === "fr"
              ? "Confirmation de votre paiement en cours — cette page se mettra à jour automatiquement, sans action de votre part."
              : "Confirming your payment — this page will update automatically, no action needed."}
          </p>
        </>
      ) : (
        <p>
          {locale === "fr"
            ? "La confirmation prend plus de temps que prévu. Si votre offre ne s'affiche pas à jour dans quelques minutes, contactez le support."
            : "Confirmation is taking longer than expected. If your plan doesn't update within a few minutes, contact support."}
        </p>
      )}
    </div>
  );
}
