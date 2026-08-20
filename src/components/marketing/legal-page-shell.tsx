import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/ui/container";

export function LegalPageShell({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-[760px]">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-body-soft">
              Dernière mise à jour : {lastUpdated}
            </p>
            {intro && (
              <p className="mt-6 text-[15px] leading-relaxed text-body">{intro}</p>
            )}
            <div className="mt-10 flex flex-col gap-10">{children}</div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-body [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Renders a [À COMPLÉTER : ...] placeholder with a visible amber
 * highlight so it can't be mistaken for real, ready-to-publish content —
 * distinct from the invisible dev-only warning comment at the top of each
 * legal page's source file. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-amber-800">
      [À COMPLÉTER : {children}]
    </span>
  );
}
