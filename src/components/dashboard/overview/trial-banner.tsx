import { Timer } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";

/** Points to /dashboard/settings, not a fresh /api/stripe/checkout call —
 * this user already has an active (trialing) Stripe subscription, so
 * starting a new Checkout session here would create a second, conflicting
 * one instead of managing the existing one. Settings' Abonnement tab is
 * where upgrading an existing subscription actually happens
 * (/api/stripe/change-plan). */
export function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Timer className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-bold text-white">
            Votre essai gratuit expire dans {daysRemaining} jour
            {daysRemaining > 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/50">
            Accédez à des analyses illimitées, au Coach IA et au Smart Money
            — abonnez-vous pour un accès complet.
          </p>
        </div>
      </div>
      <Button type="button" href="/dashboard/settings" className="shrink-0">
        S&apos;abonner maintenant
        <ButtonIcon>→</ButtonIcon>
      </Button>
    </div>
  );
}
