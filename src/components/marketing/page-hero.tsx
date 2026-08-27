import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

/** Top-of-page heading shared by every standalone marketing page — same
 * SectionHeading used throughout the landing page's own sections, just
 * given more breathing room since it opens the page instead of following
 * another section. */
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className="pb-6 pt-16 sm:pb-8 sm:pt-20">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      </Container>
    </section>
  );
}
