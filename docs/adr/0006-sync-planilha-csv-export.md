# Sincronização de Planilha via CSV export público (sem Google Sheets API)

A Sincronização de Planilha do Balneário Municipal usa a URL de exportação CSV do Google Sheets (`/gviz/tq?tqx=out:csv&sheet={ano}`) em vez da Google Sheets API v4 com autenticação.

## Considered Options

- **Google Sheets API v4 com Service Account**: requer projeto no Google Cloud Console, credenciais no `.env`, compartilhamento da planilha com email de service account. Mais robusto para planilhas privadas.
- **CSV export público** (escolhido): a planilha é pública ("qualquer pessoa com o link pode ver"). Basta um `fetch` na URL pública — zero configuração de Google Cloud, zero credenciais. A lógica de parse fica inteiramente no servidor Next.js.

## Consequências

- Se a planilha for tornada privada no futuro, a sincronização quebra silenciosamente (o fetch retorna HTML de login em vez de CSV). Solução futura: migrar para Service Account.
- O parser deve tratar datas em `DD/MM/YYYY` e decimais com vírgula (padrão brasileiro da planilha).
- A deduplicação é feita via upsert com `UNIQUE` na coluna `data` da tabela `balneario_municipal`.
