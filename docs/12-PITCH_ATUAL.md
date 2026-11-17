# Pitch Atual (V7 — Calibrado para Média de 02:30, Sem Validação Externa)

> **Total:** **346 palavras** · **Tempo estimado em palco:** **2:28 – 2:34** em ritmo natural de pitch (~135–140 palavras/min) ou **2:40** em fala bem pausada (~130 palavras/min), garantindo folga confortável antes de 3:00.  
> **Nota:** Versão auditada frase a frase para manter todos os conectivos causais, boas práticas de produção sustentáveis, Slide 6 detalhado e os pilares completos do Slide 7. Versão alternativa com o acontecimento da Índia em [13-PITCH_VALIDACAO_INDIA.md](./13-PITCH_VALIDACAO_INDIA.md).

---

## Roteiro Slide a Slide

### [0:00 – 0:30] Slides 1 → 2 · A História do Seu José & A Dor — *67 palavras*

> "Este é o Seu José, agricultor em Goiás, que planta todo dia pra pôr comida na mesa — sem saber se chove amanhã ou se o solo aguenta.  
> Como ele, mais de **80%** no Brasil não têm apoio técnico, e **quase 1 em cada 4** nem sabe ler. Sem essa orientação, a terra cansa, a comida encarece e falta pra quem precisa.  
> E se sanássemos essa dor hoje?"

*(Rodapé visual sugerido no Slide 2: `83,6% Centro-Oeste | +80% Brasil sem assistência técnica | ~25% sem leitura/escrita — Censo Agro IBGE`.)*

---

### [0:30 – 0:54] Slide 3 · A Solução Sem Barreiras (WhatsApp + NASA POWER + Embrapa) — *55 palavras*

> "**96%** dos produtores já usam WhatsApp. Daí nasceu o **PersonalAgro**, um **Cumpadre Digital** sem app e sem login — porque cadastro exclui quem não lê.  
> Por áudio, ele diz o que colheu e prioriza água, solo ou venda; nós cruzamos chuva, calor e umidade na raiz da **NASA POWER** com a **Embrapa** e respondemos em áudio."

*(Rodapé visual sugerido no Slide 3: `Uso de WhatsApp: 96% (ABMRA) • NASA POWER (GWETROOT, GWETTOP, chuva e calor ≥ 34 °C) • Previsão & FAO ET0 14d • Base Embrapa`.)*

---

### [0:54 – 1:09] Slide 4 · Entrega Prática, Boas Práticas & Escoamento — *33 palavras*

> "Assim, ele vê o risco de repetir a lavoura, compara **3 rotações** com **boas práticas de produção sustentáveis** usando menos veneno e sabe onde vender perto — tudo para apoiar, sem substituir sua sabedoria."

*(Apoio no código: motor determinístico de rotação em `src/services/rotation.js` + dossiês Embrapa em `docs/knowledge_base/`.)*

---

### [1:09 – 1:33] Slide 5 · Como Evitamos o Efeito Manada & A Escassez — *54 palavras*

> "Mas aí mora um perigo: e se uma IA comum mandar a cidade plantar igual? O preço cai, faltam outros alimentos e faltam caminhão e mão de obra.  
> Como evitamos isso? Lemos anonimamente o plantio regional, diversificamos as opções para não saturar nem faltar comida, e indicamos onde escoar: cooperativas, CEASA e merenda escolar."

*(Apoio no código: radar anônimo regional em `src/services/communitySignals.js` + canais mapeados em `CANAIS_ESCOAMENTO_GOIAS`.)*

---

### [1:33 – 1:53] Slide 6 · A Balança (IA Comum vs. PersonalAgro) — *45 palavras*

> "A diferença é direta: uma IA comum exige cadastro, responde no genérico e empurra a cidade pro mesmo erro.  
> O **PersonalAgro** fala a língua do campo, calcula com a **NASA POWER** e garante o sustento de quem planta e o prato cheio de quem precisa."

---

### [1:53 – 2:23] Slide 7 · Equipe de Goiás, 6 Regiões, Política Pública & Nordeste — *68 palavras*

> "Unimos **engenharia de IA** e vivência em Goiás no sistema **já operando hoje** em **6 regiões produtivas goianas**.  
> Nasce gratuito, **conectando agricultura familiar e segurança alimentar** à **SEAPA, EMATER e PAA Goiás**, além de **PAA e PNAE** — alcançando **regiões ainda mais castigadas pela seca**, como o **Nordeste**, onde só **7,4%** têm assistência.  
> **Somamos ciência aberta e poder público para sustentar tudo sem cobrar R$ 1 do Seu José.**"

*(Rodapé visual sugerido no Slide 7: `6 Polos Operando Hoje: Rio Verde, Jataí, Cristalina, Itaguaru, Anápolis e Goiânia • Assistência técnica no Nordeste: 7,4% (IBGE)`.)*

---

### [2:23 – 2:34] Slide 8 · Fechamento & Demonstração Ao Vivo — *24 palavras*

> "Ciência espacial fora do laboratório combate a fome e salva quem alimenta o país. Aponte pro QR Code e converse agora no WhatsApp. Obrigado!"

---

## Cola Rápida das Fontes Reais (Para Perguntas Técnicas)

- **NASA (`API ao vivo` + `tiles`):** `NASA POWER Agroclimatology API (community=AG)` (`GWETROOT`, `GWETTOP`, `PRECTOTCORR`, `T2M_MAX`, `T2M_MIN`, `ALLSKY_SFC_SW_DWN`) e camadas visuais `NASA GIBS` (`MODIS NDVI` e `SMAP`) em `/rotacao`.
- **Previsão 14d:** `Open-Meteo` (`chuva` + evapotranspiração `FAO ET0`).
- **Embrapa (`base curada no código`):** parâmetros agronômicos de culturas e sequências de Plantio Direto no Cerrado + 11 bases em `docs/knowledge_base/`.
- **CONAB & Mercado:** `CONAB / PAA / PNAE` mapeados nos corredores regionais de escoamento (`CANAIS_ESCOAMENTO_GOIAS`), e cotações diárias via scraping da tabela oficial da `CEASA-PR` (`src/services/market.js`).
