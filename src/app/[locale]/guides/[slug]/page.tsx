import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { getGuide, GUIDES } from "@/lib/data/guides";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return { title: guide ? `${guide.title} — Polypips` : "Guide — Polypips" };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <MarketingPageShell>
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-[720px]">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux guides
          </Link>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-body">{guide.intro}</p>

          <ol className="mt-10 flex flex-col gap-8">
            {guide.steps.map((step, i) => (
              <li key={step.title} className="relative flex gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="pb-1">
                  <h2 className="font-display text-lg font-bold text-ink">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </MarketingPageShell>
  );
}
