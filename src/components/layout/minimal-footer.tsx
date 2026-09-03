import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";

export function MinimalFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo className="text-base" />
        <p className="text-xs text-body-soft">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </Container>
    </footer>
  );
}
