## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/Igorsouza1/sala-de-situacao`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Design

Toda UI nova ou alterada segue o `DESIGN.md` (raiz). Princípio mestre: nada existe "porque tem que existir"; existe porque foi pensado, no detalhe, por um motivo que cabe em uma frase. Antes de construir, passe pelo checklist da seção 1.2 (motivo, clareza do texto, sensação, estados e resposta, movimento só em clicável, som, acessibilidade, cor com significado, registro da decisão). Todo componente interativo tem movimento e som definidos (seções 7 e 8). Mudou uma decisão de design? Registre o motivo no `DESIGN.md`.
