"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useCookieConsent } from "@/providers/cookie-consent-provider";
import { cn } from "@/lib/utils";

/** Full-page equivalent of the customize view inside
 * CookieConsentBanner — same categories, same underlying
 * useCookieConsent() state, so a choice made here is exactly the choice
 * the banner would have recorded, and vice versa. */
export function CookiesPreferences() {
  const { consent, hydrated, save } = useCookieConsent();
  const [analyticsDraft, setAnalyticsDraft] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalyticsDraft(consent?.analytics ?? false);
    }
  }, [hydrated, consent]);

  if (!hydrated) return null;

  const handleSave = () => {
    save(analyticsDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col divide-y divide-border">
        <div className="flex items-start justify-between gap-4 py-4 first:pt-0">
          <div>
            <p className="text-sm font-semibold text-ink">Cookies essentiels</p>
            <p className="mt-1 text-sm leading-relaxed text-body">
              Nécessaires au fonctionnement du site (connexion, sécurité, mémorisation de vos
              préférences). Ils ne peuvent pas être désactivés.
            </p>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-body-soft">
            Toujours actif
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">Cookies de mesure d&apos;audience</p>
            <p className="mt-1 text-sm leading-relaxed text-body">
              Nous aident à comprendre l&apos;utilisation du site pour l&apos;améliorer.
              Désactivés par défaut.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={analyticsDraft}
            aria-label="Cookies de mesure d'audience"
            onClick={() => setAnalyticsDraft((v) => !v)}
            className={cn(
              "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
              analyticsDraft ? "bg-brand-500" : "bg-black/15"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150",
                analyticsDraft ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 py-4 last:pb-0">
          <div>
            <p className="text-sm font-semibold text-ink">Cookies marketing</p>
            <p className="mt-1 text-sm leading-relaxed text-body">
              Polypips n&apos;utilise actuellement aucun cookie publicitaire ou de ciblage
              marketing.
            </p>
          </div>
          <span className="mt-0.5 shrink-0 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-body-soft">
            Non utilisé
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="h-4 w-4" /> Préférences enregistrées
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover sm:w-auto"
        >
          Enregistrer mes préférences
        </button>
      </div>
    </div>
  );
}
