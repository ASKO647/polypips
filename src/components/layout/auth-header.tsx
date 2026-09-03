import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/logo";
import { LanguageSelector } from "@/components/ui/language-selector";
import { Link } from "@/i18n/navigation";

export async function AuthHeader({
  variant = "signup",
}: {
  variant?: "login" | "signup";
}) {
  const t = await getTranslations("AuthHeader");

  return (
    <header className="border-b border-border bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-18 w-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <Logo />

        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="hidden items-center gap-2.5 sm:flex">
            <LanguageSelector />
          </div>
          <span className="hidden h-5 w-px bg-border-strong sm:block" />
          {variant === "login" ? (
            <p className="text-sm text-body">
              <span className="hidden sm:inline">{t("noAccount")} </span>
              <Link
                href="/signup"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {t("createAccount")}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-body">
              <span className="hidden sm:inline">{t("hasAccount")} </span>
              <Link
                href="/login"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {t("login")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
