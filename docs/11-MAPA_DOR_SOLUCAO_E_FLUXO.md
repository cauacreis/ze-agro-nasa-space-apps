# 11 — Mapa Central: Qual é a Dor, Quem Sofre, Qual Pergunta e Como o Chat Funciona

> Documento-síntese do **PersonalAgro / Cumpadre Digital** para consulta rápida do time, preparação de slides, apresentação na banca e alinhamento entre produto e código.  
> Complementa: [08-RESEARCH_PAINS.md](./08-RESEARCH_PAINS.md), [09-BANCA_PERGUNTAS_E_RESPOSTAS.md](./09-BANCA_PERGUNTAS_E_RESPOSTAS.md) e [10-PITCH_HUMANITARIO_NASA.md](./10-PITCH_HUMANITARIO_NASA.md).

---

## 1. Qual é a dor?

A **dor-mãe** é a **solidão técnica e climática do agricultor familiar na hora de decidir o que e quando plantar**:

1. **Decisão no escuro:** **83,6%** das propriedades rurais do Centro-Oeste — e **mais de 80% no Brasil** — não recebem nenhum acompanhamento técnico agronômico (IBGE). No **Nordeste**, apenas **7,4%** dos estabelecimentos contam com assistência técnica.
2. **Barreira etária e de leitura:** no campo, **mais de 70%** dos produtores têm mais de 45 anos e **quase 1 em cada 4** declara não saber ler ou escrever. Aplicativos com formulário, cadastro longo e senha funcionam como barreira de exclusão.
3. **Solo cansado e clima extremo:** repetir a mesma cultura sem rotação adequada acelera pragas, exige mais defensivos químicos, resseca o solo e compromete a safra seguinte diante de veranicos e ondas de calor.
4. **Efeito manada e escassez:** se todo mundo na mesma região recebe a mesma recomendação genérica na mesma semana, o preço de um alimento despenca, faltam caminhão e mão de obra na colheita, e outros alimentos básicos ficam em escassez.
5. **Canal incompatível com a roça:** ferramentas tradicionais exigem tela, leitura técnica ou internet pesada, sendo que **96% dos produtores já usam o WhatsApp** todos os dias.

---

## 2. Quem sofre?

| Quem sofre | Como a dor aparece na prática |
|---|---|
| **Agricultor familiar (ex.: Seu José)** | Trabalha de sol a sol sem saber o comportamento da umidade do solo e da chuva dos próximos 14 dias; perde colheita, endivida-se ou perde a própria subsistência da família. |
| **Regiões vulneráveis à seca (ex.: Nordeste)** | Alta vulnerabilidade climática somada a **92,6%** de ausência de assistência técnica; terras ficam improdutivas por falta de manejo hídrico e rotação resistente. |
| **Solo vivo, água e biodiversidade** | Monocultura repetida degrada a matéria orgânica, compacta a terra e aumenta o uso de agroquímicos para segurar pragas que a rotação quebraria naturalmente. |
| **População da cidade e segurança alimentar** | Quando o pequeno produtor erra o plantio ou sofre com efeito manada, alimentos básicos (feijão, tomate, hortaliças, milho) ficam mais caros ou faltam na mesa. |
| **Cadeia regional (frete e escoamento)** | Picos concentrados na mesma cultura geram apagão de caminhões e perda de produção na porta da fazenda sem canal de venda definido (cooperativas, CEASA, CONAB, PAA, PNAE). |

---

## 3. Qual é a pergunta central (e as perguntas reais do dia a dia)?

### A pergunta-mãe do projeto
> **"Colhi minha lavoura agora e o tempo está incerto — o que eu planto na sequência para não perder a safra, proteger minha terra, gastar pouco e conseguir escoar aqui perto?"**

### Perguntas reais que chegam pelo WhatsApp (texto, áudio ou foto)
- **Rotação e água:** *"Colhi milho em Jataí, o que eu planto agora?"* / *"Minha terra tá cansada e seca, o que aguenta?"*
- **Diagnóstico visual por foto:** *"Apareceu isso no meu milho, sô"* (foto de lagarta, mancha foliar, deficiência).
- **Custos e tamanho da área:** *"Quanto gasto pra plantar braquiária?"* / *"São 10 hectares"* / *"Compensa fazer cobertura?"*
- **Venda e mercado:** *"Pra quem eu vendo gergelim aqui perto?"* / *"Como tá o preço do tomate no CEASA?"*
- **Gestão simples da roça:** *"Anota aí que abasteci 40 litros de diesel"* / *"Me lembra de adubar sexta"* / *"Me manda o tempo todo dia de manhã"*.

---

## 4. Por que as soluções atuais falham — e o que entregamos no lugar

| Solução comum | Por que falha no campo | Como o Cumpadre Digital resolve |
|---|---|---|
| **App próprio com login e senha** | Exige baixar app, criar conta, digitar formulários e lembrar senha. | **Zero app e zero senha:** conversa direto no **WhatsApp** por **áudio, foto ou texto**; basta mandar *"apagar meus dados"* para limpar tudo (LGPD). |
| **IA genérica (ChatGPT / texto padrão)** | Devolve parede de texto técnico, chuta doses sem ver solo/clima real e cria efeito manada. | **Conta real antes de falar:** cruza umidade do solo na raiz e calor da **NASA** + chuva de 14 dias + base da **Embrapa** + sinais anônimos anti-manada da região. |
| **Resposta em textão/tabela** | Dificulta a leitura para quem tem baixa escolaridade ou está no trator/roça. | **Áudio entra -> áudio sai:** quem manda áudio recebe **áudio com voz natural** sem tabelas nem siglas técnicas confusas. |
| **Consultoria paga inacessível** | Custa caro e afasta os mais de 80% de pequenos produtores sem apoio. | **100% gratuito para o produtor:** pensado para operar integrado a políticas públicas (**SEAPA, EMATER, PAA Goiás, PAA e PNAE**). |

---

## 5. Fontes de Dados (NASA, Embrapa, CONAB, Open-Meteo e CEASA) e O Que Cada Um Vê

### 5.1 De onde vem cada dado e como entra no código

| Fonte | Papel no sistema | O que pegamos na prática | Como entra (API vs. base curada) |
|---|---|---|---|
| **NASA (`NASA POWER`)** | Base agroclimatológica histórica recente (últimos 30 dias válidos) dos **6 polos de Goiás** (*Rio Verde, Jataí, Cristalina, Itaguaru, Anápolis e Goiânia*) | `GWETROOT` (umidade na raiz), `GWETTOP` (umidade superficial), `PRECTOTCORR` (chuva 30d), `T2M_MAX` (média e dias `≥ 34 °C`), `T2M_MIN` e `ALLSKY_SFC_SW_DWN` (radiação média) | **API real** coletada por [fetch-nasa-goias.js](../scripts/fetch-nasa-goias.js) e gravada em [nasa_goias_baseline.json](../src/data/nasa_goias_baseline.json); em produção o motor lê o baseline em memória ([rotation.js](../src/services/rotation.js)) |
| **NASA (`NASA GIBS`)** | Visualização espacial de satélite sobre Goiás | Tiles WMTS de `MODIS_Terra_NDVI_8Day` (vegetação NDVI, até zoom 9) e `SMAP_L4_Analyzed_Surface_Soil_Moisture` (umidade superficial SMAP, até zoom 6) | **Tempo real** via proxy `/api/rotacao/tile/:layer/:z/:y/:x` ([server.js](../src/server.js)) com cache em memória para o painel web ([rotacao.html](../src/public/rotacao.html)) |
| **Open-Meteo** | Previsão meteorológica curta e demanda evaporativa | Previsão **14 dias** + `et0_fao_evapotranspiration` (gera `balanco_hidrico_14d_mm`) no baseline de rotação; previsão diária **7 dias** por cidade no WhatsApp | **API real** no coletor (14d) e **ao vivo em runtime** no WhatsApp ([weather.js](../src/services/weather.js), com fallback para `wttr.in`) |
| **Embrapa** | Inteligência agronômica do Cerrado, cultivares e manejo | **1)** Dossiês técnicos em `docs/knowledge_base/*.md` (*banana, soja, milho, feijão, mandioca, café, citros, tomate e gado*) com cultivares BRS, espaçamento, adubação e pragas; **2)** Parâmetros numéricos no motor (`SOLOS_CERRADO`, `CULTURAS_CERRADO`: `ciclo_dias`, `demanda_agua_mm`, `tolerancia_seca`, `tolerancia_calor`, `fixa_nitrogenio_kg_ha`, `aporte_palhada_t_ha`, `profundidade_raiz_cm`, `quebra_nematoides`; e sequências em `PLANOS_CANDIDATOS`) | **Sem API externa** — conhecimento agronômico curado e parametrizado no código ([ai.js](../src/services/ai.js) e [rotation.js](../src/services/rotation.js)) |
| **CONAB** | Referência institucional de compra pública para escoamento | Mencionada dentro do canal comprador do polo de **Itaguaru** ligada a **compras públicas PAA / PNAE (merenda escolar / CONAB)** para escoar **feijão** e **mandioca**, ao lado de cooperativas, `CEASA-GO`, `CEASA-DF`, farinheiras e agroindústrias | **Sem API nem scraping** — mapeamento regional estático em `CANAIS_ESCOAMENTO_GOIAS` ([rotation.js](../src/services/rotation.js)) |
| **CEASA-PR** | Referência ao vivo de preço de hortaliças e frutas | Preço por embalagem/kg em 5 praças do Paraná e variação diária | **Scraping HTML ao vivo** da tabela oficial da CEASA-PR ([market.js](../src/services/market.js), cache de 12h) |

### 5.2 O que cada fonte "enxerga" no sistema

| Camada / Fonte | O que ela observa / responde |
|---|---|
| **NASA (`POWER` + `GIBS`)** | Enxerga o **estado físico do ambiente**: quanto de água existe na raiz e na superfície, quanto choveu nos últimos 30 dias, quantos dias passaram de 34 °C, radiação solar e mapas de vigor vegetal (`NDVI`) e umidade (`SMAP`). |
| **Open-Meteo** | Enxerga a **janela próxima (7 a 14 dias)**: se vem chuva ou veranico pela frente e se a evapotranspiração (`ET0 FAO`) vai secar o solo mais rápido do que a chuva repõe. |
| **Embrapa (base curada)** | Enxerga a **biologia e o manejo agronômico**: qual cultura aguenta solo seco ou cansado, qual quebra ciclo de nematoides/pragas da safra anterior, quanto devolve de palhada e nitrogênio, e qual cultivar ou manejo funciona no Cerrado. |
| **CONAB / PAA / PNAE + CEASA** | Enxergam o **destino e a referência de valor da colheita**: onde o produtor entrega perto sem ficar na mão de atravessador (cooperativas, `CEASA-GO`/`CEASA-DF`, farinheiras, chamadas públicas **PAA/PNAE/CONAB**) e quanto o produto está valendo na praça de referência (`CEASA-PR`). |
| **Radar Regional (`communitySignals.js`)** | Enxerga o **movimento coletivo da microrregião**: evita recomendar a mesma cultura para a cidade inteira, prevenindo queda de preço, apagão de frete e escassez de alimentos. |

### 5.3 O que cada perfil de usuário vê na prática

| Perfil | Onde acessa | O que vê e recebe na prática | O que fica oculto / protegido |
|---|---|---|---|
| **Produtor familiar (Seu José)** | **WhatsApp** (texto, foto ou áudio — sem app, login ou senha) | Se mandar áudio, recebe **áudio em voz natural (PTT)**; se mandar texto/foto, recebe resposta limpa sem emojis/tabelas. Vê a situação da água na raiz em linguagem simples (`%`), risco de repetir o cultivo, melhor alternativa de rotação, quando/como começar, onde vender perto e diagnóstico visual de pragas sem latim. | Não vê siglas técnicas (`GWETROOT`, `FAO ET0`), não precisa preencher formulários nem lidar com mapas complexos; pode apagar seu histórico a qualquer momento (`"apagar meus dados"`). |
| **Técnico, Agrônomo ou Cooperativa** | **WhatsApp** (`"forma profissional"` opcional) e **Painel Web `/rotacao`** ([rotacao.html](../src/public/rotacao.html)) | Na `"forma profissional"` no WhatsApp, vê nota de resiliência (`0–100`), economia de água (`%`), palhada (`t/ha`), balanço de nitrogênio (`kg/ha`), janela e distância média (`km`). No **Painel Web `/rotacao`**, simula em 4 cliques, vê métricas NASA + saldo hídrico 14d, alterna camadas de satélite **NASA GIBS (`MODIS NDVI` e `SMAP`)** no mapa de Goiás, lê a tendência regional, compara monocultura vs. Top 3 e baixa os dados em **CSV** (`/api/rotacao/csv`). | Não acessa conversas individuais, números de telefone ou histórico privado de outros produtores. |
| **Motor Anti-Manada / Rede Regional** | Bastidores em [communitySignals.js](../src/services/communitySignals.js) | Registra e lê apenas contadores agregados por polo (`culturas_em_alta`, `alerta_fitossanitario`, `tendencia_solo_agua`, `total_relatos_regiao`, `contagem_prioridades`, `planos_mais_buscados`). | **Zero dado pessoal:** não armazena telefone, nome nem JID do WhatsApp. |

---

## 6. Diagramas da Lógica do Chatbot (Vetoriais — Sem Perda de Qualidade)

Os fluxos completos (versão humana para palco/negócio e versão técnica com funções e arquivos reais) estão salvos em vetor editável (`.svg`) e página única vetorial (`.pdf`):

- **Visão Humana (Linguagem simples para banca e slides):**
  - SVG editável: [fluxo-humano-cumpadre-digital.svg](./diagramas/fluxo-humano-cumpadre-digital.svg)
  - PDF vetorial: [fluxo-humano-cumpadre-digital.pdf](./diagramas/fluxo-humano-cumpadre-digital.pdf)
- **Visão Técnica (Arquitetura, Baileys, Orquestração, Tools, Failover e TTS):**
  - SVG editável: [fluxo-tecnico-cumpadre-digital.svg](./diagramas/fluxo-tecnico-cumpadre-digital.svg)
  - PDF vetorial: [fluxo-tecnico-cumpadre-digital.pdf](./diagramas/fluxo-tecnico-cumpadre-digital.pdf)

### Mapa rápido do pipeline técnico
1. **Gateway WhatsApp ([whatsapp.js](../src/services/whatsapp.js)):** ignora grupos (`@g.us`) e duplicidades (`processingUsers`), barra abuso pré-cota (`verificarAbuso`) e resolve intenções diretas sem gastar IA (`ajuda`, `apagar_dados`, `quero_aviso`, `falar_com_tecnico`, `exportar_csv`).
2. **Multimodal & Memória ([ai.js](../src/services/ai.js)):** transcreve áudio rural (`whisper-large-v3` com `WHISPER_PROMPT_AGRO` + fallback Gemini), analisa fotos da lavoura (`gemini-2.5-flash` em `analyzeCropImage`) e preserva cidade, cultura e últimos turnos (`slice(-12)`).
3. **Motor NASA & Orquestração ([rotation.js](../src/services/rotation.js) + [provedores.js](../src/services/provedores.js)):** intercepta comandos de rotação (`interpretarMensagemRotacao` / `avaliarRotacaoNasa`), ou executa `generateAgroResponse` com guardrails determinísticos, `orchestratorAgent`, seleção enxuta das 13 tools (`selecionarFerramentasConversa`) e failover multi-chave/modelo (`chatCompletions`: Groq, Gemini, Cerebras etc.).
4. **Sanitização & Entrega:** remove tabelas Markdown, normaliza medidas e símbolos químicos, reforça autonomia do produtor, e entrega em **PTT Ogg/Opus** (`edge-tts` `pt-BR-AntonioNeural` / fallback Google TTS + `ffmpeg`) quando a entrada foi áudio, ou texto segmentado quando foi texto/foto.

---

## 7. Referência Lapidada do Pitch V5 — 2:30 (Slides 7 e 8)

> Versão V5 oficial para **2:30 (~296 palavras)** (ver roteiro completo em [10-PITCH_HUMANITARIO_NASA.md](./10-PITCH_HUMANITARIO_NASA.md)):

- **[1:50 – 2:16] Equipe, Prova Social (6 Regiões), Governo & Nordeste (Slide 7):**
  > "Nossa equipe uniu IA e vivência em Goiás no sistema **já operando hoje com dados reais de 6 regiões produtivas**. Nasce gratuito para somar à **SEAPA, EMATER, PAA e PNAE** e chegar ao Nordeste, onde só **7,4%** têm assistência técnica — sem cobrar R$ 1 do Seu José."

- **[2:16 – 2:30] Fechamento & QR Code Ao Vivo (Slide 8):**
  > "Ciência espacial fora do laboratório pode matar a fome e salvar quem alimenta o país. Aponte a câmera pro QR Code e converse agora no WhatsApp. Obrigado!"
