# Editor e Owner editam campos descritivos de Ações e Propriedades no Explorar

O painel Explorar ganha o botão **Editar** para Editor (da Região), Owner e Superadmin. Edita-se apenas o que descreve o registro: na Ação, nome, situação, tipo e descrição; na Propriedade, nome, titular e município. Geometria nunca se edita aqui.

Isto muda duas regras anteriores, por decisão do produto:

- **Propriedade deixa de ser imutável para Owner/Editor** (CONTEXT.md, Owner). A edição grava no Dado de Base (ADR 0008), sem `tenant_id`: **vale para todas as Organizações que enxergam aquela Propriedade**. A tela avisa isso no rodapé do formulário e no aviso de "Salvamos…".
- **O número do CAR (chave natural) continua só do Superadmin**; a rota recusa com 403 para os demais papéis, mesmo que a tela seja contornada.

A autorização é por Região: `resolveScope` + `requireWriteRegion` (Owner, ou Editor daquela Região); o registro precisa estar na Região (Ação: também no tenant). Viewer e Auditor não veem o botão e a rota nega. Rota: `PATCH /api/map/consulta`.

## Considered Options

- **Só Ações para Editor/Owner; Propriedade só Superadmin**: preserva o ADR 0008, mas não atende ao pedido de corrigir dados de Propriedade no dia a dia.
- **Sobreposição por Organização** (valor próprio da Org sobre o global): mais correto para multi-tenant, mas exige tabela nova; fica como evolução se uma edição de uma Org atrapalhar outra.
- **Campos não-chave para todos, CAR só Superadmin** (escolhido).

## Consequências

Uma Organização pode alterar o nome que outra vê. Sem histórico de quem editou (o log de auditoria não cobre este caminho ainda).
