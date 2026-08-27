import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";

/** Shared header+footer wrapper for every standalone marketing page linked
 * from the footer (Features, Pricing, How it works, Blog, Guides, API,
 * Support, About, Contact, Partners...) — the same composition as
 * ComingSoon/LegalPageShell, extracted so real content pages don't each
 * repeat it. */
export function MarketingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
