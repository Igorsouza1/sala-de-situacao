# DESIGN.md — GEO PRISMA

Fonte única da identidade visual, de movimento, de som e de linguagem do produto. Substitui qualquer outro documento de design.

> **Princípio 1 — O usuário vem sempre em primeiro lugar.** Quem usa o Prisma não deveria precisar pensar, adivinhar nem esperar sem saber por quê. Ele é informado de cada intenção do sistema (carregando, vazio, erro, sucesso, bloqueado), e tudo o que existe passa por uma pergunta: *dá para ser mais simples, ter menos etapas, ou a interface pensar por ele?*
>
> **Princípio 2 — Nada existe porque "tem que existir".** Existe porque foi pensado, no detalhe, com cuidado, por um motivo que dá para dizer em uma frase.
>
> Uma interface boa de verdade é bonita, responde a quem usa (movimento e som), provoca uma sensação intencional e não obriga ninguém a pensar para entendê-la.

**Quando os princípios entram em conflito, vence esta ordem: o usuário, a clareza, a simplicidade, a beleza, a novidade.** Beleza é obrigatória, mas nunca à custa de o usuário entender ou ser informado (seção 2).

Este documento vale para **toda UI que for criada daqui para a frente**. Se algo novo não encaixa aqui, a decisão é registrada aqui, com o motivo, antes de ir para o código.

---

## 1. Como usar este documento

### 1.1 O que fazemos quando uma coisa não funciona

- **Remove-se** o que não tem objetivo claro. Foi assim que saíram a luz que seguia o mouse, o ponto "ao vivo" que pulsava e as texturas.
- **Ajusta-se** o que obriga o usuário a pensar. Foi assim que "média ago/2020–24: 1,55 m" virou "Normal para agosto: 1,55 m".
- **Nunca se deixa** algo "porque já estava lá" ou "porque outros produtos têm".

### 1.2 Checklist obrigatório para qualquer UI nova

Responda antes de construir. Se uma resposta for "não sei", a coisa ainda não está pronta.

| # | Pergunta | Se a resposta for ruim |
|---|---|---|
| 1 | **Usuário primeiro.** Em cada momento, o usuário sabe o que está acontecendo (carregando, vazio, erro, sucesso, bloqueado, desatualizado)? Cada um desses estados tem texto, visual e próximo passo desenhados? | Desenhe o estado que falta (seção 2.1). |
| 2 | **Simplicidade.** Dá para ser mais simples? Faz o usuário pensar? Dá para ter menos etapas? A interface já pensou por ele (padrão certo, próximo passo oferecido)? | Simplifique antes de embelezar (seção 2.2). |
| 3 | **Motivo.** Qual é o objetivo disto, em uma frase? | Não entra. |
| 4 | **Clareza.** Alguém entende sem pensar? Os textos são frases comuns, sem sigla, intervalo ou jargão? | Reescreva. O detalhe técnico vai para um tooltip. |
| 5 | **Sensação.** O que o usuário deve sentir (precisão, calma, segurança, cuidado)? Isso é o que ele sente? | Ajuste forma, cor ou movimento. |
| 6 | **Resposta.** Cada elemento clicável responde (movimento, som, estado)? Existem repouso, hover, pressionado, foco, carregando, sucesso, erro, desabilitado (com o porquê) e vazio? | Complete os estados. |
| 7 | **Movimento.** Há motivo para mover? Só elementos clicáveis se movem (a continuidade da 8.4 é a exceção); nada fica em loop. | Tire o movimento. |
| 7b | **Caminho.** Se algo some, aparece, muda de lugar ou de texto, o usuário vê **para onde foi e de onde veio**? Ou "piscou" e ele ficou sem entender? | Desenhe o caminho (seção 8.4). |
| 8 | **Som.** A interação tem o som certo da seção 9? Ação destrutiva tem som próprio? | Defina o som. |
| 9 | **Acessibilidade.** Contraste mínimo de 4,5:1 para texto, foco visível, uso por teclado, `prefers-reduced-motion`, som desligável, cursor com alternativa? | Corrija antes de entregar. |
| 10 | **Cor.** A cor significa algo? A moldura é neutra e quem tem cor é o conteúdo? | Troque por neutro. |
| 11 | **Registro.** A decisão e o motivo estão neste documento? | Registre. |

---

## 2. O usuário em primeiro lugar

Antes de tela, componente ou animação, vem a pessoa que usa. Duas obrigações decorrem disso: **informá-la de cada coisa que o sistema está fazendo** e **fazer o sistema pensar por ela sempre que possível**.

### 2.1 O usuário sempre sabe o que está acontecendo

Em qualquer momento, quem usa deve saber, sem precisar deduzir, se algo está carregando, vazio, com erro, concluído, bloqueado ou desatualizado. **Um estado sem desenho é uma interface incompleta.** "Não desenhei o erro" nunca é uma entrega aceitável.

| Situação | O usuário precisa saber | Como comunicamos | Exemplo |
|---|---|---|---|
| **Carregando** | que está carregando, o quê e, se demorar, que continua funcionando | Esqueleto com a forma do conteúdo (nunca tela em branco nem círculo solto); o botão muda para "Salvando…"; texto curto se passar de uns 3 s | "Buscando os focos de calor…" |
| **Vazio** | que está vazio, **por quê** e o que fazer | Mensagem + o próximo passo como botão; distinguir "não há dados" de "o filtro escondeu tudo" | "Nenhum foco nos últimos 7 dias. Ver os últimos 30 dias" |
| **Erro** | o que aconteceu, se o que ele fez está seguro e o que fazer agora | Frase simples, sem código técnico na tela; a ação de resolver ao lado; o que ele digitou é preservado | "Não foi possível salvar. O que você preencheu continua aqui. Tentar de novo" |
| **Sucesso** | que deu certo, na hora | Confirmação proporcional: check no botão para o que fica na tela; toast para o que sai dela | "Salvo", com check animado e som de sucesso |
| **Parcial** | o que já está pronto e o que falta | Mostra o que chegou e sinaliza o resto (esqueleto só na parte que falta) | O mapa abre enquanto os focos ainda carregam |
| **Bloqueado** | **por que** não pode agir | Explicação visível (legenda ou tooltip) junto ao controle desabilitado. Botão desabilitado sem explicação é uma pergunta sem resposta | "Disponível depois de escolher uma propriedade" |
| **Sem permissão** | o que falta e com quem falar | Texto claro e o caminho | "Seu perfil não pode remover. Fale com o administrador" |
| **Desatualizado ou sem conexão** | desde quando o dado vale | Hora e fonte à vista | "Dados da NASA · atualizados às 14:32" |
| **Ação destrutiva** | exatamente o que será perdido | Nome do item na confirmação, som próprio (seção 9), desfazer quando for possível | "Remover a Faz. Santa Clara? Os 128 focos registrados também serão apagados" |

Regras:

1. **Cada tipo de interação** (carregar, salvar, filtrar, excluir, importar, exportar, sincronizar, enviar) tem seus estados **desenhados antes do código**: texto, visual, movimento e, onde couber, som.
2. Estados iguais se parecem em toda a plataforma. O usuário aprende uma vez.
3. Nunca deixar o usuário esperando em silêncio: se algo vai demorar, a interface diz.
4. As mensagens falam do que **o usuário** pode fazer, não do que o sistema falhou em fazer.
5. **Toda mudança de estado tem caminho** (seção 8.4): o usuário vê o que saiu, o que entrou e para onde a coisa foi.
6. **Nova tentativa automática: no máximo uma.** Depois da primeira falha, o sistema tenta de novo sozinho uma vez, com a contagem à vista e o botão "Tentar agora" para adiantar. Se falhar de novo, a decisão volta ao usuário, só com "Tentar novamente". Motivo: uma tentativa cobre a queda curta de conexão; insistir sem parar esconde que o problema continua e tira o controle de quem usa.

### 2.1.1 Como cada estado foi resolvido

Avisar não basta: em cada estado, o Prisma usa **o que o sistema já sabe** para adiantar o próximo passo. Foi a lição do teste: a primeira versão tinha só ilustração, título, frase e botão iguais em todos os estados, e ficou "genérica, sem alma, sem intenção". Cada estado tem uma **sensação** que deve provocar e um **motivo** que cabe em uma frase.

| Estado | O usuário deve sentir | O que o Prisma faz além de avisar | Motivo |
|---|---|---|---|
| **Vazio: sem propriedades** | começar é fácil | Pede o **número do CAR**, que o usuário já tem, e traz o contorno. O botão fica bloqueado até colar, com o motivo escrito | Montar tudo do zero é o primeiro obstáculo |
| **Vazio: busca sem resultado** | a culpa não foi minha | Sugere o nome mais parecido ("Tem uma propriedade parecida: Faz. Lagoa Azul. Era essa?") | "Não encontrado" sem sugestão devolve o trabalho ao usuário |
| **Vazio: filtro escondeu tudo** | alívio, com prova | Cita a propriedade mais perto de ficar crítica, com o número | "Nenhuma crítica" é uma conclusão; o usuário quer saber a distância |
| **Vazio: período sem focos** | alívio, com prova | Diz **quando foi o último foco** e quantos dias de calma, com a fonte e a hora | "Boa notícia" sem fato não informa; sem a hora do dado, "nenhum foco" pode ser só dado velho |
| **Erro** | segurança | O que foi preenchido fica guardado e **visível**; uma nova tentativa sozinha, com contagem (regra 6); depois só "Tentar novamente" | Quem perde o que digitou deixa de confiar |
| **Carregando** | confiança de que anda | Esqueleto na hora; o andamento **de cada fonte**; a ilustração só depois de uns 3 s | "Buscando…" sem detalhe parece travado |
| **Parcial** | útil desde já | O que chegou já é usável; só a parte que falta tem esqueleto, com botão para pedir só ela | Travar tudo por uma fonte lenta desperdiça o que já chegou |
| **Bloqueado** | ninguém travado | O motivo fica ao lado do botão e o bloqueio se **resolve ali** (escolher a propriedade libera o botão). `aria-disabled` | Botão apagado sem resposta é uma pergunta |
| **Sem permissão** | há um caminho | Diz **quem administra** a conta e deixa pedir a permissão com um clique | Negar sem indicar caminho deixa o usuário parado |
| **Desatualizado** | sei até onde confiar | Diz até quando o dado vale **e o que isso significa** ("depois dele podem ter surgido novos focos") | Dado velho que parece novo leva a decisões erradas |
| **Ação destrutiva** | peso e cuidado | Lista **o que vai junto** (focos, alertas, anotações), oferece **baixar o relatório antes**, som grave próprio e 8 s para **desfazer** | Apagar sem mostrar o que vai junto é o erro mais caro |
| **Sucesso** | concluído, e sei o que mudou | Diz o que entrou, o que foi unido e o que merece atenção, e leva ao próximo passo ("Ver as 3 com foco ativo") | "Tudo certo!" não informa nada |

Sons: erro toca o som de erro (cada falha); sucesso, o de sucesso; falha ao atualizar dado, o de atenção; remover, o grave descendente. **O vazio é silencioso**: aparece como resultado de digitar ou filtrar, e um som a cada tecla incomodaria; o som é da ação (ligar o filtro), não do resultado.

### 2.1.2 Ilustração dos estados

1. **Todo estado tem ilustração, sempre acima do texto**, centralizada. Motivo: sem arte o estado parece mensagem de sistema ("institucional"); com arte e uma frase pessoal, passa cuidado.
2. **Estrutura fixa** (componente único): ilustração, título (o que está acontecendo), frase (por quê e o que fazer), conteúdo extra opcional, próximo passo (botão), no máximo uma linha de fonte. O usuário aprende uma vez.
3. **Mesma altura** para todas as artes (224 px), para pesarem igual, qualquer que seja o formato.
4. **A arte não tem animação própria** e a moldura não tem cor própria; ela entra e sai junto com o bloco (8.4). Motivo: só o que é clicável se move (seção 8).
5. **Formato:** webp com **fundo transparente**, para assentar direto no cartão branco. Os scripts `scripts/to_webp.py` (converte e reduz) e `scripts/recortar_estados.py` (recorta a folha de 9 artes) refazem tudo. Medido: 240 KB no total para as 9 artes contra 494 KB sem perda; PSNR de 44 a 49 dB (sem diferença visível); o limite de nitidez é a folha de origem (uns 240 a 350 px de largura por arte).
6. **Texto alternativo** descreve a cena; a mensagem fica no texto, não na imagem.

### 2.2 Simplicidade: a interface pensa pelo usuário

Para tudo o que existe (tela, campo, passo, rótulo, número), faça estas perguntas, nesta ordem:

1. **Precisa existir?** Dá para tirar?
2. **Faz o usuário pensar?** Rótulo que exige interpretação, número sem contexto, escolha sem padrão sugerido.
3. **Dá para ter menos etapas?** Cada clique, tela e campo é um custo. Junte, adie ou dispense.
4. **A interface já pensou por ele?** Valor padrão certo, próximo passo já oferecido, dado preenchido a partir do que já sabemos, decisão que o sistema pode tomar sozinho.
5. **O usuário saberia responder ao que pedimos?** Se não, pergunte de outro jeito, ou não pergunte.

Exemplos do próprio projeto:

- O KPI traz a conclusão ("64% acima do normal"), não números crus para o usuário comparar de cabeça.
- O card crítico oferece a ação que resolve ("Ver propriedades críticas"): ninguém precisa procurar o próximo passo.
- O critério histórico evita pedir um limite para cada indicador.
- A legenda "Como ler" aparece uma vez, no lugar certo, em vez de explicações espalhadas.
- Saiu por obrigar a pensar: "média ago/2020–24: 1,55 m".

### 2.3 Quando há conflito

A ordem é: **o usuário (ser informado e entender), a clareza, a simplicidade, a beleza, a novidade.** Foi por isso que o cursor animado tem alternativas e salvaguardas, que as texturas saíram e que o movimento só existe em quem é clicável.

---

## 3. Marca

**Tom:** preciso, calmo e inteligente. Técnico sem parecer burocrático. Seguro sem parecer arrogante. Poucas palavras, frases muito claras.

**Sensação que o produto deve passar:** *"isso foi pensado até o último detalhe"*.

**Calmo não é apático.** Esta foi uma lição direta dos testes: a versão toda em cinza ficou triste e ninguém tinha vontade de olhar. A moldura é calma e quase monocromática; a vida vem do **conteúdo** (dados, mapa, números), do movimento e do som.

### 3.1 Nome

- Wordmark: **GEO PRISMA**.
- No texto corrido: **Prisma** (nunca "PRISMA" em caixa-alta).
- **"Sala de Situação" não aparece na interface.** Motivo: decisão de produto; Prisma é o nome único.

### 3.2 Linguagem

Escreva como se falasse com uma pessoa inteligente que não é especialista.

| ❌ Não | ✅ Sim |
|---|---|
| Solução inovadora para gestão inteligente de dados geoespaciais. | Seu território, mais fácil de entender. |
| Visualize informações provenientes de múltiplas fontes de dados. | Tudo o que importa, no mesmo mapa. |
| média ago/2020–24: 1,55 m | Normal para agosto: 1,55 m |
| +12% vs. ago/2024 | 12% a mais que no ano passado |
| FIRMS/NASA · última leitura 14:32 | Dados da NASA · atualizados às 14:32 |

Regras:
1. Frases corridas, em português corrente. Sem siglas, abreviações, intervalos ou símbolos que exijam decifrar.
2. A mensagem principal vem primeiro ("64% acima do normal"); a referência vem embaixo, em tom secundário.
3. O detalhe técnico (período da média, fonte, método) fica no **tooltip**, nunca no texto principal.
4. Termos que explicam a si mesmos. Se for preciso explicar, a explicação é uma legenda curta ("Como ler").
5. O estado "info" **não** é um nível de severidade. Severidade tem três níveis: **crítico, atenção, normal**. "Info" só existe em toasts, como aviso neutro.
6. **Nos estados (vazio, erro, sucesso…) fale como uma pessoa, de forma concreta.** "Ainda não temos nenhuma propriedade", "Não encontramos “Lagoa Verde”", "Quer adicionar a primeira?". Nada de "Nenhum dado para mostrar no momento" nem "Tudo certo!". Primeira pessoa do plural quando é o sistema agindo ("tentamos de novo"), segunda quando é a decisão do usuário. Motivo: o tom institucional foi a primeira reclamação nos testes dos estados; frase curta e clara continua valendo (regra 1), só que dita por alguém.

---

## 4. Cor

**Regra central:** a moldura da interface (fundo, cards, bordas, texto, botões) é neutra e verde. **Quem tem cor é o conteúdo** (dados, mapa). A cor quente existe só para o que é crítico.

### 4.1 Tokens

| Papel | Nome | Valor | Contraste / observação |
|---|---|---|---|
| Texto, elementos fortes | Grafite | `#181A19` | 17,5:1 sobre branco |
| Fundo | Branco | `#FFFFFF` | Fundo da página e dos cards |
| Divisórias, trilhos | Névoa | `#E5E7E4` | Só para separar; nunca para texto |
| Texto secundário | Cinza-tinta | `#5C625D` | 6,25:1 sobre branco |
| Elementos sem texto | Pedra | `#858B86` | 3,48:1: **nunca para texto** |
| **Ação e foco** | **Floresta** | **`#1F4D3A`** | **9,63:1** com branco. Botão primário, card em foco, anel de foco. Hover `#1B4433`, pressionado `#183B2C` |
| Assinatura em detalhes | Verde mineral | `#54705F` | Contorno de propriedade no mapa, estados selecionados, marcas pequenas |
| Seleção e hover suave | Verde claro | `#DCE5DF` | Fundo de seleção, aba ativa, hover de linha |
| Texto sobre verde claro | Verde-tinta | `#355042` | 6,86:1 sobre verde claro |

### 4.2 Cores de dados (escala "viva")

| Significado | Valor | Contraste sobre branco | Uso |
|---|---|---|---|
| Crítico, fogo | `#C8431A` | 4,91:1 | Único tom quente forte |
| Atenção, desmatamento | `#E09A00` | **2,39:1** | **Só preenchimento ou ícone acompanhado de rótulo. Nunca texto.** |
| Normal | `#2E7D5B` | 5,00:1 | |
| Água | `#2A7DA6` | 4,58:1 | |
| Recuo (o que não pede atenção) | `#CDD2CD` | n/a | Barras e itens abaixo do critério |

### 4.3 Por que é assim

- **Fundo branco com cards brancos e sombra suave.** O off-white `#F5F5F2` do briefing lia como **bege/papel**; a névoa fria funcionou, mas o branco com sombra foi a escolha final por ser limpo e dar respiro.
- **Texto secundário `#5C625D`, não o cinza-pedra do briefing.** `#858B86` dá 3,2:1 sobre o fundo e falha em texto pequeno. O pedra ficou só para elementos sem texto.
- **Verde entra pouco.** O briefing pede quase monocromático, com o verde como assinatura, não decoração. Medido na tela da versão aprovada: o verde é a cor que mais aparece (36% do que tem cor), contra 4% na versão "natureza".
- **Dois verdes de marca por motivos diferentes.** O mineral `#54705F` é a cor proprietária definida no briefing. O Floresta `#1F4D3A` foi escolhido para a **ação** (botões, card em foco) numa comparação visual de seis tons: é mais profundo e frio, e dá mais firmeza a quem precisa decidir (9,63:1 com branco; o mineral exato também passa, com 5,44:1, mas fica mais suave). O musgo `#2B4234` foi o primeiro teste e foi descartado por ler como oliva escuro. Também testados: mineral fundo, verde-água e grafite verde.
- **Calor só para o crítico.** Quando o terracota estava em todo lugar (brilho do card, linhas rosadas, barras esmaecidas), a tela falava "terra e papel", não "verde mineral, preciso, calmo". Medido: 59% da cor era quente. Hoje 33%.

---

## 5. Tipografia

- **Interface:** IBM Plex Sans. **Números, coordenadas e dados técnicos:** IBM Plex Mono (com `tabular-nums`).
- **Títulos:** peso 600, espaçamento levemente negativo. **Corpo:** 400.
- Motivo da Plex: é técnica sem ser fria, tem ótimos acentos em português e uma mono da mesma família, o que cria um sistema só. Foram testadas Inter, Geist, Instrument Sans e duas serifadas de títulos; a serifada foi descartada para manter um tom técnico único.
- Números sempre em mono: alinhamento na vertical (tabelas, KPIs) e sensação de instrumento de medição.
- Removidos: Playfair Display (importado sem uso real, conflitava com o corpo), Noto Sans (importado e não usado), Inter e JetBrains Mono (substituídas por decisão).

---

## 6. Forma e superfície

| Decisão | Valor | Motivo |
|---|---|---|
| Raio | pequeno 4 px, médio 6 px, grande 10 px | Cantos suaves o bastante para ser acolhedor, retos o bastante para parecer preciso. Sem pílulas. |
| Separação | Cards brancos com sombra suave (`0 1px 2px` + `0 4px 14px`, 6% e 5%) | Sombra separa sem a rigidez de borda em todo lugar |
| Densidade | Confortável (padding 20 px, linha de tabela 44 px, corpo 15 px) | Leitura tranquila; informação densa já é a regra no conteúdo, não na moldura |
| Campos de preenchimento | Fundo branco, borda 1 px `#CDD1CC`, foco com anel Floresta de 3 px | O fundo cinza anterior ficava "sujo" dentro do card branco |
| Abas e toggle | Seguem o mesmo estilo dos campos (lista branca com borda, aba ativa em verde claro, trilho do toggle derivado) | Antes herdavam um cinza fixo que destoava do fundo |
| Gradientes | **Só em pontos focais** (card em foco). Nunca em superfícies comuns | Gradiente em tudo vira decoração |

### 6.1 Texturas: nenhuma

Foram testadas e **descartadas**: grão (a primeira versão alterava as cores; corrigida para neutra, mas sem valor percebido), tela/linho (forte demais), curvas de relevo e pontos (sem adesão). **Papel, terra e natureza não são o tom da marca.** Não reintroduzir sem um motivo novo e medido.

---

## 7. Dados e severidade

### 7.1 O critério de destaque (histórico)

O destaque precisa de um **critério explícito e visível**, senão o usuário pergunta "por que este brilha?".

- **Padrão: histórico.** O valor é comparado ao **normal do mesmo mês** (média dos mesmos meses de 2020 a 2024).
  - **Crítico:** mais de 30% acima do normal. **Atenção:** de 5% a 30% acima. **Normal:** dentro do normal.
  - O **nível do rio é invertido**: é pior quando fica abaixo.
- **Alternativa: limite fixo** (crítico acima de 100% do limite, atenção a partir de 80%).
- Motivo do histórico: fogo em agosto é sempre alto; um teto único marca o ano inteiro e esconde a sazonalidade. Exemplo medido: setembro com 140 focos, abaixo do limite de 150, está 47% acima do normal do mês e deve ser visto.
- ⚠️ **Os valores usados nos protótipos (150, 128, 71…) são exemplos.** O produto precisa **calcular** o normal e os limites por organização (ver pendências).

### 7.2 Componentes

| Componente | Decisão | Motivo |
|---|---|---|
| **KPI** | Número grande em mono, mensagem em frase ("64% acima do normal"), referência embaixo, **barra até a referência** (a marca vertical é o normal), indicador de severidade, miniatura de evolução | Cada card mostra de onde vem a conclusão, sem precisar de explicação |
| **KPI em foco** | **Só o crítico** fica escuro, em Floresta, com número maior e a **ação que resolve** ("Ver propriedades críticas") | Guia o olhar para o que importa e entrega o próximo passo |
| **Card informativo** | É parado: sem cursor de clique, sem subir, sem animar | Movimento sugere clique; só o que é clicável se move |
| **Indicador** | Medidor de 3 barras + rótulo ("crítico", "atenção", "normal") com tooltip que explica o critério | Lê-se num relance e não depende só de cor |
| **Legenda "Como ler"** | Aparece sob os KPIs, com o significado de cada nível e o que é "normal do mês" | Explica uma vez, em um lugar |
| **Miniatura de evolução** | Linha do ano até agora + tracejado do normal, ponto no mês atual | Ocupa o espaço com informação real (tendência e sazonalidade) |
| **Tabela** | Linha crítica com barra à esquerda e tom suave; barras na coluna "Focos" | Grandeza e prioridade num relance |
| **Gráfico** | Barras + linhas com **traço técnico** (segmentos retos, barras de ponta reta); acima do critério em crítico, o resto em cinza neutro; **pico anotado**; linha tracejada do normal; séries secundárias recuam | Foco no que passou do critério, aparência de instrumento de medição |
| **Tooltip do gráfico** | Cartão branco arredondado (14 px), sombra suave, pontos coloridos, números em mono, animação de entrada de 160 ms | Substituiu o cartão quadrado "institucional" |

---

## 8. Movimento

**Regra:** só **elementos clicáveis** se movem. Nada fica em loop (exceto indicador de carregamento). Cada movimento tem um motivo: confirmar, orientar ou dar sensação de qualidade. **Única exceção: a continuidade (8.4)**, em que o conteúdo se move para mostrar o que mudou e para onde foi.

### 8.1 Sistema "Tátil"

| Interação | Comportamento | Motivo |
|---|---|---|
| Botão: hover | Sobe 1 px, ganha sombra, cor aprofunda (260 ms, curva com leve mola) | Convida e confirma que é clicável |
| Botão: pressionado | Afunda (escala 0,96) e escurece | Sensação física de apertar |
| Botão: clique | Onda a partir do ponto exato do clique (550 ms) | Mostra onde o clique aconteceu |
| Botão: salvar | Ciclo normal → girando → check que "estala" → volta | O usuário vê o resultado sem ler nada |
| Ícones | Animam no hover do clicável, **cada um do seu jeito**: download desce, filtro desliza, camadas sobem, pin pula, sino balança, fogo oscila, árvore balança, gota quica, engrenagem gira 90° | Dão personalidade e reforçam o significado |
| Menu | Abre com mola a partir do gatilho (200 ms), itens entram em cascata, o chevron gira; a opção escolhida pisca em verde claro, mostra um check que "estala" e o menu fecha 280 ms depois | O usuário vê o efeito da escolha antes do menu sumir |
| Diálogo | Entra com leve subida e escala (260 ms), sai mais rápido (150 ms) | Foco sem susto |
| Toast | Entra com mola (400 ms), sai deslizando (190 ms); o **X é funcional**, tem pointer e hover | Controle total ao usuário |
| Abas, toggle | Transição de 180 ms; o toggle tem mola | Estado muda de forma legível |
| Entrada | Seções entram em ordem de leitura (90 ms entre elas); números contam até o valor (1 s); a barra de referência cresce (900 ms) | Orienta a leitura e dá vida |
| Carregando | Esqueleto com brilho passando (1,3 s) | Mostra a forma do que vem |

### 8.2 Proibido

- **Pulsar em loop.** O ponto "ao vivo" pulsando foi removido: tinha "cara de IA" e não dizia nada. Hoje o texto informa fonte e horário.
- **Luz que segue o mouse** nos cards: era bonita, mas sem intenção.
- Movimento em card informativo.

### 8.3 Acessibilidade

`prefers-reduced-motion`: todas as animações e o degradê do cursor ficam paradas.

### 8.4 Continuidade: se algo vai para algum lugar, o usuário vê para onde foi

**Regra:** nenhuma troca de conteúdo acontece "de uma vez". O que sai **sai** de algum jeito visível, o que entra **chega**, a altura se acomoda em vez de dar um salto, e o que mudou fica marcado por um instante.

**Motivo (teste do estado "Busca sem resultado"):** ao clicar em "Ver Faz. Lagoa Azul", a tela "piscou" e virou outra coisa. O usuário não entendeu o que aconteceu nem de onde veio o resultado. Sem caminho, o sistema parece instável, e o usuário perde a confiança de que entende o que ele faz.

| Situação | Caminho | Tempo |
|---|---|---|
| Um bloco troca por outro (vazio → tabela, erro → sucesso, um estado → outro) | O antigo sobe e some, a **altura acompanha** (sem salto) e o novo sobe até o lugar | 170 ms saída, 320 ms altura, 300 ms entrada |
| Só o **texto** do estado muda (1ª falha → 2ª falha) | A ilustração fica como âncora; só o texto troca | o mesmo |
| Um botão muda o que há num campo (sugestão, "Limpar a busca") | O texto é **digitado no campo**, apagando e escrevendo até o novo | cerca de 400 ms no total |
| Um item é achado, adicionado ou atualizado | A linha **pisca em verde claro e se apaga devagar** | 1,9 s |
| Um item é removido | A linha **encolhe até sumir** e o aviso com "Desfazer" abre no lugar dela. Ao desfazer, ela expande de volta e pisca | 350 ms |
| Um botão passa a funcionar (era bloqueado) | Sai de 45% de opacidade para 100% | 250 ms |
| Um botão muda de rótulo (Salvar → Salvando → Salvo) | O novo rótulo aparece com fade, **no próprio botão**: ele é o destino da ação | 280 ms |
| Uma lista aparece depois do vazio | As linhas entram em cascata | 45 ms entre elas |
| Barras de gráfico entram | Crescem de baixo para cima, em cascata | 500 ms |

Regras:
1. O **destino da ação mostra a mudança no mesmo instante** em que o resultado aparece (o botão vira "Salvo" quando o bloco de erro some).
2. Elementos que estão saindo ficam **inertes**: não recebem foco nem clique.
3. `prefers-reduced-motion`: as trocas continuam acontecendo, sem animação, mas o destaque (verde claro) e o texto que explica o que mudou **permanecem**.
4. Isso não permite animar à toa: se não há "de onde" e "para onde", não há movimento.

> Para bibliotecas de animação (ex.: `motion`), a decisão fica em aberto. Qualquer uma entra **só** respeitando as regras desta seção.

---

## 9. Som

Som é parte do design, não um enfeite. **Toda interação definida tem seu som**, sintetizado (Web Audio, sem arquivos), curto e baixo.

| Interação | Som |
|---|---|
| Clique em botão | tique curto e grave-médio |
| Toggle ligar / desligar | duas notas subindo / descendo |
| Abrir / fechar menu ou diálogo | glissando subindo / descendo |
| Escolher opção de menu | duas notas triangulares |
| Trocar de aba | tique agudo |
| Sucesso (salvar, exportar) | arpejo de três notas subindo |
| Atenção | duas notas iguais |
| Erro | duas notas descendo, mais graves |
| Fechar toast | mesmo som de fechar |
| **Remover, excluir, apagar** | **golpe grave descendente, mais longo que qualquer outro** |
| Hover | só no modo "expressivo" |

Regras:
1. **Ação destrutiva sempre tem som próprio**, grave e descendente, para que ninguém a confunda com um clique comum.
2. Modos: **sem som**, **sutil** (padrão) e **expressivo** (mais corpo, e som no hover).
3. O som só toca depois do primeiro gesto do usuário (regra dos navegadores) e o usuário pode desligá-lo nas configurações.
4. Volume baixo; nunca assusta.

---

## 10. Cursor

**Prisma aurora**, em todo o site.

- Padrão: seta geométrica (prisma) com uma faceta, em grafite.
- **Clicável:** a seta fica verde mineral, a **borda inteira vira um degradê de cores (ocre, terracota, verde, ardósia) que corre na diagonal**, como uma tela grande passando só pelo traço, com um halo suave desfocado ("aurora").
- **Clique:** um círculo leve nasce na ponta e se dissolve (500 ms).
- **Bloqueado:** a seta com um símbolo de proibido em terracota. **Campo de texto:** cursor de texto do navegador. **Mapa:** o mesmo cursor (arrastar só escurece a faceta).

Motivos: a marca se chama Prisma; o degradê que passa pela borda evoca luz atravessando um prisma, e só aparece onde há ação.

**Custos e salvaguardas** (o cursor é desenhado pelo site, não pelo navegador):
- Roda código a cada movimento do mouse e pode ficar um quadro atrás em páginas pesadas, como o mapa.
- Some em telas de toque e ignora o cursor grande das configurações de acessibilidade do sistema.
- Por isso: o cursor nativo só é escondido **depois do primeiro movimento**; existem alternativas ("Prisma nativo", só muda de cor, e "Sistema"); com `prefers-reduced-motion` o degradê para.
- O botão desabilitado do shadcn tem `pointer-events: none`; a detecção de "bloqueado" usa a geometria. Em UIs novas, prefira `aria-disabled` a `disabled`.

---

## 11. Ícones

**Tabler**, traço de 1,75. Motivo: geométricos e firmes, combinam com a linguagem técnica. Foram testados Lucide (2 espessuras), Phosphor (6 pesos), Remix e Iconoir; o traço fino do Lucide ficou tímido e o cheio, pesado.

Cada conceito tem um ícone fixo (fogo, árvore, gota, pin, camadas, sino, download, busca, filtro, calendário, engrenagem, check, alerta, erro, info, fechar, carregando, seta). Ícone sempre acompanha um rótulo quando o significado não for óbvio.

---

## 12. Toasts

Cartão branco com sombra, ícone em círculo tingido, título e frase curta, **borda de 1 px na cor do alerta** (70%) para o estado ser lido sem ler o texto, **X funcional**. Entrada com mola, saída deslizando.

---

## 13. Mapa

- **Base padrão:** OpenFreeMap vetorial **recolorido na paleta** ("mineral"): vegetação em verde suave, água em azul-ardósia claro, ruas brancas. Motivo: mostra o território com vida sem o bege de carta topográfica.
- **Relevo sombreado médio** (elevação gratuita da AWS) e **inclinação de 50°, girado −14°, com relevo 3D** (exagero 1,8). Motivo: dá profundidade e faz o território parecer território.
- **Camadas de dados:** focos (círculo crítico com contorno branco), desmatamento (âmbar a 55%), propriedade (contorno tracejado em verde mineral).
- **Secundárias:** satélite, e outras bases gratuitas testadas (Esri Topo, OpenTopoMap, OSM, Positron).

⚠️ **Limites de zoom por serviço** (medidos em Bonito/MS): acima do último nível com dados, a Esri devolve um tile-placeholder "Map data not yet available". Definir `maxzoom` da fonte em: NatGeo 12, Topo 16, Ruas 16, Satélite 17, Cinza 11.

---

## 14. Referência viva e escolha final

O laboratório `/dev/design-lab` (branch `proto/design-lab`, descartável, nunca vai para a `main`) é a referência visual enquanto o código não é migrado. A escolha final do projeto, no formato de URL do laboratório:

```
f=plex w=600 g=white t=ink r=b s=shadow d=comfy i=a c=viva e=focus z=historico
hot=green hg=forest sp=on db=on v=c b=b a=tactile o=tabler x=prisma-aurora
q=none l=entrada u=soft n=d k=a y=tech p=a m=ofm-mineral j=tilt3d h=medium
```

Atmosferas testadas, para registro: **Natureza** (terrosa: lia como papel, rejeitada), **Instrumento** (tudo em cinza: apática, rejeitada) e **Instrumento vivo** (moldura fria e precisa com conteúdo vivo: **escolhida**).

---

## 15. O que foi removido e por quê

Para ninguém recolocar sem motivo.

| Removido | Motivo |
|---|---|
| Dark mode (`.dark`, `dark:`) | Nunca esteve ativo; a paleta foi pensada para o claro |
| Azul `#3B82F6` do shadcn, verde/lima "pantaneiro", `brand-*` | Três identidades concorrentes, sem propósito; unificadas |
| `docs/DESIGN.md` (análise da Apple) e `docs/DESIGN/` (mockups e vídeos) | Referência externa que contradizia a marca |
| Playfair Display, Noto Sans | Importadas sem uso ou em conflito |
| Inter, JetBrains Mono | Substituídas por IBM Plex por decisão |
| Off-white `#F5F5F2` | Lia como bege/papel |
| Cinza-pedra como cor de texto | Contraste de 3,2:1, falha em texto pequeno |
| Serifada nos títulos | Quebrava o tom técnico único |
| Limites fixos como critério padrão | Arbitrários; escondem a sazonalidade |
| "info" no medidor de severidade | Não significa severidade |
| Textos "média ago/2020–24", "+12% vs. ago/2024" | Obrigavam a decifrar |
| Ponto "Atualizado agora" pulsando | Sem informação; "cara de IA" |
| Luz que segue o mouse | Sem intenção |
| Raios coloridos no cursor | Desagradaram; trocados pelo degradê na borda |
| Texturas (grão, tela, curvas, pontos) | Ver 6.1 |
| Brilho terracota no card em foco, linhas críticas rosadas, barras recuadas em rosa | Calor desnecessário; a tela passava "terra" |
| Mapa topográfico (OpenTopoMap) como padrão | 50% bege e 46% verde de mata: lia como carta de natureza |
| Satélite como mapa padrão | O mapa bonito é o principal; satélite é utilidade |
| Basemap Dark Matter | Sem dark mode, perde o sentido |
| Cursor de mão nativo como único | Queríamos uma marca também no cursor |
| Mais de um verde "sem papel" (musgo `#2B4234`) | Lia como oliva escuro; ficou o Floresta |
| Estados com ilustração, título, frase e botão **iguais** em todos | Genérico, "sem alma, sem intenção"; ver 2.1.1 |
| Primeira folha de ilustrações dos estados (monocromática, só verdes) | Substituída por decisão do responsável de design pela folha colorida (`public/estados-novos.png`) |
| Mudança de conteúdo "de uma vez" (o bloco troca sem caminho) | O usuário não entendia o que tinha acontecido; ver 8.4 |

---

## 16. Armadilhas técnicas

Descobertas na prática; valem para quem implementar.

- **Tailwind v4:** o `@theme` declara `--color-x: hsl(var(--x))` na raiz. Sobrescrever `--primary` em um elemento filho **não funciona**; sobrescreva `--color-*` diretamente. O v4 também **zerou o `cursor: pointer` dos botões**: é preciso regra global para tudo que é clicável.
- **Diálogo:** o v4 centraliza com a propriedade `translate`, não `transform`. Animações do diálogo não podem usar `translate(-50%, -50%)`.
- **Recharts 2.15 com React 19:** não enxerga `<>…</>` como filho de gráfico (perde séries e o eixo Y). Use arrays com `key`. Ao criar um segundo `YAxis`, dê `yAxisId` explícito a **todas** as séries.
- **Filtros SVG** calculam em espaço linear por padrão; use `color-interpolation-filters='sRGB'` ou o resultado clareia.
- **Botão desabilitado** do shadcn tem `pointer-events: none` (ver seção 10).
- **Licenças** dos provedores de mapa não foram conferidas (ver pendências).

---

## 17. Pendências em aberto

1. **Limites e "normal" são dados de exemplo.** Definir de onde vêm (cálculo por organização a partir do histórico, regra legal ou configuração) antes de implementar o dashboard.
2. **Consolidar os verdes.** Hoje há três: verde mineral (marca), Floresta (ação) e verde-folha `#2E7D5B` (dado "normal"). Decidir se o "normal" deve ser o Floresta ou o mineral.
3. **Licenças e termos** dos provedores de mapa (Esri, OSM, Carto, OpenTopoMap, OpenFreeMap) antes de ir para produção.
4. **Política de som no produto:** padrão "sutil" ligado, mas confirmar se começa ligado ou desligado para novos usuários.
5. **Segunda onda** (fora do escopo atual): impressão e PDF, e-mails, manifest do PWA, mapa em Leaflet legado, reescrita dos textos existentes no tom da seção 3, vetorização do logo.
6. **Landing:** só troca de cores; layout e textos ficam como estão.
7. **Teste existente falhando**, sem relação com design: `maplibre-layer.test.ts` (`resolveLayerType`).
8. **Estados: desenhados no laboratório (ticket #68), ver 2.1.1 e 2.1.2.** Falta: **conferir a acessibilidade em navegador** (leitor de tela, teclado, contraste de 4,5:1, `prefers-reduced-motion`; o código segue a seção 1.2, mas só foi checado por tipos, não por uso) e **migrar** os estados para as telas reais, uma tela por vez nos PRs de dashboard, mapa, admin e auth.
9. **Auditar as telas atuais** com o checklist da seção 1.2 e a seção 2: onde há espera sem aviso, lista vazia sem explicação, erro sem saída, botão desabilitado sem motivo ou etapa que dá para eliminar.
10. **Cor das ilustrações dos estados.** A folha atual é colorida (marrom do café e da madeira, laranja da placa e dos avisos, azul do passarinho). A seção 4 diz "cor quente só para o crítico", mas as artes são conteúdo, não moldura. Decidir se isso fica como regra ("a ilustração é conteúdo, pode ter cor") e registrar o motivo.
11. **Ilustração do "não encontrado"** (teclado em tons de verde) está em estilo diferente do resto. Trocar por uma no estilo da folha atual.
12. **Textos de exemplo** (nome do administrador, números, horários, "CAR") são fictícios. Os que dependem de dados reais (último foco, quem administra, o que vai junto ao remover) precisam vir do sistema.

---

## 18. Como evoluir este documento

- Toda mudança de design **registra o motivo** aqui, na seção certa, e se algo foi removido, na seção 15.
- Antes de criar UI nova, passe pelo checklist da seção 1.2.
- Mudou uma decisão? Não apague a antiga: mova para a seção 15 com o motivo.
