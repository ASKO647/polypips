import type { Metadata } from "next";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginTrustRow } from "@/components/auth/login-trust-row";
import { AuthBackground } from "@/components/auth/auth-background";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Polypips",
  description: "Réinitialisez le mot de passe de votre compte Polypips.",
};

export default function ForgotPasswordPage() {
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
