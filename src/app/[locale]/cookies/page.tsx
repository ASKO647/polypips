import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { CookiesPreferences } from "./cookies-preferences";

export const metadata: Metadata = {
  title: "Gérer mes cookies — Polypips",
  description: "Consultez et modifiez à tout moment vos préférences de cookies.",
};

export default function CookiesPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Cookies"
        title="Gérer mes cookies"
        description="Modifiez à tout moment votre choix — le même que celui demandé lors de votre première visite."
      />

      <Container className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl">
          <CookiesPreferences />
        </div>
      </Container>
    </MarketingPageShell>
  );
}
