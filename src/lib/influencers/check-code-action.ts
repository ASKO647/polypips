"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INFLUENCER_COOKIE_NAME,
  INFLUENCER_COOKIE_MAX_AGE_SECONDS,
  serializeInfluencerAttribution,
} from "@/lib/influencers/attribution";

/**
 * Public, unauthenticated action — called from the signup form as a
 * visitor types a promo code, before any account exists. Looks the code
 * up directly with the admin client (not a client-reachable RLS policy,
 * to avoid ever exposing an influencer's commission rate or contact email
 * to the browser) and, if it matches an active influencer, sets the same
 * attribution cookie /i/[slug] sets — see lib/influencers/attribution.ts
 * for why an explicit code entry always overwrites any prior attribution.
 */
export async function applyInfluencerCode(rawCode: string): Promise<{ valid: boolean }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("influencers")
    .select("id")
    .eq("code_promo", code)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return { valid: false };

  const cookieStore = await cookies();
  cookieStore.set(
    INFLUENCER_COOKIE_NAME,
    serializeInfluencerAttribution({ influencerId: data.id, referredVia: "code" }),
    { path: "/", maxAge: INFLUENCER_COOKIE_MAX_AGE_SECONDS, sameSite: "lax" }
  );

  return { valid: true };
}
