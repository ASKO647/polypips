"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Pause, Play, RefreshCw, Search } from "lucide-react";
import { LockedOverlay } from "@/components/dashboard/locked-overlay";
import { EventCard } from "@/components/dashboard/pips-tracks/event-card";
import { FilterTabs } from "@/components/dashboard/pips-tracks/filter-tabs";
import { SummaryPanel } from "@/components/dashboard/pips-tracks/summary-panel";
import {
  DEFAULT_QUICK_FILTERS,
  QuickFiltersPanel,
  type QuickFilters,
} from "@/components/dashboard/pips-tracks/quick-filters-panel";
import { TopTokensPanel } from "@/components/dashboard/pips-tracks/top-tokens-panel";
import { AlertsPanel } from "@/components/dashboard/pips-tracks/alerts-panel";
import { createClient } from "@/lib/supabase/client";
import { fetchEvents, subscribeToPipsTrackEvents } from "@/lib/supabase/pips-tracks";
import type {
  PipsTrackEvent,
  PipsTrackFilterValue,
  PipsTrackSummary,
  PipsTrackTopToken,
} from "@/lib/data/pips-tracks";

const IMPACT_SEVERITY: Record<NonNullable<PipsTrackEvent["aiImpact"]>, number> = {
  eleve: 3,
  moyen: 2,
  faible: 1,
};

function matchesQuickFilters(event: PipsTrackEvent, filters: QuickFilters, followedAddresses: Set<string>): boolean {
  if (filters.tokenSymbol !== "all" && event.tokenSymbol !== filters.tokenSymbol) return false;
  if (filters.minAmount > 0 && (event.amountUsd ?? 0) < filters.minAmount) return false;
  if (filters.minScore !== "all") {
    if (!event.aiImpact) return false;
    if (IMPACT_SEVERITY[event.aiImpact] < IMPACT_SEVERITY[filters.minScore]) return false;
  }
  if (filters.followedOnly && (!event.walletAddress || !followedAddresses.has(event.walletAddress))) return false;
  if (filters.keyword.trim()) {
    const needle = filters.keyword.trim().toLowerCase();
    const haystack = `${event.title} ${event.description} ${event.tokenSymbol ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function PipsTracksFlow({
  initialEvents,
  initialSummary,
  initialTopTokens,
  followedWalletAddresses,
  hasActiveSubscription,
  cancelled,
}: {
  initialEvents: PipsTrackEvent[];
  initialSummary: PipsTrackSummary | null;
  initialTopTokens: PipsTrackTopToken[];
  followedWalletAddresses: string[];
  hasActiveSubscription: boolean;
  cancelled: boolean;
}) {
  const [filter, setFilter] = useState<PipsTrackFilterValue>("all");
  const [events, setEvents] = useState(initialEvents);
  const [quickFilters, setQuickFilters] = useState<QuickFilters>(DEFAULT_QUICK_FILTERS);
  const [live, setLive] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialEvents.length > 0);
  const [searchQuery, setSearchQuery] = useState("");

  const followedAddresses = useMemo(() => new Set(followedWalletAddresses), [followedWalletAddresses]);
  const isFirstFilterRender = useRef(true);

  // Refetch from the DB whenever the source tab changes — the tab decides
  // which rows are even fetched; quick filters below only narrow what's
  // already been loaded (see QuickFiltersPanel's own comment on that
  // scope choice). Skips the very first run: initialEvents was already
  // fetched server-side for the default "all" filter, so re-fetching the
  // same thing again on mount would just be a redundant round trip.
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const fresh = await fetchEvents(supabase, { filter });
      if (!cancelled) {
        setEvents(fresh);
        setHasMore(fresh.length > 0);
        setPendingCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  useEffect(() => {
    const supabase = createClient();
    const channel = subscribeToPipsTrackEvents(supabase, (event) => {
      if (!live) {
        setPendingCount((n) => n + 1);
        return;
      }
      setEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [event, ...prev]));
      setHighlightIds((prev) => new Set(prev).add(event.id));
      setTimeout(() => {
        setHighlightIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }, 4000);
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [live]);

  const handleLoadMore = async () => {
    if (loadingMore || events.length === 0) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const oldest = events[events.length - 1];
      const more = await fetchEvents(supabase, { filter, before: oldest.occurredAt });
      setEvents((prev) => [...prev, ...more]);
      setHasMore(more.length > 0);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTogglePause = () => {
    setLive((v) => {
      if (!v) setPendingCount(0);
      return !v;
    });
  };

  const filteredEvents = useMemo(() => {
    const withQuickFilters = events.filter((e) => matchesQuickFilters(e, quickFilters, followedAddresses));
    if (!searchQuery.trim()) return withQuickFilters;
    const needle = searchQuery.trim().toLowerCase();
    return withQuickFilters.filter(
      (e) =>
        (e.tokenSymbol ?? "").toLowerCase().includes(needle) ||
        (e.walletAddress ?? "").toLowerCase().includes(needle) ||
        (e.walletLabel ?? "").toLowerCase().includes(needle)
    );
  }, [events, quickFilters, followedAddresses, searchQuery]);

  const availableTokens = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.tokenSymbol) set.add(e.tokenSymbol);
    return Array.from(set).sort();
  }, [events]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Pips Tracks</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Le flux en temps réel de Fomo, Axiom et Signal IA. Ne manquez aucune information importante.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un token, wallet, utilisateur..."
            className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-white/25 outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <FilterTabs value={filter} onChange={setFilter} />

      <LockedOverlay
        locked={!hasActiveSubscription}
        cancelled={cancelled}
        contentClassName="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        message={
          cancelled
            ? "Réabonnez-vous pour continuer à suivre le flux Pips Tracks."
            : "Débloquez votre abonnement pour accéder au flux Pips Tracks en temps réel."
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white">Flux en temps réel</h2>
              <Info className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
            </div>
            <button
              type="button"
              onClick={handleTogglePause}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              {live ? (
                <>
                  Pause
                  <Pause className="h-3.5 w-3.5" strokeWidth={2} />
                </>
              ) : (
                <>
                  Reprendre
                  <Play className="h-3.5 w-3.5" strokeWidth={2} />
                </>
              )}
            </button>
          </div>

          {!live && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setLive(true)}
              className="rounded-full border border-brand-400/40 bg-brand-500/10 py-2 text-xs font-semibold text-brand-400 transition-colors hover:bg-brand-500/15"
            >
              {pendingCount} nouveau{pendingCount > 1 ? "x" : ""} événement{pendingCount > 1 ? "s" : ""}
            </button>
          )}

          {filteredEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/40">
              Aucun événement correspondant à vos filtres.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} isNew={highlightIds.has(event.id)} />
              ))}
            </div>
          )}

          {hasMore && filteredEvents.length > 0 && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 text-xs font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              <RefreshCw className={loadingMore ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} strokeWidth={2} />
              {loadingMore ? "Chargement..." : "Charger plus d'événements"}
            </button>
          )}

          <div className="flex items-center gap-2 pt-1 text-[11px] text-white/30">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            Les données sont mises à jour en temps réel dès qu&apos;un nouvel événement est détecté.
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <SummaryPanel summary={initialSummary} />
          <QuickFiltersPanel
            filters={quickFilters}
            onChange={setQuickFilters}
            availableTokens={availableTokens}
            hasFollowedWallets={followedAddresses.size > 0}
          />
          <TopTokensPanel tokens={initialTopTokens} />
          <AlertsPanel />
        </div>
      </LockedOverlay>
    </div>
  );
}
