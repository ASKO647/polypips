"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { GroupCard } from "@/components/dashboard/community/group-card";
import { CreateGroupModal } from "@/components/dashboard/community/create-group-modal";
import { FindGroupTab } from "@/components/dashboard/community/find-group-tab";
import type { GroupSummary } from "@/lib/data/community";
import { cn } from "@/lib/utils";

type Tab = "discover" | "mine" | "find";

export function CommunityFlow({
  initialDiscoverGroups,
  initialMyGroups,
  hasCommunityAccess,
}: {
  initialDiscoverGroups: GroupSummary[];
  initialMyGroups: GroupSummary[];
  hasCommunityAccess: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [createOpen, setCreateOpen] = useState(false);

  const handleJoined = () => {
    router.refresh();
  };

  const handleCreated = (groupId: string) => {
    setCreateOpen(false);
    router.push(`/dashboard/community/${groupId}`);
  };

  const groups = tab === "discover" ? initialDiscoverGroups : initialMyGroups;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Communauté
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
            Échangez avec d&apos;autres traders dans des groupes texte et photo.
          </p>
        </div>
        {hasCommunityAccess && (
          <Button type="button" onClick={() => setCreateOpen(true)} size="md">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Créer un groupe
          </Button>
        )}
      </div>

      <LockedOverlay
        locked={!hasCommunityAccess}
        message="Débloquez la Communauté — rejoignez et créez des groupes. Débutez pour 0,99 €"
      >
        <div className="flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              { key: "discover", label: "Découvrir" },
              { key: "mine", label: "Mes groupes" },
              { key: "find", label: "Trouver un groupe" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150",
                tab === t.key
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-white/50 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "find" ? (
          <FindGroupTab />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
              <Users className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-semibold text-white">
              {tab === "discover"
                ? "Aucun groupe public pour le moment"
                : "Vous n'avez rejoint aucun groupe"}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-white/45">
              {tab === "discover"
                ? "Soyez le premier à créer un groupe pour la communauté Polypips."
                : "Rejoignez un groupe dans l'onglet Découvrir, ou créez le vôtre."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onOpen={() => router.push(`/dashboard/community/${group.id}`)}
                onJoined={handleJoined}
              />
            ))}
          </div>
        )}
      </LockedOverlay>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
