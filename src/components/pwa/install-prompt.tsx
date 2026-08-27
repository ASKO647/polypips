"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useCookieConsent } from "@/providers/cookie-consent-provider";

const DISMISSED_KEY = "polypips-install-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Custom install banner — never the browser's native mini-infobar. On
 * Android/Chrome we capture beforeinstallprompt and trigger it ourselves;
 * iOS Safari never fires that event, so we detect the platform and show
 * manual "Partager -> Ajouter à l'écran d'accueil" instructions instead.
 * Shown at most once (localStorage flag), and only after the cookie banner
 * has already been answered so the two bottom sheets never stack.
 */
export function InstallPrompt() {
  const { hydrated, consent } = useCookieConsent();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");

    if (isStandalone()) return;

    if (isIOS()) {
      setPlatform("ios");
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform("android");
    };
    const handleInstalled = () => {
      window.localStorage.setItem(DISMISSED_KEY, "1");
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  const cookieAnswered = hydrated && consent !== null;
  const visible = cookieAnswered && !dismissed && platform !== null && (platform === "ios" || deferredPrompt !== null);
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer Polypips"
      className="fixed inset-x-0 bottom-0 z-[65] px-4 pb-[calc(72px+env(safe-area-inset-bottom))] sm:px-6 lg:pb-[calc(env(safe-area-inset-bottom)+16px)]"
    >
      <div className="mx-auto flex w-full max-w-xl items-start gap-3 rounded-2xl border border-border-strong bg-surface p-4 shadow-[0_16px_48px_rgba(18,5,7,0.16)] sm:p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {platform === "ios" ? (
            <Share className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Download className="h-4 w-4" strokeWidth={2} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Installer l&apos;application Polypips</p>
          {platform === "ios" ? (
            <p className="mt-1 text-[13px] leading-relaxed text-body">
              Appuyez sur <Share className="inline h-3.5 w-3.5 -translate-y-px" strokeWidth={2} aria-hidden />{" "}
              <strong className="font-semibold text-ink">Partager</strong>, puis{" "}
              <strong className="font-semibold text-ink">Ajouter à l&apos;écran d&apos;accueil</strong>.
            </p>
          ) : (
            <p className="mt-1 text-[13px] leading-relaxed text-body">
              Accès plus rapide, plein écran, sans passer par le navigateur.
            </p>
          )}

          {platform === "android" && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-cta px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cta-hover"
              >
                Installer l&apos;application
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body-soft transition-colors hover:bg-black/[0.05] hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
