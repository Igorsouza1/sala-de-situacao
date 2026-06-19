# Prisma

Plataforma de inteligência geoespacial e monitoramento ambiental. Permite que organizações dominem seu território com dados satelitais, ações de campo e análises cruzadas sobre propriedades rurais.

## Language

### Atores

**Organização**:
Entidade (município, instituto, empresa) que contrata o Prisma para monitorar um ou mais territórios.
_Avoid_: Tenant, cliente, instituição (em documentação de domínio; "tenant" é termo de implementação)

**Gestor Ambiental**:
Usuário primário do Prisma. Monitora território, registra ações de campo e gera evidências de conformidade ambiental.
_Avoid_: Operador, analista, usuário

### Território

**Região**:
Limite geográfico de qualquer forma, definido pela Organização, que delimita a área de inserção e gestão de dados. Não precisa corresponder a um limite cadastral ou municipal. Pertence a exatamente uma Organização (relação N:1). Duas Organizações podem monitorar a mesma área geográfica, mas cada uma define e gerencia sua própria Região — não existe compartilhamento de Região entre Organizações.
_Avoid_: Município, área, território, zona

**Propriedade**:
Imóvel rural com cadastro obrigatório no CAR (Cadastro Ambiental Rural). É um Dado de Base — existe uma única vez no sistema por `codImovel`, independente de quantas Regiões a contêm. Uma Propriedade pode estar contida em uma ou mais Regiões (relação muitos-para-muitos). Não pertence a nenhuma Organização; é a unidade de análise cruzada com alertas ambientais.
_Avoid_: Imóvel, parcela, lote, fazenda

**Dossiê**:
Visão consolidada de uma Propriedade: alertas de desmatamento, focos de calor, avistamentos de fauna e Acões cujos pontos interceptam espacialmente o polígono da Propriedade. Não é uma entidade persistida — é montado por consulta espacial.
_Avoid_: Relatório, ficha, laudo

### Camadas

**Camada**:
Conjunto de dados geoespaciais (pontos, linhas ou polígonos) com definição de schema e configuração visual, exibido no mapa. Pode ser de escopo global (visível para todas as Organizações, criada apenas pelo Superadmin) ou de escopo de Organização (criada e gerenciada pela própria Org).
_Avoid_: Layer (em documentação de domínio), shapefile

**Camada Global**:
Camada disponível para todas as Organizações. Criação restrita ao Superadmin. Exemplos: APPs (Áreas de Preservação Permanente), limites municipais, rios.
_Avoid_: Camada pública, camada base

**Camada de Organização**:
Camada criada e gerenciada por uma Organização específica, visível apenas aos seus usuários. Exemplos: estações meteorológicas, postos de fiscalização, pontos de monitoramento hídrico.
_Avoid_: Camada privada, camada tenant

### Notificações

**Notificação**:
Email automático disparado quando uma nova Detecção (Foco de Calor via FIRMS ou Detecção de Desmatamento via MapBiomas) é identificada dentro de uma Região. Enviado aos Destinatários cadastrados naquela Região. Implementado via Supabase Functions.
_Avoid_: Alerta (ambíguo com Detecção de Desmatamento), aviso

**Relatório Semanal**:
Resumo periódico consolidado das Detecções e atividades de uma Região, enviado por email aos Destinatários que optaram por recebê-lo.
_Avoid_: Boletim, sumário

**Destinatário**:
Email cadastrado para receber Notificações e/ou Relatórios Semanais de uma Região específica. Não precisa ser um usuário do Prisma. Configurado por Editor ou acima.
_Avoid_: Contato, usuário notificado, assinante

### Alertas ambientais

**Foco de Calor**:
Detecção de calor via satélite (fonte: FIRMS/NASA). Ponto com coordenadas, brilho, confiança e timestamp de aquisição. Associado a uma Propriedade via `codImovel`. É um Dado de Base — existe uma única vez no sistema por ponto/data/hora, independente de quantas Regiões o contêm. Não pertence a nenhuma Organização; a associação com Regiões (e indiretamente com Organizações) é feita via junction table.
_Avoid_: Incêndio, foco de incêndio, hotspot

**Detecção de Desmatamento**:
Polígono de supressão vegetal detectado via satélite (fonte: MapBiomas). Contém área em hectares, fonte e ano de detecção. Quando identificada dentro de uma Região, dispara uma Notificação para os Destinatários. É um Dado de Base — existe uma única vez no sistema por alertid, independente de quantas Regiões o contêm.
_Avoid_: Alerta de desmatamento (ambíguo com Notificação), desmate, corte raso, supressão

### Papéis de acesso

**Superadmin**:
Papel de escopo global — vê e opera todas as Organizações e todos os dados do sistema. Não está vinculado a nenhuma Organização específica. Atualmente restrito à equipe técnica, mas pode ser concedido a outros no futuro.
_Avoid_: Admin (ambíguo), root

**Owner**:
Papel de escopo de Organização com controle total sobre ela. Pode fazer qualquer operação dentro das Regiões do tenant — criar e gerenciar Camadas de Organização, registrar Ações, adicionar Anotações a dados de base — com duas exceções: não altera a geometria de uma Região (responsabilidade do Superadmin) e não edita dados de tabelas de base imutáveis (Propriedades, Detecções de Desmatamento, Focos de Calor). Gerencia todos os usuários da Org, incluindo criar outros Owners.
_Avoid_: Admin (quando se refere ao dono da Org)

**Editor**:
Papel de escopo de Organização. Cria e edita Acões, sobe arquivos de campo e pode fazer Importações de dados externos. Não gerencia usuários.
_Avoid_: Operador

**Viewer**:
Papel de escopo de Organização. Somente visualização do mapa e dados da Org.
_Avoid_: Leitor

**Auditor**:
Papel de escopo de Organização. Visualização do mapa mais acesso ao histórico de logs, para fins de conformidade e auditoria.
_Avoid_: Fiscal (conflita com Fiscalização)

### Administração

**Dado de Base**:
Entidade que representa um fato físico do mundo real — Propriedade, Foco de Calor, Detecção de Desmatamento. Existe uma única vez no sistema por sua chave natural (codImovel, lat/lon/data/hora, alertid), independente de quantas Regiões ou Organizações a referenciam. Não tem `tenant_id`. A associação com Regiões é feita via junction tables.
_Avoid_: Dado global (ambíguo com Camada Global), dado compartilhado

**Importação**:
Ato exclusivo do Superadmin que vincula Dados de Base a uma Região: geometria da Região, Propriedades, Focos de Calor e Detecções de Desmatamento. Esses dados chegam de fontes externas (FIRMS, MapBiomas, SIGEF/CAR) e são processados antes da inserção. Owner não faz Importação de Dados de Base — apenas adiciona Camadas de Organização e Anotações.
_Avoid_: Commit (termo de implementação), upload, sincronização

**Anotação**:
Informação complementar adicionada por um Owner ou Editor a um item existente (Foco de Calor, Detecção de Desmatamento ou Propriedade) — como fotos ou texto descritivo. Não altera os dados primários do item, apenas enriquece sua visualização.
_Avoid_: Edição, atualização do dado

### Monitoramento ambiental

**Estação de Monitoramento**:
Ponto geográfico fixo instalado e gerenciado por uma Organização, que coleta séries temporais de Leituras ambientais (nível d'água, turbidez, temperatura, pluviometria, etc.) com schema de métricas customizável. É um Dado de Organização — pertence a um único tenant, não é compartilhada. Leituras podem ser inseridas manualmente ou sincronizadas via Planilha.
_Avoid_: Sensor, medidor, estação meteorológica (quando não é especificamente meteorológica)

**Estação Meteorológica Pública**:
Ponto geográfico fixo de redes meteorológicas públicas (ex: Wunderground, INMET). É um Dado de Base — existe independente de qualquer Organização e pode ser visível em múltiplas Regiões. Escopo futuro: ainda não implementado como entidade separada no sistema.
_Avoid_: Estação de Monitoramento (quando se trata de rede pública)

**Leitura**:
Registro individual de uma medição em uma Estação de Monitoramento em um dado momento. Contém os valores das métricas configuradas para aquela estação e o timestamp de coleta.
_Avoid_: Medição, amostra, dado

**Sincronização de Planilha**:
Operação que busca Leituras de uma fonte externa (Google Sheets) e as insere na base via upsert, usando a data como chave de deduplicação. A planilha é a fonte de verdade — se um valor foi corrigido na planilha, a sincronização o atualiza no banco. Distinto de Importação (que é exclusiva do Superadmin para dados de base como Propriedades e Detecções). A Sincronização de Planilha é executada por Editor ou acima.
_Avoid_: Importação (quando se refere a Leituras de planilha), sync, pull

### Fauna

**Avistamento**:
Registro geoespacial pontual de observação de uma espécie de fauna em campo. Contém espécie, tipo de observação, notas e geometria de ponto. A espécie prioritária atual é o Javali (Sus scrofa), mas o conceito é genérico e suporta outras espécies.
_Avoid_: Ocorrência (conflita com uso em Acões), detecção

**Javali**:
Espécie invasora Sus scrofa. Primeira e atualmente principal espécie monitorada via Avistamentos no Prisma. Impacto ambiental e econômico no Pantanal.
_Avoid_: Porco-do-mato, suíno feroz

### Operações de campo

**Ação**:
Registro geoespacial pontual de uma atividade de campo dentro de uma Região. Possui tipo, status, timestamp e geometria de ponto. Vinculada a uma Propriedade exclusivamente por interseção espacial — não por chave estrangeira. Os tipos iniciais são: Fiscalização, Recuperação, Incidente, Monitoramento, Infraestrutura. Não são tipos fixos e rígidos — são os disponíveis no momento inicial.
_Avoid_: Evento, ocorrência, operação, incidente (como termo genérico)

**Fiscalização**:
Tipo de Ação com poder coercitivo — pode resultar em auto de infração, embargo ou multa. Distingue-se de Monitoramento pela capacidade de intervenção legal.
_Avoid_: Vistoria, inspeção

**Monitoramento**:
Tipo de Ação de observação sem intervenção. Registra condições de campo sem exercer poder coercitivo.
_Avoid_: Fiscalização (quando não há poder coercitivo)

## Example dialogue

> **Dev:** Preciso listar todas as Acões de uma Propriedade.
> **Domínio:** Busca as Acões cujo ponto está dentro do polígono da Propriedade — não tem FK direta, é interseção espacial.

> **Dev:** Uma Propriedade pertence a qual Região?
> **Domínio:** Pode pertencer a várias. Uma fazenda grande pode cruzar duas Regiões. A Importação cria a associação, mas a Propriedade é única no sistema pelo `codImovel`.

> **Dev:** Tem diferença entre Foco de Calor e Detecção de Desmatamento?
> **Domínio:** Sim. Foco de Calor é um ponto (calor detectado pelo satélite FIRMS), Detecção de Desmatamento é um polígono (área de supressão vegetal detectada pelo MapBiomas). Ambos disparam Notificações para os Destinatários da Região.

> **Dev:** Um Superadmin pode ver os dados de qualquer Organização?
> **Domínio:** Sim. O Superadmin é o único papel sem escopo de Organização — vê e opera tudo. Owner e abaixo só veem sua própria Org.

> **Dev:** Qual a diferença entre Fiscalização e Monitoramento?
> **Domínio:** Fiscalização tem poder coercitivo — pode resultar em embargo ou multa. Monitoramento é só observação, sem intervenção legal. Ambos são tipos de Ação.
