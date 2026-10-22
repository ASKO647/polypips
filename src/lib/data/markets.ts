/**
 * How often scan-markets actually runs. There is no committed
 * cron.schedule() call for it (see the pg_cron migration's own comment —
 * it needs the project's service role key, which can't live in a checked-in
 * migration), so this number can't be read back from the database: it's a
 * plain constant that must be kept in sync by hand with whatever interval
 * is configured for the scan-markets cron job in the Supabase
 * dashboard/SQL editor — now every 24 hours (margin protection; was 8
 * hours — see supabase/migrations/20261022092000_reschedule_scan_markets_24h.sql,
 * which must be run by hand for the real cron job to match this number).
 * Only used to drive the "Prochains marchés dans" countdown on
 * /dashboard/markets — purely cosmetic, doesn't affect when the Edge
 * Function itself actually runs.
 */
export const SYNC_MARKETS_INTERVAL_MINUTES = 24 * 60;
