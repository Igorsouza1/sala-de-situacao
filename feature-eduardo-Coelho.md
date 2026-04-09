# 📋 ESPECIFICAÇÃO - Importação GPX para Ações

> **Status:** Aprovado para implementação  
> **Versão:** 2.0  
> **Data:** 09/04/2026

---

## 1. VISÃO GERAL

Feature de importação de arquivos GPX com fluxo em **3 etapas** que permite:
1. Extrair metadados do arquivo
2. Visualizar e cadastrar trilha
3. Classificar waypoints como **Ações** com fotos antes do envio

### Princípios
- **1 arquivo GPX = 1 trilha** (mesmo com múltiplos tracks no arquivo)
- **Waypoints → Ações**: Cada waypoint gera 1 registro na tabela `monitoramento.acoes`
- **Edição completa** antes do envio (sem rascunho)
- **Fotos opcionais** (0-2 por ação)

---

## 2. FLUXO DO USUÁRIO

```
┌──────────────────────────────────────────────┐
│  [Drag & Drop GPX] → Parser → Validação     │
│           ↓                                  │
│  ETAPA 1: Informações Gerais                 │
│  (metadados + região)                        │
│           ↓                                  │
│  ETAPA 2: Dados da Trilha + Map Preview      │
│           ↓                                  │
│  ETAPA 3: Waypoints → Ações (Accordion)      │
│  - Editar campos obrigatórios                │
│  - Adicionar fotos (0-2)                     │
│  - Bulk apply                                │
│           ↓                                  │
│  [Enviar] → Validação → API → DB             │
└──────────────────────────────────────────────┘
```

---

## 3. ETAPA 1 - Informações Gerais do GPX ✅ IMPLEMENTADA

### 3.1. Upload
- [x] **Drag and drop** de arquivo `.gpx`
- [x] Aceitar seleção manual via file picker
- [x] Validação: extensão `.gpx` e MIME type `application/gpx+xml` ou `text/xml`
- [x] Feedback visual de erro (arquivo inválido, corrompido, vazio)

### 3.2. Parsing Automático
Após upload válido, extrair automaticamente:

| Dado | Origem | Editável? |
|------|--------|-----------|
| **Nome** | Nome do arquivo (sem extensão) | ✅ Sim |
| **Total de pontos** | Trackpoints + Waypoints | ❌ Info |
| **Distância total** | Cálculo geométrico | ❌ Info |
| **Data início** | Primeiro timestamp do track | ❌ Info |
| **Data fim** | Último timestamp do track | ❌ Info |
| **Duração** | Diferença início-fim | ❌ Info |
| **Nº tracks** | Contagem `<trk>` no GPX | ❌ Info |
| **Nº waypoints** | Contagem `<wpt>` no GPX | ❌ Info |

### 3.3. Campos do Formulário

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| **Nome** | `input text` | ✅ | Default: nome do arquivo |
| **Região** | `select` | ✅ | Carregado de `regioesInMonitoramento` |

### 3.4. Validações
- [x] Nome preenchido (mínimo 3 caracteres)
- [x] Região selecionada
- [x] GPX contém pelo menos 1 track OU 1 waypoint

### 3.5. Navegação
```
[Cancelar] ──── fecha modal, descarta tudo
[Próximo →] ── valida → Etapa 2
```

### 3.6. Arquivos Criados
- `components/gpx-import/GpxUploader.tsx` - Componente drag-and-drop
- `components/gpx-import/Step1GeneralInfo.tsx` - Formulário Etapa 1
- `components/gpx-import/GpxImportTab.tsx` - Container principal com stepper
- `components/ui/alert.tsx` - Componente Alert (shadcn)

### 3.7. Arquivos Modificados
- `components/admin/region-map-preview.tsx` - Adicionada aba "Ações"
- `app/admin/regions/[id]/page.tsx` - Busca regiões para o select

---

## 4. ETAPA 2 - Dados da Trilha ✅ IMPLEMENTADA

### 4.1. Map Preview
- [x] Exibir trilha no mapa usando componente `RegionMapPreview` existente
- [x] Camada de trilha com destaque (azul com glow)
- [x] Zoom automático para bounds da trilha
- [x] **NÃO** exibir waypoints nesta etapa

### 4.2. Dados Extraídos

| Dado | Origem | Editável? |
|------|--------|-----------|
| **Geometria** | Track(s) do GPX → GeoJSON | ❌ |
| **Distância** | Cálculo automático (km) | ❌ Info |
| **Duração** | Cálculo automático (h:m) | ❌ Info |

### 4.3. Campos do Formulário

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| **Nome da trilha** | `input text` | ✅ | Default: nome da Etapa 1 |
| **Data início** | `input datetime-local` | ❌ | Default: do GPX, editável |
| **Data fim** | `input datetime-local` | ❌ | Default: do GPX, editável |

### 4.4. Caso Especial: GPX sem Track
Se arquivo contiver **apenas waypoints** (sem `<trk>`):
- [x] Exibir aviso: *"Este arquivo não contém trilhas. Apenas waypoints serão importados como Ações."*
- [x] Pular Etapa 2 automaticamente → Ir direto para Etapa 3
- [x] Botão "Avançar para Ações"

### 4.5. Navegação
```
[← Voltar] ─── volta para Etapa 1 (mantém estado)
[Próximo →] ── valida → Etapa 3
```

### 4.6. Arquivos Criados
- `components/gpx-import/Step2TrailData.tsx` - Formulário Etapa 2

### 4.7. Arquivos Modificados
- `components/gpx-import/GpxImportTab.tsx` - Adicionado Step2 e callback `onTrailPreview`
- `components/admin/region-map-preview.tsx` - Camada de preview da trilha no mapa

---

## 5. ETAPA 3 - Waypoints → Ações ✅ IMPLEMENTADA (Frontend Completo)

### 5.1. Estrutura de Exibição
- [x] **Accordion** (toggle expansível) por waypoint
- [x] Header do accordion mostra:
  - Nome do waypoint (ou "Waypoint N" se vazio)
  - Ícone de coordenadas 📍
  - Status de preenchimento (✅ completo / ⚠️ pendente)

### 5.2. Dados do GPX (Read-only)

| Dado | Exibição |
|------|----------|
| **Latitude** | Texto, não editável |
| **Longitude** | Texto, não editável |
| **Elevação** | Texto, não editável (se disponível) |
| **Data/Hora** | Texto, não editável (se disponível) |

### 5.3. Campos Editáveis (Formulário por Waypoint)

**Todos os campos são OBRIGATÓRIOS**

| Campo | Tipo | Valores Válidos | Default |
|-------|------|-----------------|---------|
| **Nome** | `input text` | Livre | Nome do GPX ou "Waypoint N" |
| **Descrição** | `textarea` | Livre | Vazio |
| **Categoria** | `select` | `['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura']` | ❌ Nulo |
| **Tipo** | `input text` | Livre | Vazio |
| **Status** | `select` | `['Identificado', 'Em Recuperação', 'Concluído']` | ❌ Nulo |
| **Eixo Temático** | `select` | `['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura']` | ❌ Nulo |
| **Tipo Técnico** | `select` | `['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura']` | ❌ Nulo |
| **Caráter** | `select` | `['Fiscalização', 'Recuperação', 'Incidente', 'Monitoramento', 'Infraestrutura']` | ❌ Nulo |

### 5.4. Upload de Fotos (Opcional)

- [x] **Máximo:** 2 fotos por waypoint
- [x] **Mínimo:** 0 (opcional)
- [x] Drag and drop ou file picker
- [x] Formatos aceitos: JPG, PNG, WebP
- [x] Tamanho máximo: 5MB por arquivo
- [x] Preview em thumbnail após upload
- [x] Campo de descrição por foto (opcional)
- [x] Botão de remover foto (X no canto)
- [x] Contador visual: `(1/2 fotos)`

### 5.5. Funcionalidades Bulk

- [x] Barra de ações no topo: Categoria, Status, Eixo Temático, Tipo Técnico, Caráter
- [x] Selecionar valores e clicar "Aplicar a Todos"
- [x] **NÃO** sobrescreve campos já preenchidos (apenas vazios)
- [x] Feedback visual: "X waypoints atualizados" (desaparece após 3s)

### 5.6. Validação por Waypoint

- [x] Nome: mínimo 3 caracteres
- [x] Descrição: mínimo 10 caracteres
- [x] Categoria selecionada
- [x] Tipo preenchido (mínimo 3 caracteres)
- [x] Status selecionado
- [x] Eixo Temático selecionado
- [x] Tipo Técnico selecionado
- [x] Caráter selecionado

**Indicador visual:**
- ✅ Verde: waypoint completo
- ⚠️ Amarelo: campos pendentes

### 5.7. Validação e Envio

- [x] Botão "Enviar Tudo ✓" valida TODOS os waypoints
- [x] Se houver erros: expandir primeiro accordion com erro
- [x] Mensagem: "X waypoint(s) com pendências"
- [x] Se tudo válido: chama callback de submit (preparado para API)
- [x] Spinner durante envio
- [x] Toast de sucesso após envio

### 5.8. Arquivos Criados
- `components/gpx-import/Step3Waypoints.tsx` - Container principal da Etapa 3
- `components/gpx-import/WaypointAccordion.tsx` - Accordion por waypoint
- `components/gpx-import/PhotoUploader.tsx` - Upload de fotos por waypoint
- `components/gpx-import/WaypointBulkActions.tsx` - Barra de bulk actions

### 5.9. Arquivos Modificados
- `components/gpx-import/GpxImportTab.tsx` - Integração do Step3 e extração de waypoints

---

## 6. BACKEND - API (PRÓXIMA ETAPA)

> **Nota:** O frontend está completo. O próximo passo é implementar o backend para receber os dados e salvar no banco.

---

## 6. BACKEND - API

### 6.1. Endpoint

```
POST /api/gpx/import
```

### 6.2. Request

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trilha.nome` | string | condicional | Nome da trilha (se houver track) |
| `trilha.geom` | string (WKT) | condicional | MULTILINESTRING Z (se houver track) |
| `trilha.dataInicio` | datetime | condicional | Início da trilha |
| `trilha.dataFim` | datetime | condicional | Fim da trilha |
| `regiaoId` | integer | ✅ | ID da região |
| `acoes` | JSON string | ✅ | Array de ações (waypoints) |
| `acoes[N].nome` | string | ✅ | Nome da ação |
| `acoes[N].descricao` | string | ✅ | Descrição |
| `acoes[N].categoria` | enum | ✅ | categoria_acao |
| `acoes[N].tipo` | string | ✅ | Tipo técnico |
| `acoes[N].status` | enum | ✅ | status_acoes |
| `acoes[N].eixoTematico` | string | ✅ | Eixo temático |
| `acoes[N].tipoTecnico` | string | ✅ | Tipo técnico |
| `acoes[N].carater` | string | ✅ | Caráter |
| `acoes[N].latitude` | numeric | ✅ | Latitude |
| `acoes[N].longitude` | numeric | ✅ | Longitude |
| `acoes[N].elevation` | numeric | ❌ | Elevação (opcional) |
| `acoes[N].time` | datetime | ❌ | Timestamp (opcional) |
| `acoes[N].fotos` | File[] | ❌ | 0-2 arquivos de imagem |
| `acoes[N].fotosDesc` | string[] | ❌ | Descrições das fotos |

### 6.3. Processamento no Backend

**Fluxo:**
```
1. Validar request completo
2. Iniciar transação no banco
3. Se trilha presente:
   3.1. Insert em monitoramento.trilhas
   3.2. Obter trilhaId gerado
4. Para cada ação:
   4.1. Validar coordenadas dentro da região (warning log)
   4.2. Insert em monitoramento.acoes (geom como POINT Z)
   4.3. Obter acaoId gerado
   4.4. Se fotos presentes:
       4.4.1. Upload para Supabase Storage (bucket: acoes-fotos)
       4.4.2. Insert em monitoramento.fotos_acoes (url + descricao)
5. Commit transação
6. Retornar sucesso com IDs criados
```

### 6.4. Response

**Sucesso (201 Created):**
```json
{
  "success": true,
  "data": {
    "trilhaId": 123,
    "acoesIds": [456, 457, 458],
    "totalFotos": 5
  }
}
```

**Erro (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validação falhou",
  "details": [
    {
      "waypointIndex": 2,
      "field": "categoria",
      "message": "Categoria é obrigatória"
    }
  ]
}
```

**Erro (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Erro interno ao processar importação"
}
```

### 6.5. Transação e Rollback

- [ ] **TUDO** em transação única
- [ ] Se qualquer insert falhar → rollback completo
- [ ] Se upload de foto falhar → rollback de inserts anteriores
- [ ] Log de erro com detalhes para debug

---

## 7. REQUISITOS TÉCNICOS

### 7.1. Frontend

**Tecnologias:**
- [ ] `react-dropzone` para drag and drop
- [ ] Componentes shadcn/ui (já instalados no projeto)
- [ ] `MapPreview` existente para preview
- [ ] `zustand` ou React Context para estado do formulário
- [ ] `zod` para validação

**Componentes a criar:**
```
components/
└── gpx-import/
    ├── GpxImportModal.tsx          # Modal principal com stepper
    ├── Step1GeneralInfo.tsx        # Etapa 1
    ├── Step2TrailData.tsx          # Etapa 2
    ├── Step3Waypoints.tsx          # Etapa 3 (container)
    ├── WaypointAccordion.tsx       # Accordion por waypoint
    ├── WaypointBulkActions.tsx     # Barra de bulk actions
    ├── PhotoUploader.tsx           # Upload de fotos por waypoint
    └── GpxValidationSummary.tsx    # Resumo de validação
```

**Reutilizar:**
- `lib/helpers/gpxParser.ts` (parser GPX → GeoJSON/WKT)
- `components/MapPreview.tsx` (preview no mapa)
- Componentes de formulário shadcn/ui

### 7.2. Backend

**Endpoint:**
```
app/api/gpx/import/route.ts
```

**Serviços:**
- [ ] Criar `lib/service/gpxImportService.ts`
- [ ] Função `importGpx(data)` encapsula toda lógica
- [ ] Usa `gpxParser` existente para conversão
- [ ] Supabase storage para fotos (bucket: `acoes-fotos`)

**Validações:**
- [ ] Schema Zod completo para request
- [ ] Validação de coordenadas com ST_Contains
- [ ] Validação de arquivos (tipo, tamanho)

### 7.3. Banco de Dados

**Tabelas existentes (NÃO precisa modificar schema):**

| Tabela | Uso |
|--------|-----|
| `monitoramento.trilhas` | 1 registro (se houver track) |
| `monitoramento.acoes` | 1 registro por waypoint |
| `monitoramento.fotos_acoes` | 0-2 registros por ação |
| `monitoramento.regioes` | Referência (FK regiaoId) |

**Indexes sugeridos (performance):**
```sql
-- Verificar se já existem
CREATE INDEX IF NOT EXISTS idx_acoes_regiao_id ON monitoramento.acoes(regiao_id);
CREATE INDEX IF NOT EXISTS idx_acoes_categoria ON monitoramento.acoes(categoria);
CREATE INDEX IF NOT EXISTS idx_acoes_status ON monitoramento.acoes(status);
```

---

## 8. VALIDAÇÕES COMPLETAS

### 8.1. Upload GPX
- [ ] Extensão `.gpx`
- [ ] XML bem formado
- [ ] Contém pelo menos 1 track OU 1 waypoint
- [ ] Tamanho máximo: 10MB

### 8.2. Etapa 1 (Info Geral)
- [ ] Nome: mínimo 3 caracteres, máximo 255
- [ ] Região: selecionada e válida

### 8.3. Etapa 2 (Trilha)
- [ ] Nome: mínimo 3 caracteres (se trilha presente)
- [ ] Datas coerentes (início < fim)

### 8.4. Etapa 3 (Waypoints)
- [ ] Pelo menos 1 waypoint
- [ ] Cada waypoint com todos os campos obrigatórios
- [ ] Nome: mínimo 3 caracteres, máximo 255
- [ ] Descrição: mínimo 10 caracteres, máximo 255
- [ ] Tipo: mínimo 3 caracteres, máximo 100
- [ ] Enums: valores válidos
- [ ] Fotos: máximo 2, formato JPG/PNG/WebP, máx 5MB cada

### 8.5. Coordenadas
- [ ] Latitude: -90 a 90
- [ ] Longitude: -180 a 180
- [ ] Aviso se fora da região selecionada

---

## 9. TRATAMENTO DE ERROS

### 9.1. Frontend
- [ ] Validação em tempo real por campo
- [ ] Mensagens de erro claras em português
- [ ] Destaque visual de campos com erro
- [ ] Toast de sucesso após envio
- [ ] Toast de erro se falha na API

### 9.2. Backend
- [ ] Validação de schema antes de processar
- [ ] Rollback automático em caso de erro
- [ ] Log detalhado com stack trace
- [ ] Response de erro com detalhes específicos

### 9.3. Casos Especiais
| Cenário | Comportamento |
|---------|---------------|
| GPX sem tracks | Pular Etapa 2, importar só waypoints |
| GPX sem waypoints | Exibir aviso, permitir só trilha |
| GPX vazio | Erro na Etapa 1: "Arquivo GPX vazio" |
| Falha no upload de foto | Retry automático (1x), depois falha |
| Coordenadas fora da região | Aviso mas permite envio |
| Timeout na API | Mensagem: "Tempo esgotado. Tente novamente." |

---

## 10. UX/UI

### 10.1. Stepper Visual
```
●────────○────────○
Etapa 1    2    3
Info       Trilha Ações
```
- ✅ Completada: círculo verde com check
- 🔵 Ativa: círculo azul preenchido
- ⚪ Pendente: círculo vazio

### 10.2. Responsividade
- [ ] Funcionar em desktop (prioritário)
- [ ] Tablet: layout ajustável
- [ ] Mobile: NÃO suportado inicialmente (mensagem: "Use desktop")

### 10.3. Acessibilidade
- [ ] Labels em todos os inputs
- [ ] Mensagens de erro associadas via `aria-describedby`
- [ ] Navegação por teclado (Tab, Enter, Esc)
- [ ] Contraste adequado

### 10.4. Feedback Visual
- [ ] Skeleton loaders enquanto processa GPX
- [ ] Spinners em botões durante envio
- [ ] Toast notifications (sucesso/erro)
- [ ] Badges de status nos accordions

---

## 11. NÃO INCLUÍDO (Scope Out)

❌ Edição de geometria da trilha  
❣ Múltiplas trilhas por GPX  
❣ Salvamento de rascunho  
❣ Histórico/auditoria de importações  
❣ Undo após envio  
❣ Validação bloqueante de coordenadas fora da região  
❌ Waypoints duplicados (mesmas coordenadas)  
❌ Exportar dados de volta para GPX  

---

## 12. CRITÉRIOS DE ACEITE

### 12.1. Cenário Principal
- [ ] Usuário faz upload de GPX válido com tracks e waypoints
- [ ] Preenche Etapa 1 (nome + região)
- [ ] Visualiza trilha na Etapa 2
- [ ] Classifica todos os waypoints na Etapa 3
- [ ] Adiciona 1-2 fotos em alguns waypoints
- [ ] Envia com sucesso → trilha, ações e fotos criados no banco
- [ ] Toast de sucesso exibido
- [ ] Modal fecha automaticamente

### 12.2. Cenário Só Waypoints
- [ ] GPX sem tracks → Etapa 2 pulada
- [ ] Apenas ações criadas (sem trilha)
- [ ] Toast: "X ações importadas com sucesso"

### 12.3. Cenário de Erro
- [ ] Validação detecta campos faltando
- [ ] Accordions com erro expandem automaticamente
- [ ] Usuário corrige e reenvia
- [ ] Envio conclui com sucesso

### 12.4. Bulk Actions
- [ ] Usuário aplica categoria em lote
- [ ] Apenas waypoints vazios são preenchidos
- [ ] Contador: "X waypoints atualizados"
- [ ] Usuário pode sobrescrever manualmente depois

---

## 13. DEPENDÊNCIAS

### 13.1. Bibliotecas Existentes
- ✅ `@tmcw/togeojson` - Parser GPX → GeoJSON
- ✅ `@xmldom/xmldom` - Parser XML
- ✅ `react-dropzone` - Drag and drop
- ✅ shadcn/ui - Componentes de UI
- ✅ `zod` - Validação
- ✅ Supabase Storage - Fotos (bucket já configurado)

### 13.2. Componentes Existentes
- ✅ `MapPreview` - Preview no mapa
- ✅ `gpxParser.ts` - Parser GPX
- ✅ `gpx-upload-modal.tsx` - Referências (pode substituir)
- ✅ `DataInsertDialog.tsx` - Padrão de stepper

### 13.3. Infraestrutura
- ✅ Banco com schema `monitoramento`
- ✅ Supabase storage configurado
- ✅ Next.js API routes

---

## 14. PLANO DE IMPLEMENTAÇÃO

### Fase 1: Base e Upload (Dia 1-2)
1. Criar estrutura de pastas `components/gpx-import/`
2. Criar `GpxImportModal.tsx` com stepper
3. Implementar Step 1 (General Info + drag & drop)
4. Integração com `gpxParser.ts`
5. Validações básicas

### Fase 2: Trilha e Preview (Dia 3)
1. Implementar Step 2 (Trail Data)
2. Integração com `MapPreview`
3. Caso especial: GPX sem track
4. Validações de data/nome

### Fase 3: Waypoints (Dia 4-6)
1. Implementar Step 3 (Waypoints container)
2. Criar `WaypointAccordion.tsx`
3. Formulário por waypoint com validação
4. Implementar `WaypointBulkActions.tsx`
5. Indicadores visuais de status

### Fase 4: Fotos (Dia 7-8)
1. Criar `PhotoUploader.tsx`
2. Integração com Supabase Storage
3. Preview e remoção de fotos
4. Validações (tamanho, formato, quantidade)

### Fase 5: Backend API (Dia 9-10)
1. Criar endpoint `/api/gpx/import`
2. Schema Zod de validação
3. Service `gpxImportService.ts`
4. Transação no banco
5. Upload de fotos e inserts

### Fase 6: Testes e Polimento (Dia 11-12)
1. Testes manuais completos
2. Correção de bugs
3. UX polish (animações, feedback)
4. Tratamento de erros
5. Toast notifications

---

## 15. MONITORAMENTO E LOG

### 15.1. Logs de Sucesso
```
[INFO] GPX importado: { arquivo, regiaoId, totalWaypoints, totalFotos, trilhaCriada }
```

### 15.2. Logs de Erro
```
[ERROR] Falha na importação: { erro, etapa, dadosParciais }
```

### 15.3. Métricas (futuro)
- Tempo médio de importação
- Taxa de erro por tipo
- Número de waypoints por importação

---

## 16. NOTAS TÉCNICAS

### 16.1. Parser GPX
Reutilizar `lib/helpers/gpxParser.ts`:
- `convertGpxToGeoJSON(file)` → FeatureCollection
- `extractTrackAsWKT(geojson)` → MULTILINESTRING Z
- `extractWaipointsAsWKT(geojson)` → Array de pontos

### 16.2. Geometria no Banco
- **Trilha:** `geometry(MULTILINESTRINGZ, 4674)`
- **Ação:** `geometry(POINTZ, 4674)`
- WKT exemplo: `POINT Z (-45.678 -12.345 150.5)`

### 16.3. Supabase Storage
- **Bucket:** `acoes-fotos` (já configurado)
- **Path:** `acoes/{acaoId}/{timestamp}_{filename}`
- **URL pública:** gerada após upload

### 16.4. Validação de Coordenadas
```sql
SELECT ST_Contains(
  (SELECT geom FROM monitoramento.regioes WHERE id = $1),
  ST_SetSRID(ST_MakePoint($2, $3), 4674)
)
```

---

## 17. GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **GPX** | Formato XML para dados de GPS (tracks, routes, waypoints) |
| **Track** | Sequência de pontos gravados durante movimento |
| **Waypoint** | Ponto de interesse com coordenadas específicas |
| **Ação** | Registro na tabela `acoes` (waypoint classificado) |
| **Bulk Action** | Aplicar mesmo valor a múltiplos waypoints |
| **WKT** | Well-Known Text (formato de geometria para PostGIS) |

---

**FIM DO DOCUMENTO**
