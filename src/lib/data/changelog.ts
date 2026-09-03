/**
 * Changelog display copy (date/title/items) lives in the "pages" message
 * namespace under `Pages.Changelog.entries` (messages/{locale}/pages.json),
 * never as hardcoded strings here — this file only holds the ordered,
 * language-neutral entry ids and their version labels. Call
 * getChangelogEntries(t) with a translator scoped to "Pages.Changelog" to
 * get the locale-aware entry list at render time.
 *
 * Newest entry first — append new releases to the top of ENTRY_IDS.
 */

export type ChangelogEntryId = "v1-0";

export type ChangelogEntryMeta = {
  id: ChangelogEntryId;
  version: string;
};

/** Real changelog data — starts with a single "launch" entry and is meant
 * to be appended to over time, one entry per release, newest first. */
export const CHANGELOG_ENTRY_META: ChangelogEntryMeta[] = [{ id: "v1-0", version: "V1.0" }];

export type ChangelogEntry = ChangelogEntryMeta & {
  date: string;
  title: string;
  items: string[];
};

type ChangelogTranslator = {
  (key: string): string;
  raw: (key: string) => unknown;
};

/** Builds the locale-aware changelog entry list — call with a translator
 * scoped to "Pages.Changelog" so every entry's copy renders in the current
 * locale. Never import a static entry array directly; call this at render
 * time in the changelog page. */
export function getChangelogEntries(t: ChangelogTranslator): ChangelogEntry[] {
  return CHANGELOG_ENTRY_META.map((meta) => ({
    ...meta,
    date: t(`entries.${meta.id}.date`),
    title: t(`entries.${meta.id}.title`),
    items: t.raw(`entries.${meta.id}.items`) as string[],
  }));
}
