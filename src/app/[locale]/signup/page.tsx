import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { TrustStrip } from "@/components/ui/trust-strip";
import { SocialProofRow } from "@/components/ui/social-proof-row";
import { SignupBenefits } from "@/components/auth/signup-benefits";
import { LaunchOfferCard } from "@/components/auth/launch-offer-card";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthBackground } from "@/components/auth/auth-background";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.Signup");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SignupPage(props: PageProps<"/[locale]/signup">) {
  const { locale } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect({ href: "/dashboard", locale });
  }

  const { error, plan } = await props.searchParams;
  const oauthError = typeof error === "string" ? error : undefined;
  const intendedPlan = typeof plan === "string" ? plan : undefined;
  const t = await getTranslations("Auth.Signup");

  return (
    <>
      <AuthHeader />

      <main className="relative flex-1">
        <AuthBackground />

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:gap-12 lg:py-24 lg:px-8">
          <div className="flex flex-col gap-8">
            <SocialProofRow align="center" />

            <div className="flex flex-col gap-4">
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-[2.75rem]">
                {t("heroTitle1")}
                <br />
                {t("heroTitle2")}
                <br />
                {t.rich("heroTitle3", {
                  highlight: (chunks) => (
                    <span className="text-brand-500">{chunks}</span>
                  ),
                })}
              </h1>
              <p className="max-w-md text-balance text-base leading-relaxed text-body">
                {t("heroDescription")}
              </p>
            </div>

            <SignupBenefits />

            <LaunchOfferCard />
          </div>

          <SignupForm oauthError={oauthError} plan={intendedPlan} />
        </div>
      </main>

      <TrustStrip />
      <MinimalFooter />
    </>
  );
}
