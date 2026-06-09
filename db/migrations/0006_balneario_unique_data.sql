-- Migration: 0006_balneario_unique_data
-- Adiciona constraint UNIQUE em balneario_municipal.data
-- para suportar upsert na Sincronização de Planilha.
-- Execução: Supabase SQL Editor

ALTER TABLE monitoramento.balneario_municipal
  ADD CONSTRAINT balneario_municipal_data_unique UNIQUE (data);

-- ROLLBACK:
-- ALTER TABLE monitoramento.balneario_municipal
--   DROP CONSTRAINT balneario_municipal_data_unique;
