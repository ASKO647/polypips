import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import {
  INFLUENCER_COOKIE_NAME,
  INFLUENCER_COOKIE_MAX_AGE_SECONDS,
  serializeInfluencerAttribution,
} from "@/lib/influencers/attribution";

/**
 * The short link handed out to influencers (see the console's "copier le
 * lien" button). Lives outside [locale] on purpose — it's meant to be
 * shared as a short, memorable URL, not a locale-prefixed one — so it
 * resolves the visitor's locale itself the same way /auth/callback does
 * (no [locale] param available on this route) rather than guessing.
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
    .from("influencers")
    .select("id")
    .eq("tracking_slug", slug)
    .eq("status", "active")
    .maybeSingle();

  const response = NextResponse.redirect(redirectUrl);

  // An unknown or paused slug still redirects to the normal landing page —
  // just without setting any attribution — rather than showing an error
  // page to whoever clicked the link.
  if (data) {
    response.cookies.set(
      INFLUENCER_COOKIE_NAME,
      serializeInfluencerAttribution({ influencerId: data.id, referredVia: "link" }),
      { path: "/", maxAge: INFLUENCER_COOKIE_MAX_AGE_SECONDS, sameSite: "lax" }
    );
  }

  return response;
}
