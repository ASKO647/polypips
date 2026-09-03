"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Plus, Search, Users } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { GroupCard } from "@/components/dashboard/community/group-card";
import { CreateGroupModal } from "@/components/dashboard/community/create-group-modal";
import { FindGroupPanel } from "@/components/dashboard/community/find-group-panel";
import { createClient } from "@/lib/supabase/client";
import { joinGroup } from "@/lib/supabase/community";
import type { MyCommunityGroup, PublicCommunityGroup } from "@/lib/data/community";

type Tab = "discover" | "mine";

export function CommunityFlow({
  publicGroups,
  myGroups,
  hasActiveSubscription,
  cancelled,
}: {
  publicGroups: PublicCommunityGroup[];
  myGroups: MyCommunityGroup[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const t = useTranslations("Community.CommunityFlow");
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [createOpen, setCreateOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const myGroupIds = new Set(myGroups.map((g) => g.id));

  const handleEnterPublicGroup = async (groupId: string) => {
    setError(null);
    if (myGroupIds.has(groupId)) {
      router.push(`/dashboard/community/${groupId}`);
      return;
    }
    setJoiningId(groupId);
    try {
      const supabase = createClient();
      await joinGroup(supabase, groupId);
      router.push(`/dashboard/community/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("joinError"));
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFindOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            <Search className="h-4 w-4" strokeWidth={2} />
            {t("findGroup")}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t("createGroup")}
          </button>
        </div>
      </div>

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        message={cancelled ? t("lockedMessageCancelled") : t("lockedMessage")}
      >
        <div className="flex flex-col gap-5">
          <div className="flex w-fit rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setTab("discover")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === "discover" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t("tabDiscover")}
            </button>
            <button
              type="button"
              onClick={() => setTab("mine")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === "mine" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t("tabMine")} {myGroups.length > 0 && `(${myGroups.length})`}
            </button>
          </div>

          {error && <p className="text-xs font-medium text-rose-400">{error}</p>}

          {tab === "discover" ? (
            publicGroups.length === 0 ? (
              <EmptyState message={t("emptyDiscover")} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    name={group.name}
                    description={group.description}
                    avatarUrl={group.avatarUrl}
                    isPrivate={false}
                    memberCount={null}
                    actionLabel={myGroupIds.has(group.id) ? t("actionOpen") : t("actionEnter")}
                    actionLoading={joiningId === group.id}
                    onAction={() => handleEnterPublicGroup(group.id)}
                  />
                ))}
              </div>
            )
          ) : myGroups.length === 0 ? (
            <EmptyState message={t("emptyMine")} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  name={group.name}
                  description={group.description}
                  avatarUrl={group.avatarUrl}
                  isPrivate={group.isPrivate}
                  memberCount={group.memberCount}
                  badge={
                    group.memberStatus === "pending"
                      ? t("badgePending")
                      : group.memberRole === "owner"
                        ? t("badgeOwner")
                        : undefined
                  }
                  actionLabel={group.memberStatus === "pending" ? t("actionPending") : t("actionOpen")}
                  actionDisabled={group.memberStatus === "pending"}
                  onAction={() => router.push(`/dashboard/community/${group.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </LockedOverlay>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(groupId) => router.push(`/dashboard/community/${groupId}`)}
      />
      <FindGroupPanel
        open={findOpen}
        onClose={() => setFindOpen(false)}
        onOpenGroup={(groupId) => router.push(`/dashboard/community/${groupId}`)}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/40">
        <Users className="h-4.5 w-4.5" strokeWidth={2} />
      </span>
      <p className="max-w-xs text-sm leading-relaxed text-white/40">{message}</p>
    </div>
  );
}
