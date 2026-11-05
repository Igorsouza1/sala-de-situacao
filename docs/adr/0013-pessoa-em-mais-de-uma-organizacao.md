# Uma pessoa pode ver Regiões de mais de uma Organização; a Organização segue a Região aberta

Até aqui cada pessoa (não Superadmin) ficava presa a uma Organização: a do `app_metadata.tenant_id`, ou a do primeiro papel. Uma Região de outra Organização dava 403 mesmo para quem tinha papel lá, e o menu "Regiões" só listava as da Organização resolvida. Com Bonito (Instituto Homem Pantaneiro) e Serra do Amolar (Rede Amolar) em Organizações diferentes, não havia como dar as duas a uma pessoa.

Decisão:

- **Em `/admin/users`, os papéis que não são owner recebem Regiões de qualquer Organização.** O servidor descobre a Organização de cada Região e cria um papel em cada uma (`grantsFor` em `lib/service/userManagementService.ts`). Owner continua sendo de uma Organização inteira. O modelo de dados não muda: continua um papel por (Organização, pessoa, Região).
- **A Organização da requisição segue a Região aberta.** A página aberta com `?regiao_id=` grava a Região num cookie (`prisma_regiao`, gravado pelo proxy e pelo menu da conta). `resolveTenantIdForUser` prefere a Organização dessa Região, **só se a pessoa tiver papel nela** (o Superadmin tem todas). Depois vêm o `app_metadata` e o primeiro papel, como antes. O cookie é preferência, nunca permissão.
- **Rotas com Região explícita** (`resolveScope`, `requireWriteRegion`) conferem o papel na Organização **dona da Região**, e não na preferida. Sem papel lá, a resposta continua 403 "Região pertence a outra Organização". Com papel, o escopo passa a ser o dessa Organização.
- **O menu "Regiões" junta as Regiões de todas as Organizações da pessoa** (`listAccessibleRegions`). Quando há mais de uma Organização, cada linha diz de qual é.

## Considered Options

- **Um papel por Organização, criado pelo admin à mão, sem mudar o app**: já era possível criar, mas o app ignorava o segundo papel. Não resolve.
- **Trocar a Organização preferida no `app_metadata` ao trocar de Região**: exigiria uma rota de escrita no Auth a cada troca, e o valor fica igual em todas as abas. O cookie tem o mesmo efeito, sem escrita.
- **Toda rota receber a Região**: correto, mas são dezenas de rotas (camada por nome, permissão de edição…). Fica a regra de que, quando há Região, ela vence; o cookie cobre as demais.
- **Cookie com a Região aberta** (escolhido).

## Consequências

- Duas abas abertas em Regiões de Organizações diferentes: as rotas **sem** Região seguem a última Região aberta. As rotas com Região não são afetadas. É raro, e a pior consequência é um 404 numa camada da outra aba até recarregar.
- O ADR 0010 continua valendo: o isolamento é feito na aplicação e a Organização é sempre autorizada pelos papéis atuais. O que muda é que a pessoa pode ter mais de uma Organização autorizada.
