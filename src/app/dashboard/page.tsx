import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/layout/auth-header";
import { MinimalFooter } from "@/components/layout/minimal-footer";
import { Container } from "@/components/ui/container";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tableau de bord — Polypips",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup");
  }

  return (
    <>
      <AuthHeader />

      <main className="flex-1">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Bienvenue sur Polypips
          </h1>
          <p className="max-w-md text-balance text-base leading-relaxed text-body">
            Connecté en tant que <span className="font-semibold text-ink">{user.email}</span>.
            Le tableau de bord arrive bientôt.
          </p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </Container>
      </main>

      <MinimalFooter />
    </>
  );
}
