import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEM_IDS } from "@/lib/data/faq";

export function FAQ() {
  const t = useTranslations("FAQ");

  return (
    <section id="faq" className="reveal py-10 sm:py-12">
      <Container className="flex flex-col gap-8">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <Accordion
          type="single"
          collapsible
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {FAQ_ITEM_IDS.map((id) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger>{t(`items.${id}.question`)}</AccordionTrigger>
              <AccordionContent>{t(`items.${id}.answer`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
