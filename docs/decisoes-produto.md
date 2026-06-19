# Decisões de Produto — PRISMA (junho 2026)

Documento gerado a partir de sessão de alinhamento estratégico (2026-06-19).

---

## O que o PRISMA é

Sistema de **gestão de áreas ambientais** com dois modos de uso simultâneos:

- **Produção de dado**: técnicos de campo inserem ações, fotos e leituras
- **Consumo de evidência**: gestores e financiadores visualizam o que aconteceu, recebem alertas e geram relatórios

O produto só é útil quando os dois modos se conectam — o técnico insere, o gestor vê.

---

## Personas reais

| Persona | Necessidade central | Maior dor hoje |
|---|---|---|
| Secretário de Meio Ambiente / Eduardo Coelho | Evidência territorial, visão ampla, ser notificado antes de jornalistas, comprovar ações | Sem alertas chegando, relatório manual |
| Técnico do Eduardo | Inserir dados que hoje estão em planilha, ver anomalias (chuva excessiva, turbidez) | Upload de fotos ponto a ponto |
| Técnico do IHP | Planejar campo via dados, registrar ações com fotos, emitir relatório para Eduardo/Secretário | Inserção de ações trabalhosa, relatório manual fora do PRISMA |

### Notas sobre personas

- Eduardo Coelho paga o IHP para ações de mitigação do turvamento do Rio da Prata. Perdas financeiras diretas no turismo quando o rio turva.
- O Técnico do IHP é o **usuário mais completo**: produz dado E consome análise. O fluxo dele define o esqueleto do produto.
- O Secretário e o Eduardo são **consumidores de evidência** — precisam de relatórios, dashboards e notificações, não de telas de inserção.

---

## Fluxo central do produto

O Técnico do IHP percorre este ciclo toda semana:

```
1. Planejamento
   → Abre PRISMA, vê alertas de desmatamento, imagem recente de satélite
   → Identifica áreas prioritárias (análise NDVI, mata ciliar — futuro)
   → Eduardo ou notificação dispara: "turvou, vai ver"

2. Campo
   → Usa Wicloc para marcar pontos GPS com nome e fotos

3. Inserção (gargalo atual)
   → Baixa pontos do Wicloc (GPX/KML)
   → Acessa site do Wicloc, salva fotos uma por uma
   → Insere cada ação no PRISMA: tipo, descrição, foto, coordenada
   → 5 dias de campo = N pontos × 1-3 fotos cada

4. Relatório
   → Hoje: monta PDF manualmente (Word/Canva) com texto, prints do mapa, fotos
   → Futuro: PRISMA gera o PDF automaticamente a partir das ações inseridas
```

**Limitação Wicloc confirmada**: não oferece export em ZIP de fotos. KML exportado não embute fotos (referencia URLs internas). Fotos precisam ser salvas uma por uma no navegador. A solução deve estar no lado do PRISMA (upload múltiplo simultâneo), não na integração com Wicloc.

---

## Relatório: direção de produto

**Curto prazo — Opção A (PDF gerado pelo PRISMA):**
PRISMA monta o relatório automaticamente a partir das ações do período: mapa das ações, fotos, indicadores reais (N ações, N propriedades visitadas, N alertas investigados), próximos passos. Técnico para de fazer trabalho duplicado.

**Longo prazo — Opção B (acesso direto ao PRISMA):**
Eduardo e Secretário têm login e acessam uma view curada do sistema. O relatório vira um link. Requer que o PRISMA seja confiável o suficiente para ser acessado ativamente.

**Decisão**: implementar A primeiro. Quando Eduardo começar a clicar nos links dentro do PDF, ele está pronto para B.

---

## O que está quebrado — priorizado

### 1. Modelo de dados não é verdadeiramente multi-região (bloqueante)

Propriedades, FIRMS (Focos de Calor) e Detecções de Desmatamento ainda têm `tenant_id` direto, quando deveriam ser Dados de Base ligados via junction tables. Enquanto isso não está corrigido:
- A mesma detecção não aparece corretamente em duas regiões ao mesmo tempo
- O sistema de alertas não pode ser construído corretamente

**Plano técnico detalhado:** `docs/plano-dados-de-base-e-firms.md`

### 2. Sistema de alertas sem ingestão de dados (core quebrado)

FIRMS/MapBiomas pararam de ingerir dados quando o sistema saiu da Azure. Precisam ser reconstruídos como Supabase Functions. O código não existe mais, mas a lógica não é complexa. Depende do item 1 estar resolvido para ser construído corretamente (multi-região desde o início).

### 3. UX de inserção de ações (dor diária do usuário mais ativo)

Upload de fotos é feito foto a foto. Solução: upload múltiplo simultâneo / drag-and-drop na tela de ação. Não é bloqueante para o produto funcionar, mas é o que o técnico sente toda semana.

### 4. Relatório gerado manualmente fora do PRISMA (trabalho duplicado)

Técnico insere no PRISMA e depois remonta tudo num PDF externo. Solução: PRISMA gera o PDF a partir das ações do período.

---

## Cliente potencial: Município de Bonito (MS)

Negociação em andamento, prazo estimado: meses. Requer que o multi-tenant esteja funcional e que o modelo de dados seja correto (Dados de Base verdadeiramente universais). O Track A abaixo é exatamente o trabalho que viabiliza Bonito como segundo tenant real.

---

## Ordem de trabalho decidida

### Track A — Fundação (primeiro, bloqueante)

Seguir o plano em `docs/plano-dados-de-base-e-firms.md`:

```
Fase 1: regioes.tenant_id como FK real (~1-2 dias)
  ↓
Fase 2: junction firms_regioes + Supabase Function de ingestão FIRMS (~3-5 dias)
  ↓ (paralelo)
Fase 3: junction propriedades_regioes (~1-2 dias)
Fase 4: junction desmatamento_regioes (~1-2 dias)
  ↓
Limpeza final: remover metadata->>'organizationId', remover SEED_TENANT_ID dos repositórios de dados de base
```

Resultado ao final do Track A: alertas funcionando para N regiões, modelo de dados correto, Bonito pode ser onboardado.

### Track B — Experiência (depois do Track A)

1. **Multi-upload de fotos nas ações**: drag-and-drop, seleção múltipla, progresso visual
2. **Geração de relatório PDF**: a partir das ações do período selecionado — mapa, fotos, indicadores, próximos passos

---

## Decisões explícitas

- **Alertas antes de UX**: alertas são o core. Sem eles o sistema não cumpre sua proposta. Mas dependem do modelo de dados correto.
- **Track A antes de Track B**: qualquer UX construída antes do modelo de dados correto pode precisar ser refeita.
- **Desenvolvimento solo**: um desenvolvedor. Não há paralelismo de tracks.
- **Bonito não é urgente**: negociação em meses. Não justifica sacrificar qualidade do produto para o usuário atual (IHP/Eduardo).
- **Wicloc não tem integração viável**: a solução de fotos é no PRISMA, não em integração com Wicloc.
