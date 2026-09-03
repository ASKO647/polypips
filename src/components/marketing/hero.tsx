"use client";

import { useTranslations } from "next-intl";
import { PlayCircle } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { SocialProofRow } from "@/components/ui/social-proof-row";
import { CheckItem } from "@/components/ui/check-item";
import { HeroBackground } from "@/components/marketing/hero-background";
import { V2Badge } from "@/components/marketing/v2-badge";
import { scrollToHashIfAlreadyThere } from "@/lib/hash-scroll";

export function Hero() {
  const t = useTranslations("Hero");
  const trustItems = [t("trust1"), t("trust2"), t("trust3"), t("trust4")];

  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackground />

      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center px-6 pt-14 pb-8 text-center sm:pt-16 sm:pb-10 lg:pt-16 lg:pb-10">
        <V2Badge className="animate-fade-up" />
        <SocialProofRow align="center" className="mt-4 animate-fade-up" />

        <h1
          className="mt-8 animate-fade-up text-balance font-display text-[2.5rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-[68px]"
          style={{ animationDelay: "80ms" }}
        >
          {t("title1")}
          <br />
          {t("title2")}
          <br />
          <span className="text-brand-500">{t("title3")}</span>
        </h1>

        <p
          className="mt-6 max-w-[560px] animate-fade-up text-balance text-[18px] leading-[1.65] text-body"
          style={{ animationDelay: "140ms" }}
        >
          {t("description")}
        </p>
        <p
          className="mt-3 animate-fade-up text-balance text-sm font-semibold uppercase tracking-wide text-body-soft"
          style={{ animationDelay: "180ms" }}
        >
          {t("tagline")}
        </p>

        <div
          className="mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "220ms" }}
        >
          <Button
            href="#tarifs"
            size="lg"
            onClick={scrollToHashIfAlreadyThere("tarifs")}
          >
            {t("ctaTrial")} <ButtonIcon>→</ButtonIcon>
          </Button>
          <Button
            href="#demonstration"
            variant="outline"
            size="lg"
            onClick={scrollToHashIfAlreadyThere("demonstration")}
          >
            <ButtonIcon variant="outline">
              <PlayCircle className="h-5 w-5 text-brand-500" strokeWidth={2} />
            </ButtonIcon>
            {t("ctaDemo")}
          </Button>
        </div>

        <ul
          className="mt-8 grid animate-fade-up grid-cols-2 justify-items-center gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:gap-y-2"
          style={{ animationDelay: "260ms" }}
        >
          {trustItems.map((item) => (
            <CheckItem key={item} className="text-body-soft">
              {item}
            </CheckItem>
          ))}
        </ul>
      </div>
    </section>
  );
}
