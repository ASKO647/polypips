import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CheckItem } from "@/components/ui/check-item";

const ARGUMENTS = [
  "0,99 € pendant 3 jours",
  "Accès immédiat",
  "Annulation à tout moment",
];

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-solid px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(239,42,61,0.35), transparent 60%)",
            }}
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-7">
            <h2 className="text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
              Prêt à prendre l&apos;avantage
              <br />
              sur les marchés&nbsp;?
            </h2>

            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {ARGUMENTS.map((arg) => (
                <CheckItem key={arg} tone="muted">
                  {arg}
                </CheckItem>
              ))}
            </ul>

            <Button href="/signup" size="lg" className="mt-2">
              Débutez pour 0,99&nbsp;€ <span aria-hidden>→</span>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
