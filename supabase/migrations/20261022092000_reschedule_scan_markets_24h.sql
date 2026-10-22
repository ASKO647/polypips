-- Margin protection, step 6: scan-markets moves from its current interval
-- to every 24 hours, roughly halving its AI cost (it's the only
-- auto-scan burning an Anthropic call per candidate on a schedule —
-- scan-sport-matches/scan-trading-pairs stay disabled by default, see
-- SPORT_SCAN_ENABLED/TRADING_SCAN_ENABLED below).
--
-- There is NO committed cron.schedule() call for scan-markets in this
-- repo — see 20260813120628_enable_pg_cron_pg_net.sql's own comment: it
-- needs the project's service role key and the Edge Function's URL,
-- neither of which can live in a checked-in migration. The interval
-- actually configured today is 8 hours, per the frontend's own
-- "kept in sync by hand" comment (src/lib/data/markets.ts,
-- SYNC_MARKETS_INTERVAL_MINUTES) — NOT 12 hours as commonly assumed
-- elsewhere in this app's own marketing/dashboard copy (now also
-- corrected to say 24h, see the delivery report for the exact file
-- list). Whatever the real current interval is, this file reprograms it
-- to 24h.
--
-- This migration is NOT applied automatically, and even once "applied"
-- in the literal sense it does nothing on its own — IT MUST BE RUN BY
-- HAND in the Supabase SQL editor (or via `supabase db push` against a
-- project where the placeholders below have been filled in), because it
-- needs two secrets that can't be committed:
--   <YOUR_PROJECT_REF>         — e.g. "abcdefghijklmnop"
--   <YOUR_SERVICE_ROLE_KEY>    — Settings -> API -> service_role key
--
-- Find the existing job's name first:
--   select jobid, jobname, schedule from cron.job;
-- Adjust the `jobname` filter below to match whatever that query returns
-- (it may not literally be 'scan-markets') before running the rest.

select cron.unschedule('scan-markets')
where exists (select 1 from cron.job where jobname = 'scan-markets');

select cron.schedule(
  'scan-markets',
  '0 */24 * * *', -- every 24 hours, on the hour
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/scan-markets',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
