import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { requireOwnerUser } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { getAuthUser } from "@/lib/supabase/server";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** noindex/nofollow at the root of the whole console — there's no
 * sitemap.ts in this app to exclude it from either, so this metadata is
 * the only public signal about the route, and it says "don't index this". */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The only gate that decides WHETHER someone is let in at all (auth +
 * OWNER role). The AAL2/MFA step-up gate lives one level down, in the
 * (dash) route group's own layout — kept separate so /mfa-setup and
 * /mfa-challenge can sit inside this owner-only boundary without also
 * being blocked by the very step-up check they exist to satisfy.
 *
 * Every branch that isn't "grant access" returns notFound() (a plain 404)
 * rather than a 403 or a login redirect — a normal user, or an anonymous
 * visitor, hitting this URL should see nothing that confirms the route
 * even means anything.
 *
 * This segment sits outside [locale] (the owner console isn't translated),
 * so with no src/app/layout.tsx it's its own root layout, not a child of
 * [locale]/layout.tsx — it doesn't inherit that layout's <html>/<body> or
 * its globals.css import. It must define both itself, or every owner page
 * renders as unstyled markup despite Tailwind having generated the CSS.
 */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    await logOwnerEvent({ event: "owner_console_access", result: "denied", detail: { reason: "unauthenticated" } });
    notFound();
  }

  const owner = await requireOwnerUser();
  if (!owner) {
    await logOwnerEvent({
      event: "owner_console_access",
      result: "denied",
      userId: user.id,
      email: user.email,
      detail: { reason: "not_owner" },
    });
    notFound();
  }

  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0b0d10] text-slate-100">{children}</body>
    </html>
  );
}
