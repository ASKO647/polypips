import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Button, ButtonIcon } from "@/components/ui/button";
import { CheckItem } from "@/components/ui/check-item";

export function FinalCTA() {
  const t = useTranslations("FinalCTA");
  const args = [t("arg1"), t("arg2"), t("arg3")];

  return (
    <section className="reveal py-8 sm:py-10">
      <Container>
        <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[32px] bg-[#FFF1F1] px-6 py-12 text-center sm:px-12 lg:h-[260px] lg:py-0">
          <h2 className="text-balance font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[44px] lg:text-[56px]">
            {t("title1")}
            <br />
            {t("title2")}
          </h2>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {args.map((arg) => (
                <CheckItem key={arg}>{arg}</CheckItem>
              ))}
            </ul>

            <Button href="/signup" size="lg" className="h-[58px] w-[260px]">
              {t("cta")} <ButtonIcon>→</ButtonIcon>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
