## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/Igorsouza1/sala-de-situacao`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Design

Toda UI nova ou alterada segue o `DESIGN.md` (raiz). Dois princípios: (1) **o usuário vem sempre em primeiro lugar**: ele é informado de cada estado (carregando, vazio, erro, sucesso, bloqueado, desatualizado, ação destrutiva), e tudo passa pela pergunta "dá para ser mais simples, ter menos etapas, a interface pensar por ele?" (seção 2); (2) **nada existe "porque tem que existir"**: existe porque foi pensado, no detalhe, por um motivo que cabe em uma frase. Em conflito, vence: usuário, clareza, simplicidade, beleza, novidade. Antes de construir, passe pelo checklist da seção 1.2. Todo estado de cada tipo de interação é desenhado antes do código, e todo componente interativo tem movimento e som definidos (seções 8 e 9), e nada some ou aparece do nada: o usuário vê o caminho (8.4). Mudou uma decisão de design? Registre o motivo no `DESIGN.md`. O teste `lib/__tests__/design-guard.test.ts` impede o design antigo de voltar (modo escuro, tokens antigos, `animate-pulse`, fontes antigas); classes de paleta do Tailwind e cores hexadecimais têm um limite por arquivo que só desce. Em UI nova use os tokens (`text-foreground`, `bg-muted`, `text-crit`…), nunca `bg-gray-50` ou `#hex`.
