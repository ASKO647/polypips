import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Container } from "@/components/ui/container";
import { ContentBlocks } from "@/components/marketing/content-blocks";
import { Link } from "@/i18n/navigation";
import { getBlogArticle, BLOG_ARTICLES } from "@/lib/data/blog";

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  const t = await getTranslations("Pages.Blog");
  return { title: `${article ? article.title : t("articleFallbackTitle")} — Polypips` };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getBlogArticle(slug);
  if (!article) notFound();
  const t = await getTranslations("Pages.Blog");

  return (
    <MarketingPageShell>
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-[720px]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> {t("backToBlog")}
          </Link>

          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-600">
            {article.category}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-body-soft">
            {article.date} · {article.readMinutes} {t("readMinutesLabel")}
          </p>

          <div className="mt-8">
            <ContentBlocks blocks={article.content} />
          </div>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
