-- =============================================================
-- Migration: 0012_pg_cron_mapbiomas
-- Agenda a ingestão MapBiomas Alerta (ADR 0011): pg_cron + pg_net
-- disparam as Edge Functions mapbiomas-sync e mapbiomas-notify
-- 1x/semana (segunda-feira).
--
-- ANTES DE EXECUTAR, substituir os placeholders:
--   <PROJECT_REF>  — ref do projeto Supabase (subdomínio de *.supabase.co)
--   <CRON_SECRET>  — mesmo valor configurado como secret CRON_SECRET
--                    nas Edge Functions (supabase secrets set CRON_SECRET=...)
--
-- Pré-requisitos (fora desta migration):
--   Migration 0011_desmatamento_junction aplicada
--   supabase functions deploy mapbiomas-sync --no-verify-jwt
--   supabase functions deploy mapbiomas-notify --no-verify-jwt
--   supabase secrets set SUPABASE_DB_URL=... MAPBIOMAS_EMAIL=... \
--     MAPBIOMAS_PASSWORD=... RESEND_API_KEY=... ALERT_FROM_EMAIL=... \
--     CRON_SECRET=...
--
-- Horários (UTC, segunda-feira): sync 07:00, notify 07:30 — fora da
-- janela do FIRMS (06:00/06:30 diário) para não concorrer.
-- Cadência semanal porque a publicação de alertas do MapBiomas é semanal.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamentos anteriores se existirem (idempotência)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('mapbiomas-sync-weekly', 'mapbiomas-notify-weekly');

SELECT cron.schedule(
  'mapbiomas-sync-weekly',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/mapbiomas-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);

SELECT cron.schedule(
  'mapbiomas-notify-weekly',
  '30 7 * * 1',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/mapbiomas-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
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
--   WHERE jobname IN ('mapbiomas-sync-weekly', 'mapbiomas-notify-weekly');
