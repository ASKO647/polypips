export type CommunityMemberStatus = "pending" | "approved" | "rejected";
export type CommunityMemberRole = "owner" | "member";

/** One row from community_list_my_groups() — an "owned or approved
 * member of" group, with the caller's own role/status attached. */
export type MyCommunityGroup = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  /** Only populated when the caller is the owner — see the RPC's own
   * comment for why (a group's invite code isn't shown to regular
   * members). */
  inviteCode: string | null;
  memberRole: CommunityMemberRole;
  memberStatus: CommunityMemberStatus;
  memberCount: number;
  createdAt: string;
};

/** A public group as listed in "Découvrir" — a plain community_groups
 * row (RLS already restricts this query to is_private = false), so no
 * membership fields at all. */
export type PublicCommunityGroup = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  createdAt: string;
};

/** community_find_group_by_code()'s result shape — deliberately narrower
 * than PublicCommunityGroup/MyCommunityGroup: no invite code, no
 * member count, since this can resolve a private group the caller has
 * never interacted with. */
export type FoundCommunityGroup = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  isPrivate: boolean;
};

export type CommunityMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: CommunityMemberStatus;
  role: CommunityMemberRole;
  joinedAt: string;
};

/** community_get_group_view()'s result shape — one call serving the
 * entire group detail page (see that function's own comment for why this
 * exists instead of composing the page from several client-side reads). */
export type CommunityGroupView = {
  group: {
    id: string;
    name: string;
    description: string;
    avatarUrl: string | null;
    isPrivate: boolean;
    inviteCode: string | null;
  };
  myMembership: { status: CommunityMemberStatus; role: CommunityMemberRole } | null;
  isOwner: boolean;
  members: CommunityMember[];
};

export type CommunityMessage = {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};
