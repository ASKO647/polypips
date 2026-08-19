import type { User } from "@supabase/supabase-js";
import { createClient, getAuthUser } from "@/lib/supabase/server";

/**
 * A single reserved account, configured via OWNER_USER_ID (the Supabase Auth
 * UUID, not the email — an email can change, this can't). Never hardcoded,
 * never more than one value possible by construction. Read once per process
 * rather than per call since env vars don't change at runtime.
 */
function ownerUserId(): string | null {
  const id = process.env.OWNER_USER_ID;
  return id && id.trim().length > 0 ? id.trim() : null;
}

export function isOwnerUserId(userId: string | null | undefined): boolean {
  const owner = ownerUserId();
  return !!owner && !!userId && userId === owner;
}

/** Authenticated + is the OWNER account. Returns null for anyone else,
 * including a fully logged-in normal user — callers must still enforce
 * MFA/AAL2 on top of this before granting real access. Never trust this
 * alone client-side; it only runs server-side (getAuthUser re-verifies the
 * JWT against Supabase, not a trusted cookie). */
export async function requireOwnerUser(): Promise<User | null> {
  const user = await getAuthUser();
  const owner = ownerUserId();
  console.error(
    "[DIAG] requireOwnerUser: OWNER_USER_ID defined =",
    owner !== null,
    "| user present =",
    !!user,
    "| user.id === OWNER_USER_ID =",
    !!user && !!owner && user.id === owner,
    "| user.id length =",
    user?.id?.length ?? 0,
    "| OWNER_USER_ID length =",
    owner?.length ?? 0
  );
  if (!user || !isOwnerUserId(user.id)) return null;
  return user;
}

export type OwnerAalStatus = {
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  hasVerifiedFactor: boolean;
  verifiedFactorId: string | null;
};

/** Real Supabase-native TOTP MFA state for the current session — no custom
 * 2FA system invented. hasVerifiedFactor distinguishes "never enrolled"
 * (send to /mfa-setup) from "enrolled but this session hasn't stepped up
 * yet" (send to /mfa-challenge). */
export async function getOwnerAalStatus(): Promise<OwnerAalStatus> {
  const supabase = await createClient();

  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const verifiedFactor = (factors?.totp ?? []).find((f) => f.status === "verified");

  return {
    currentLevel: narrowAalLevel(aal?.currentLevel),
    nextLevel: narrowAalLevel(aal?.nextLevel),
    hasVerifiedFactor: !!verifiedFactor,
    verifiedFactorId: verifiedFactor?.id ?? null,
  };
}

/** Supabase's own type is an open string union (room for future assurance
 * levels); narrowed here since aal1/aal2 are the only two that exist
 * today and the only two this console's gate logic needs to distinguish. */
function narrowAalLevel(level: string | null | undefined): "aal1" | "aal2" | null {
  return level === "aal1" || level === "aal2" ? level : null;
}
