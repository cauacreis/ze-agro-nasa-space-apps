# PersonalAgro ("Zé Agro") — O Cumpadre Digital

> **Ciência espacial e agronomia traduzidas para áudio no WhatsApp — 100% gratuito para o agricultor familiar.**  
> Desenvolvido em Goiás para o **NASA Space Apps Challenge** (desafio de rotação de culturas, resiliência do solo e segurança alimentar).

---

## O Problema que Resolvemos

No campo brasileiro, a decisão de **o que plantar depois da colheita** ainda acontece no escuro:

- **Mais de 80%** dos estabelecimentos rurais do Brasil (**83,6%** no Centro-Oeste e **92,6%** no Nordeste — apenas **7,4%** com assistência) não têm acompanhamento técnico agronômico (**IBGE / IPEA**).
- **Quase 1 em cada 4** produtores declara não saber ler ou escrever (**IBGE**), o que transforma aplicativos próprios, telas de login, formulários e gráficos em **exclusão digital**.
- Ao mesmo tempo, **96%** dos produtores já usam **WhatsApp** todos os dias (**ABMRA**).

Quando falta informação acessível:
1. O produtor repete a mesma cultura em solo cansado e seco;
2. Pragas e doenças exigem mais defensivos;
3. IAs genéricas podem empurrar uma microrregião inteira para a mesma cultura na mesma semana (**efeito manada**), derrubando preços, congestionando fretes e gerando **escassez de outros alimentos na mesa da população**.

---

## A Solução: Zero App, Zero Login — Só Conversa

O **PersonalAgro ("Zé Agro")** opera diretamente dentro do WhatsApp sem exigir cadastro, senha ou download de aplicativo:

1. **Entrada sem barreiras (Áudio, Foto, Texto e Multilíngue):**
   - Se o produtor envia **áudio** (com limpeza de ruído da roça via `FFmpeg` + transcrição `Whisper` com fallback multimodal), o sistema responde **exclusivamente em áudio natural** (`edge-tts` com tradutor fonético que converte siglas como `mm`, `t/ha` e `14d` em fala cotidiana).
   - Se envia **foto** da lavoura, a visão computacional descreve sintomas visuais em linguagem simples (com sanitização anti-loop degenerativo e travas para nunca inventar dose ou defensivo fora de bula).
   - Suporte **multilíngue seguro** em [`src/config/i18n.js`](src/config/i18n.js) com travamento de idioma por DDI, proteção anti-vazamento de idioma na resposta e vozes neurais dedicadas (ex.: `pt-BR`, `en`, `es` e demais idiomas mapeados).
2. **Motor Determinístico de Rotação de Culturas para Todo o Brasil (`NASA POWER` ao vivo + `Open-Meteo 14d` + `IBGE PAM` + `Embrapa`):**
   - [`src/services/nasaLive.js`](src/services/nasaLive.js) geocodifica municípios brasileiros e consulta ao vivo a API **NASA POWER** (`GWETROOT`, `GWETTOP`, `PRECTOTCORR`, `T2M_MAX`/`T2M_MIN`, `ALLSKY_SFC_SW_DWN`) e a previsão **Open-Meteo 14d (`FAO ET0`)**, com fallback para o baseline calibrado dos 6 polos de Goiás.
   - [`src/services/ibgeAgro.js`](src/services/ibgeAgro.js) consulta municípios e a **Produção Agrícola Municipal (IBGE SIDRA PAM 5457)** para identificar dominância de monocultura e produtividade local.
   - [`src/services/rotation.js`](src/services/rotation.js) calcula pontuação transparente (`0 a 100`) e entrega **3 estratégias comparáveis de rotação**, explicando **benefícios, riscos e janela de início**, sem substituir o julgamento local do agricultor.
3. **Custos Reais Anti-Alucinação, Trava Anti-Efeito Manada & Escoamento Regional:**
   - [`src/services/custosProducao.js`](src/services/custosProducao.js) calcula custos operacionais (horas de máquina, diesel por UF via **CombustivelAPI / ANP**, sementes e manejo) cruzados com produtividade IBGE e cotações físicas, sem deixar o LLM inventar valores.
   - [`src/services/communitySignals.js`](src/services/communitySignals.js) agrega contadores **100% anônimos** por microrregião (sem telefone, nome ou dado pessoal) para pontuar **diversificação** e evitar saturação de oferta.
   - Indica canais reais de escoamento (`cooperativas`, `CEASA-GO`, `CEASA-DF`, agroindústrias e chamadas públicas **`CONAB / PAA / PNAE`**).
4. **Painel Técnico Web (`/rotacao`) e Demonstração (`/testar`):**
   - Enquanto o produtor usa voz simples no WhatsApp, técnicos da **EMATER**, **SEAPA**, cooperativas e jurados podem acessar o mapa web interativo (`/rotacao`) com camadas ao vivo **`NASA GIBS`** (`MODIS Terra NDVI` e `SMAP L4 Soil Moisture`), simulador de 3 rotas, exportação CSV (`/api/rotacao/csv`) e o QR Code ao vivo em `/testar`.

---

## Diagramas e Documentação do Projeto

- **Fluxo Humano (Produção no WhatsApp):** [`docs/diagramas/fluxo-humano-cumpadre-digital.svg`](docs/diagramas/fluxo-humano-cumpadre-digital.svg)
- **Fluxo Técnico (Pipeline & Anti-Manada):** [`docs/diagramas/fluxo-tecnico-cumpadre-digital.svg`](docs/diagramas/fluxo-tecnico-cumpadre-digital.svg)
- **Mapa Dor, Solução & Fluxo Completo:** [`docs/11-MAPA_DOR_SOLUCAO_E_FLUXO.md`](docs/11-MAPA_DOR_SOLUCAO_E_FLUXO.md)
- **Perguntas & Respostas para Banca:** [`docs/09-BANCA_PERGUNTAS_E_RESPOSTAS.md`](docs/09-BANCA_PERGUNTAS_E_RESPOSTAS.md)
- **Visão Humanitária & Roteiro de Pitch:** [`docs/10-PITCH_HUMANITARIO_NASA.md`](docs/10-PITCH_HUMANITARIO_NASA.md)
- **Dados, CSVs e JSONs Exportados:** [`recursos-e-dados-nasa/README.md`](recursos-e-dados-nasa/README.md)

---

## Transparência de Dados e Fontes Reais

Separação exata entre **APIs ao vivo**, **bases agronômicas curadas no código** e **canais regionais mapeados**:

| Camada | Fonte / Serviço | Como entra hoje no código |
|---|---|---|
| **Satélite & Agroclimatologia** | **NASA POWER API** (`community=AG`) | Consulta ao vivo para municípios do Brasil em [`src/services/nasaLive.js`](src/services/nasaLive.js) e baseline dos 6 polos de Goiás via [`scripts/fetch-nasa-goias.js`](scripts/fetch-nasa-goias.js): `GWETROOT` (umidade na raiz), `GWETTOP` (superfície), `PRECTOTCORR` (chuva 30d), `T2M_MAX`/`T2M_MIN` (dias ≥ 34 °C) e `ALLSKY_SFC_SW_DWN` em [`src/data/nasa_goias_baseline.json`](src/data/nasa_goias_baseline.json). |
| **Camadas Visuais no Mapa** | **NASA GIBS** (WMTS) | Proxy em [`src/server.js`](src/server.js) exibindo ao vivo no mapa `/rotacao` (`Leaflet` sobre CARTO/OpenStreetMap) as camadas `MODIS_Terra_NDVI_8Day` (vegetação) e `SMAP_L4_Analyzed_Surface_Soil_Moisture` (umidade). |
| **Previsão & Evapotranspiração** | **Open-Meteo** (+ fallback **`wttr.in`**) | Geocodificação no Brasil + previsão de 14 dias com evapotranspiração **`FAO ET0`** para saldo hídrico ([`src/services/nasaLive.js`](src/services/nasaLive.js)) e previsão de 7 dias ao vivo no chat ([`src/services/weather.js`](src/services/weather.js)). |
| **Produção Municipal** | **IBGE Localidades & SIDRA PAM (5457)** | Consulta ao vivo em [`src/services/ibgeAgro.js`](src/services/ibgeAgro.js) de municípios brasileiros, culturas dominantes e produtividade municipal (`kg/ha`) para medir risco de monocultura e balizar conta de safra. |
| **Agronomia Brasileira** | **Embrapa** *(base curada no código)* | Parâmetros numéricos de culturas e sequências de Plantio Direto no Cerrado em [`src/services/rotation.js`](src/services/rotation.js) + 11 dossiês em [`docs/knowledge_base/`](docs/knowledge_base) (*Cerrados*, *Mandioca e Fruticultura*, pecuária, Pronaf). *(Sem chamada de API externa da Embrapa neste estágio.)* |
| **Cotações, Diesel & Escoamento** | **CEASA-PR / Notícias Agrícolas / AwesomeAPI / CombustivelAPI (ANP)** *(ao vivo)* · **CONAB / PAA / PNAE / CEASA-GO / CEASA-DF** *(mapeados)* | Preços ao vivo de hortifrúti (`CEASA-PR`), grãos/pecuária por praça (`Notícias Agrícolas`) e câmbio `USD/BRL` (`AwesomeAPI`) em [`src/services/market.js`](src/services/market.js); preço do diesel por UF (`CombustivelAPI / ANP`) e cálculo de maquinário em [`src/services/custosProducao.js`](src/services/custosProducao.js); compradores regionais em `CANAIS_ESCOAMENTO_GOIAS` ([`src/services/rotation.js`](src/services/rotation.js)). |
| **Comunidade Anônima** | **Radar Regional** | Contadores agregados sem PII em [`src/services/communitySignals.js`](src/services/communitySignals.js) para o freio anti-efeito manada. |

---

## Como Rodar Localmente

### Pré-requisitos
- **Node.js 20+**
- **FFmpeg** instalado no sistema (para limpeza de ruído de áudios do WhatsApp)
- **Python 3 + `edge-tts`** (opcional, usado na síntese neural de áudio multilíngue; há fallback integrado)

### Instalação e Execução
```bash
git clone https://github.com/cauacreis/ze-agro-nasa-space-apps.git
cd ze-agro-nasa-space-apps
npm install
cp .env.example .env
```

Preencha no `.env` suas chaves (`SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `QR_TOKEN` e demais provedores opcionais em rodízio gratuito).

```bash
# 1. Atualizar o baseline real da NASA POWER + Open-Meteo 14d (opcional — JSON/CSV já acompanham o repo)
npm run fetch:nasa

# 2. Exportar CSVs e JSON consolidado para análise (opcional)
npm run export:csv

# 3. Rodar a suíte completa de testes (motor NASA, HTTP, anti-abuso e fluxos operacionais)
npm test

# 4. Iniciar o servidor web + gateway WhatsApp
npm start
```

Com o servidor no ar (padrão `http://localhost:3000`):
- **`/rotacao`** — Painel interativo de rotação de culturas, balanço hídrico 14d e camadas **NASA GIBS** (`MODIS NDVI` / `SMAP`).
- **`/testar`** — QR Code e links prontos para testar o Zé Agro no WhatsApp.
- **`/api/rotacao/csv`** — Download direto do baseline NASA POWER + Clima 14d de Goiás.
- **`/qr?token=SEU_QR_TOKEN`** — Pareamento protegido da sessão WhatsApp (Baileys).
- **`/ping`** — Health check HTTP (`pong`).

---

## Arquitetura de Pastas

```text
index.js                         # Inicialização do servidor HTTP, WhatsApp, backup e agendamentos
src/
  server.js                      # Express: /rotacao, /testar, /qr, proxy NASA GIBS e APIs REST
  config/i18n.js                 # Internacionalização, travamento de idioma por DDI, vozes TTS e anti-vazamento
  public/rotacao.html            # Interface web Leaflet + simulação em 4 cliques
  middlewares/subscription.js    # Controle de perfil/memória com acesso 100% gratuito e contingência offline
  services/
    whatsapp.js                  # Gateway Baileys (áudio, foto, texto, comandos e proteção anti-ban)
    ai.js                        # Orquestração multimodal, sanitização de imagem, tradução fonética e guardrails
    provedores.js                # Failover multi-chave e multi-provedor (Groq, Gemini, Cerebras, GitHub, Mistral etc.)
    nasaLive.js                  # Cliente ao vivo NASA POWER + Open-Meteo 14d por município no Brasil
    ibgeAgro.js                  # Cliente oficial IBGE Localidades + SIDRA PAM 5457
    custosProducao.js            # Cálculo determinístico de custos, maquinário e diesel real (CombustivelAPI/ANP)
    rotation.js                  # Motor determinístico NASA POWER + FAO ET0 + IBGE + Embrapa + escoamento
    communitySignals.js          # Contadores regionais anônimos (anti-efeito manada)
    weather.js / janela.js       # Previsão Open-Meteo (fallback wttr.in) e janela operacional
    market.js / field.js / finance.js / reminders.js / shopping.js / database.js / opsStore.js
scripts/
  fetch-nasa-goias.js            # Coletor oficial NASA POWER + Open-Meteo 14d para os 6 polos de Goiás
  export-recursos-csv.js         # Gerador de CSVs e JSON em recursos-e-dados-nasa/
  test-rotacao-nasa.js           # Testes automatizados do motor NASA, HTTP e guardrails
  test_operacional.mjs           # Testes operacionais e unitários dos módulos auxiliares
  test-multilingue.js            # Testes de arquitetura multilíngue, DDI lock, anti-vazamento e TTS
  test-imagem.js                 # Testes de visão computacional (anti-loop, histórico limpo e validação agro)
docs/
  knowledge_base/                # 11 bases agronômicas curadas (Embrapa / Cerrado / Pronaf)
  diagramas/                     # Diagramas vetoriais SVG e PDF dos fluxos humano e técnico
```

---

## Segurança, Privacidade e Política Pública

- **Zero barreira e LGPD:** nenhum formulário de cadastro ou senha; cada usuário é isolado por identificador e pode remover seus registros na conversa com `"apagar meus dados"`. O radar anti-efeito manada jamais armazena telefone, nome ou conversa.
- **Guardrails contra alucinação:** proibido inventar doses de defensivos/receituários; orienta confirmação em bula e acompanhamento presencial da **EMATER** ou agrônomo em casos graves.
- **Sustentabilidade e Escala:** projeto **100% gratuito para o produtor familiar**, desenhado para atuar integrado a políticas públicas (**SEAPA**, **EMATER**, **PAA Goiás**, **PAA** e **PNAE**) e expandir dos 6 polos validados em Goiás para regiões críticas de seca como o **Nordeste brasileiro**.

---

## Licença e Autoria

Copyright (c) 2026 **Cauã Felype Caetano Reis**.

Distribuído sob a licença **GNU Affero General Public License v3.0 (`AGPL-3.0-only`)** — licença Open Source aprovada pela OSI (compatível com as regras do NASA Space Apps Challenge) com **copyleft forte**: modificações e uso em servidor/rede para terceiros exigem manutenção dos créditos do autor e abertura do código-fonte derivado. Veja [LICENSE](LICENSE) e [NOTICE](NOTICE).
