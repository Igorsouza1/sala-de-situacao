-- =============================================================
-- Migration: 0009_pg_cron_firms
-- Agenda a ingestão FIRMS (ADR 0009): pg_cron + pg_net disparam as
-- Edge Functions firms-sync e firms-notify 1x/dia.
--
-- ANTES DE EXECUTAR, substituir os placeholders:
--   <PROJECT_REF>  — ref do projeto Supabase (subdomínio de *.supabase.co)
--   <CRON_SECRET>  — mesmo valor configurado como secret CRON_SECRET
--                    nas Edge Functions (supabase secrets set CRON_SECRET=...)
--
-- Pré-requisitos (fora desta migration):
--   supabase functions deploy firms-sync --no-verify-jwt
--   supabase functions deploy firms-notify --no-verify-jwt
--   supabase secrets set SUPABASE_DB_URL=... NASA_FIRMS_MAP_KEY=... \
--     RESEND_API_KEY=... ALERT_FROM_EMAIL=... CRON_SECRET=...
--
-- Horários (UTC): sync 06:00 (dados do dia anterior consolidados na NASA),
-- notify 06:30 (após o sync terminar).
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamentos anteriores se existirem (idempotência)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('firms-sync-daily', 'firms-notify-daily');

SELECT cron.schedule(
  'firms-sync-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://efklyvxlcuhjdfqdtqut.supabase.co/functions/v1/firms-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 4d5cd9bb765952ded78f03bc70382c4b5484a87926e159f172fa2ce6df3fcd966d9129856d413a889642e0748c369a16520892ef5a2cf456954ad4205fa962db809d5a65534d218513feaed184b65fb3'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);

SELECT cron.schedule(
  'firms-notify-daily',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://efklyvxlcuhjdfqdtqut.supabase.co/functions/v1/firms-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 4d5cd9bb765952ded78f03bc70382c4b5484a87926e159f172fa2ce6df3fcd966d9129856d413a889642e0748c369a16520892ef5a2cf456954ad4205fa962db809d5a65534d218513feaed184b65fb3'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);

-- Conferir: SELECT jobname, schedule, active FROM cron.job;
-- Histórico: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- =============================================================
-- ROLLBACK
-- =============================================================
-- SELECT cron.unschedule(jobid) FROM cron.job
--   WHERE jobname IN ('firms-sync-daily', 'firms-notify-daily');
