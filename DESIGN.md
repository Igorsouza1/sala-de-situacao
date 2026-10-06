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
| 4b | **Hierarquia e respiro.** Dá para ver onde cada assunto começa e termina sem ler? Há espaço entre os textos? A janela não é toda da mesma cor? | Separe em cartões sobre uma base e aumente o espaço (seção 6.2). |
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
6. **A ilustração é decorativa:** `alt` vazio. Motivo: a mensagem inteira está no texto; descrever a cena de novo seria ruído para quem usa leitor de tela.
7. **Acessibilidade do bloco:** o título é um `h4`; o conteúdo vive numa **região viva** (`aria-live="polite"`) que existe antes da troca, para o leitor de tela anunciar o texto novo (uma região criada junto com o conteúdo muitas vezes não é anunciada); erro usa `role="alert"`.
8. **Foco:** se o elemento que tinha o foco sai de cena (o bloco troca ou encolhe), o foco vai para o primeiro controle do conteúdo novo ou para o próprio bloco, nunca para o início da página. Ao remover, o foco vai para "Desfazer".

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
6. **Voz do produto: "Colega de campo".** Conversa de pessoa para pessoa, concreta, nunca institucional.
   - **Pergunta quando oferece:** "Quer adicionar a primeira?", "Era essa?".
   - **"Nós" quando o sistema age** ("tentamos de novo", "não encontramos"), **"você" quando a decisão é da pessoa** ("o que você preencheu continua aqui").
   - **Frases de até 20 palavras.** Fato e número concretos no lugar de adjetivo ("Já são 8 dias de calma", não "Boa notícia").
   - **Exemplos:** "Ainda não temos nenhuma propriedade" · "Não encontramos “Lagoa Verde”" · "Não conseguimos salvar" · "Estes dados são de ontem às 14:32".
   - **Motivo da escolha:** a primeira reclamação nos testes dos estados foi o tom institucional ("genérico, frio, sem alma"). Entre as três direções testadas no laboratório (seção "Voz e tom", 14 situações), o responsável de design preferiu esta por ser a mais próxima de quem usa. Continua preciso e calmo (seção 3): frases curtas, sem sigla, sem código técnico, sempre o que a pessoa pode fazer.

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
| Elementos sem texto | Pedra | `#858B86` | 3,48:1: **nunca para texto**. Usada na **borda dos campos** e no trilho do toggle desligado (exigem 3:1) |
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

### 4.4 Cores da base do mapa

O MapLibre não lê `var()`, então a base Mineral lê estes tokens com `getComputedStyle` ao montar o estilo (`components/map/helpers/basemaps.ts`). Os valores são os aprovados no laboratório; **não são cores de marca**, só da base do mapa.

| Token | Valor | Uso |
|---|---|---|
| `--color-map-water` | `#c6d8de` | Água (azul-ardósia claro) |
| `--color-map-water-text` | `#4f6f7b` | Nomes de rios e lagos |
| `--color-map-forest` | `#cfddd2` | Mata |
| `--color-map-grass` | `#dde7de` | Parque, campo, uso do solo |
| `--color-map-urban` | `#eceeeb` | Área urbana |
| `--color-map-casing` | `#d9ddd8` | Contorno das ruas |
| `--color-map-shadow`, `--color-map-shadow-accent` | `#2f3d35`, `#4b5d52` | Relevo sombreado |

Os demais tons da base reaproveitam os tokens existentes: fundo e ruas em `background`, prédios em `border`, limites em `stone`, texto em `muted-foreground`.
**Motivo:** os hex no código falhariam no `design-guard` e o mapa precisa dos tons exatos aprovados. Derivar do azul de dados (`water`) deixaria a água mais forte do que a escolhida.

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
| Campos de preenchimento | Fundo branco, borda 1 px **Pedra `#858B86`**, foco com anel Floresta de 3 px | O fundo cinza anterior ficava "sujo" dentro do card branco. A borda era `#CDD1CC` (1,55:1) e falhava no contraste de componentes (3:1): o campo é identificado pela borda, então ela precisa ser vista |
| Abas e toggle | Seguem o mesmo estilo dos campos (lista branca com borda, aba ativa em verde claro, trilho do toggle derivado) | Antes herdavam um cinza fixo que destoava do fundo |
| Gradientes | **Só em pontos focais** (card em foco). Nunca em superfícies comuns | Gradiente em tudo vira decoração |

### 6.1 Texturas: nenhuma

Foram testadas e **descartadas**: grão (a primeira versão alterava as cores; corrigida para neutra, mas sem valor percebido), tela/linho (forte demais), curvas de relevo e pontos (sem adesão). **Papel, terra e natureza não são o tom da marca.** Não reintroduzir sem um motivo novo e medido.


### 6.2 Respiro e hierarquia

**Regra:** toda janela diz, sem ser lida, **onde um assunto começa e onde termina**, e **respira**. A pessoa não deveria precisar pensar para entender onde está dentro de um painel.

**Motivo (teste dos painéis Camadas e Filtros do mapa):** tudo branco sobre fundo branco, com os textos colados, deu "tontura" e sensação de sufoco. Não se via onde uma seção acabava e a outra começava, era preciso ler tudo para entender o que era o quê, e a legenda de algumas camadas sumia (branco sobre branco).

1. **Três níveis de superfície**, e só: **base** (cinza suave, `muted` a 50%), **cartão** (branco, borda Névoa, raio de 10 px) e **campo** (branco, borda Pedra). Uma janela toda em branco não vale: o cartão branco só aparece sobre uma base diferente.
2. **Um cartão por assunto**, com título (14 px, 600) e, se couber, uma legenda curta abaixo (12 px, cinza-tinta). O título é o que diz "aqui começa"; a borda do cartão diz "aqui termina".
3. **Três tamanhos de texto por janela:** título da janela (16 px, 600), título do cartão (14 px, 600) e corpo (14 px, 400), com apoio em 12 px. Títulos em caixa-alta minúscula saíram: pesavam menos que o corpo e escondiam a hierarquia.
4. **Escala de espaço:** 4, 8, 12, 16, 24 px. Entre cartões: 16. Dentro do cartão: 16 de borda e 12 entre o título e o conteúdo. Linha clicável: no mínimo 48 px de altura (toque e respiro). Dois textos empilhados ficam a 2 a 4 px um do outro, nunca colados.
5. **A legenda é o que o mapa desenha:** o mesmo preenchimento, contorno e transparência. Um fio escuro por fora garante que uma cor clara (o creme das estradas, o branco do contorno das nascentes) apareça no cartão branco. **Branco sobre branco nunca:** a pessoa teria de adivinhar o que a cor significa.
6. **Componentes do projeto, não do navegador:** seletor, calendário e menus usam os nossos (mesmo estilo e mesmo movimento). O `<select>` nativo abre com o visual do sistema e quebra a unidade da janela.
7. **O texto se lê como o que é:** "Área de [mínimo] a [máximo] ha" no lugar de um rótulo e dois campos soltos; "Vale para…" só quando acrescenta algo que o título não diz.

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

**Curva de mola:** `--ease-spring` = `cubic-bezier(0.34, 1.32, 0.64, 1)`. Passa uns 3% do destino e volta: dá o "leve" da mola sem balançar. Tudo que abre, sobe ou aparece usa essa curva; o que **sai** usa `ease-in` e é mais rápido (150 ms), para não ficar na frente de quem já decidiu. Cores e opacidade não precisam de mola.


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
| Painel do mapa | **Abre** de baixo, a partir do botão que o abriu, com leve subida e escala (240 ms, mola); **fecha** em 150 ms, sem mola. Fechado fica inerte (sem foco nem clique). Os **cartões de dentro entram em ordem de leitura**, 60 ms entre eles, depois de o painel abrir (+90 ms) | A pessoa vê de onde o painel veio e para onde foi (8.4), e o olho é conduzido de cima para baixo em vez de receber tudo de uma vez |
| Recolher e expandir | A altura acompanha em 320 ms, o conteúdo some e volta junto e o chevron **gira** (um ícone só, em vez de trocar por outro) | Mostra o que mudou, sem salto |
| Contador do dock (Filtros · 2) | Surge e muda com um "pop": nasce a 50%, passa a 120% e assenta (320 ms, mola) | Mostra que o número mudou, no lugar exato onde a pessoa vai olhar |
| Frase que resume o estado ("Mostrando de…") | É refeita a cada mudança e **pisca em verde claro**, apagando em 1,9 s (8.4). Com movimento reduzido não pisca: a frase já diz o que mudou | A pessoa liga a ação dela (clicar num atalho) ao resultado, sem procurar |
| Contagem ("12 propriedades encontradas") | Entra com fade (200 ms) quando o número muda | O número novo não aparece "do nada" |
| Frase de filtro numa camada ("Filtrada pelo período.") | A altura da linha cresce e encolhe em 320 ms, sem pular a lista | Quem está abaixo não é empurrado de uma vez |
| Atalho ou ano escolhido | Cor, borda e texto passam para o verde claro em 200 ms; no clique afunda e volta (mola) | Confirma a escolha antes de ler a frase |

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

**No código (mapa principal):** `components/map/PrismCursor.tsx`, montado dentro do `MapLibreMap`, com as regras em `app/globals.css`. Vale enquanto o mapa está na tela (a página inteira, não só o canvas) e o nativo volta ao sair. Decisões do porte:
- **Mira de medir e de inspecionar coordenadas:** sobre o mapa, o cursor some e fica o `crosshair` do navegador. Motivo: a mira precisa de um ponto exato, e o prisma não tem centro.
- **Feição clicável no mapa** (foco, propriedade) vira o estado clicável, igual a um botão: o MapLibre sinaliza por estilo do canvas, não por elemento, então o cursor lê esse estilo.
- **Cores do degradê** vêm dos tokens, não dos hex do laboratório: ocre → `warn`, terracota → `crit`, verde → `mineral`, ardósia → `map-water-text`. Motivo: o `design-guard` barra hex novos; o ocre e o terracota ficam um pouco mais vivos que no laboratório.
- Fora do mapa o cursor ainda é o do sistema (resto do site em 17.11).

---

## 11. Ícones

**Tabler**, traço de 1,75. Motivo: geométricos e firmes, combinam com a linguagem técnica. Foram testados Lucide (2 espessuras), Phosphor (6 pesos), Remix e Iconoir; o traço fino do Lucide ficou tímido e o cheio, pesado.

Cada conceito tem um ícone fixo (fogo, árvore, gota, pin, camadas, sino, download, busca, filtro, calendário, engrenagem, check, alerta, erro, info, fechar, carregando, seta). Ícone sempre acompanha um rótulo quando o significado não for óbvio.

---

## 12. Toasts

Cartão branco com sombra, ícone em círculo tingido, título e frase curta, **borda de 1 px na cor do alerta** (70%) para o estado ser lido sem ler o texto, **X funcional**. Entrada com mola, saída deslizando.

---

## 13. Mapa

- **Base padrão: Satélite suave** (por agora). Sobre o Mineral claro, o dock branco, os controles e os dados (fogo, desmatamento) se perdiam; sobre o satélite dessaturado eles se destacam sem o satélite cru competir com os dados. O **Mineral** continua no seletor: OpenFreeMap vetorial **recolorido na paleta** (4.4), com vegetação em verde suave, água em azul-ardósia claro e ruas brancas, e só é baixado quando alguém o escolhe.
- **Bases:** Satélite suave (padrão), Mineral, Satélite, Ruas e StreetMap, escolhidas dentro do painel Camadas (13.1). O Dark Matter saiu (seção 15). O **Satélite suave** é o mesmo satélite com `raster-saturation` −0,5, `raster-brightness-max` 0,88 e `raster-contrast` −0,15. Ele virou o padrão por decisão do responsável de design, **por agora** (17.15); se ele vencer de vez, o Satélite cru pode sair (uma base a mais é um controle sem motivo).
- **Se o Mineral não baixar:** o mapa cai sozinho para Ruas, o painel Camadas avisa "Mineral indisponível agora. Mostrando Ruas." e **o botão Camadas do dock ganha um ponto âmbar** (com o painel fechado, a troca silenciosa deixaria a pessoa sem saber). Ele **não volta sozinho**: o usuário escolhe o Mineral de novo. Motivo: trocar a base sem aviso, de novo, tira o controle de quem usa (2.1); e o mapa nunca fica sem fundo.
- **Relevo:** sombreado médio **só no Mineral, no Ruas e no StreetMap**. O satélite não tem: a foto já traz as próprias sombras e o sombreado as duplicaria. A elevação é a gratuita da AWS.
- **Abre em 2D na primeira visita** (o 3D pesava demais no aparelho). Quem escolhe 3D abre em 3D nas próximas: o mapa enquadra a região e inclina até **50°, girado −14°, com relevo 3D (exagero 1,8)** num **único movimento de ~1,2 s**, cancelável pelo primeiro gesto (8.4: o usuário vê de onde a câmera veio e para onde foi). Com `prefers-reduced-motion`, ela já nasce no destino. Motivo: dá profundidade e faz o território parecer território.
- **Segmento 2D | 3D**, dentro do cartão da câmera (13.1). Motivo: nem sempre se quer 3D, e dois segmentos mostram o estado atual sem a pessoa pensar (2.2), ao contrário de um botão cujo rótulo é o destino.
  - O destaque troca no mesmo instante em que a câmera começa a se mover (8.4). Em 2D a câmera volta de cima e ao norte; o relevo 3D só desliga quando ela termina de achatar. O hillshade continua.
  - **O segmento segue a câmera:** inclinação acima de ~1° é 3D. Inclinar com o mouse ou clicar na bússola também troca o modo. Motivo: um segmento que diz "3D" com o mapa visto de cima mente.
  - **O último modo escolhido fica salvo no navegador** (`localStorage`, chave `prisma:mapa:modo`), por botão ou gesto. **A animação automática da abertura não grava.** Primeira visita: 2D. Quem escolheu 3D abre em 3D. Motivo: a escolha vale por navegador e aparelho, e não existe tabela de preferências do usuário no banco; criar uma migration por um valor só não compensa. Se surgirem mais preferências por usuário, migra-se tudo junto.
  - Sem som por enquanto (política de som em aberto, pendência 4).
- **Camadas de dados:** focos (círculo crítico com contorno branco), desmatamento (âmbar a 55%), propriedade (contorno tracejado em verde mineral).

### 13.1 Controles do mapa

**Por que mudou:** os controles tinham crescido sem plano: filtros e Fauna no canto esquerdo, bases e 2D|3D no topo, ferramentas numa coluna à direita com posições fixas em pixel (o cartão de medição caía em cima do botão de coordenadas), Camadas num painel escuro embaixo. Uns eram redondos, outros quadrados, uns com borda, outros sem; os pop-ups saíam de lados diferentes. A pessoa precisava procurar o que queria. O mapa agora tem **dois lugares** e uma regra: o que se faz nos dados vai no dock; o que se faz na câmera vai no canto.

| Lugar | O quê | Pergunta que responde |
|---|---|---|
| **Dock** (embaixo, centralizado) | **Camadas** · **Filtros** · divisor · **Medir ▾** · **Consultar ▾** · divisor · **Imprimir** | "O que está no mapa, o que estou vendo e o que quero fazer com ele?" |
| **Câmera** (canto superior direito, um cartão) | `+`, `−`, bússola, 2D\|3D | "De que ângulo e de quão perto?" |

- **Um estilo só** (`helpers/control-style.ts`): borda Névoa, fundo `card`, sombra `--shadow-control` (mais definida que a do card, que se perde sobre a base clara), raio de 6 px nos botões e de 10 px nos painéis. Item ativo em verde claro, como as abas (6).
- **Rótulo sempre visível no dock.** Motivo: no celular não existe hover para o tooltip (11). Só a câmera, de ícones óbvios, usa tooltip. No celular o `+` e o `−` somem (a pinça já resolve) e o painel ocupa a largura toda acima do dock.
- **Painéis não bloqueiam o mapa** e abrem para cima, a partir do botão que os abriu; um por vez; fecham no X, no Esc ou ao abrir outro (8.4). O foco vai para o painel ao abrir e volta ao botão ao fechar (2.1.2, regra 8). O conteúdo continua montado mesmo fechado, para os filtros guardarem o que a pessoa escolheu.
- **Camadas:** em cima, o cartão do **mapa base** (miniaturas; a base é a camada de baixo); embaixo, **um cartão por categoria** de dados. O **Atualizar** fica no cabeçalho do painel, porque vale para todas as camadas (o rótulo muda no próprio botão: Atualizar → Atualizando… → Atualizado, 8.4). A **Fauna (javali)** deixou de ser um popover e é uma camada como as outras. A hierarquia segue a 6.2: painel em base cinza suave, cartões brancos, título de cartão em 14 px.
  - **Sem acordeão.** Eram três níveis (categoria → pasta → item) para umas 12 linhas: escondia mais do que organizava. Agora cada categoria (Operacional, Monitoramento, Base Territorial, Infraestrutura, Uploads) é um cartão sempre aberto. Só a camada com grupos (Ações, por eixo temático; a Fauna) expande, num único nível, por um chevron que **gira** e uma altura que acompanha (8.1).
  - **A linha:** `[amostra] Nome · 128 [interruptor]`, com no mínimo 48 px de altura. A **amostra** é a legenda, **fiel ao mapa** (preenchimento, contorno e transparência da camada, com um fio escuro por fora para cores claras, 6.2), e fica esmaecida quando desligada; o **número** é quantas feições estão no mapa; a **linha inteira** liga e desliga. Interruptor, não caixa de seleção: é ligar e desligar na hora. A frase do filtro vem logo abaixo do nome, a 2 px.
  - **O filtro aparece na camada que ele mexe:** "Filtrada pelo período." e, quando deixou zero, "Nenhum resultado para o período escolhido." (2.1, "o filtro escondeu tudo"). Sem isso, a pessoa filtrava e metade do mapa não mudava, sem saber por quê.
  - **Só "Ocultar todas"**, e só quando há alguma ligada. "Mostrar todas" saiu: é o caminho mais curto para travar o mapa (as camadas pesadas, como Propriedades, chegam a levar uns 10 s) e quase nunca é o que a pessoa quer.
  - **O mapa abre só com o que responde "o que está acontecendo?":** Propriedades, Focos, Desmatamento e Ações. O resto a pessoa liga. Se a região não tem nenhuma dessas (ex.: uma região só com a Rede Amolar), abre com todas, para não abrir em branco. Antes abria tudo ligado.
- **Andamento por camada (2.1, "Parcial"):** cada camada ligada mostra um esqueleto enquanto chega, ou "Não carregou. Tentar de novo" se falhou. O véu escuro "Atualizando dados…" que travava o mapa inteiro **saiu**: o mapa continua usável enquanto o resto chega.
- **Filtros aplicam na hora** (sem botão Aplicar; o tamanho aplica uma pausa depois da última tecla e conta as propriedades). O botão escolhido fica marcado, a frase de cima diz o que está valendo ("Mostrando de 01/01/2026 a 31/12/2026") e "Limpar tudo" desfaz. **O botão Filtros do dock mostra quantos estão ligados.** Motivo: quem fecha o painel com um período filtrado vê o mapa "vazio" e não sabe por quê (2.1).
  - **Os filtros não são globais, e o painel diz onde valem.** O período só mexe em Ações, Focos e Desmatamento; o tamanho só em Propriedades; as outras camadas ignoram os dois. Cada seção traz "Vale para: Focos, Desmatamento e Ações." e, se nenhuma dessas camadas está ligada, "Nenhuma está ligada: ligue uma em Camadas para ver o efeito." Mover cada filtro para dentro da camada foi descartado: o mesmo período apareceria três vezes.
  - **Período compacto:** quatro atalhos (Hoje, Esta semana, Este mês, Este ano), um seletor de ano e "Escolher datas" recolhido, **lado a lado**. As datas abrem numa linha só ("[início] até [fim]"), cada uma com o calendário do projeto, e não em duas linhas empilhadas. O seletor e os calendários são os componentes do projeto, não o `<select>` nativo (6.2). Motivo: o Período ocupava quase o painel inteiro e o tamanho das propriedades ficava abaixo da dobra, onde ninguém via. O painel usa até 75% da altura.
  - **Propriedades** lê-se como o filtro que é: "Área de [mínimo] a [máximo] ha". Antes eram um título longo ("Tamanho das propriedades"), uma linha de apoio e dois campos soltos: a pessoa precisava ler três coisas para entender que era um filtro de tamanho. A frase "Vale para…" só aparece quando acrescenta algo (se a camada está desligada).
  - **Movimento dos painéis (8.1):** o painel nasce do botão do dock e os cartões entram em ordem de leitura; escolher um filtro move a frase de resumo (pisca), o contador do dock ("pop") e a contagem (fade) no mesmo instante, e o "Escolher datas" cresce em altura com o chevron girando. Tudo respeita `prefers-reduced-motion`: sem animação, mas as trocas e as frases continuam.
- **Ferramentas de modo: só uma ativa por vez.** Medir (Distância, Área) e Consultar (Coordenadas, Propriedade) abrem um menu para cima. O botão do grupo acende e passa a dizer o nome da ferramenta ("Distância"). Escolher a ativa de novo desliga. Motivo: duas ferramentas ao mesmo tempo disputavam o clique e o cursor.
- **Faixa de modo** acima do dock: diz o que o clique faz agora ("Clique no mapa para marcar o primeiro ponto."), mostra o resultado (distância, área, coordenada com **Copiar**) e leva a saída (**Concluir**, **Limpar**, **Sair · Esc**). Esc sai de qualquer ferramenta; no celular o Concluir substitui o clique direito. O cartão da propriedade abre logo acima da faixa; tocar numa propriedade também a escolhe. A faixa some enquanto um painel está aberto (disputariam o mesmo lugar). O leitor de tela só ouve "Ferramenta ativa: …": o número muda a cada movimento do mouse.
- **Taxonomia (onde cada coisa nova entra):** uma camada nova vai em Camadas; um filtro novo em Filtros; uma ferramenta que muda o clique em Medir ou Consultar; uma ação que leva algo para fora (exportar) junto de Imprimir; uma coisa da câmera no cartão da câmera.

⚠️ **Limites de zoom por serviço** (medidos em Bonito/MS): acima do último nível com dados, a Esri devolve um tile-placeholder "Map data not yet available". Definir `maxzoom` da fonte em: NatGeo 12, Topo 16, Ruas 16, Satélite 17, Cinza 11. (No produto hoje: o Satélite usa 17 na fonte e 19 no zoom máximo do mapa.)

---

## 14. Referência viva e escolha final

O laboratório `/dev/design-lab` (branch `proto/design-lab`, descartável, nunca vai para a `main`) é a referência visual e de comportamento enquanto as telas não são migradas. Depois da escolha abaixo, ele ganhou as seções **Estados** (2.1.1, com comportamento, som e continuidade 8.4) e **Voz e tom** (3.2). A escolha final do projeto, no formato de URL do laboratório:

```
f=plex w=600 g=white t=ink r=b s=shadow d=comfy i=a c=viva e=focus z=historico
hot=green hg=forest sp=on db=on v=c b=b a=tactile o=tabler x=prisma-aurora
q=none l=entrada u=soft n=d k=a y=tech p=a m=ofm-mineral j=tilt3d h=medium
```

Atmosferas testadas, para registro: **Natureza** (terrosa: lia como papel, rejeitada), **Instrumento** (tudo em cinza: apática, rejeitada) e **Instrumento vivo** (moldura fria e precisa com conteúdo vivo: **escolhida**).

### 14.1 Onde cada decisão já está no código

| Já no código (PR 1) | Ainda só no laboratório |
|---|---|
| Tokens de cor, de dados, raio, sombra e fontes (`app/globals.css`, `@theme static`) | **Sons** (9): a política de som no produto está em aberto (pendência 4) |
| Fontes IBM Plex Sans e Mono; Inter, JetBrains, Noto e Playfair removidas | **Cursor Prisma aurora** (10) fora do mapa (no mapa principal já está) |
| Sem modo escuro (446 classes `dark:` removidas) e sem os tokens brand/pantaneiro | **Onda do clique, animação de menu, diálogo e abas** (8.1) |
| Botão "Tátil", card branco com sombra, campo com borda Pedra e foco de 3 px, badge sem pílula, esqueleto com brilho, toast (12) | **Componente de estado** (`StateBlock`) e as transições `Swap` e `Collapse` (2.1.2, 8.4) |
| Cursor de clicável, títulos 600, números em mono, movimento reduzido (globais) | **Critério de severidade, KPI em foco, gráfico "traço técnico"** (7) |
| Nada pulsa em loop; "Sala de Situação" fora da interface | **Ícones Tabler** (11; hoje lucide) |
| Teste `design-guard`: o design antigo não volta | |
| **Mapa principal** (13): base Mineral, relevo, abertura em 2D (3D por escolha), segmento 2D/3D com modo salvo, **dock, painéis, câmera e ferramentas (13.1)** e **cursor Prisma aurora** (10) | O hover e o modal das feições, a tela de erro do mapa inteiro e as cores do desenho de medição (17.16) |

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
| Mineral como base padrão do mapa (por agora) | Sobre o Mineral claro, o dock branco e os dados se perdiam; o padrão passou a Satélite suave (13). O Mineral segue como opção. A linha acima (satélite cru como padrão) continua rejeitada: o que voltou foi o satélite **dessaturado**, que deixa os dados em primeiro plano |
| Títulos de cartão em caixa-alta pequena e janelas inteiras em branco | Pesavam menos que o corpo, escondiam a hierarquia e davam tontura; ver 6.2 |
| `<select>` nativo e datas empilhadas em duas linhas nos filtros | O nativo abre com o visual do sistema; as duas linhas pareciam abruptas. Substituídos pelos componentes do projeto e por uma linha só (13.1) |
| Legenda de camada que pintava o contorno como preenchimento | Nascentes aparecia em branco sobre branco e Bacia/Município como quadrado cheio, mas o mapa desenha outra coisa; ver 6.2 |
| Basemap Dark Matter | Sem dark mode, perde o sentido |
| Controles espalhados pelos quatro cantos do mapa, com formas e bordas diferentes e posições fixas em pixel | Sem plano: a pessoa procurava o que queria e os cartões se sobrepunham. Substituídos pelo dock e pela câmera (13.1) |
| Painel Camadas escuro (grafite com texto claro) | Dois jeitos de ler painel no mesmo produto; a moldura é branca (4) |
| Véu escuro "Atualizando dados…" sobre o mapa | Travava o que a pessoa queria ver; o andamento agora é por camada (13.1) |
| Acordeões aninhados, caixa de seleção pequena e "Mostrar todas" na lista de camadas | Três níveis para umas 12 linhas; a lista plana com interruptor mostra tudo e liga na hora (13.1). Ligar tudo de uma vez travava o mapa |
| Botão "Aplicar" nos filtros | Etapa a mais; os filtros aplicam na hora (2.2) |
| Seletor de bases solto no topo e botão Atualizar solto | Passaram para dentro de Camadas, onde a pessoa os procura (13.1) |
| Mapa abrindo em 3D por padrão | O relevo 3D pesava no aparelho; o padrão passou a 2D e o 3D ficou como escolha salva (13) |
| Cursor de mão nativo como único | Queríamos uma marca também no cursor |
| Mais de um verde "sem papel" (musgo `#2B4234`) | Lia como oliva escuro; ficou o Floresta |
| Seletor de tema (`next-themes`) e a variante `dark` dos gráficos | Sem modo escuro; o seletor nunca foi usado |
| Tokens `hsl(var(--x))` e as variáveis HSL (`--primary: 217 91% 60%`…) | Os tokens agora são cores diretas; o tom era o azul da marca antiga |
| `primary-dark/forest/green/lime/yellow` e `brand-whatsapp` | Nunca foram usados |
| Esqueleto e pontos "ativo" pulsando (`animate-pulse`) | Pulsar em loop é proibido (8.2); o esqueleto usa brilho |
| Toast verde sólido | O toast é cartão branco com borda na cor do alerta (12) |
| Estados com ilustração, título, frase e botão **iguais** em todos | Genérico, "sem alma, sem intenção"; ver 2.1.1 |
| Primeira folha de ilustrações dos estados (monocromática, só verdes) | Substituída por decisão do responsável de design pela folha colorida (`public/estados-novos.png`) |
| Mudança de conteúdo "de uma vez" (o bloco troca sem caminho) | O usuário não entendia o que tinha acontecido; ver 8.4 |
| Ilustração do teclado com a tecla ausente (no "não encontrado") | Estilo diferente do resto da folha; o "não encontrado" usa a caixa vazia, igual ao vazio |
| `alt` descrevendo a ilustração | Ruído para o leitor de tela: a mensagem já está no texto |
| Borda dos campos `#CDD1CC` e trilho do toggle `#CFD4CF` | 1,55:1 sobre branco; exigem 3:1. Trocados pela Pedra |
| Direções de voz "Instrumento claro" (sóbrio, só afirma) e "Parceiro de trabalho" (liga o aviso ao relatório/laudo) | O responsável de design preferiu o "Colega de campo"; ver 3.2 |

---

## 16. Armadilhas técnicas

Descobertas na prática; valem para quem implementar.

- **Tailwind v4:** os tokens são `--color-*` em `@theme static` (cores diretas). Para sobrescrever num elemento filho, sobrescreva `--color-*`. O v4 **zerou o `cursor: pointer` dos botões**: a regra global do `globals.css` cobre tudo que é clicável.
- **`@theme static`:** sem o `static`, o Tailwind só emite as variáveis que aparecem em classes; os gráficos usam `var(--color-crit)` em strings e ficariam sem cor.
- **`@source not`:** o Tailwind varre o projeto inteiro, inclusive `.agent`, `.claude` e `docs`, e gerava classes `dark:` a partir de documentação. O `globals.css` exclui essas pastas.
- **Teste `design-guard`** (`lib/__tests__`): o limite de paleta e hexadecimais por arquivo só desce. Quem migrar uma tela roda `UPDATE_DESIGN_BASELINE=1 npx jest lib/__tests__/design-guard` para registrar o progresso.
- **Transições no Tailwind v4:** `hover:-translate-y-px`, `-translate-x-1/2` e `active:scale-*` usam as propriedades CSS próprias `translate` e `scale`, **não** `transform`. Uma lista como `transition-[background-color,transform]` não as cobre e o movimento **estala** em vez de deslizar. Foi o motivo de o hover e o clique dos botões "não serem suaves". Use `transition-transform` (que no v4 cobre `transform, translate, scale, rotate`) ou liste `translate` e `scale`. Regras CSS fora de `@layer` (como `.panel-rise`) vencem as utilidades do Tailwind: não as aplique a um filho direto que tenha o próprio hover.
- **Botão `aria-disabled`:** o variant `default` já trata `aria-disabled` (sem movimento, 45% de opacidade); `disabled` continua existindo mas esconde o cursor.
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
5. **Segunda onda** (fora do escopo atual): impressão e PDF, e-mails, manifest do PWA, mapa em Leaflet legado, reescrita dos textos existentes no tom da seção 3, vetorização do logo. Específicos (ticket #69): `manifest.json` (nome "Registro de Javali - PRISMA", `theme_color` verde antigo) e as cores do e-mail em `lib/email/resend.ts`.
6. **Landing:** só troca de cores; layout e textos ficam como estão.
7. **Teste existente falhando**, sem relação com design: `maplibre-layer.test.ts` (`resolveLayerType`).
8. **Estados: desenhados e vistoriados no laboratório (ticket #68), ver 2.1.1 e 2.1.2.** Vistoria feita em três frentes: (a) **código e cálculo** (contrastes medidos, foco, avisos, movimento reduzido); (b) **verificador automático axe-core 4.13.0** (regras WCAG 2.0, 2.1 e 2.2 nível AA mais boas práticas) rodado em Chrome real, com movimento reduzido, em **24 telas e estados** (todos os vazios, erro antes e depois da falha, carregando em 3 momentos, parcial, bloqueado nos dois lados, sem permissão, desatualizado em 3 momentos, ação destrutiva com o toast, sucesso e "Voz e tom"): **0 violações**; (c) **foco por teclado**, medido: depois de uma troca de bloco o foco fica no bloco novo (não no início da página) e, ao remover, vai para "Desfazer". O axe só pega parte dos problemas: **falta um teste manual com leitor de tela** (anúncio das trocas e dos erros) e **migrar** os estados para as telas, uma por vez nos PRs de dashboard, mapa, admin e auth. Corrigido na vistoria: texto do chip no hover (4,47:1 passou a grafite), destaque que sumia com movimento reduzido, foco perdido quando o bloco sai de cena, região viva para o leitor de tela, `alt` das ilustrações, rótulo de placar que o leitor de tela ignorava. Limite conhecido: o "diálogo" de remoção do laboratório é um bloco em linha; no produto use o `Dialog` (que já devolve o foco a quem abriu).
9. **Auditar as telas atuais** com o checklist da seção 1.2 e a seção 2: onde há espera sem aviso, lista vazia sem explicação, erro sem saída, botão desabilitado sem motivo ou etapa que dá para eliminar.
10. **Cor das ilustrações dos estados.** A folha atual é colorida (marrom do café e da madeira, laranja da placa e dos avisos, azul do passarinho). A seção 4 diz "cor quente só para o crítico", mas as artes são conteúdo, não moldura. Decidir se isso fica como regra ("a ilustração é conteúdo, pode ter cor") e registrar o motivo.
11. **Ainda não portado do laboratório** (tabela da 14.1): sons, cursor animado fora do mapa, onda do clique, animação de menu, diálogo e abas, `StateBlock`, `Swap` e `Collapse`, critério de severidade e KPI em foco, ícones Tabler. O **mapa principal** já está no código (13 e 13.1), com os controles que flutuam sobre ele.
12. **Dependência `next-themes`** continua no `package.json` sem uso. Remover junto com a atualização de `bun.lock` e `package-lock.json`.
13. **Migração das telas.** A guarda registra o que falta: **110 arquivos. 1.381 classes de paleta e 434 cores hexadecimais**. Por área (classes / hex): admin 424 / 119, mapa 293 / 107, importação de GPX 219 / 0, dashboard e gráficos 191 / 131, outros 129 / 6, auth 106 / 0, landing 19 / 71. Os componentes base (`components/ui`) já estão zerados. Ordem do plano: PR 2 dashboard e gráficos, PR 3 mapa, PR 4 admin, PR 5 auth e landing; cada um zera o seu limite. Os neutros (slate, gray, neutral: 832 classes) viram tokens com pouca decisão; os tons de cor (azul 196, vermelho 141, verde 118, âmbar 113…) pedem decisão por tela (marca, água, severidade ou decoração), e em superfície escura o realce é `accent`, não `primary`.
14. **Textos de exemplo** (nome do administrador, números, horários, "CAR") são fictícios. Os que dependem de dados reais (último foco, quem administra, o que vai junto ao remover) precisam vir do sistema.
15. **Padrão do mapa: Satélite suave (por agora) ou Mineral** (13). O padrão passou a Satélite suave por decisão do responsável de design. Revisitar depois de uso real: se os dados e os controles seguirem em destaque, o Mineral pode ficar só como opção e o Satélite cru sair.
16. **Controles do mapa: o que ficou para depois** (13.1). (a) **Movimento e som** do dock, dos painéis e da faixa: o painel (abre, fecha, cartões em cascata), o recolher, o contador e a frase de resumo já têm movimento (8.1); falta a entrada e a saída da faixa de modo (8.4), o movimento dos ícones do dock e os sons (9, política em 17.4). (b) **Ícones Tabler** com animação própria (11): o dock e a câmera ainda usam lucide. (c) **Hora do dado e nova tentativa automática** ("Dados da plataforma · atualizados às 14:32"; regra 6 de 2.1), cortadas por ora: hoje a falha mostra a frase e o "Tentar de novo". (d) **Hover e modal das feições**, a **tela de erro** do mapa inteiro (ainda `bg-gray-100`) e as **cores do desenho de medição** (azul e rosa fora da paleta). (e) **Teste manual com leitor de tela** do dock, dos painéis e da faixa de modo, e em celular de verdade. (f) **Exportar** ainda não existe; quando existir, entra junto de Imprimir.

---

## 18. Como evoluir este documento

- Toda mudança de design **registra o motivo** aqui, na seção certa, e se algo foi removido, na seção 15.
- Antes de criar UI nova, passe pelo checklist da seção 1.2.
- Mudou uma decisão? Não apague a antiga: mova para a seção 15 com o motivo.
