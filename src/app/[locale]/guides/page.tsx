import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { GUIDES } from "@/lib/data/guides";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Guides");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function GuidesPage() {
  const t = await getTranslations("Pages.Guides");

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex items-center gap-5 rounded-[24px] border border-border bg-surface p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_16px_32px_-16px_rgba(18,5,7,0.12)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <BookOpen className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-ink">{guide.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-body">{guide.excerpt}</p>
              </div>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </Container>
    </MarketingPageShell>
  );
}
