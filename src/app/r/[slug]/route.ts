import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  serializeReferralAttribution,
} from "@/lib/referrals/attribution";

/**
 * The link every user gets from Settings → "Inviter et gagner" — mirrors
 * src/app/i/[slug]/route.ts (the influencer link) exactly: lives outside
 * [locale] so it stays a short, shareable URL, resolves the visitor's
 * locale itself from the NEXT_LOCALE cookie, and always redirects to the
 * landing page — an unknown slug just doesn't set the attribution cookie,
 * rather than showing an error to whoever clicked the link.
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
  const redirectUrl = `${origin}/${locale}`;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_referral_links")
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();

  const response = NextResponse.redirect(redirectUrl);

  if (data) {
    response.cookies.set(
      REFERRAL_COOKIE_NAME,
      serializeReferralAttribution({ referrerUserId: data.user_id, slug }),
      { path: "/", maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS, sameSite: "lax" }
    );
  }

  return response;
}
