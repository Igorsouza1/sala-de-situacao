# Acesso de usuários no PRISMA

Este guia resume o comportamento implementado nas rotas e consultas atuais. O acesso efetivo depende da rota usada; consulte as limitações no fim.

## Papéis

| Papel | Acesso implementado |
| --- | --- |
| **Superadmin** | Papel global, verificado em `app_metadata.is_superadmin`. Pode atravessar organizações nas rotas que aceitam esse papel. Algumas operações, como gestão de organizações e importações, são exclusivas dele. |
| **Owner** | Maior papel da organização. Passa pelas verificações de nível `editor` e tem acesso a todas as regiões da organização nas consultas que usam o escopo de regiões. |
| **Editor** | Pode criar ou alterar ações, trilhas, estradas e fotos somente nas regiões em que tem papel Editor. |
| **Viewer** | Papel de leitura nas rotas que verificam papel. |
| **Auditor** | Tem o mesmo nível de leitura do Viewer nas verificações gerais. Acesso específico a auditoria depende de checagens próprias da rota. |

O código não define um papel `admin` no verificador atual. As permissões de Viewer e Auditor não são diferenciadas pela hierarquia geral.

## Organização e regiões

Uma requisição autenticada usa `tenant_id` dos metadados apenas como preferência e confirma o vínculo atual em `monitoramento.roles`. A tabela legada `monitoramento.user_access` não autoriza acesso. Sem papel atual, as rotas que exigem organização negam acesso.

Rotas que aplicam escopo regional limitam resultados às regiões da organização e, quando aplicável, às regiões vinculadas ao usuário. Owner e Superadmin recebem acesso a todas as regiões dentro do escopo que a rota permite. Região pertencente a outra organização só pode ser consultada por Superadmin nas rotas que verificam esse vínculo.

No painel **Admin → Gerir Usuários**, todas as contas de login aparecem, inclusive as que não têm papel atual. **Sem acesso** e **Sem região** ficam em vermelho; o filtro **Precisam de acesso** reúne esses casos. **Conceder acesso** reaproveita o email da conta existente. Owner recebe a organização inteira; Editor, Viewer e Auditor precisam de ao menos uma região atribuída.

## Dados e propriedade

- **Estações legadas** — Balneário Municipal, Deque de Pedras e Ponte do Cure pertencem a uma organização cada. O código compara a organização resolvida do usuário com a organização configurada para a estação. Sem configuração inequívoca, a rota nega acesso. Leitura exige autenticação e escrita exige papel Editor ou superior.
- **Ações, trilhas, waypoints e estradas** — Leituras exigem a organização e as regiões atribuídas. Uma ação de outra região não aparece no mapa, listagem, dossiê ou impressão. Escrita exige Editor naquela região, Owner da organização ou Superadmin; o tenant e a região são derivados da sessão e do vínculo verificado.
- **Focos de calor (FIRMS) e detecções de desmatamento** — São dados de base compartilhados, sem isolamento por `tenant_id` do registro. A leitura das rotas ambientais usa as associações entre detecção e Região, e limita a consulta às regiões da organização e às regiões acessíveis ao usuário. Uma detecção não fica automaticamente visível para toda organização: precisa estar associada a uma de suas regiões.
- **Propriedades** — No mapa, na contagem e no dossiê, uma propriedade é elegível quando sua geometria cruza (`ST_Intersects`) uma Região permitida. Ações, focos e desmatamento exibidos no dossiê também seguem a organização e as regiões da consulta. Só Superadmin pode alterar o nome global de uma propriedade.

## Limitações conhecidas do comportamento atual

- O nível de papel é verificado por rota. Várias rotas de leitura exigem sessão e organização resolvida, mas não chamam `requireRole`; portanto não se deve interpretar a tabela de papéis como uma matriz uniforme aplicada automaticamente a toda a aplicação.
- O resolvedor de organização escolhe um único tenant para a requisição. Se a conta tiver vínculos em várias organizações, não há seletor geral implementado nesse resolvedor; a escolha parte dos metadados e, na ausência deles, do primeiro vínculo retornado.
- Para usuários que não são Owner nem Superadmin, as consultas regionais usam os vínculos com `region_id` preenchido. Um vínculo com `region_id = NULL` não é tratado uniformemente como “todas as regiões”.
- A importação manual de propriedades ainda conserva `tenant_id`/`regiao_id` legados no registro físico. As consultas citadas acima usam interseção espacial; a canonização da importação e uma tabela de associações próprias para propriedades ainda estão pendentes.
- O escopo das estações é por organização, não por região individual.
- Contas antigas que possuam apenas `user_access`, sem registro migrado em `roles`, precisam receber um papel atual pelo administrador para voltar a acessar. Linhas legadas residuais não restauram acesso; sua limpeza da base ainda pode ser auditada separadamente.

## Referências no código

`lib/api/require-auth.ts`, `lib/api/require-region.ts`, `lib/api/scope.ts`, `lib/api/station-access.ts`, `lib/api/environmental-read-scope.ts`, `lib/repositories/acoesRepository.ts`, `lib/repositories/firmsRepository.ts`, `lib/repositories/desmatamentoReposiroty.ts` e `lib/repositories/propriedadesRepository.ts`.
