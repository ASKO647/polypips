import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = useTranslations("ComingSoon");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t("badge")}
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-md text-balance text-base leading-relaxed text-body">
            {description}
          </p>
          <Button href="/" size="lg" className="mt-2">
            {t("backHome")}
          </Button>
        </Container>
      </main>
      <Footer />
    </>
  );
}
