import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { BLOG_ARTICLES } from "@/lib/data/blog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Blog");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function BlogPage() {
  const t = await getTranslations("Pages.Blog");

  return (
    <MarketingPageShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
          {BLOG_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col gap-4 rounded-[24px] border border-border bg-surface p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_32px_-16px_rgba(18,5,7,0.12)]"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                {article.category}
              </span>
              <h2 className="font-display text-lg font-bold text-ink">{article.title}</h2>
              <p className="text-sm leading-relaxed text-body">{article.excerpt}</p>
              <div className="mt-auto flex items-center justify-between text-xs font-medium text-body-soft">
                <span>
                  {article.date} · {article.readMinutes} {t("readMinutesLabel")}
                </span>
                <ArrowRight
                  className="h-4 w-4 text-brand-500 transition-transform duration-200 group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </MarketingPageShell>
  );
}
