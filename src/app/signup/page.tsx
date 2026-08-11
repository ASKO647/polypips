import type { Metadata } from "next";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { TrustStrip } from "@/components/ui/trust-strip";
import { SocialProofRow } from "@/components/ui/social-proof-row";
import { SignupBenefits } from "@/components/auth/signup-benefits";
import { LaunchOfferCard } from "@/components/auth/launch-offer-card";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthBackground } from "@/components/auth/auth-background";

export const metadata: Metadata = {
  title: "Créer un compte — Polypips",
  description:
    "Créez votre compte Polypips et prenez l'avantage sur le marché.",
};

export default function SignupPage() {
  return (
    <>
      <AuthHeader />

      <main className="relative flex-1">
        <AuthBackground />

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:gap-12 lg:py-24 lg:px-8">
          <div className="flex flex-col gap-8">
            <SocialProofRow />

            <div className="flex flex-col gap-4">
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-[2.75rem]">
                Créez votre compte
                <br />
                et prenez l&apos;avantage
                <br />
                sur <span className="text-brand-500">le marché.</span>
              </h1>
              <p className="max-w-md text-balance text-base leading-relaxed text-body">
                Rejoignez les utilisateurs qui utilisent l&apos;IA pour
                analyser, comprendre et prendre de meilleures décisions sur
                les marchés.
              </p>
            </div>

            <SignupBenefits />

            <LaunchOfferCard />
          </div>

          <SignupForm />
        </div>
      </main>

      <TrustStrip />
      <MinimalFooter />
    </>
  );
}
