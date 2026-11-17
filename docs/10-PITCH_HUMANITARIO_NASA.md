# Visão Humanitária & Pitch NASA — Personal Agro (Zé Agro)

> Este documento guarda o coração e os princípios do projeto para **todas** as decisões técnicas, de texto e de apresentação na banca.

---

## 1. Premissa Central do Projeto (Quem é o nosso ouvinte)

- **Missão principal:** combater a fome, proteger a subsistência humana, recuperar o solo vivo e ajudar áreas vulneráveis à seca a produzir alimento — **não** lucro, **não** foco comercial.
- **Lente da NASA e do julgador social:** a NASA não busca modelo de negócio ou lucro; ela quer saber **como usamos ciência espacial e tecnologia para resolver um problema humano e ambiental real**.
- **Consequência prática na fala e no código:**
  - Quando falamos de perda no campo, o ponto principal **não é "perder dinheiro"** — é a família do **Seu José** perder a subsistência, o solo cansar e **faltar comida (ou encarecer o básico)** na mesa de quem mora na cidade.
  - Pensar como proteção / combate à escassez e à degradação: cada orientação tem de defender o solo, a água, o agricultor familiar e o abastecimento.
  - Projeto **100% gratuito** para o pequeno produtor — zero cobrança, zero assinatura no atendimento.

---

## 2. Regras de Ouro da Narrativa (Pitch & Palco)

1. **Rosto humano real (`Seu José`):**
   - Mostrar a situação real dele no campo (foto e contexto humano).
   - Sempre amarrar o problema técnico e a solução **à dor do Seu José** ("sanar a dor do Seu José", "proteger o trabalho de sol a sol do Seu José").
2. **Conectivo depois de todo dado pesado:**
   - Sempre que jogar uma estatística seca/dura (ex.: `83,6% sem acompanhamento técnico`, `>70% acima de 45 anos`, `quase 1 em 4 declara não saber ler/escrever`, `7,4% no Nordeste`), **puxar a atenção da plateia de volta na hora** com um conectivo humano/interativo: *"Imagine que..."*, *"Olha que choque..."*, *"E se eu te contasse que..."*, *"Mas espera — já imaginou..."*.
3. **Provocação antecipada (Sem senha / sem formulário / sem app):**
   - A banca pode perguntar por que não tem login nem senha. Resposta: **para quem mal consegue preencher um formulário, login não é segurança — é exclusão.** A sessão do WhatsApp já é autenticada e criptografada, e basta mandar `"apagar meus dados"` para apagar o registro.
4. **Estrutura lógica do raciocínio:**
   `Seu José (dor humana)` → `Dados reais (IBGE)` → `Problema na mesa e no solo` → `Solução sem barreiras (WhatsApp + NASA + Embrapa)` → `Diferencial único (anti-efeito manada e combate à escassez)` → `Política pública (Goiás + PAA/PNAE + expansão Nordeste)` → `Fechamento humano + demonstração ao vivo (QR Code)`.

---

## 3. Os 3 Pilares Sociais e Técnicos do Diferencial

1. **Combate à exclusão digital e ao analfabetismo funcional:**
   - 96% dos produtores já usam WhatsApp. Entrada por áudio ou texto simples, sem senha e sem aplicativo novo. Quem conversa por áudio recebe áudio de volta.
2. **Combate ao efeito manada e à escassez de alimentos (`communitySignals.js` + `rotation.js`):**
   - *Provocação:* já imaginou 80% dos produtores usando uma IA comum que manda todo mundo plantar a mesma coisa na mesma semana? Um alimento despenca, outros **entram em escassez na mesa da população**, e falta caminhão e mão de obra na colheita.
   - *Solução no código:* leitura anônima das consultas da região para dar peso extra à diversificação, tirar o produtor da manada saturada, evitar apagão de frete e apontar escoamento real (cooperativas, CEASA, CONAB, PAA e PNAE).
3. **Expansão social e recuperação de áreas secas/improdutivas (Goiás → Nordeste + Brasil):**
   - Em Goiás: somar a políticas públicas como **SEAPA**, **EMATER** e **PAA Goiás / Goiás Social**.
   - Em escala federal: conectar a agricultura familiar ao **PAA** e ao **PNAE** (onde **30%** da merenda escolar deve vir da agricultura familiar por lei).
   - **Parte mais dolorida / maior impacto:** no **Nordeste**, apenas **7,4%** dos estabelecimentos têm assistência técnica e mais de **90%** da agricultura familiar está desassistida (IBGE 2017). Adaptar esse mesmo Cumpadre Digital para levar ciência espacial, manejo de água/solo e rotação resistente à seca a áreas secas e improdutivas combate diretamente a fome e a vulnerabilidade climática.

---

## 4. Roteiro de Fala Cronometrado — Versão V5 Oficial (2:30 — ~296 palavras)

> **Regra de palco:** ~296 palavras fecham exatamente em **2:25 – 2:35** em fala natural e emotiva (~115–125 palavras/min). Termos técnicos extras (`Evapotranspiração FAO ET0`, `Umidade na raiz GWETROOT`, `IBGE 2017`) ficam no rodapé dos slides para os jurados lerem enquanto a fala segue 100% simples.

### [0:00 – 0:30] História do Seu José & A Dor (Slide 1 rápido → Slide 2 foto real) — *62 palavras*
> "Este é o Seu José, agricultor em Goiás. Ele planta todo dia para pôr comida na sua mesa — sem saber se chove amanhã ou se a terra aguenta.  
> Mais de **80%** no Brasil não têm apoio agronômico, e **quase 1 em cada 4** nem sabe ler. Sem apoio, o solo cansa, a comida encarece e falta pra quem tem fome.  
> E se sanássemos essa dor hoje?"

*(Rodapé visual no Slide 2: `83,6% Centro-Oeste | +80% Brasil sem assistência técnica | ~25% sem leitura/escrita (IBGE)`.)*

### [0:30 – 1:00] Solução Sem Barreiras + NASA POWER Simples (Slide 3) — *59 palavras*
> "**96%** do campo já usa WhatsApp. Criamos o **PersonalAgro**, um **Cumpadre Digital** que já funciona hoje.  
> Sem app nem login, porque cadastro exclui quem não lê — no WhatsApp ele só fala.  
> Diz o que colheu e prioriza: água, solo ou venda. Cruzamos chuva, calor e água no solo da **NASA POWER** com a **Embrapa**, e devolvemos em áudio."

*(Rodapé visual no Slide 3: `NASA POWER (umidade na raiz e calor) • Chuva & Evapotranspiração 14d • Embrapa`.)*

### [1:00 – 1:15] Impacto Claro (Slide 4) — *31 palavras*
> "Na hora, ele vê o risco de repetir a lavoura, compara **3 opções de rotação** para recuperar o solo com menos veneno e sabe onde vender perto — apoiando, nunca substituindo, sua sabedoria."

### [1:15 – 1:50] Anti-Escassez vs. IAs Comuns & A Balança (Slides 5 → 6) — *68 palavras*
> *(Slide 5)* "Mas e se uma IA comum mandar toda a cidade plantar igual? O preço cai, falta comida na mesa e faltam caminhão e mão de obra. Evitamos isso lendo anonimamente o plantio regional, diversificando as opções e indicando cooperativas, CEASA e escolas.  
> *(Slide 6)* IA comum exige cadastro e empurra todos pro mesmo erro; o **PersonalAgro** fala a língua do campo com a **NASA POWER** para proteger quem planta e quem come."

### [1:50 – 2:16] Equipe, Prova Social (6 Regiões), Governo & Nordeste (Slide 7) — *50 palavras*
> "Nossa equipe uniu IA e vivência em Goiás no sistema **já operando hoje com dados reais de 6 regiões produtivas**.  
> Nasce gratuito para somar à **SEAPA, EMATER, PAA e PNAE** e chegar ao Nordeste, onde só **7,4%** têm assistência técnica — sem cobrar R$ 1 do Seu José."

### [2:16 – 2:30] Fechamento & QR Code Ao Vivo (Slide 8) — *26 palavras*
> "Ciência espacial fora do laboratório pode matar a fome e salvar quem alimenta o país. Aponte a câmera pro QR Code e converse agora no WhatsApp. Obrigado!"

---

## 5. Resumo Rápido dos Dados da NASA no Código (Cola de Palco)
- **Qual base da NASA:** `NASA POWER Agroclimatology API (community=AG)`.
- **O que lemos:** umidade do solo na zona da raiz (`GWETROOT`), umidade superficial (`GWETTOP`), precipitação acumulada (`30d`) e dias de calor extremo (`> 34 °C`).
- **Como calculamos:** cruzamos com o balanço hídrico de 14 dias (`Open-Meteo FAO ET0`), parâmetros agronômicos da `Embrapa` e pulso anônimo de saturação regional (`communitySignals.js`).
- **Para que serve:** dar nota de `0 a 100` para cada opção de rotação, evitando monocultura em solo seco/cansado, reduzindo gasto com defensivos e indicando o canal real de escoamento.
