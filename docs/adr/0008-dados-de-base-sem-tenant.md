# Dados de Base não têm tenant_id — acesso via regiao_id

Propriedades, Focos de Calor e Detecções de Desmatamento são fatos físicos do mundo real. Existem uma única vez no sistema por sua chave natural, independente de quantas Organizações os monitoram. Não têm `tenant_id`. A associação com Organizações é derivada indiretamente: Dado de Base → junction table → Região → `regioes.tenant_id` → Organização.

Queries de exibição filtram por `regiao_id` (Opção A), não por `tenant_id`.

## Considered Options

- **Dado de Base universal + junction table por regiao_id** (escolhido): um único registro por fato físico; junction table (`firms_regioes`, `propriedades_regioes`, `desmatamento_regioes`) associa o dado às Regiões que o contêm. Queries filtram por `regiao_id`. Resultado: sem duplicação de dados, duas Organizações com Regiões sobrepostas veem o mesmo registro.

- **Dado duplicado por tenant** (situação anterior): cada tenant tinha sua cópia do dado (`tenant_id` direto na tabela). Simples de queries isoladas, mas: (a) duplica armazenamento para áreas monitoradas por múltiplos tenants; (b) viola a unicidade do fato físico — o mesmo incêndio existia como dois registros distintos; (c) impossibilita deduplificação histórica confiável.

- **Dado filtrado por tenant via join em `regioes`** (Opção B, descartado): manteria `tenant_id` removido mas filtraria via `EXISTS (SELECT 1 FROM firms_regioes fr JOIN regioes r ON r.id = fr.regiao_id WHERE r.tenant_id = ?)`. Query mais pesada e não alinha com o contexto do usuário no mapa, que sempre opera em uma Região específica — não em um tenant genérico.

## Escopo

Entidades cobertas por esta decisão: `raw_firms`, `propriedades`, `desmatamento`.

Entidades fora deste escopo (têm `tenant_id` legitimamente): `acoes`, `camadas de organização`, `avistamentos`, `estações de monitoramento`, `trilhas`.

Estações Meteorológicas Públicas (ex: Wunderground) serão Dados de Base quando implementadas, mas estão fora do escopo atual.
