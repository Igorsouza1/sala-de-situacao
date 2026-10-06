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

## Leia primeiro

> **Para construir ou mexer em qualquer tela, leia esta página e a receita (seção 19) do que for construir. O resto do documento é consulta.**
>
> Esta página existe porque as mesmas correções foram pedidas várias vezes: *"faz o usuário pensar"*, *"está carregado"*, *"sem espaço"*, *"sem hierarquia"*, *"não faz movimento suave"*. Os princípios da seção 2 estavam certos, mas eram abstratos demais para se aplicar sozinhos: dá para responder "sim, está simples" a qualquer tela. Aqui cada princípio virou uma **regra com um teste** que se aplica olhando a tela, e cada regra aponta o **caso real** que a originou (seção 20).

**Como trabalhar, nesta ordem:** (1) escolha a **receita** da seção 19 que mais se parece com o que vai construir; (2) construa com as **réguas** da 6.3; (3) rode a **auditoria** da 1.3 e **diga o resultado, regra por regra**; (4) se a pessoa repetir uma correção, **pare e registre a causa** (seção 20 e, se for geral, esta página) antes de corrigir a tela.

| # | Regra | Como testar (passa ou não passa) | Detalhe e caso |
|---|---|---|---|
| 1 | **A tela pensa; a pessoa só escolhe.** | Conte as escolhas visíveis num cartão: **no máximo 3**. Procure número, unidade ou código na tela (px, %, hex): **nenhum**. O padrão certo já vem marcado. | 2.2, 13.3 · C4, C11, C13 |
| 2 | **Tudo tem um motivo dito numa frase.** | Para cada elemento, complete "isto existe para ___". Sem frase, sai. | 1.2, 13.3 · C10 |
| 3 | **Um tipo de controle, sempre no mesmo lugar.** | Desenhe as colunas da lista: o mesmo controle cai na **mesma coluna em todas as linhas**? O que só existe em algumas linhas toma o lugar de algo que existe em todas? | 6.2 regra 8 · C1, C9 |
| 4 | **Hierarquia visível sem ler.** | Desfoque a tela: dá para ver onde cada assunto começa e termina? Base cinza suave, cartão branco **com título**, 3 tamanhos de texto. **Janela toda branca não passa.** | 6.2 · C2, C3 |
| 5 | **Respiro por régua, não por impressão.** | Meça com a 6.3 (texto empilhado 2 a 4 px, entre cartões 16, antes de barra de ação 24 a 32, linha clicável ≥ 48). Margens verticais vizinhas **colapsam**: espaço novo tem que ser maior que o do vizinho, ou ser *padding*. | 6.3, 16 · C3, C16 |
| 6 | **Cabeçalho leve.** | Título em **uma linha**, nunca quebra. No máximo **2 ações além de fechar**. Se não couber, tire uma ação do modo; não encolha o título. | 6.3, 19.2 · C17 |
| 7 | **O modo e o estado são ditos, em cor e em frase, sempre.** | Depois de qualquer ação (salvar, cancelar, voltar), a tela ainda diz em que modo está? Quem voltou de uma subtela sabe que não saiu do modo? | 19.5 · C14 |
| 8 | **O que abre algo diz que abre.** | Todo ícone tem rótulo escrito. O botão que abre uma escolha mantém o "+" e o rótulo **mesmo com um valor já escolhido**. | 6.2 regra 9, 11 · C10, C12 |
| 9 | **Nada pisca, nada brota.** | O que entra **cresce**, o que sai **encolhe e some**; texto novo faz **crossfade**; numa troca de modo, título, botões e corpo **se movem** (nenhum troca de uma vez); **todo clicável responde ao mouse**. | 8.1, 8.4 · C6, C7, C18 |
| 10 | **Tudo centralizado no eixo.** | Numa linha com ícone, texto, botão e contador, os **centros verticais coincidem**. Botão ao lado de texto de duas linhas fica no meio, não no topo. | 19.4 · C15 |
| 11 | **Componente do projeto, nunca do navegador.** | Nada de `<select>`, `type="color"`, `alert()` ou `confirm()`. **O design-guard barra isso sozinho.** | 6.2 regra 6 · C5 |
| 12 | **A amostra é o que o mapa desenha.** | Legenda com o mesmo preenchimento, contorno e transparência da camada; cor clara com fio escuro por fora; **branco sobre branco nunca**. | 6.2 regra 5 · C8 |
| 13 | **Desfazer vale mais que confirmar.** | Ação que muda algo compartilhado mostra o **aviso no alto com contador de 10 s** em vez de perguntar "tem certeza?". | 12, 13.3 · C15 |
| 14 | **Antes de entregar, auditar.** | A auditoria da 1.3 foi feita **e dita**, regra por regra. | 1.3 |

**Em dúvida entre duas soluções**, fique com a que tem **menos coisas na tela e mais espaço**. Se uma regra precisar ser quebrada, registre a **exceção** antes (1.3). Se um caso novo não cabe em nenhuma regra, **a regra é que muda**.


## 1. Como usar este documento

### 1.1 O que fazemos quando uma coisa não funciona

- **Remove-se** o que não tem objetivo claro. Foi assim que saíram a luz que seguia o mouse, o ponto "ao vivo" que pulsava e as texturas.
- **Ajusta-se** o que obriga o usuário a pensar. Foi assim que "média ago/2020–24: 1,55 m" virou "Normal para agosto: 1,55 m".
- **Nunca se deixa** algo "porque já estava lá" ou "porque outros produtos têm".

### 1.2 Checklist obrigatório para qualquer UI nova

Responda antes de construir. Se uma resposta for "não sei", a coisa ainda não está pronta. **Este checklist é de antes. Depois de construir, vale a auditoria da 1.3**, que é objetiva (passa ou não passa) em vez de pedir uma opinião.

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


### 1.3 Auditoria antes de entregar

O checklist da 1.2 pede opinião ("dá para ser mais simples?"), e uma opinião sempre responde "sim". A auditoria pede **evidência**.

- **Quando:** depois de qualquer mudança de tela, **antes** de dizer "pronto". Não depois da correção de quem usa.
- **Como:** percorra as 14 regras da página "Leia primeiro". Para cada uma, **passa**, **não se aplica** (e por quê) ou **falha** (e o que foi feito). Corrija as falhas antes de entregar.
- **Como dizer:** a resposta final traz um bloco **"Auditoria"**, uma linha por regra que se aplica, com a evidência (a medida, a classe, a ordem das colunas). Em mudança trivial (um texto, uma cor), uma linha basta: "Auditoria: a estrutura não mudou; regras 4, 5 e 9 conferidas." **Nunca "está pronto" sem isso.**
- **O que a auditoria não vê:** quem audita pelo código **não vê a tela**. Por isso as regras dizem **o que medir** (réguas, ordem dos elementos, classes) e o resultado é dito com honestidade: "conferido no código; falta olhar na tela". O teste visual final é de quem usa, e a auditoria reduz o que chega até ele.
- **Exceção:** se uma regra precisar ser quebrada, registre **antes**, num caso da seção 20 ou na seção do componente: "Exceção à regra N: o quê, por quê, até quando". Exceção não registrada é falha.
- **Trava automática:** o `design-guard` barra o que é mecânico (regra 11 e a armadilha do v4, seção 16). O resto, que é o que mais custou, só a auditoria pega.
- **Repetiu uma correção?** Pare e registre, nesta ordem: (a) o **caso** na seção 20, com sintoma, causa e regra; (b) se a regra era vaga, **mude a regra** (ela é que falhou); (c) só então corrija a tela.

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
- **Controles que pedem número saem; entram palavras.** O editor de camada pede **uma cor** e três escolhas em palavras ("Só contorno · Suave · Cheio", "Fina · Média · Grossa", "Pequeno · Médio · Grande"). A tela traduz em números, deriva o contorno da cor e recolhe o que quase nunca muda em "Mais opções" (13.3). Saíram por obrigar a pensar: pixels, porcentagens, código hex e dois campos de cor.
- **A tela mostra o que a pessoa não precisa procurar.** Se a camada que ela edita está desligada, a tela a mostra no mapa só durante a edição e diz isso. A frase "Vale para todos que veem esta região." fica sempre junto do Salvar.

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
8. **Colunas alinhadas: cada controle fica sempre no mesmo lugar.** Numa lista de linhas parecidas, o mesmo tipo de controle ocupa a mesma coluna em todas (o interruptor é sempre o último, à direita). O que existe só em algumas linhas (a seta de expandir) **não toma o lugar do que existe em todas**: vai junto do nome, de onde se lê "isto abre", e as linhas-filhas recuam só o nome e a amostra. Motivo (teste da lista de camadas): a seta ao lado do interruptor empurrava o interruptor 40 px nas linhas com grupos, e onde a pessoa esperava um interruptor havia uma seta.
9. **O que abre outro controle diz que abre, sempre.** Um botão que leva a uma escolha mantém o ícone e o rótulo à vista **mesmo depois de a pessoa já ter escolhido algo**. Motivo (teste do seletor de cor): com uma cor própria escolhida, o quadrado virava só mais uma cor, e a pessoa achava que não dava para escolher outra. Agora o botão traz um "+" e o rótulo ("Outra cor", e "Mudar" quando há uma cor própria).

10. **Um eixo à esquerda por cartão.** Todo texto de um cartão começa na mesma linha vertical: com um ícone ao lado, o ícone ocupa a primeira coluna e **tudo** (título, apoio, status, data) cai na segunda; o que vem embaixo não volta para a borda do cartão. Um selo com fundo (chip) **desloca o texto** para dentro e quebra o eixo: o status é a palavra seguida de um ponto colorido, sem caixa, para o texto ficar no eixo. Motivo (caso C21): "Em recuperação" parecia desalinhado porque estava num chip, 8 px para dentro do título.
11. **Texto escrito por gente é arrumado na tela, nunca mostrado cru.** Nomes e tipos vêm digitados por pessoas ("limpeza de ACEIRO", "recuperação DE mata"). A tela mostra **a primeira letra maiúscula** e palavras longas em CAIXA-ALTA em minúscula (siglas de até 3 letras ficam: MS, CAR), pelo helper `tidyText`. O dado no banco não muda. Motivo (caso C21).
12. **Título de cartão em uma linha.** Nome comprido termina em reticências; o nome inteiro está no modal. Título que quebra desfaz a hierarquia (C21).
13. **Ícone de reserva nunca aparece.** Se a tela mostra o ponto genérico no lugar do ícone da ação, é defeito, não padrão: a causa é buscar o estilo por outro caminho que o do mapa. Quem desenha o ícone lê o **mesmo** estilo do mapa (C20).
14. **Número nunca vem sozinho.** Todo número diz **o que conta** ("25 ações", não "25") e, quando há o que ver dentro dele, **mostra o que tem lá sem exigir clique** (cartão de hover). Motivo (caso C22).

### 6.3 Réguas numéricas: o que "respirar" e "ser leve" medem

"Respire" e "está carregado" não são medidas, e cada pessoa lê de um jeito. Estas são. **Meça antes de dizer que passou** (regras 4, 5, 6 e 10).

| O que medir | Valor | Por quê (caso) |
|---|---|---|
| Texto empilhado (nome e frase de apoio) | **2 a 4 px** um do outro, nunca colados | Colados não têm hierarquia (C3) |
| Linha clicável | altura **≥ 48 px**, com `py-2` por dentro | Alvo de toque e respiro (C3) |
| Qualquer alvo de toque | **≥ 44 px** | Celular em campo |
| Dentro do cartão | **16 px** de borda; **12 px** entre o título e o conteúdo | 6.2 |
| Entre cartões | **16 px** | 6.2 (C2) |
| Entre grupos de controles no mesmo cartão | **20 a 24 px** | Uma pergunta não pode encostar na outra (C11) |
| Antes de uma barra de ação ou rodapé | **24 a 32 px**, mais uma sombra leve se ela for fixa (`sticky`) | O `mt-2` que não aparecia (C16) |
| Cabeçalho de painel | **1 linha**; título com `whitespace-nowrap`; **no máximo 2 ações** além de fechar | O título que quebrava (C17) |
| Escolhas visíveis por cartão | **no máximo 3** | O editor com 7 controles (C11) |
| Amostras de cor visíveis | **no máximo 12** (a paleta mais "Outra cor") | C11 |
| Menor texto | **12 px** (só apoio); corpo **14 a 15 px** | 5 |
| Raios | **4 / 6 / 10 px** (campo e botão / controle / cartão e painel) | 6 |
| Tempos de movimento | abrir **240 a 260 ms** com mola; fechar **150 ms**; recolher e crossfade **300 a 320 ms**; aviso entra **400** e sai **190**; contagem de desfazer **10 s** | 8.1 |
| Alinhamento | **centros verticais coincidem**; botão ao lado de texto de 2 linhas fica **no meio** | O "Desfazer" colado no topo (C15) |

**Duas regras de CSS que enganam a régua:** (1) **margens verticais vizinhas colapsam**: um `mt-2` dentro de um `space-y-4` some, porque o espaço que vale é o maior (16), e não a soma. Para espaço novo, use um valor **maior que o do vizinho** ou `padding`. (2) `overflow: hidden` num ancestral **quebra** o `sticky` (ele passa a grudar na caixa, não no painel): use `overflow: clip`.

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
| Aviso com desfazer ("Salvamos…") | Entra **de cima** com mola (400 ms) e sai deslizando para cima (190 ms). Um **anel de contagem de 10 s** se esvazia com o número dentro; **pausa** com o mouse ou o foco no aviso. Ao desfazer, o mesmo cartão troca o texto ("Desfeito") em vez de sair e voltar | Brotar do nada deixava a pessoa sem saber de onde veio (8.4); o contador mostra quanto tempo falta sem pedir que ela conte |
| Linha da camada recém-editada (e recém-desfeita) | Pisca em verde claro e se apaga em 1,9 s (8.4) | A pessoa liga o "Salvei" à linha que mudou |
| Seletor de "Outra cor" | Abre a partir do botão, nascendo pequeno com a mola do projeto (260 ms) e sai em 150 ms. Em **Cores**, os tons **escorrem** de uma cor para a outra (300 ms) quando a matiz muda; trocar entre **Cores e Livre** anima a altura (320 ms); setas movem a escolha | A pessoa vê de onde o cartão veio e acompanha cada mudança, e o seletor tem a mesma linguagem do resto da marca |
| Botões do dock (Camadas, Filtros, Medir, Consultar, Imprimir) | O botão sobe 1 px e **cada ícone se move do seu jeito**, com a mola do projeto (300 ms): as **camadas sobem**, o **filtro desliza**, a **régua se inclina**, a **mira gira um quarto de volta**, a **folha da impressora desce**, a **lupa do Explorar cresce** | Confirma que é clicável e dá personalidade ao ícone (8.1, ícones). Antes o dock não respondia ao mouse |
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
| Um painel troca de visão (lista → escolher o que editar → editor) | A visão que sai **some em fade enquanto encolhe**, a que entra **aparece enquanto cresce**, e a altura do painel acompanha; a rolagem volta ao topo, suave | 320 ms |
| O cabeçalho do painel muda de modo ("Camadas" → "Editar camadas") | O título faz **crossfade** (um sobe e some, o outro sobe e aparece, no mesmo lugar, sem quebrar em duas linhas); o lápis **cresce em largura**; o botão "Editar" vira "Concluir" trocando rótulo e ícone em crossfade, com a cor passando do neutro ao verde cheio; o "Atualizar" **encolhe em largura e some**, e os vizinhos deslizam para o lugar | 300–320 ms |

Regras:
1. O **destino da ação mostra a mudança no mesmo instante** em que o resultado aparece (o botão vira "Salvo" quando o bloco de erro some).
2. Elementos que estão saindo ficam **inertes**: não recebem foco nem clique.
3. `prefers-reduced-motion`: as trocas continuam acontecendo, sem animação, mas o destaque (verde claro) e o texto que explica o que mudou **permanecem**.
4. Isso não permite animar à toa: se não há "de onde" e "para onde", não há movimento.
5. **Nada nasce nem some de um instante para o outro, nem num cabeçalho.** Títulos, botões e visões do corpo entram e saem visivelmente: o que sai encolhe e some, o que entra cresce, e os vizinhos deslizam para o lugar. Trocar um conteúdo por outro de uma vez ("piscar") é o erro que esta seção existe para evitar. Motivo (teste do modo Editar): o título, o botão e o corpo do painel trocavam de uma vez, e a pessoa via "tudo alterado" sem ver o caminho.

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
- **Rolagem:** a barra de rolagem **nativa** do navegador não aceita `cursor: none`, então sobre ela volta o cursor do sistema (C27). Os painéis do dock usam `OverlayScroll` (`components/ui/overlay-scroll.tsx`): a barra nativa some e uma barra fina do projeto, sobreposta ao conteúdo, aparece ao rolar e ao chegar o mouse; o polegar se arrasta e a trilha se clica, e tudo isso é elemento do site, então o prisma continua sobre ela. A rolagem em si é a do navegador (roda, toque e teclado). Rolagens fora dos painéis (modais, listas soltas) ainda têm a barra nativa.
- **Mira de medir e de inspecionar coordenadas:** sobre o mapa, o cursor some e fica o `crosshair` do navegador. Motivo: a mira precisa de um ponto exato, e o prisma não tem centro.
- **Feição clicável no mapa** (foco, propriedade) vira o estado clicável, igual a um botão: o MapLibre sinaliza por estilo do canvas, não por elemento, então o cursor lê esse estilo.
- **Cores do degradê** vêm dos tokens, não dos hex do laboratório: ocre → `warn`, terracota → `crit`, verde → `mineral`, ardósia → `map-water-text`. Motivo: o `design-guard` barra hex novos; o ocre e o terracota ficam um pouco mais vivos que no laboratório.
- Fora do mapa o cursor ainda é o do sistema (resto do site em 17.11).

---

## 11. Ícones

**Tabler**, traço de 1,75 (`@tabler/icons-react`). Os **ícones das camadas e das ações** já são Tabler (13.6); os controles do dock e da câmera ainda usam Lucide (17.16b). Motivo: geométricos e firmes, combinam com a linguagem técnica. Foram testados Lucide (2 espessuras), Phosphor (6 pesos), Remix e Iconoir; o traço fino do Lucide ficou tímido e o cheio, pesado.

Cada conceito tem um ícone fixo (fogo, árvore, gota, pin, camadas, sino, download, busca, filtro, calendário, engrenagem, check, alerta, erro, info, fechar, carregando, seta). Ícone sempre acompanha um rótulo quando o significado não for óbvio.

---

## 12. Toasts

Cartão branco com sombra, ícone em círculo tingido, título e frase curta, **borda de 1 px na cor do alerta** (70%) para o estado ser lido sem ler o texto, **X funcional**. Entrada com mola, saída deslizando.

**Aviso com desfazer** (mapa, 13.3): é o toast do laboratório, no **alto e ao centro**, onde o olho já está depois de clicar em Salvar. Título curto na voz do produto ("Salvamos “Propriedades”"), uma frase de apoio e o botão **Desfazer**, com um **contador de 10 segundos** (anel que se esvazia, número dentro). Ele **para enquanto o mouse ou o foco estão nele**: ninguém deve perder a chance de desfazer por estar lendo ou por navegar com o teclado (9). O leitor de tela ouve "Dá para desfazer por mais N segundos" uma vez, não a cada tique. Tudo no cartão (contador, texto, botão e X) fica **centralizado na vertical**: o botão não pode ficar colado no topo enquanto o texto ocupa duas linhas. Sem desfazer, o aviso some sozinho em 5 s (9 s no erro). Motivo dos 10 s, e não os 8 s da remoção (2.1.1): a pessoa precisa olhar o mapa mudar e decidir; apagar dados é mais grave, mas aqui o aviso disputa a atenção com a própria mudança.

---

## 13. Mapa

- **Base padrão: Satélite suave** (por agora). Sobre o Mineral claro, o dock branco, os controles e os dados (fogo, desmatamento) se perdiam; sobre o satélite dessaturado eles se destacam sem o satélite cru competir com os dados. O **Mineral** continua no seletor: OpenFreeMap vetorial **recolorido na paleta** (4.4), com vegetação em verde suave, água em azul-ardósia claro e ruas brancas, e só é baixado quando alguém o escolhe.
- **Bases:** Satélite suave (padrão), Mineral, Satélite, Ruas e StreetMap, escolhidas dentro do painel Camadas (13.1). O Dark Matter saiu (seção 15). O **Satélite suave** é o mesmo satélite com `raster-saturation` −0,5, `raster-brightness-max` 0,88 e `raster-contrast` −0,15. Ele virou o padrão por decisão do responsável de design, **por agora** (17.15); se ele vencer de vez, o Satélite cru pode sair (uma base a mais é um controle sem motivo).
- **Se o Mineral não baixar:** o mapa cai sozinho para Ruas, o painel Camadas avisa "Mineral indisponível agora. Mostrando Ruas." e **o botão Camadas do dock ganha um ponto âmbar** (com o painel fechado, a troca silenciosa deixaria a pessoa sem saber). Ele **não volta sozinho**: o usuário escolhe o Mineral de novo. Motivo: trocar a base sem aviso, de novo, tira o controle de quem usa (2.1); e o mapa nunca fica sem fundo.
- **Relevo:** sombreado médio **só no Mineral, no Ruas e no StreetMap**. O satélite não tem: a foto já traz as próprias sombras e o sombreado as duplicaria. A elevação é a gratuita da AWS.
- **Abre em 2D na primeira visita** (o 3D pesava demais no aparelho). Quem escolhe 3D abre em 3D nas próximas: o mapa enquadra a região e inclina até **50°, girado −14°, com relevo 3D (exagero 1,8)** num **único movimento de ~1,2 s**, cancelável pelo primeiro gesto (8.4: o usuário vê de onde a câmera veio e para onde foi). Com `prefers-reduced-motion`, ela já nasce no destino. Motivo: dá profundidade e faz o território parecer território. **Quem já usou o mapa abre onde o deixou, sem esse movimento (13.2).**
- **Segmento 2D | 3D**, dentro do cartão da câmera (13.1). Motivo: nem sempre se quer 3D, e dois segmentos mostram o estado atual sem a pessoa pensar (2.2), ao contrário de um botão cujo rótulo é o destino.
  - O destaque troca no mesmo instante em que a câmera começa a se mover (8.4). Em 2D a câmera volta de cima e ao norte; o relevo 3D só desliga quando ela termina de achatar. O hillshade continua.
  - **O segmento segue a câmera:** inclinação acima de ~1° é 3D. Inclinar com o mouse ou clicar na bússola também troca o modo. Motivo: um segmento que diz "3D" com o mapa visto de cima mente.
  - **O último modo escolhido fica salvo no navegador** (`localStorage`, chave `prisma:mapa:modo`), por botão ou gesto. **A animação automática da abertura não grava.** Primeira visita: 2D. Quem escolheu 3D abre em 3D. Motivo: a escolha vale por navegador e aparelho, e não existe tabela de preferências do usuário no banco; criar uma migration por um valor só não compensa. Agora há mais preferências guardadas (13.2), e lá está por que elas seguem no navegador por ora.
  - Sem som por enquanto (política de som em aberto, pendência 4).
- **Camadas de dados:** focos (círculo crítico com contorno branco), desmatamento (âmbar a 55%), propriedade (contorno tracejado em verde mineral).

### 13.1 Controles do mapa

**Por que mudou:** os controles tinham crescido sem plano: filtros e Fauna no canto esquerdo, bases e 2D|3D no topo, ferramentas numa coluna à direita com posições fixas em pixel (o cartão de medição caía em cima do botão de coordenadas), Camadas num painel escuro embaixo. Uns eram redondos, outros quadrados, uns com borda, outros sem; os pop-ups saíam de lados diferentes. A pessoa precisava procurar o que queria. O mapa agora tem **dois lugares** e uma regra: o que se faz nos dados vai no dock; o que se faz na câmera vai no canto.

| Lugar | O quê | Pergunta que responde |
|---|---|---|
| **Dock** (embaixo, centralizado) | **Camadas** · **Filtros** · **Explorar** · divisor · **Medir ▾** · **Consultar ▾** · divisor · **Imprimir** | "O que está no mapa, o que estou vendo e o que quero fazer com ele?" |
| **Câmera** (canto superior direito, um cartão) | `+`, `−`, bússola, 2D\|3D | "De que ângulo e de quão perto?" |

- **Um estilo só** (`helpers/control-style.ts`): borda Névoa, fundo `card`, sombra `--shadow-control` (mais definida que a do card, que se perde sobre a base clara), raio de 6 px nos botões e de 10 px nos painéis. Item ativo em verde claro, como as abas (6).
- **Rótulo sempre visível no dock.** Motivo: no celular não existe hover para o tooltip (11). Só a câmera, de ícones óbvios, usa tooltip. No celular o `+` e o `−` somem (a pinça já resolve) e o painel ocupa a largura toda acima do dock.
- **Painéis não bloqueiam o mapa** e abrem para cima, a partir do botão que os abriu; um por vez; fecham no X, no Esc ou ao abrir outro (8.4). O foco vai para o painel ao abrir e volta ao botão ao fechar (2.1.2, regra 8). O conteúdo continua montado mesmo fechado, para os filtros guardarem o que a pessoa escolheu.
- **Camadas:** em cima, o cartão do **mapa base** (miniaturas; a base é a camada de baixo); embaixo, **um cartão por categoria** de dados. O **Atualizar** fica no cabeçalho do painel, porque vale para todas as camadas (o rótulo muda no próprio botão: Atualizar → Atualizando… → Atualizado, 8.4). A **Fauna (javali)** deixou de ser um popover e é uma camada como as outras. A hierarquia segue a 6.2: painel em base cinza suave, cartões brancos, título de cartão em 14 px.
  - **Sem acordeão.** Eram três níveis (categoria → pasta → item) para umas 12 linhas: escondia mais do que organizava. Agora cada categoria (Operacional, Monitoramento, Base Territorial, Infraestrutura, Uploads) é um cartão sempre aberto. Só a camada com grupos (Ações, por eixo temático; a Fauna) expande, num único nível, por um chevron que **gira** e uma altura que acompanha (8.1).
  - **A linha:** `[amostra] Nome · 128 [interruptor]`, com no mínimo 48 px de altura. A **amostra** é a legenda, **fiel ao mapa** (preenchimento, contorno e transparência da camada, com um fio escuro por fora para cores claras, 6.2), e fica esmaecida quando desligada; o **número** é quantas feições estão no mapa; a **linha inteira** liga e desliga. Interruptor, não caixa de seleção: é ligar e desligar na hora. A frase do filtro vem logo abaixo do nome, a 2 px. **O interruptor é sempre a última coluna** (6.2, regra 8): a seta de expandir de Ações e da Fauna fica logo depois do nome, e as linhas dos grupos recuam só a amostra e o nome, com uma linha-guia à esquerda.
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
- **Taxonomia (onde cada coisa nova entra):** uma camada nova vai em Camadas; um filtro novo em Filtros; uma ferramenta que muda o clique em Medir ou Consultar; uma **busca ou lista de registros** (ações, propriedades) em Explorar; uma ação que leva algo para fora (exportar) junto de Imprimir; uma coisa da câmera no cartão da câmera.

⚠️ **Limites de zoom por serviço** (medidos em Bonito/MS): acima do último nível com dados, a Esri devolve um tile-placeholder "Map data not yet available". Definir `maxzoom` da fonte em: NatGeo 12, Topo 16, Ruas 16, Satélite 17, Cinza 11. (No produto hoje: o Satélite usa 17 na fonte e 19 no zoom máximo do mapa.)


### 13.2 Preferências do mapa

**Regra:** o mapa abre como a pessoa o deixou. **Só se grava o que ela escolheu**: abrir no padrão e sair não "congela" o padrão como se fosse escolha dela.

| O que fica salvo | Vale para | Como volta |
|---|---|---|
| **Camadas ligadas** (e as opções da Fauna) | cada região | Só as que ainda existem no catálogo. Camada nova abre desligada (a pessoa não a escolheu). Se tudo o que estava salvo sumiu, abre no padrão. Uma lista vazia salva ("Ocultar todas") é uma escolha e vale |
| **Mapa base** | todas as regiões | Só se a base ainda existe |
| **Filtros** | cada região | O período é salvo como **intenção** ("Hoje", "Esta semana", "Este mês", "Este ano", um ano, ou o intervalo livre) e recalculado a cada abertura; o tamanho, como foi digitado. "Limpar tudo" também é lembrado (abre sem filtro) |
| **Posição e zoom** | cada região, em cada aparelho | Só se a posição ainda cai dentro da região; senão, o mapa enquadra a região como na primeira visita. Abre direto no lugar, sem o movimento de enquadrar (8.4 não se aplica: não há "de onde" nem "para onde") |
| **2D \| 3D** | todas as regiões | Como em 13 |

- **Por que a intenção, e não as datas:** "Hoje" salvo como data abriria, na semana seguinte, mostrando um dia que já passou, o que engana (2.1).
- **Por que por região:** as camadas mudam de uma região para outra (e o admin troca por `?regiao_id=`); o zoom de uma não serve na outra. A base e o 2D\|3D não dependem do território.
- **Onde fica:** `localStorage`, num único módulo (`helpers/map-prefs.ts`; chaves `prisma:mapa:regiao:<id>` e `prisma:mapa:base`). Cada campo é validado na leitura: um valor estranho (versão antiga, edição à mão) vira "não salvo", nunca um erro.
- **Por que no navegador e não no banco:** (1) o zoom é **por aparelho** (o do celular não serve no computador); (2) abre sem esperar uma busca, então o mapa não pisca o padrão; (3) uma migration, um repository, um serviço, uma rota e as regras de tenant não compensam por ora. **Custo aceito:** as preferências não seguem a pessoa entre aparelhos, e num computador compartilhado quem usa o mesmo navegador divide as preferências. **Gatilho para migrar:** quando entrarem o modo do som (17.4) e a escolha do cursor (10), migra-se tudo junto para uma tabela por usuário; o mapa só troca o armazenamento do módulo.
- **Voltar ao padrão do mapa** (rodapé do painel Camadas): apaga o que está salvo e devolve camadas, base, filtros, 2D e posição a como o Prisma abre na primeira visita. O rótulo muda no próprio botão ("Voltou ao padrão") e a frase de baixo diz exatamente o que volta. Motivo: quem guarda o estado do usuário precisa devolver o controle a ele (2.1); sem isso, uma camada esquecida desligada ou um filtro antigo prenderiam a pessoa.
- **Enquadrar a região**, no cartão da câmera: devolve a vista da região inteira, no mesmo movimento da abertura. Fica bloqueado até a região carregar, com o motivo no tooltip. Motivo: o mapa agora abre onde a pessoa parou, e ela precisa de um caminho de volta.
- **A pessoa vê o estado restaurado nos próprios controles** (o contador de filtros no dock, a frase de resumo, os interruptores das camadas), por isso não há aviso extra na abertura.


### 13.3 Edição de camadas

**Regra:** quem cuida do território acerta, no próprio mapa, como cada camada aparece. A mudança é vista **antes** de gravar, vale para todos que veem a região, e dá para desfazer.

- **Quem edita:** o `owner` da organização dona da camada, ou o superadmin. Camada global (sem organização) só o superadmin. Quem não pode não vê o lápis, e o servidor confere o papel de novo. Motivo: quem cuida do território sabe como a camada deve aparecer, e uma das rotas antigas nem checava o papel.
- **Onde:** um botão **"Editar"**, com rótulo, no cabeçalho do painel Camadas (ao lado do Atualizar), só para quem pode. Ligado, a lista vira **"Escolha a camada que você quer editar."**: cada linha é um botão com a amostra, o nome e uma seta; sem interruptor, sem contagem. Escolher abre o editor dentro do painel, com o mapa à vista (ele entra pela direita e a lista volta pela esquerda, 8.4). "Concluir" sai do modo. **Não há um lápis em cada linha**: apertava a linha (seis elementos em 320 px), era um ícone sem texto (11) e pedia para a pessoa decifrar. A tela de admin deve usar o mesmo editor depois (17.18). **O modo fica dito o tempo todo** (2.1), em cor e em frase: o cabeçalho do painel passa a **"Editar camadas"**, com um lápis e fundo em verde claro; a lista de escolha abre com o aviso **"Você está editando as camadas. Escolha a que quer mudar. Quando terminar, toque em Concluir."**, que também diz o próximo passo; o botão vira **"Concluir"**, cheio em verde (é o que se aperta ao terminar); e o "voltar" dos editores diz **"Editar camadas"**, não "Camadas". Motivo (teste): depois de salvar ou cancelar, a lista de escolha parecia a lista normal, e a pessoa não sabia se ainda estava editando. O **"Atualizar" sai do cabeçalho enquanto se edita**: com o título "Editar camadas" e o "Concluir", o cabeçalho ficava pesado e o título quebrava em duas linhas. A troca do modo **se vê** (8.1 e 8.4): o título, o lápis, o botão, o Atualizar e o corpo do painel entram e saem em transição, e nunca de uma vez.
- **Pré-visualização ao vivo:** cada mudança aparece no mapa na hora e só é gravada em **Salvar**. Motivo: cor e espessura se decidem olhando o mapa, não um formulário. Enquanto há edição não salva, o botão Camadas do dock mostra o ponto âmbar.
- **A frase que não sai de vista:** "Vale para todos que veem esta região." fica junto do Salvar (a barra acompanha a rolagem). O Salvar bloqueado diz por quê ("Dê um nome à camada.", "Nada mudou ainda."), e o rótulo muda no próprio botão (Salvando…).
- **Depois de salvar:** o **aviso com desfazer** (seção 12), no alto e ao centro, com contador de 10 s; a lista volta com **a linha da camada piscando em verde claro** (8.4). Se a gravação falha, o rascunho **continua na tela**, com o motivo em frase ("O que você editou continua aqui.").
- **O que dá para editar (v1) e como a tela pensa por quem edita:** o editor mostra, no topo, a **amostra da legenda desenhada com o rascunho** e o campo do nome ("É assim que ela aparece na lista e no mapa."). Depois, **Aparência**: **uma cor** (a paleta, com o nome da cor ao lado; sem código hex) e, conforme o tipo, **uma ou duas escolhas em palavras**: polígono, "Preenchimento" (Só contorno · Suave · Cheio) e "Linha do contorno" (Fina · Média · Grossa); linha, "Linha"; ponto, "Tamanho" (Pequeno · Médio · Grande); ícone, a grade de ícones com o nome do escolhido. **A tela deriva o resto:** o contorno do polígono é a cor escolhida um tom mais escuro; a borda do ponto fica como está; os números (0,25, 2, 7…) são dela, não da pessoa. Um valor já salvo que não bate com nenhum degrau aparece marcado no mais próximo e só muda se a pessoa escolher outro. **"Mais opções"** (recolhido): "Aparece em" (a seção da lista) e "Já vem ligada". O **slug nunca muda** (o código decide comportamento por ele) e o tipo da camada também não.
- **Camada com áreas (Ações): o que se edita é o ícone de cada área.** Ações não é uma camada comum: ela é o interruptor que liga todas as ações, e dentro dela há áreas (os eixos temáticos), cada uma com o seu ícone no mapa. Editar "Ações" como um todo não faz sentido, então, no modo Editar, a linha dela **abre as suas áreas** ("Edite o ícone de cada área"), e cada área abre um editor de uma pergunta só: qual ícone, com a prévia igual ao marcador do mapa. O ícone vive na **regra por valor** do catálogo (`rules`), que é o que o marcador do mapa lê; o editor grava ali, sem mexer nas outras áreas, e a legenda das áreas passou a ler a mesma regra (antes lia um palpite por palavra no serviço, que podia divergir do mapa). **Não existe cor por área** no catálogo: todos os marcadores usam a cor da camada. A lista guarda quais camadas estão abertas, para não fechar quando a pessoa volta do editor (8.4). Nome e seção de Ações não têm editor por enquanto.
- **Camada desligada continua visível enquanto se edita:** editar o que não se vê é adivinhar. Em edição, a camada aparece no mapa mesmo desligada (e é buscada), e o editor diz: "Esta camada está desligada. Mostramos ela no mapa só enquanto você edita." Não altera o que a pessoa deixou ligado.
- **Cores: paleta curada, com nomes de cor e não de significado.** Terracota, Âmbar, Verde, Azul, Verde mineral, Verde floresta, Grafite, Cinza e Branco, lidos dos tokens (o catálogo guarda hex, mas o código não tem nenhum), mais **"Outra cor"**: um **cartão da marca** que abre a partir do botão (no lugar do seletor do navegador, que abre com o visual do sistema e sem movimento, 6.2 regra 6), com **dois modos**. **Cores** é o padrão e guia a escolha em dois passos: **Cor** (12 famílias) e **Tom** (5 degraus, do claro ao escuro), sem arrastar nada. **Livre** serve para qualquer cor: um quadrado de saturação e brilho, uma faixa de matiz e, só para quem já tem o código, o campo "Já tem o código da cor?" (aceita com ou sem #, em 3 ou 6 letras). Nos dois modos a cor vale na hora: o mapa já mostra. Trocar de modo anima a altura (8.4). O botão **mantém o "+" e o rótulo à vista** ("Outra cor"; com uma cor própria escolhida, o "+" vira um selo no canto e o rótulo diz "Mudar", 6.2 regra 9). Fora da paleta, a cor aparece em palavras ("Azul escuro"), não em hex. Os nomes **não** são "Crítico", "Atenção" e "Normal": a cor quente só significa crítico nos dados (4), e uma camada de estradas "Crítica" diria à pessoa que há algo crítico. Cada amostra tem um fio escuro por fora para o Branco e as cores claras aparecerem (6.2). Setas movem a escolha.
- **"Abre ligada" manda:** `true` ou `false` no catálogo valem; sem valor, vale a lista do código (Propriedades, Focos, Desmatamento e Ações, 13.1). Se nada ficou ligado, o mapa só liga tudo quando ninguém decidiu nada (uma região só com a Rede Amolar não tem as camadas-padrão); se alguém desligou tudo de propósito, abre vazio. As preferências salvas da pessoa (13.2) valem por cima. Nada mudou ao entrar no ar, exceto o **Município de Bonito, que já estava `true` no banco e passou a abrir ligado**.

**Por que a edição tinha que mexer na raiz (a aparência vivia em dois lugares):** o catálogo guarda a aparência no `baseStyle` (que o Leaflet e a legenda liam) **e** no `maplibre.paint` (que o mapa principal usa quando existe: 13 das 15 camadas). Editar só um não mudava o outro. A prova: a legenda de Propriedades dizia `#22c55e` e o mapa desenhava `#32a852`; e o editor antigo do admin gravava só o `baseStyle`, então a edição **não aparecia** no mapa principal.

- **Fonte única:** `lib/layer-style.ts`. Lê com a **mesma precedência do mapa** (`maplibre.paint` e `outlinePaint`, depois `baseStyle`), grava no `baseStyle` sempre e no `maplibre` **quando ele existe** (sem criar um que não havia), e preserva tudo o que não é aparência (`rules`, `popupFields`, `groupByColumn`…). Servidor, editor e legenda usam o mesmo código; a legenda passou a mostrar o que o mapa desenha (Nascentes deixou de aparecer branca: o miolo é azul e a borda é branca).
- **Rota única e validada:** `PUT /api/admin/layer-catalog/[slug]` (repository → service → rota fina). Valida cores hex, transparências, espessura, ícone e seção; devolve o `visual_config` novo para o mapa se atualizar **sem buscar de novo**. A rota `layers/[id]/visual`, que aceitava qualquer JSON, saiu.
- **Cache:** a API do catálogo é guardada por 2 minutos no navegador. Por isso o "Atualizar" ignora o cache; senão traria a versão de antes da edição.
- **Limite conhecido:** não há registro de quem editou e quando (17.18).

### 13.4 Cartão de hover das ações

- **Cartão de hover:** responde a uma pergunta, **"que ação é esta e em que pé está?"**, e só ela. Duas colunas: o **ícone do marcador** (mesma cor e mesmo ícone, 6.2 regra 5) à esquerda; à direita, **tudo no mesmo eixo** (6.2 regra 10): **nome** (14 px, 600, uma linha), a **área** (eixo temático, 12 px cinza-tinta), o **status** (a palavra, 14 px, seguida de um ponto colorido: é a segunda informação mais importante) e "Registrada em 12/03/2025" (12 px cinza-tinta). Rodapé: "Clique para ver os detalhes". Saíram do hover: caráter, tipo técnico, mês e atuação (estão no modal): cada linha a mais pede para a pessoa decifrar. Hierarquia: **nome → status → data**, em três pesos visíveis, sem tabela de rótulo e valor (rótulo à esquerda e valor à direita deixam o olho cruzar o cartão).
- **Um cartão por vez.** Quando a lista de uma pilha (13.6) está à vista, o cartão da ação que está por baixo não abre (C23).
- **Movimento:** nasce do marcador com mola, 120 ms depois de o mouse parar (passar rápido não pisca cartões). Foco por teclado abre o mesmo cartão.

### 13.5 Explorar

**Para que serve:** responder "o que existe aqui?". Lista as **ações** e as **propriedades** da região, deixa buscar por nome, abre um registro com o que ele é e onde fica, e o **desenha no mapa**. Veio da branch de desenvolvimento (a antiga "Consulta"), refeita com este documento: era um painel à esquerda com azul, hex e botões fora do padrão. **Nome:** "Explorar", e não "Consultar", porque o dock já tem **Consultar ▾** (as ferramentas de clique: coordenadas e propriedade). Dois botões com o mesmo nome obrigariam a pessoa a decifrar.

- **Onde:** painel do dock, ao lado de Filtros (receita 19.2), **mas aberto no canto esquerdo e não centrado no botão** (`side` no `DockPanelButton`), **com 26rem de largura**. **O painel nasce do botão do dock e viaja até o canto** (pequeno em cima do botão, desliza com a mola em 320 ms e volta em 200 ms): a pessoa vê de onde veio (8.4). Abrir no meio e aparecer no canto, sem caminho, parecia um defeito (C26). **Exceção à 13.1, registrada:** os outros painéis (Camadas, Filtros) mexem no que o mapa mostra e podem ficar no meio; o Explorar mostra um registro que a pessoa quer ver **no mapa ao mesmo tempo**, e um painel centrado cobria justamente onde o mapa se move (C25). Aberto um registro, o mapa o enquadra no espaço livre ao lado do painel (440 px de folga à esquerda; no celular, 60% da altura embaixo, com o painel limitado a 55% da tela). Valor desta decisão: o card e o mapa se veem juntos. Duas visões no mesmo painel, trocadas por `ViewSwap` (8.4): a **lista** e o **registro aberto**. A lista continua montada, então a busca, o filtro e a rolagem estão onde ficaram ao voltar.
- **Lista:** cartão "Buscar" com no máximo 3 controles: **Ações | Propriedades**, a **busca** e o interruptor **"Só nesta área do mapa"** (sempre na última coluna, 6.2 regra 8). A busca **aplica sozinha**, 350 ms depois da última tecla (2.2); Enter aplica já. Abaixo, o cartão dos resultados: título que diz o que se vê ("Ações da região" ou "Resultados para “aceiro”"), a ordem em uma frase ("As últimas registradas vêm primeiro."), e linhas de **64 px ou mais**: **ícone do marcador** (o do mapa, 40 px, 6.2 regra 5) · nome (14 px, 600, uma linha) · área e data (na propriedade, município e tamanho em hectares) em 12 px cinza-tinta · seta que se move no hover. Vinte por vez, com "Mostrar mais".
- **Estados** (2.1): carregando = esqueleto com a forma das linhas; erro = "Não foi possível carregar a lista. O que você digitou continua aqui." com "Tentar de novo"; vazio **diz por quê e leva ao próximo passo** ("Não encontramos “x”" → "Limpar busca"; "Nada nesta área do mapa" → "Ver a região inteira"). **Exceção à 2.1.2 (registrada):** o vazio ainda não tem ilustração, porque o `StateBlock` não foi portado (17.11); entra com ele.
- **Registro aberto:** o **mesmo desenho do cartão de hover** (13.4): ícone à esquerda e, no mesmo eixo, nome, área, status (palavra e ponto) e data; depois os cartões, **na ordem do que cada registro tem de mais importante**: na ação, "Onde fica" (município, bacia e a propriedade, que abre o registro dela) e "Sobre a ação" (a descrição); na propriedade, "Sobre a propriedade" (titular, tamanho em hectares, número do CAR) e depois "Onde fica". Duas saídas lado a lado: **Ver no mapa** (bloqueado, com o motivo no tooltip, se não há localização) e **Abrir dossiê** (o modal completo). Numa propriedade, o cartão "Ações nesta propriedade" lista as ações que cruzam o terreno.
- **O "voltar" diz para onde leva** (19.5): "Voltar às ações", ou "Voltar a Fazenda Santa Clara" quando a pessoa veio de outro registro dentro do painel. A trilha só vale para o que foi aberto lá dentro; um clique no mapa recomeça.
- **No mapa:** abrir um registro **leva o mapa até ele** (1,2 s, deixando-o fora do painel que abre embaixo) e o **desenha**: **troca de cor conforme a base** (`overlayInk` em `helpers/basemaps.ts`, lido por `useOverlayInk`): **no satélite**, claro com fio escuro (preenchimento branco a 30%, contorno branco, borda escura a 35% por baixo); **no Mineral, Ruas e StreetMap**, verde da marca a 22% com contorno verde e fio branco a 90% por baixo. Branco aparece no satélite e some no Mineral; verde aparece no Mineral e some no satélite (6.2, regra 5). Num ponto, um anel de 16 px em volta da ponta do pino. **Clicar numa ação ou propriedade no mapa abre o Explorar nesse registro**: o modal deixou de abrir no clique (continua no "Abrir dossiê"), e o rodapé do cartão de hover ("Clique para ver os detalhes") passou a ser verdadeiro.
- **Texto de gente** passa por `tidyText` (6.2 regra 11), e a data vem formatada do banco (`data_texto`): a data bruta muda de dia conforme o fuso.
- **Escopo e segurança:** a rota `GET /api/map/consulta` valida a consulta (zod), resolve o escopo da região (`resolveScope`, ADR 0010) e filtra ações pelo tenant e pela interseção com a região. Propriedades são dado de base, autorizadas pela interseção com a região.
- **Não veio da `desenvolvimento`** (ficou para fora de propósito): o cookie de região ativa do superadmin e as mudanças de `require-auth` e do `middleware`. Não são da consulta e mexem na autenticação, onde a `main` tem mudanças próprias (#75).
- **Teste:** a rota, o repositório e os textos (`helpers/explore.ts`) têm teste automático. Falta olhar na tela e com leitor de tela.

### 13.6 Pontos, pinos e pilhas

**Por que mudou (C26):** a primeira versão agrupava as ações em bolhas "25 ações". Foi refeita duas vezes (número solto, depois palavra e mancha) e a pessoa ainda precisava passar o mouse para saber o que era e ampliar para chegar nas ações: **o grupo era uma abstração**. Saíram a bolha, o cartão do grupo e a mancha. O que ficou é mais direto: ver cada ação.

- **Longe, ponto:** abaixo do zoom 13, cada ação é um **ponto de 14 px** na cor da área, com fio branco, **sem número**. A distribuição se lê de relance; passar o mouse mostra o cartão da ação (13.4).
- **Perto, pino:** a partir do zoom 13, o ponto vira um **pino com o ícone da área** (gota de 32 × 44 px, ícone de 16 px, **a ponta no local exato**). Um limite só, para a pessoa aprender uma regra ("chegando perto, aparece o ícone"); o pino cresce da ponta com a mola (240 ms). **Status em selo** no canto do pino (Identificado em âmbar, Em Recuperação em azul-água, Concluído em verde com check).
- **Mesmo lugar, pilha:** ações **exatamente no mesmo ponto** (até 1 m) dividem um marcador. O pino leva o selo **"+N"**. **Passar o mouse** abre a lista (só leitura); **clicar a deixa aberta**, com as linhas clicáveis, e escolher uma abre o registro no Explorar. Fecha no Esc ou clicando fora. A lista mostra até 6 linhas (ícone da área, nome, status) e "e mais N ações".
- **Ícones: Tabler** (seção 11), com traço de 1,75, num conjunto curado de silhuetas diferentes entre si (`helpers/layer-icons.ts`). O catálogo guarda o **nome** do ícone, não o desenho (hoje herdado do Lucide: "map-pin", "sprout"…): o mapa traduz o nome, sem migrar dados. Um teste garante que todo ícone que o editor oferece e todo nome em uso no catálogo têm desenho.
- **O desenho vale em todo lugar** (6.2 regra 5): marcador, cartão de hover, lista de pilha, Explorar, legenda e editor de ícones leem o mesmo mapa de nomes.
- **Por que HTML e não uma camada do mapa:** pino com ícone e selo é rico demais para uma camada; o custo (um elemento por marcador) é contido porque **só os da tela, com folga, existem**.

### 13.7 Mexer e se orientar

**Para que serve:** o mapa é o holofote, então mexer nele precisa ser fluido e a pessoa nunca deve se perguntar "onde estou?" ou "o que é esta cor?".

- **Movimento** (`helpers/map-feel.ts`, todos os valores num lugar só para ajustar olhando a tela): ao soltar o arrasto o mapa **continua deslizando** e desacelera (`linearity` 0,25, `deceleration` 1700, `maxSpeed` 1700; os padrões são 0,3, 2500 e 1400). **O zoom da roda e da pinça do trackpad tem movimento próprio** (`useSmoothWheelZoom`): cada giro soma a um **destino** de zoom (~0,28 níveis por giro de roda) e o mapa anda até ele a cada quadro, com alisamento **por tempo** (110 ms, igual em 60 e em 144 Hz) e **mantendo parado o ponto sob o mouse**. Motivo (C28): mudar só a taxa do zoom nativo do MapLibre não mudou nada que se sentisse; o suavizado dele é fixo. Como cada quadro termina um movimento, quem escuta `moveend` (gravar a câmera, reler a vista dos marcadores) espera 100 a 150 ms de mapa parado. O zoom do toque, o arrasto e o duplo clique seguem os do MapLibre.
- **Teclado:** **setas** movem o mapa (140 px, o dobro com Shift), **+** e **−** dão zoom (um nível, dois com Shift), **Home** enquadra a região, com 260 ms de movimento. A tecla é do mapa só quando **não é de outra coisa em foco**: campo de texto, menu, seletor, painel (onde a seta rola) e o modal ficam com ela (`mapKeyAction`). O atalho aparece no tooltip dos botões da câmera ("Aproximar (+)", "Afastar (−)", "Enquadrar a região (Home)"). O teclado do próprio MapLibre fica desligado: responderia junto e o mapa andaria em dobro.
- **Legenda e escala** (`MapLegend`): um cartão no **canto de baixo à direita, alinhado a 16 px da borda** (a mesma linha da câmera e da atribuição), logo acima do botão de atribuição; abaixo de 1120 px de largura sobe acima do dock, para não encostar nele. Só as camadas **ligadas**, cada uma com a **amostra igual ao que o mapa desenha** (6.2 regra 5): o **ícone das ações é o pino, em cor cheia com o ícone branco** (antes era só o contorno e a cor não aparecia). **Uma camada com áreas de ícone próprio (Ações) não ganha linha-mãe:** "Ações" não é nada que o mapa desenhe; o que se vê são os pinos de cada área, e a legenda lista as áreas. A Fauna mantém o nome como título, porque "Mapa de calor" sozinho não diz de quê. Recolhido, são as amostras numa linha (até 6 e "+N"); ao **passar o mouse, focar ou tocar**, abre com o nome de cada uma (14 px, linhas de 36 px, cartão de até 19rem), com a altura crescendo em 320 ms (8.4). Sem camada ligada, sobra só a escala. **Atribuição:** o botão compacto do MapLibre (obrigatório pelos provedores) foi refeito no estilo dos controles (36 px, borda, sombra, ícone de informação do projeto) e alinhado ao mesmo canto (C28).
- **Escala:** um traço com uma **distância redonda** (1, 2 ou 5 vezes uma potência de 10: "200 m", "2 km") para o zoom e a latitude de agora, de no máximo 96 px. Fica sempre embaixo no mesmo cartão. Motivo: sem escala, o tamanho de uma mancha de desmatamento ou de uma propriedade não se lê.

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
| Lápis em cada linha da lista de camadas | Apertava a linha, era um ícone sem texto (11) e pedia para decifrar. A entrada é um botão "Editar" com rótulo no cabeçalho do painel (13.3) |
| Controles de edição em pixels, porcentagem e código hex, e dois campos de cor para um polígono | Faziam a pessoa pensar e decifrar números (2.2, 3.2). Entraram uma cor, degraus em palavras e o resto derivado pela tela |
| Paleta de camada com nomes de severidade (Crítico, Atenção, Normal) | A cor quente só significa crítico (4); o nome enganaria. Agora os nomes são das cores |
| Aviso de salvamento no canto da tela, sem movimento | Brotava do nada (8.4, 12). Agora no alto e ao centro, com mola, contador de 10 s e saída deslizando |
| Seletor de cor do navegador (`<input type="color">`) | Abre com o visual do sistema e sem movimento, e pede para arrastar e decifrar (6.2 regra 6, 2.2). Substituído pelo cartão de cor e tom (13.3) |
| Seta de expandir ao lado do interruptor, empurrando-o | Nas linhas com grupos o interruptor ficava 40 px mais à esquerda, e onde se esperava um interruptor havia uma seta. Agora o interruptor é sempre a última coluna (6.2, regra 8) |
| Abrir "Ações" como se fosse uma camada comum no modo Editar | Ações é só o interruptor das suas áreas; o que tem ícone próprio é cada área. A linha abre as áreas (13.3) |
| Editor de camada do admin que gravava só o `baseStyle` | O mapa principal desenha com o `maplibre.paint`: a edição não aparecia. Substituído pelo editor único no mapa (13.3) |
| Rota de edição visual de camada que aceitava qualquer JSON (`z.any()`) e exigia só superadmin | Sem validação e sem a regra de quem pode editar; substituída pela rota única `layer-catalog/[slug]` (13.3) |
| Legenda de camada lida só do `baseStyle` | Divergia do mapa (cor de Propriedades) e pintava o contorno branco de Nascentes como miolo; ver 13.3 |
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
- **Margens verticais colapsam.** Duas margens verticais vizinhas viram uma só (a maior). Um `mt-2` ao lado do `space-y-4` não somava nada; foi por isso que o espaço pedido "não aparecia" (C16). Use `padding` ou um valor maior que o do vizinho (6.3).
- **`overflow: hidden` quebra `sticky`.** Ele cria um contêiner de rolagem, e a barra de salvar passava a grudar na caixa que recolhe, não no painel. Use `overflow: clip` (que não cria rolagem). Margens negativas também são cortadas pelo corte.
- **O Esc dos componentes por dentro.** Um seletor ou menu aberto (Radix) trata o Esc e chama `preventDefault`. O ouvinte global do painel precisa checar `!e.defaultPrevented`, senão o Esc fecha o seletor **e** o painel inteiro (C19).
- **Pop-ups por cima do painel.** O painel do dock usa `z-[1000]`; seletores, calendários e menus abertos por dentro precisam de `z-[1200]` ou ficam atrás dele.
- **Trava `design-guard` dos erros mecânicos** (`design-mecanico-baseline.json`): `<select>`, `type="color"`, `alert()`, `confirm()` e `transition-[…transform]` com `translate-`/`scale-` na mesma linha. Mesmo regime do limite de paleta: só desce. Atualizar: `UPDATE_DESIGN_BASELINE=1 npx jest lib/__tests__/design-guard`. Arquivos em pastas `__tests__` ficam fora.
- **Conteúdo mais largo que o cartão (caso C24).** Uma coluna de `grid` é `auto` por padrão e **cresce até o texto mais largo** (um nome comprido que não quebra), empurrando o cartão para além do painel. Regras: toda coluna de grid que recebe conteúdo da pessoa é `minmax(0, 1fr)` (o `Collapse` já é); todo filho de `flex` que trunca (`truncate`) ou quebra tem `min-w-0` e todos os pais até a coluna também; o corpo rolável de um painel esconde o excesso lateral (`overflow-x-hidden`), mas isso é rede de segurança: o conteúdo tem de caber por si.
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
17. **Preferências do usuário no banco** (13.2). Hoje ficam no navegador: não seguem a pessoa entre aparelhos e, num computador compartilhado, são divididas. Migrar tudo junto (mapa, som em 17.4, cursor em 10) para uma tabela por usuário quando o segundo caso aparecer. A câmera deve continuar por aparelho.
18. **Edição de camadas: o que ficou para depois** (13.3). (a) **Cor por área** (hoje todos os marcadores de Ações usam a cor da camada, e o catálogo não guarda cor por eixo); o **ícone por área já pode ser editado**. Nome e seção de Ações também não têm editor. (b) **Campos do popup** (o que aparece ao passar o mouse e no modal). (c) **Ordem** das camadas por arrastar. (d) A tela `/admin/layers` ainda só mostra o JSON; deve usar o mesmo editor. (e) O `BaseLayersManager` do admin passou a gravar pela rota nova, mas segue com o visual antigo e com `confirm()` e `alert()` do navegador. (f) **Trilha de auditoria**: quem editou, quando e o que mudou. (g) Criar e excluir camada pela interface. (h) Nomes no banco com acento faltando ("Municipio de Bonito", "Focos Incêndio") a pessoa ajusta pelo próprio editor. (i) Teste visual e com leitor de tela do editor, do modo "Editar" e do aviso (hoje só a lógica, a rota e o serviço têm teste automático). (j) **Levar a vista até a camada** ao editar: se a camada está fora da tela, a pré-visualização não aparece. (k) Cor do contorno separada do preenchimento foi **removida de propósito** (a tela deriva); se alguém pedir, volta como opção em "Mais opções".

---

## 18. Como evoluir este documento

- Toda mudança de design **registra o motivo** aqui, na seção certa, e se algo foi removido, na seção 15.
- Antes de criar UI nova, passe pelo checklist da seção 1.2.
- Mudou uma decisão? Não apague a antiga: mova para a seção 15 com o motivo.
- **Repetiu uma correção?** O documento falhou, não a pessoa: registre a causa na seção 20 e, se for geral, na página "Leia primeiro" **antes** de corrigir a tela (1.3). Se uma regra era vaga, mude a regra.
- Antes de entregar uma tela, faça a auditoria da 1.3 e diga o resultado.

---

## 19. Receitas de componentes

**Use a receita; não invente.** Cada receita é a anatomia pronta de um padrão que já foi construído e corrigido. Se o que você vai fazer parece com uma delas, comece por ela. Se não couber, registre a **exceção** (1.3) antes de inventar.

### 19.1 Lista de linhas com controle (ex.: Camadas)

- **Anatomia da linha:** `[amostra] [nome + apoio] [seta, se abre] ····· [contagem] [interruptor]`. O **interruptor é sempre a última coluna**; o que só existe em algumas linhas (a seta) vai **junto do nome** e nunca toma o lugar dele. As linhas-filhas recuam **só a amostra e o nome**, com uma linha-guia à esquerda.
- **Medidas:** linha ≥ 48 px; nome e apoio a 2 px; cada categoria é **um cartão com título** (nada de acordeão aninhado); entre cartões 16 px.
- **A linha toda liga e desliga** (um `<label>` amarrado ao interruptor). A saída de um erro é um botão e fica **fora** do label.
- **Estados:** carregando (esqueleto no lugar da contagem), erro (frase + "Tentar de novo" embaixo da linha), vazio (frase com o motivo), desligada (amostra esmaecida, nome em cinza-tinta).
- **Movimento:** a seta **gira** (um ícone só); os filhos **crescem em altura** (320 ms); a linha que acabou de mudar **pisca em verde claro** (1,9 s). **Hover** na linha toda.
- **Foge de:** C3, C9, C10.

### 19.2 Painel (cabeçalho, corpo, rodapé)

- **Cabeçalho:** **uma linha**; título (16 px, 600, `nowrap`) à esquerda; **no máximo 2 ações** e o fechar à direita. Num modo especial ganha **cor** (verde claro) e o título faz crossfade; as ações que não servem ao modo **encolhem e somem** (nunca vão para uma segunda linha).
- **Corpo:** base cinza suave (`muted` a 50%), 16 px de borda, **um cartão branco por assunto, com título**, 16 px entre cartões. Janela toda branca não passa.
- **Rodapé de ação** (quando há): fixo (`sticky`) no fundo, **24 a 32 px abaixo** do último cartão, com borda em cima e sombra leve; a frase do que a ação afeta em cima dos botões; os botões em duas colunas (Cancelar, Salvar). **Sem margem negativa embaixo.**
- **Movimento:** abre **de baixo, a partir do botão**, com mola (240 ms), fecha em 150 ms; os cartões entram em ordem de leitura (60 ms entre eles); trocar de visão dentro do painel usa o `ViewSwap` (a que sai some encolhendo, a que entra cresce, a altura acompanha).
- **Foge de:** C2, C16, C17.

### 19.3 Editor ou formulário (ex.: editar camada)

- **Topo:** a **prévia ao vivo** do que está sendo editado (a amostra da legenda), com o nome ao lado, e uma frase do que ela mostra.
- **No máximo 3 perguntas por tipo**, **em palavras** ("Fina, Média, Grossa"; "Só contorno, Suave, Cheio"), com o padrão certo já marcado. **Uma cor só**; a tela deriva o resto (o contorno vem da cor). Nada de px, % ou hex. Um valor salvo que não bate com nenhum degrau aparece marcado no mais próximo.
- **O que quase nunca muda** vai para **"Mais opções"**, recolhido (a seta gira, a altura cresce).
- **Só o que é editável aparece.** Se o que se edita são as partes de algo (os ícones das áreas de Ações), a tela abre as partes, não o todo.
- **Rodapé:** "Vale para todos que veem esta região." sempre junto do Salvar; o botão bloqueado **diz por quê**; Salvando… no próprio botão; em erro, **o que foi editado continua na tela** e o motivo vem em frase.
- **Depois de salvar:** aviso com desfazer (19.4); a linha editada pisca.
- **Foge de:** C11, C13.

### 19.4 Aviso com desfazer

- **Onde:** **no alto e ao centro**. **Anatomia:** `[anel com contagem] [título + frase] [Desfazer] [X]`, **todos centralizados na vertical**.
- **Tempo:** **10 s**, com o número dentro de um anel que se esvazia; **para** com o mouse ou o foco no aviso. O leitor de tela ouve a frase **uma vez**.
- **Movimento:** entra **de cima com mola** (400 ms) e sai deslizando para cima (190 ms). Ao desfazer, o **mesmo cartão** troca o texto ("Desfeito"); não sai e volta.
- **Texto (voz "colega de campo"):** título curto no "nós" ("Salvamos “Propriedades”"), uma frase de até 20 palavras. Erro: borda terracota, sem contagem, a saída em frase.
- **Foge de:** C7, C15.

### 19.5 Troca de modo ou de visão (ex.: Editar)

- **O modo é dito em cor e em frase, e continua dito depois de salvar, cancelar ou voltar** (regra 7): título do cabeçalho muda ("Editar camadas") com lápis e fundo verde claro; o corpo abre com um aviso do modo e do **próximo passo**; o botão de sair vira **cheio em verde** ("Concluir").
- **O "voltar" diz para onde leva** ("Editar camadas"), não "Camadas" (que sugeriria que a edição acabou).
- **A troca se vê:** o título faz crossfade e o lápis cresce; o botão troca rótulo e ícone em crossfade e a cor passa de uma para a outra; o que não serve ao modo encolhe e some; o corpo troca por `ViewSwap`. **Nada troca de uma vez.**
- **Foge de:** C7, C14, C17.

### 19.6 Botão que abre outro controle (ex.: "Outra cor")

- **Ícone e rótulo à vista, sempre.** Com um valor próprio já escolhido, o "+" vira um **selo** no canto e o rótulo passa a "Mudar". Quem escolheu não pode achar que o valor ficou fixo.
- **O cartão que abre é nosso** (nunca o do navegador): nasce a partir do botão com mola (260 ms), sai em 150 ms; começa pelo modo **guiado** (matiz e tom) e tem um modo **livre** (quadrado, faixa e código) um segmento ao lado; o valor vale **na hora**; setas movem a escolha; o valor aparece **em palavras** ("Azul escuro"), não em código.
- **Foge de:** C5, C12.

## 20. Casos reais (o que deu errado e a regra que nasceu)

Cada linha é uma correção que alguém precisou pedir. **Leia como "se eu estou prestes a fazer isto, pare".**

| # | O que se viu | Causa | Regra e onde | Como ficou |
|---|---|---|---|---|
| C1 | Controles nos quatro cantos, uns redondos, outros quadrados, uns com borda e outros sem | Cada controle foi desenhado sozinho, sem plano | 3, 4 · 13.1 | Dock único embaixo e câmera num cartão, com um estilo só |
| C2 | Painel escuro e janelas **todas brancas**: "dá até uma tontura" | Superfície única, sem base nem cartão | 4 · 6.2 | Base cinza suave, cartão branco com título |
| C3 | Lista com acordeões aninhados, textos colados: "sufocado, sem espaço, sem hierarquia" | Três níveis de dobra e nenhuma régua de espaço | 4, 5 · 6.3 | Cartão por categoria, linha de 48 px, apoio a 2 px |
| C4 | Filtro "Propriedade" abaixo da dobra; "Tamanho das propriedades" obrigava a **ler** para entender que era filtro | Período ocupava o painel; rótulo + linha de apoio + dois campos soltos | 1, 5 · 13.1 | Período compacto; frase "Área de [ ] a [ ] ha" |
| C5 | `<select>` nativo que abria com outro estilo; datas em duas linhas empilhadas, "abruptas" | Componente do navegador; sem pensar no conjunto | 11, 9 · 6.2 | Select e calendário do projeto, datas lado a lado |
| C6 | Hover e clique dos botões **estalavam**, sem suavidade | No Tailwind v4 `translate` e `scale` não entram em `transition-[…transform]` | 9 · 16 | Lista de transição corrigida; trava no `design-guard` |
| C7 | Aviso que "brota"; ao trocar de modo, título, botões e corpo mudavam **de uma vez** | Troca sem caminho | 9 · 8.4 regra 5 | Crossfade, encolher e crescer, `ViewSwap` |
| C8 | Pontos **brancos em fundo branco** na legenda (Nascentes, Estradas) | A legenda pintava o contorno como miolo; cor clara sem fio escuro | 12 · 6.2 regra 5 | Legenda lê o mesmo modelo do mapa, com fio por fora |
| C9 | A seta de expandir **empurrava o interruptor**: "onde deveria ter um toggle tem uma seta" | A seta era irmã do interruptor | 3 · 6.2 regra 8 | Interruptor sempre na última coluna; seta junto do nome |
| C10 | **Lápis em cada linha** da lista: feio, apertado, ícone sem texto | Entrada de edição repetida por linha | 2, 8 · 13.3 | Um botão "Editar" com rótulo no cabeçalho |
| C11 | Editor em **px, %, hex** e com duas cores: "faz o usuário pensar" | Expôs a mecânica em vez de decidir | 1 · 13.3 | Uma cor, degraus em palavras, o resto derivado |
| C12 | O quadrado de cor escolhida parecia **fixo**: não se via que dava para escolher outra | O "+" sumia quando havia uma cor própria | 8 · 6.2 regra 9 | "+" como selo e rótulo "Mudar" |
| C13 | Clicar em "Ações" abria a edição de **Ações**, que não é o que se edita | Tratou o todo como editável | 1, 2 · 13.3 | A linha abre as áreas; cada área edita o seu ícone |
| C14 | Depois de salvar, a lista de escolha **parecia a lista normal**: "não parece que ainda está editando" | O modo não era dito depois de voltar | 7 · 19.5 | Cabeçalho, aviso e botão dizem o modo o tempo todo |
| C15 | Botão "Desfazer" **colado no topo** do aviso | Alinhamento no topo com texto de duas linhas | 10 · 19.4 | Tudo centralizado na vertical |
| C16 | O espaço pedido acima da barra de salvar **"não foi feito"** | Margem vertical colapsou com a do vizinho | 5 · 6.3, 16 | 32 px, maior que o vizinho |
| C17 | Cabeçalho "pesado": o título **quebrava** ao lado de "Concluir" e "Atualizar" | Ações demais no cabeçalho, título sem `nowrap` | 6 · 6.3 | Atualizar sai do cabeçalho no modo; título em uma linha |
| C18 | Os botões do dock **não respondiam** ao mouse | Só o botão base tinha hover | 9 · 8.1 | Botão sobe 1 px; cada ícone se move do seu jeito |
| C19 | O Esc de um seletor fechava **o painel inteiro** | O ouvinte global ignorava que o Esc já foi tratado | técnica · 16 | Checa `defaultPrevented` |
| C20 | O cartão de hover da ação mostrava o **ponto genérico**, enquanto o marcador tinha o ícone certo | O cartão lia o estilo de um caminho (propriedades do evento) e o marcador de outro (regras do catálogo) | 12 · 6.2 regra 13 | O cartão recebe cor e ícone pelo **mesmo** cálculo do marcador (`resolveFeatureStyle`) |
| C21 | O mesmo cartão: **título quebrava**, texto de gente com maiúsculas e minúsculas soltas, "Em recuperação" **fora do eixo**, "Registrada em" e a data em **fonte e alinhamento diferentes**, sem hierarquia | Entreguei dizendo "passa" **só pelo código**: o chip deslocava o status, a tabela de rótulo e valor com `tabular-nums` mudava a letra, e os dados crus foram mostrados como vieram | 4, 5, 12 · 6.2 regras 10 a 13, 13.4 | Eixo único, status em ponto e palavra, frases no lugar de tabela, título de uma linha, `tidyText`. **A auditoria de tela só vale com a medida da tela:** sem ver o resultado, a entrega diz "não vi" e pede o print antes de declarar "passa" |
| C22 | Bolha de agrupamento só com **um número**: "o que são esses números?"; para ver o que havia ali era preciso ampliar até o zoom 25 | O número foi mostrado sem dizer o que conta nem o que contém | 1, 2 · 6.2 regra 14, 13.4 | "25 ações" na bolha e cartão de hover com as áreas e o ícone de cada uma |
| C23 | Sobre uma bolha de grupo abriam **dois cartões** um em cima do outro (o do grupo e o da ação por baixo) | Dois caminhos de hover independentes (marcador e camada do mapa) | 4 · 13.4 | O grupo avisa o mapa, que esconde o cartão da ação enquanto o mouse está nele |
| C24 | No Explorar, ao ver **propriedades**, o conteúdo ficava **mais largo que o cartão** e o painel parecia mal pensado | A coluna `auto` do `Collapse` (grid) cresceu até o nome mais largo; as linhas truncavam, mas a coluna já tinha crescido | 4, 5 · 16 | Coluna `minmax(0,1fr)`, `min-w-0` nos filhos e `overflow-x-hidden` no corpo do painel; a linha da propriedade ganhou o tamanho em hectares e o primeiro cartão deixou de repetir o título da janela |
| C25 | Ao clicar numa propriedade, o painel do Explorar ficava **bem na frente do mapa**: "precisamos do card e do mapa" | O painel abria centrado no dock, o mesmo lugar para onde o mapa leva o registro | 2, 4 · 13.5 | Painel no canto esquerdo e o mapa enquadra o registro no espaço livre ao lado dele |
| C26 | O Explorar **abria no meio e aparecia no canto**, e as ações agrupadas em bolhas "25 ações" ainda deixavam a pessoa sem saber o que havia ali | O botão ficava no centro do dock e o painel no canto, sem caminho entre os dois; o grupo era uma abstração que exigia hover e zoom | 4, 9 · 8.4, 13.5, 13.6 | O painel nasce do botão e viaja até o canto; bolhas, cartão do grupo e mancha saíram: ponto longe, pino perto, pilha só onde o ponto é o mesmo |
| C27 | Ao rolar um painel (o Explorar), o **prisma travava e voltava o cursor do sistema** | A barra nativa do navegador não aceita `cursor: none`; além disso, rolar com a roda não manda `pointermove` e o cursor ficava no da raiz | 9 · 10 | `OverlayScroll` nos painéis do dock, raiz do site também esconde o cursor e o prisma reconfere o estado ao rolar |
| C28 | A legenda ficou **apertada e pequena**, com o ícone das ações **sem cor**, uma linha-mãe "Ações" sem sentido, **desalinhada** da câmera e da atribuição do MapLibre (o "i" padrão), e o zoom da roda **não mudou** | Cada peça foi posta sozinha (right-3 contra right-4, atribuição no padrão da biblioteca); a amostra do ícone só tinha contorno; o ajuste de taxa do zoom nativo é quase imperceptível | 4, 5, 12 · 6.2 regras 5 e 10, 13.7 | Coluna única no canto a 16 px, amostra igual ao pino, áreas sem linha-mãe, atribuição no estilo do projeto e zoom da roda com destino e alisamento próprios |
