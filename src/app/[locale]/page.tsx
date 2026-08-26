import { SiteHeader } from "@/components/layout/site-header";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureSection } from "@/components/marketing/feature-section";
import { ProofShowcase } from "@/components/marketing/proof-showcase";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductDemo } from "@/components/marketing/product-demo";
import { PotentialCalculator } from "@/components/marketing/potential-calculator";
import { V2Announcement } from "@/components/marketing/v2-announcement";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";
import { SmartMoneyActivityPopup } from "@/components/marketing/smart-money-activity-popup";

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero />
        <FeatureSection />
        <ProofShowcase />
        <HowItWorks />
        <ProductDemo />
        <PotentialCalculator />
        <V2Announcement />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <SmartMoneyActivityPopup />
    </>
  );
}
