import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { LoginForm } from "@/components/auth/login-form";
import { LoginTrustRow } from "@/components/auth/login-trust-row";
import { AuthBackground } from "@/components/auth/auth-background";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Connexion — Polypips",
  description: "Connectez-vous à votre compte Polypips.",
};

export default async function LoginPage(props: PageProps<"/[locale]/login">) {
  const { locale } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect({ href: "/dashboard", locale });
  }

  const { error } = await props.searchParams;
  const oauthError = typeof error === "string" ? error : undefined;

  return (
    <>
      <AuthHeader variant="login" />

      <main className="relative flex-1">
        <AuthBackground />

        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-12 px-6 py-16 lg:py-24">
          <LoginForm oauthError={oauthError} />
          <LoginTrustRow />
        </div>
      </main>

      <MinimalFooter />
    </>
  );
}
