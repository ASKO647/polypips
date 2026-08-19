import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatButton } from "@/components/layout/chat-button";
import { ScrollRevealObserver } from "@/components/scroll-reveal-observer";
import { TouchActiveEnabler } from "@/components/touch-active-enabler";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  console.error("[DIAG] [locale]/layout.tsx REACHED, locale param =", JSON.stringify(locale));
  if (!hasLocale(routing.locales, locale)) {
    console.error("[DIAG] [locale]/layout.tsx invalid locale -> notFound()");
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
            {children}
            <ChatButton />
            <ScrollRevealObserver />
            <TouchActiveEnabler />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
