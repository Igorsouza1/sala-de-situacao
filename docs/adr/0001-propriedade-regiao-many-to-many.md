# Propriedade compartilhada entre múltiplas Regiões

Uma Propriedade (identificada pelo `codImovel` do CAR) é uma entidade única no sistema e pode ser associada a mais de uma Região via relação muitos-para-muitos. Escolhemos essa abordagem em vez de duplicar o polígono por Região para economizar armazenamento e garantir consistência — atualizar o nome ou geometria de uma Propriedade propaga para todas as Regiões que a contêm.

## Considered Options

- **Propriedade única, muitos-para-muitos com Região** (escolhido): join table `propriedades_regioes`; a Propriedade existe uma vez, referenciada por várias Regiões.
- **Propriedade duplicada por Região**: cada Região tem sua própria cópia do polígono; mais simples de queries isoladas, mas gera drift de dados e armazenamento redundante.
