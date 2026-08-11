import { SiteHeader } from "@/components/layout/site-header";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { FeatureSection } from "@/components/marketing/feature-section";
import { VideoTestimonials } from "@/components/marketing/video-testimonials";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductDemo } from "@/components/marketing/product-demo";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <AnnouncementBar />
      <main>
        <Hero />
        <FeatureSection />
        <VideoTestimonials />
        <HowItWorks />
        <ProductDemo />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
