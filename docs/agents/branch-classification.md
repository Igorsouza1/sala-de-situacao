# Classificação de branches e PRs

Use nomes curtos para deixar claro o tipo e a área principal do trabalho. A branch sempre nasce de `main`, salvo quando a PR declara outra base necessária.

## Nome de branch

Formato: `<tipo>/<área>-<assunto-curto>`.

Tipos aceitos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

Áreas: `frontend`, `backend`, `mapa`, `dados`, `auth`, `infra`, `docs`. Escolha uma área principal; use `mapa` para mudanças de comportamento cartográfico, mesmo quando também alterarem interface.

Exemplos: `fix/auth-escopo-organizacao`, `feat/mapa-camada-firms`, `docs/branch-classification`.

## Pull requests e labels

- PRs devem apontar para a issue relacionada, explicar o resultado e os testes executados, e usar título claro (de preferência `tipo(área): resumo`).
- Adicione uma label de tipo já existente (`bug`, `enhancement`, `documentation` ou outra adequada) e todas as labels de área relevantes: `area:frontend`, `area:backend`, `area:mapa`, `area:dados`, `area:auth`, `area:infra`, `area:docs`.
- Labels de triagem como `ready-for-agent` descrevem estado, não área. `codex` identifica autoria/ferramenta e não classifica o conteúdo.
- Após merge, remova a branch remota se não for uma branch de integração mantida. Não renomeie nem apague branches antigas sem confirmar que não têm trabalho útil.

## Inventário observado

Snapshot de 4 de outubro de 2026, comparando branches locais com `origin/main` (`1ffbc13`) e consultando branches e PRs no GitHub. “Stale” significa candidata a limpeza ou atualização, não autorização para excluir. Branches em worktrees ativas ficam marcadas como em andamento.

| Branch | Presença | Estado observado |
| --- | --- | --- |
| `main` | local e remota | Remota em `1ffbc13`; `main` local em `4e3a80e`, 20 commits atrás, sem commits exclusivos. Atualizar checkout local antes de iniciar trabalho. |
| `desenvolvimento` | local e remota | Divergiu: 20 commits atrás e 2 à frente de `origin/main`; candidata a stale. Definir se continua sendo branch de integração antes de promover ou limpar. |
| `fix/tenant-bugs-integration` | local e remota | PR #70 merged em `main`; branch remota ainda existe e está 1 commit atrás. Stale, candidata a remoção após confirmar política de retenção. |
| `docs/branch-classification` | local | Em andamento neste worktree; baseada no `main` atual. |
| `audit/tenant-access-branch-policy` | local | Em andamento em worktree separada; HEAD coincide com `origin/main`. |
| `fix/validate-station-access` | local | Em andamento em worktree separada; HEAD coincide com `origin/main`. |
| `fix/validate-universal-scope` | local | Em andamento em worktree separada; HEAD coincide com `origin/main`. |
| `design/identidade-prisma` | local | Em andamento no checkout de trabalho; 9 commits exclusivos e base anterior ao `origin/main`. PR não encontrada no inventário. |
| `fix/issue-58-tenant-read-scope` | local | 3 commits exclusivos; HEAD não ancestral de `origin/main`; sem worktree dedicada observada. Candidata a stale. |
| `fix/tenant-actions` | local | 2 commits exclusivos; HEAD não ancestral de `origin/main`; sem worktree dedicada observada. Candidata a stale. |
| `fix/tenant-auth-print` | local | 6 commits exclusivos; HEAD não ancestral de `origin/main`; sem worktree dedicada observada. Candidata a stale. |
| `fix/tenant-environment` | local | 3 commits exclusivos; HEAD não ancestral de `origin/main`; sem worktree dedicada observada. Candidata a stale. |
| `proto/design-lab` | local | 21 commits exclusivos; HEAD não ancestral de `origin/main`; sem worktree dedicada observada. Candidata a stale. |

O GitHub reportou somente `main`, `desenvolvimento` e `fix/tenant-bugs-integration` como branches remotas. Não havia PR aberta. A PR #70 foi merged; PRs históricas fechadas ou merged não indicam atividade atual.

## Exemplo de áreas

A PR [#70](https://github.com/Igorsouza1/sala-de-situacao/pull/70) altera autenticação, rotas API, repositórios e acesso a camadas e dados ambientais. Por isso recebeu `area:auth`, `area:backend`, `area:mapa` e `area:dados`.
