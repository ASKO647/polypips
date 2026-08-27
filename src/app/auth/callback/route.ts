import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { readStoredAttributionFromHeader } from "@/lib/attribution/capture";
import { recordSignupSource } from "@/lib/supabase/signup-sources";
import { readInfluencerAttributionFromHeader } from "@/lib/influencers/attribution";
import { recordInfluencerReferral } from "@/lib/supabase/influencer-referrals";
import { readReferralAttributionFromHeader } from "@/lib/referrals/attribution";
import { recordReferralAttribution } from "@/lib/supabase/user-referrals";

const ALLOWED_ERROR_REDIRECTS = ["/signup", "/login"];

/**
 * This route lives outside [locale] on purpose (it's the fixed OAuth
 * redirect URI registered with Google/Supabase — see google-auth-button.tsx
 * / signup-form.tsx), so it has no [locale] param to read from the URL.
 * The locale the user was on is threaded through explicitly via a `locale`
 * query param on the initiating request instead, falling back to the
 * NEXT_LOCALE cookie next-intl's middleware already maintains, and finally
 * to the app's default locale — never a bare, unprefixed path, which would
 * 404 since every real page now lives under /fr or /en.
 */
function resolveLocale(request: Request, searchParams: URLSearchParams): string {
  const param = searchParams.get("locale");
  if (param && routing.locales.includes(param as (typeof routing.locales)[number])) {
    return param;
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const cookieLocale = match?.[1];
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale;
  }
  return routing.defaultLocale;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = resolveLocale(request, searchParams);
  // `next`/`error_redirect` are always bare, locale-agnostic relative paths
  // (e.g. "/dashboard?checkout=pro") set by the initiating client component
  // — this route is the one place responsible for prefixing them with the
  // resolved locale, so callers never need to know or guess it themselves.
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = `/${locale}${nextParam}`;
  const errorRedirectParam = searchParams.get("error_redirect");
  const errorRedirect = ALLOWED_ERROR_REDIRECTS.includes(
    errorRedirectParam ?? ""
  )
    ? `/${locale}${errorRedirectParam}`
    : `/${locale}/signup`;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Covers Google OAuth signups and email/password signups that
      // required confirmation — both land here. A no-op for an existing
      // user simply logging back in via Google, since recordSignupSource
      // ignores the duplicate rather than overwriting the original source.
      const cookieHeader = request.headers.get("cookie") ?? "";
      const attribution = readStoredAttributionFromHeader(cookieHeader);
      if (attribution && data.user) {
        await recordSignupSource(supabase, data.user.id, attribution);
      }
      const influencerAttribution = readInfluencerAttributionFromHeader(cookieHeader);
      if (influencerAttribution && data.user) {
        await recordInfluencerReferral(supabase, data.user.id, influencerAttribution);
      }
      const referralAttribution = readReferralAttributionFromHeader(cookieHeader);
      if (referralAttribution && data.user) {
        await recordReferralAttribution(supabase, data.user.id, referralAttribution);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${errorRedirect}?error=auth_failed`
  );
}
