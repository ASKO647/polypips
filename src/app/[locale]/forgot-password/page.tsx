import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginTrustRow } from "@/components/auth/login-trust-row";
import { AuthBackground } from "@/components/auth/auth-background";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.ForgotPassword");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader />

      <main className="relative flex-1">
        <AuthBackground />

        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-12 px-6 py-16 lg:py-24">
          <ForgotPasswordForm />
          <LoginTrustRow />
        </div>
      </main>

      <MinimalFooter />
    </>
  );
}
