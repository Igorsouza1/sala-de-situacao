# Acões vinculadas a Propriedades por interseção espacial, não por FK

Uma Ação não possui chave estrangeira para Propriedade. O Dossiê de uma Propriedade é montado consultando quais Acões (pontos) intersectam espacialmente o polígono da Propriedade. Escolhemos essa abordagem porque uma Ação pertence primariamente a uma Região (tem `regiao_id`), e uma Propriedade pode estar em múltiplas Regiões — forçar uma FK para Propriedade criaria ambiguidade de escopo e duplicação de registros.
