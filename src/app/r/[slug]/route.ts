import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  serializeReferralAttribution,
} from "@/lib/referrals/attribution";

/**
 * The user-to-user referral link ("Parrainez un ami" — see
 * /dashboard/credits and Profil). Same structure as /i/[slug]
 * (influencers), but sends the visitor straight to /signup instead of the
 * marketing homepage: a referral link's whole purpose is a new signup, so
 * skipping the homepage is a deliberate improvement over the influencer
 * route's own behavior, not an oversight.
 */
function resolveLocale(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const cookieLocale = match?.[1];
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale;
  }
  return routing.defaultLocale;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { origin } = new URL(request.url);
  const locale = resolveLocale(request);
  const redirectUrl = `${origin}/${locale}/signup`;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_referral_links")
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();

  const response = NextResponse.redirect(redirectUrl);

  // An unknown slug still redirects to /signup — just without setting any
  // attribution — rather than showing an error page.
  if (data) {
    response.cookies.set(
      REFERRAL_COOKIE_NAME,
      serializeReferralAttribution({ slug }),
      { path: "/", maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS, sameSite: "lax" }
    );
  }

  return response;
}
