-- Enables scheduling scan-markets to run automatically (see the migration's
-- companion instructions in the task summary for the actual cron.schedule()
-- call — that one isn't committed here because it needs your project's
-- service role key, which must never live in a checked-in migration file).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
