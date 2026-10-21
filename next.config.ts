import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * Coach IA and Communauté were removed from the dashboard. These
   * redirects cover old links, bookmarks, and already-installed PWAs that
   * may still hold a cached navigation to these dead routes — redirecting
   * to /dashboard instead of letting them 404. Both the bare path (direct
   * deep link) and the locale-prefixed path (what the proxy/middleware
   * normally resolves to, and what a PWA's cached navigation actually
   * stores) are covered.
   */
  async redirects() {
    return [
      { source: "/dashboard/coach", destination: "/dashboard", permanent: true },
      { source: "/dashboard/community", destination: "/dashboard", permanent: true },
      { source: "/dashboard/community/:path*", destination: "/dashboard", permanent: true },
      { source: "/:locale(fr|en)/dashboard/coach", destination: "/:locale/dashboard", permanent: true },
      { source: "/:locale(fr|en)/dashboard/community", destination: "/:locale/dashboard", permanent: true },
      { source: "/:locale(fr|en)/dashboard/community/:path*", destination: "/:locale/dashboard", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
