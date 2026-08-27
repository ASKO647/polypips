import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/theme-provider";
import { CookieConsentProvider } from "@/providers/cookie-consent-provider";
import { CookieConsentBanner } from "@/components/cookies/cookie-consent-banner";
import { ChatButton } from "@/components/layout/chat-button";
import { ScrollRevealObserver } from "@/components/scroll-reveal-observer";
import { TouchActiveEnabler } from "@/components/touch-active-enabler";
import { VercelAnalyticsGate } from "@/components/analytics/vercel-analytics";
import { AttributionCapture } from "@/components/attribution/attribution-capture";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Matches --color-brand-500 in globals.css and manifest.json's theme_color —
// brand-500 is the general identity red (icons/accents), not --color-cta
// which is reserved for primary buttons specifically.
export const viewport: Viewport = {
  themeColor: "#e52323",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Resizes the visual viewport (not just an overlay) when the on-screen
  // keyboard opens, so fixed-position bars (dashboard bottom nav, chat
  // input) get pushed above it instead of being hidden underneath.
  interactiveWidget: "resizes-content",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    icons: {
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Polypips",
    },
    // Next's appleWebApp.capable only emits the unprefixed
    // mobile-web-app-capable tag — add the apple-prefixed one explicitly for
    // older iOS Safari versions that only recognize that name.
    other: {
      "apple-mobile-web-app-capable": "yes",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Renders per-request on the server (never cached across locales) — see
  // https://next-intl.dev/docs/getting-started/app-router#static-rendering
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page-bg text-ink">
        <NextIntlClientProvider>
          <ThemeProvider>
            <CookieConsentProvider>
              {children}
              <ChatButton />
              <ScrollRevealObserver />
              <TouchActiveEnabler />
              <AttributionCapture />
              <VercelAnalyticsGate />
              <CookieConsentBanner />
              <ServiceWorkerRegister />
              <InstallPrompt />
            </CookieConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
