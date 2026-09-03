import type { Metadata } from "next";
import { Rocket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { getChangelogEntries } from "@/lib/data/changelog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Changelog");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ChangelogPage() {
  const t = await getTranslations("Pages.Changelog");
  const entries = getChangelogEntries(t);

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          {entries.map((entry, i) => (
            <div key={entry.version} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F3C7C7] bg-brand-50">
                  <Rocket className="h-5 w-5 text-brand-500" strokeWidth={1.75} />
                </div>
                {i < entries.length - 1 && (
                  <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-brand-200" />
                )}
              </div>
              <div className="pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-600">
                    {entry.version}
                  </span>
                  <span className="text-xs font-medium text-body-soft">{entry.date}</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-ink sm:text-2xl">
                  {entry.title}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {entry.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-body">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <p className="text-center text-sm text-body-soft">{t("moreComingSoon")}</p>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
