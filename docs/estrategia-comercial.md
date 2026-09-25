# Estratégia Comercial — PRISMA (setembro 2026)

Documento gerado a partir de sessão de pesquisa de mercado e alinhamento estratégico (2026-09-24).
Registra **o raciocínio, as evidências e as decisões** tomadas como um caminho possível para o
PRISMA gerar receita em 30 dias. Não é um plano aprovado em definitivo — é a hipótese mais bem
fundamentada até aqui, com critérios explícitos para seguir ou pivotar.

> Complementa `docs/decisoes-produto.md` (jun/2026), que descreve o PRISMA como gestão de áreas
> ambientais para IHP / Secretaria. Este documento parte da constatação de que esse uso **não
> encontrou tração** e propõe reposicionar o motor técnico para um problema com prazo e dinheiro.

---

## 1. Ponto de partida (honesto)

- A ideia original era vender para **município**. Descartado: venda lenta, licitação, política.
- O PRISMA funciona e tem usuários, mas **o IHP — dono das duas Regiões em produção (Serra do
  Amolar; Bonito e Rio da Prata) — praticamente não usa**. A "Sala de Situação" como produto não
  tem product-market fit comprovado.
- Objetivo: **gerar receita em 30 dias**, com um cliente específico, não "para todo mundo".

### O que o PRISMA tem de reaproveitável (o motor)

- PostGIS + ingestão de Dados de Base (FIRMS, MapBiomas) via Edge Functions (ADRs 0009, 0011)
- Cruzamento espacial com Propriedades CAR (ADR 0001) e dossiê por Propriedade
- Ações de campo geolocalizadas com fotos, vinculadas por interseção (ADR 0002)
- Multi-tenant: Organização → Regiões → usuários com papéis (ADRs 0003, 0007, 0010)
- Notificação por email por Região (Resend)

**Decisão:** parar de vender "o PRISMA" e vender a **solução de um problema**, com o PRISMA como motor.

---

## 2. Ideias descartadas (e por quê)

| Ideia | Por que caiu |
|---|---|
| **Alerta de fogo por email/WhatsApp** para fazendeiro | NASA FIRMS e INPE Queimadas já enviam alerta **grátis** para qualquer polígono. Não há por que pagar. |
| **Laudo avulso de due diligence por CAR** | Commodity: Sentinela Rural (R$ 39/laudo), Dados Fazenda (R$ 59,90–99,90/mês), Registro Rural (R$ 149,90/mês), plataforma Agro Brasil+Sustentável do MAPA (grátis). Guerra de preço contra quem já integra dezenas de bases. |
| **Vender a Sala de Situação para ONGs** | Ciclo depende de edital; o próprio usuário atual (IHP) não usa. Insistir seria empurrar produto sem tração. |
| **Algoritmo próprio de detecção de desmatamento** | Banco usa PRODES, não algoritmo de terceiros; DETER/MapBiomas já fazem com validação humana, grátis; Pantanal (cheia/seca/fogo) gera falso positivo em massa para detector caseiro. |
| **Crédito de carbono / água / biodiversidade** | Mercado distinto (desenvolvedoras, certificadoras), lento, poucos compradores. Não é o mesmo cliente e não cabe em 30 dias. |

---

## 3. As duas dores reais encontradas (regulação com prazo)

### 3.1 PRODES no crédito rural

- **Res. CMN 5.268/2025** (vigente desde 01/04/2026) e **Res. CMN 5.303/2026** (escalonamento):
  o banco deve verificar supressão de vegetação nativa **após 31/07/2019** no imóvel, usando a
  lista do MMA derivada do PRODES/INPE, antes de liberar crédito rural.
- Prazos por tamanho do imóvel:
  - **> 15 módulos fiscais: 04/01/2027**
  - 4 a 15 módulos: 01/07/2027
  - ≤ 4 módulos: jan/2028
- Documentos que destravam: ASV, UAS, TAC, Termo de Compromisso Ambiental, **laudo técnico de
  sensoriamento remoto** (com ART). Contestação de polígono: canal Biomas BR do INPE.
- PRODES não distingue legal de ilegal e tem falso positivo; a CNA alerta que vai travar produtor regular.
- Cobre **os 6 biomas**, incluindo Pantanal (limite > 5 ha em Cerrado/Pantanal).

### 3.2 COMIF 3/2025 — prevenção de incêndio obrigatória

- Proprietário rural passa a ter obrigação de prevenção e preparação: aceiros, treinamento,
  equipamentos, comunicação com vizinhos/brigadas, **adesão a sistema de monitoramento**; médias e
  grandes também mapa de risco e vigilância de áreas críticas.
- Adequação até **08/09/2027**. Multa por uso irregular de fogo: **R$ 3.000/ha**.
- Em auto de infração, se o fiscal afirma que não havia foco no vizinho, **cabe ao produtor provar
  que o fogo veio de fora** → valor de uma linha do tempo de focos + registro de prevenção.

---

## 4. A lista do MMA (dado central)

O MMA publica a lista que os bancos consultam — **pública**, atualizada a cada ~15 dias (CAR) e a
cada atualização do INPE (PRODES):

- Página: https://www.gov.br/mma/pt-br/assuntos/controle-ao-desmatamento-queimadas-e-ordenamento-ambiental-territorial/controle-do-desmatamento-1/atendimento-ao-manual-de-credito-rural
- CSV: `car_lista_mcr_acima4mf_toleranc.zip` (na mesma página; o arquivo interno traz a data no nome, `DDMMAAAA`)
- Base espacial (SharePoint do MMA) e painel interativo por CAR
- Nota explicativa (metodologia e dicionário de dados): `NotaExplicativaManualdeCreditoRural_27_03.pdf`

### Semântica dos campos (confirmada na nota explicativa)

| Campo | Significado |
|---|---|
| `julg_status` | **Só o status do CAR.** "Com restrição" = CAR cancelado/suspenso (crédito impedido de qualquer forma). "Sem restrição" = CAR ativo/pendente. **Não** diz nada sobre o desmatamento. |
| `dentro_criterio` | "Não" = desmatamento **acima** do limite do bioma → item 17 do MCR se aplica. |
| `sobrep_prodes_[ANO]` | Hectares de sobreposição PRODES naquele ano. |
| `soma_desmat` | Soma de sobreposição após 31/07/2019 (ha). |
| `resultados` | Texto consolidado dos impedimentos. |

**Importante:** o MMA faz uma "simples interseção" PRODES × CAR. A lista **não sabe** quem já tem
ASV/TAC — quem tem documento continua na lista e apresenta o papel ao banco. Quem contestou no INPE
e ganhou **sai** da lista. O próprio MMA declara que a sobreposição "não configura presunção de
ilegalidade".

### Números da lista de 21/09/2026

| Recorte | Imóveis | > 15 MF | Sobreposição somada |
|---|---|---|---|
| Brasil | 106.024 | — | — |
| MS | 3.291 | 1.972 | 590.878 ha |
| **Corumbá** | **513** | **401** | **237.840 ha** |

Corumbá é o **município nº 1 do MS** na lista (seguido de Aquidauana 218, Porto Murtinho 213,
Bonito 121). 500 dos 513 imóveis são bioma Pantanal; mediana de área dos imóveis: 3.819 ha.
Módulo fiscal de Corumbá ≥ 100 ha → a maioria das fazendas do Pantanal está na janela de janeiro/2027.

Detalhe de Corumbá:

| Grupo | Imóveis | Leitura |
|---|---|---|
| CAR cancelado ("Com restrição") | 16 | Problema distinto: regularizar CAR |
| CAR ativo/pendente, > 15 MF | 390 | Banco exige documento a partir de 04/01/2027 |
| CAR ativo/pendente, 4–15 MF | 107 | A partir de 01/07/2027 |

Entre os 390: 136 com 5–50 ha de sobreposição, 133 com 50–500 ha, 121 com > 500 ha; mediana de
2,9% da área do imóvel; 60 aparecem **só** por supressão de 2024/2025.

**Hipótese (não confirmada):** o volume de sobreposição no Pantanal sugere falso positivo em massa
(cheia, fogo, pastagem nativa) → contestação seria serviço relevante.

**Como falar com o cliente:** nunca "513 fazendas vão ter crédito negado". Sim: "390 imóveis grandes
de Corumbá estão na lista que o banco começa a checar em janeiro; cada um vai precisar apresentar
ASV, TAC ou laudo".

---

## 5. Concorrência (o espaço NÃO está vazio)

| Lado | Quem | O que faz |
|---|---|---|
| Banco / trading / cooperativa | Agrotools Credit, DataSafra (Geoambiente), Serasa | Compliance automático de carteira de crédito |
| Produtor / consultor / advogado | SpectraX | "Analise sua propriedade com os mesmos dados do banco"; laudo auditável |
| | Sentinela Rural (Mariotti, só MT) | Laudo automático R$ 39; planos R$ 99–400/mês; ART sob demanda |
| | Dados Fazenda, Registro Rural | Consulta por CAR com PRODES/embargos |
| | Consultorias (Mariotti, Topographia etc.) | Laudo e contestação com ART |
| Federações | Famato (MT) | Orienta produtor a consultar PRODES e dá apoio técnico |
| Fogo (hardware) | umgrauemeio / Pantera | Torres com câmera + IA, contrato por hectare, 30–60 meses |

**Por que a Agrotools não foca no produtor:** ela olha pelo lado de quem tem dinheiro (banco).
Lado do produtor é fragmentado, ticket baixo, custo de aquisição alto, e laudo exige ART (serviço,
não software). Por isso está sendo ocupado por empresas pequenas e consultorias.

**Conclusão:** tecnologia **não é fosso** — a varredura básica é cruzar uma lista de CARs com o CSV
do MMA (cabe numa planilha). Diferenciais possíveis, a validar:

1. **Distribuição local** — IHP em Corumbá, acesso ao Sindicato Rural de Corumbá. O ativo mais valioso.
2. **Especialidade Pantanal** — pulso de inundação/fogo gera falso positivo; contestação exige conhecimento local.
3. **Fogo + COMIF + PRODES para a carteira de um sindicato** — não encontramos ninguém vendendo isso
   para sindicato (não encontrar ≠ não existir).

Se nenhum dos três se confirmar em campo: **não entrar** (seria competir só por preço).

---

## 6. Quem é o cliente

**Quem sente a dor é sempre a fazenda.** Sindicato, consultor e banco apenas monetizam essa dor.
Por isso a unidade de valor é o **imóvel monitorado**, não o contrato.

Vender via intermediário não reduz o ticket se o preço for **por imóvel**: 1 sindicato com 40
associados × R$ 50/imóvel/mês = mesma receita de 40 vendas diretas, com 1 negociação. Risco real é
**concentração**, resolvido com múltiplos canais.

| Segmento | Dor | Nº no MS | Ticket | Ciclo | 30 dias? |
|---|---|---|---|---|---|
| Fazendeiro (> 15 MF) | Crédito, multa, laudo | milhares (~75 mil CAR no MS) | baixo–médio | curto se conhecer | ❌ como canal principal |
| **Sindicato rural** | Benefício real ao associado | 69 (Famasul) | médio, por imóvel | semanas | ✅ **Corumbá é a porta** |
| **Consultor / projetista de crédito rural** | Mais serviço vendido, laudo mais rápido | centenas | médio | curto | ✅ |
| ONG / rede de conservação | Monitorar território, prestar contas | dezenas | por projeto | editais | ⚠️ outro produto |
| Cooperativa de crédito / revenda / trading | Risco da carteira | poucos | alto | 6–12 meses | ❌ depois |

Obs.: "projetista de crédito" = quem elabora projeto de financiamento bancário (custeio,
investimento, Pronaf). Não inclui crédito de carbono/água/biodiversidade.

### Decisão: um motor, duas prateleiras

1. **Conformidade da Fazenda** (PRODES + DETER + fogo + laudo) — cobrança **por imóvel**, em duas camadas:
   - sindicato/consultor paga o **monitoramento da carteira** (recorrente, baixo por imóvel);
   - fazendeiro sinalizado paga **laudo/prova** (avulso, mais alto), via consultor com ART.
   - O sindicato abre a porta; cada associado na lista vira venda adicional.
2. **Sala de Situação** (ONGs/territórios) — produto atual, vendido por projeto. **Fora do foco dos 30 dias.**

---

## 7. A oferta (hipóteses de preço, a validar)

- **Isca grátis — Varredura de Carteira:** o cliente envia a lista de CARs; em 48h recebe quem está
  na lista do MMA, com alerta DETER/MapBiomas recente, embargo ou histórico de fogo.
- Planos para consultor: R$ 197/mês (até 20 imóveis, 5 laudos) · R$ 397/mês (até 80 imóveis, 25 laudos) · laudo avulso R$ 49.
  Benchmark: Sentinela Rural R$ 99–400/mês.
- **Oferta fundador:** 5 primeiros a R$ 97/mês travado por 12 meses, pagamento anual no Pix (R$ 970).
- Formatos para o sindicato escolher:
  - (a) sindicato paga e oferece como benefício;
  - (b) sindicato indica, associado paga com desconto, sindicato recebe comissão;
  - (c) sindicato paga a varredura; quem está na lista paga o laudo.
  - Se quer só a varredura grátis e recusa os três → interesse sem orçamento; ir para consultores.
- Cobrança recorrente **sem integrar Stripe**: link de assinatura Asaas / Mercado Pago, ou Pix anual.
- Laudo com ART é responsabilidade do consultor parceiro — o PRISMA entrega análise, não assinatura.

### Por que alguém pagaria se FIRMS/PRODES são grátis

O consultor não paga pelo alerta. Paga porque o PRISMA:
1. diz **qual cliente dele vai travar no banco antes do banco** (gera serviço para ele);
2. entrega o **laudo pré-montado** (PRODES desde 2019, MapBiomas, embargos, focos, Ações, imagens
   Sentinel-2 ano a ano) para ele revisar e assinar;
3. monta a **linha do tempo do fogo** + registro de prevenção (COMIF) como prova.

---

## 8. Dados e infraestrutura

| Dado | Fonte | Frequência | Papel |
|---|---|---|---|
| Lista MMA (PRODES × CAR) | MMA | ~15 dias | **Centro**: o que o banco consulta |
| PRODES Cerrado/Pantanal | INPE TerraBrasilis | anual | detalhe por ano/área |
| DETER Cerrado/Pantanal | INPE | diária | **aviso cedo** do próximo PRODES |
| MapBiomas Alerta | MapBiomas (já integrado) | semanas–meses | confirmação + imagens antes/depois |
| FIRMS | NASA (já integrado, **com bug**) | horas | linha do tempo de fogo |
| Embargos IBAMA | dados abertos | periódica | checagem padrão |
| CAR MS | SICAR | download por município | base de tudo |
| Sentinel-2 | Copernicus Data Space | 5 dias | **evidência** para laudo (não detecção) |

- **Satélite:** Copernicus Data Space / Sentinel Hub — 10.000 Processing Units/mês grátis; recorte e
  renderização no servidor deles. **Evitar Google Earth Engine comercial** (US$ 2.000/mês Professional;
  tier grátis é não comercial).
- **Supabase aguenta com folga:** banco de produção inteiro = 49 MB; 1.819 propriedades = 3 MB
  (~1,7 KB cada). CAR do MS inteiro estimado em 100–200 MB. Imagens vão para **Storage**, não Postgres.
  Processamento pesado **não** roda em Edge Function (limite de CPU) — ela só pede o recorte pronto.

---

## 9. Bug crítico encontrado — FIRMS parado desde 08/07/2025

- `supabase/functions/firms-sync/index.ts` busca `VIIRS_NOAA20_NRT/world/1/${today}` às 06:00 UTC.
  A API FIRMS retorna só o dia `DATE` em diante → às 06:00 UTC o dia mal começou; a passagem da
  tarde (~17h UTC no MS) do dia anterior **nunca** é buscada.
- Evidência em produção: `raw_firms` sem focos novos desde **2025-07-08**; log de 2026-09-24:
  `fetched: 1312, candidates: 0, inserted: 0`. O cron aparece como "succeeded" porque só registra o
  `net.http_post`.
- Correção proposta: buscar a data de ontem com `DAY_RANGE=2`; incluir `VIIRS_SNPP_NRT` e
  `VIIRS_NOAA21_NRT`; rodar a cada 1–3 h (upsert já deduplica); backfill histórico desde 2019.

---

## 10. Plano de 30 dias

### Antes de codar: validar sem código

1. Filtrar o CSV do MMA para Corumbá → já feito (seção 4).
2. Criar conta em SpectraX, Dados Fazenda e Sentinela; rodar um CAR de Corumbá; ver onde falham no Pantanal.
3. Reunião com o **Sindicato Rural de Corumbá** levando os números. Perguntas:
   - Dos associados, quantos sabem que estão na lista e quantos têm ASV/TAC em mãos?
   - O que usam hoje? A Famasul oferece algo? (risco: federação dar de graça)
   - Quantos associados > 15 módulos? Têm técnico próprio ou indicam consultores?
   - Qual formato de cobrança (a/b/c) faz sentido?
   - "Me passa a lista de CARs dos associados que devolvo em 48h quem está na lista."
4. 10–15 entrevistas com consultores/projetistas no MS (Mom Test — perguntar sobre o passado, não apresentar o produto):
   - Quantos clientes tiveram problema com PRODES no último ano? Conte o último caso.
   - Descobriu antes ou depois do banco?
   - Quanto tempo leva e quanto cobra por laudo/contestação?
   - Algum cliente levou multa por fogo? Como foi a defesa?
   - Que ferramenta usa hoje, quanto paga?
   - "Se eu rodar grátis a varredura da sua carteira, você me manda os CARs?"

### Critérios de decisão

- **Segue:** ≥ 4 de 10 relatam caso recente, cobram por esse serviço e enviam CARs; ou o sindicato topa um dos formatos.
- **Pivota:** maioria diz "uso Sentinela/Dados Fazenda e resolve", ou a Famasul já oferece grátis →
  alternativa: laudo automático MS-first para corretores de imóveis rurais (mesmo motor, outro comprador).

### Cronograma

| Semana | Negócio | Código |
|---|---|---|
| 1 | Lista de 40 contatos; entrevistas; reunião sindicato | Consertar `firms-sync` + backfill; Edge Function `prodes-sync`/importação da lista MMA (molde `mapbiomas-sync`) |
| 2 | 5 varreduras grátis apresentadas em call | Varredura em lote (lista de CARs → planilha de riscos); importar CAR do MS e embargos IBAMA |
| 3 | Oferta fundador; **meta: 3 pagantes** | Laudo v2: `findPropriedadeDossieData` (`lib/repositories/propriedadesRepository.ts`) + `propriedade-dossie-template.tsx` com PRODES por ano, timeline de fogo, Ações de prevenção, recortes Sentinel-2. Consultor/sindicato = Organização; fazenda = Região/Propriedade |
| 4 | Onboarding, cobrança, decisão seguir/pivotar | Estilo de mapa **só no modo laudo/impressão** (satélite, legenda limpa) |

**Meta honesta:** 3 clientes pagantes (R$ 1–3 mil em caixa com plano anual fundador) e confirmação
de qual dor paga (PRODES ou fogo). O valor importa menos que provar que alguém específico paga.

---

## 11. Riscos

- Prazo do PRODES **já foi adiado uma vez** (5.268 → 5.303) e pode ser de novo; COMIF sustenta o plano nesse caso.
- Famasul/CNA podem oferecer checagem gratuita aos sindicatos.
- Laudo com ART depende de parceiro engenheiro — o PRISMA não assina.
- PRODES é anual: varredura mostra risco histórico, não desmatamento em tempo real (para isso, DETER).
- Proporção dos 390 de Corumbá que **já tem ASV/TAC** é desconhecida — pode reduzir muito o mercado real.
- Preço de laudo com ART não foi encontrado publicamente — maior incerteza de precificação.

---

## 12. Fontes

- MMA — Atendimento ao Manual de Crédito Rural (lista, CSV, painel, nota explicativa): link na seção 4
- INPE — Nova norma do CMN incorpora dados do Prodes: https://www.gov.br/inpe/pt-br/assuntos/ultimas-noticias/nova-norma-do-cmn-incorpora-dados-do-prodes-na-analise-de-credito-rural
- CNA — Acesso ao crédito rural por restrição PRODES: https://cnabrasil.org.br/publicacoes/acesso-ao-credito-rural-por-restricao-prodes
- Famato — Res. 5.303 amplia prazos: https://sistemafamato.org.br/blog/2026/05/13/nova-resolucao-amplia-prazo-para-exigencias-ambientais-no-credito-rural-em-mato-grosso/
- COMIF 3/2025 — FAEMG: https://www.faemg.org.br/noticias/novas-regras-para-prevencao-de-incendios ; IAMAT: https://iamat.org.br/da-reacao-a-prevencao-novos-deveres-legais-do-produtor-rural-em-caso-de-incendios-em-sua-propriedade/
- Jusfazenda — fogo vindo do vizinho: https://jusfazenda.com.br/queimadas-fogo-em-propriedade-vizinha-o-que-fazer-para-proteger-a-minha-fazenda/
- NASA FIRMS Alerts (grátis): https://firms.modaps.eosdis.nasa.gov/alerts/
- FIRMS Area API: https://firms.modaps.eosdis.nasa.gov/api/area/
- Sentinela Rural: https://sentinelarural.mariottiregen.com.br/
- Dados Fazenda: https://dadosfazenda.com.br/
- Registro Rural: https://www.registrorural.com.br/
- Agro Brasil+Sustentável (MAPA): https://agrobrasil.agricultura.gov.br/abs/home
- SpectraX (CompreRural): https://www.comprerural.com/satelite-deixa-de-ser-vilao-e-vira-aliado-do-produtor-no-credito-rural-com-prodes/
- Agrotools Rural Financing: https://agrotools.com.br/en/solucoes/rural-financing/
- DataSafra/Geoambiente: https://geoambiente.com.br/datasafra-decisoes-seguras-com-inteligencia-google/
- umgrauemeio (Pantera): https://startupi.com.br/umgrauemeio-desenvolve-solucao-para-incendios/
- DETER (INPE): https://data.inpe.br/biomasbr/deter-monitoramento-diario-da-supressao-e-degradacao-de-vegetacao-nativa/
- Copernicus Data Space / Sentinel Hub: https://dataspace.copernicus.eu/ecosystem/services/sentinel-hub
- Google Earth Engine pricing: https://cloud.google.com/earth-engine/pricing
- Imasul — 75 mil CAR no MS: https://www.imasul.ms.gov.br/governo-adere-a-sistema-federal-e-agiliza-analise-do-car-de-75-mil-propriedades-rurais-em-ms/
- Embrapa — módulos fiscais: https://www.infoteca.cnptia.embrapa.br/bitstream/doc/949260/1/doc146.pdf
