# Ingestão FIRMS reconstruída como Supabase Edge Functions standalone

As rotas `/api/cron/firms-sync` e `/api/cron/firms-notify` (Vercel Cron) nunca chegaram a rodar em produção — não havia `vercel.json` com `crons` configurado, então o código existia mas nunca era invocado. Decidimos reconstruir a ingestão do zero como duas Supabase Edge Functions (`firms-sync`, `firms-notify`), disparadas por `pg_cron` + `pg_net` uma vez por dia, em vez de portar a lógica antiga para o Next.js/Vercel Cron.

As Edge Functions são **standalone**: não importam `db/schema.ts` nem `lib/repositories/firmsRepository.ts` do Next.js. Deno e Node/Next.js são runtimes diferentes, e path aliases (`@/db`) e a configuração do Drizzle não atravessam essa fronteira sem fricção — cada Edge Function tem seu próprio cliente Postgres (`postgres` via `npm:`) e sua própria cópia mínima da lógica de fetch/match/insert/notificação. O match ponto-região é feito em SQL (`ST_Intersects` contra `regioes.geom`, que já tem índice GiST), não em JS/turf como antes — elimina a necessidade de portar `FirmsProcessor` e resolve "múltiplas regiões sobrepostas" apenas com semântica de JOIN, sem a lógica de `break` que existia no código antigo.

Notificação por email passa a usar Resend (domínio já verificado) em vez de Microsoft Graph/Outlook — API mais simples de usar a partir de Deno, sem client-credentials OAuth flow.

## Considered Options

- **Standalone Edge Function** (escolhido): duplica um pouco de lógica, mas deploy independente do Next.js e zero risco de incompatibilidade Deno/Node.
- **Compartilhar código via `npm:` imports do `lib/` do Next.js** (descartado): menos duplicação, mas acopla o deploy da Edge Function ao código do app e traz risco de quebra por incompatibilidade de runtime.
- **Portar a lógica antiga para uma rota Next.js real (mantendo Vercel Cron)** (descartado): a automação antiga nunca foi configurada e a intenção explícita foi migrar para infraestrutura Supabase.
