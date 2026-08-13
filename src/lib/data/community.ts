/**
 * Real data: rows come from the groups / group_members / group_messages
 * tables (see the 20260814090000 migration). Membership state transitions
 * (create/join/approve/reject/remove) go through SECURITY DEFINER Postgres
 * functions rather than direct table writes — see lib/supabase/groups.ts.
 */

export type GroupMemberStatus = "pending" | "approved" | "rejected";
export type GroupMemberRole = "owner" | "member";

export type GroupSummary = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  /** The current user's membership status in this group, or null if
   * they've never requested/joined it. */
  membershipStatus: GroupMemberStatus | null;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  status: GroupMemberStatus;
  role: GroupMemberRole;
  joinedAt: string;
};

export type GroupMessage = {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};

export function initialsFor(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "?";
}

/** Deterministic-ish accent color for a member's initials avatar, purely
 * cosmetic — cycles through the app's existing semantic tones instead of
 * introducing new colors. */
const AVATAR_TONES = [
  "bg-brand-500/15 text-brand-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-sky-500/15 text-sky-400",
  "bg-violet-500/15 text-violet-400",
] as const;

export function avatarToneFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}
