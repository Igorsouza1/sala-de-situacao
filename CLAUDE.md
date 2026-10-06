## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/Igorsouza1/sala-de-situacao`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Design

Toda UI nova ou alterada segue o `DESIGN.md` (raiz). **Comece pela página "Leia primeiro" (14 regras testáveis) e pela receita da seção 19 do que vai construir; o resto é consulta.** Dois princípios: (1) **o usuário vem sempre em primeiro lugar**: ele é informado de cada estado (carregando, vazio, erro, sucesso, bloqueado, desatualizado, ação destrutiva), e **a tela pensa por ele** (no máximo 3 escolhas por cartão, sem número, unidade ou código na tela, o padrão certo já marcado); (2) **nada existe "porque tem que existir"**: existe porque foi pensado, no detalhe, por um motivo que cabe em uma frase. Em conflito, vence: usuário, clareza, simplicidade, beleza, novidade.

**Meça, não opine.** "Respirar", "leve" e "hierarquia" têm régua (seção 6.3: texto empilhado 2 a 4 px, entre cartões 16, antes de barra de ação 24 a 32, linha clicável ≥ 48, cabeçalho de uma linha com no máximo 2 ações). Janela toda branca não vale: base cinza suave e cartão branco com título (6.2). Margens verticais vizinhas colapsam (16). Nada pisca nem brota: o que entra cresce, o que sai encolhe, texto novo faz crossfade, todo clicável responde ao mouse (8.1 e 8.4). O mesmo controle fica na mesma coluna em todas as linhas (6.2 regra 8). O modo e o estado são ditos em cor e em frase, inclusive depois de voltar (19.5). Componente do projeto, nunca do navegador: sem `<select>`, `type="color"`, `alert()` ou `confirm()` (o `design-guard` barra).

**Antes de dizer "pronto" numa mudança de tela, faça a auditoria da seção 1.3 e diga o resultado**: um bloco "Auditoria" com uma linha por regra que se aplica (mudança trivial: uma linha). Quem audita pelo código não vê a tela: diga o que foi conferido no código e o que falta olhar. **Se a pessoa repetir uma correção, pare e registre a causa** (caso na seção 20; se a regra era vaga, mude a regra) **antes** de corrigir a tela. Exceção a uma regra: registre antes.

Todo estado de cada tipo de interação é desenhado antes do código (2.1), e todo componente interativo tem movimento e som definidos (seções 8 e 9). Mudou uma decisão de design? Registre o motivo no `DESIGN.md`. O teste `lib/__tests__/design-guard.test.ts` impede o design antigo de voltar (modo escuro, tokens antigos, `animate-pulse`, fontes antigas) e barra os erros mecânicos (`<select>`, `type="color"`, `alert()`, `confirm()`, a armadilha de transição do Tailwind v4); classes de paleta do Tailwind, cores hexadecimais e esses erros têm um limite por arquivo que só desce. Em UI nova use os tokens (`text-foreground`, `bg-muted`, `text-crit`…), nunca `bg-gray-50` ou `#hex`.
