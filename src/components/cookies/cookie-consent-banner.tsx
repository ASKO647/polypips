"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCookieConsent } from "@/providers/cookie-consent-provider";
import { cn } from "@/lib/utils";

/**
 * RGPD-conformant consent UI: no implicit accept, "Tout refuser" is as
 * prominent as "Tout accepter", and essential cookies are shown but not
 * toggleable. Rendered once, site-wide, from [locale]/layout.tsx — visible
 * on first visit (no stored choice yet) and again whenever the footer's
 * "Gérer mes cookies" link calls openPreferences().
 */
export function CookieConsentBanner() {
  const { consent, hydrated, preferencesOpen, acceptAll, rejectAll, save, closePreferences } =
    useCookieConsent();
  const [mode, setMode] = useState<"banner" | "customize">("banner");
  const [analyticsDraft, setAnalyticsDraft] = useState(false);

  useEffect(() => {
    if (preferencesOpen) {
      // Re-opened from the footer's "Gérer mes cookies" link — jump
      // straight to the customize view, pre-filled with the stored
      // choice, rather than the first-visit accept/reject banner.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalyticsDraft(consent?.analytics ?? false);
      setMode("customize");
    }
  }, [preferencesOpen, consent]);

  if (!hydrated) return null;

  const visible = consent === null || preferencesOpen;
  if (!visible) return null;

  const handleDismissCustomize = () => {
    if (consent === null) {
      // First visit with no decision yet — don't let this be dismissed
      // into nothing, fall back to the accept/reject banner.
      setMode("banner");
    } else {
      closePreferences();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Préférences de cookies"
      className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-border-strong bg-surface shadow-[0_16px_48px_rgba(18,5,7,0.16)]">
        {mode === "banner" ? (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Cookie className="h-4 w-4" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Nous respectons votre vie privée
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-body">
                  Polypips utilise des cookies essentiels au fonctionnement du
                  site, et — avec votre accord — des cookies de mesure
                  d&apos;audience pour améliorer le produit.{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
                  >
                    En savoir plus
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMode("customize")}
                className="rounded-full border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-black/[0.03] sm:order-1"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-full border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-black/[0.03] sm:order-2"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-cta px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover sm:order-3"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-ink">
                Gérer mes préférences de cookies
              </p>
              <button
                type="button"
                onClick={handleDismissCustomize}
                aria-label="Fermer"
                className="rounded-full p-1 text-body-soft transition-colors hover:bg-black/[0.05] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col divide-y divide-border">
              <div className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Cookies essentiels</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-body">
                    Nécessaires au fonctionnement du site (connexion, sécurité,
                    mémorisation de vos préférences). Toujours actifs.
                  </p>
                </div>
                <span className="mt-0.5 shrink-0 rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-body-soft">
                  Toujours actif
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Cookies de mesure d&apos;audience
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-body">
                    Nous aident à comprendre l&apos;utilisation du site pour
                    l&apos;améliorer. Désactivés par défaut.
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
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-full border border-border-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-black/[0.03] sm:order-1"
              >
                Tout refuser
              </button>
              <button
                type="button"
                onClick={() => save(analyticsDraft)}
                className="rounded-full bg-cta px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover sm:order-2"
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
