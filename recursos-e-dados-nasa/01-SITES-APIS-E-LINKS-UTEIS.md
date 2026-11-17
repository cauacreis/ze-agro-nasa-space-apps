# 01 — Sites, APIs Abertas e Fontes Oficiais Utilizadas

Catálogo consolidado de todos os portais, endpoints e bases usados no **PersonalAgro ("Zé Agro")** para o **NASA Space Apps Goiânia**.

---

## 1. NASA Earth Observations (Acesso Direto Sem API Key)

### A. NASA POWER Agroclimatology API (Fonte Numérica Principal)
- **Documentação:** https://power.larc.nasa.gov/docs/
- **Portal Visual (Data Access Viewer):** https://power.larc.nasa.gov/data-access-viewer/
- **Endpoint REST usado por [`scripts/fetch-nasa-goias.js`](../scripts/fetch-nasa-goias.js):**
  ```text
  https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MAX,T2M_MIN,GWETTOP,GWETROOT,ALLSKY_SFC_SW_DWN&community=AG&longitude=-50.9192&latitude=-17.7923&start=YYYYMMDD&end=YYYYMMDD&format=JSON
  ```
- **Variáveis Agroclimatológicas utilizadas:**
  | Parâmetro | Significado | Papel no PersonalAgro |
  |---|---|---|
  | `GWETROOT` | Umidade do solo na zona da raiz (0 a 1) | Mede a "Caixa d'Água do Solo" para definir risco hídrico da rotação |
  | `GWETTOP` | Umidade superficial do solo (0 a 1) | Avalia condição de germinação na camada de semeadura |
  | `PRECTOTCORR` | Precipitação diária corrigida (mm/dia) | Soma dos últimos 30 dias reais em Goiás |
  | `T2M_MAX` / `T2M_MIN` | Temperatura máxima e mínima a 2 metros (°C) | Contabiliza dias de calor extremo ($\ge 34^\circ\text{C}$) |
  | `ALLSKY_SFC_SW_DWN` | Radiação solar incidente ($MJ/m^2/\text{dia}$) | Estimativa de demanda energética e evaporação |

### B. NASA GIBS (Camadas de Satélite no Mapa Web `/rotacao`)
- **Documentação API:** https://nasa-gibs.github.io/gibs-api-docs/
- **Tiles XYZ WMTS usados ao vivo no Leaflet (`src/public/rotacao.html`):**
  - **Vegetação (MODIS Terra NDVI 8-Day — zoom nativo até nível 9):**
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`
  - **Umidade do Solo (SMAP L4 — zoom nativo até nível 6):**
    `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`

### C. Portais Visuais e Missões NASA de Referência (Para Slides e Pitch)
- **NASA Worldview (focado em Goiás):** https://worldview.earthdata.nasa.gov/?v=-53.5,-19.8,-45.8,-12.5
- **Missão NASA SMAP (Soil Moisture Active Passive):** https://smap.jpl.nasa.gov/
- **NASA Crop-CASMA (Crop Condition and Soil Moisture Analytics):** https://nassgeo.gmu.edu/CropCASMA/
- **NASA Earthdata Portal:** https://www.earthdata.nasa.gov/

---

## 2. Previsão Climática Futura (14 Dias)

- **Open-Meteo Weather Forecast API:** https://open-meteo.com/en/docs
- **Endpoint usado no projeto (14 dias com Evapotranspiração FAO `ET0`):**
  ```text
  https://api.open-meteo.com/v1/forecast?latitude=-17.7923&longitude=-50.9192&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&timezone=auto&forecast_days=14
  ```
- **Uso no motor:** calcula `chuva_prevista_14d_mm - et0_previsto_14d_mm` para prever se as próximas duas semanas vão repor ou secar a umidade da raiz.

---

## 3. Solo Local, Culturas e Mercado Brasileiro

| Fonte | Link | O Que Fornece |
|---|---|---|
| **Embrapa Cerrados** | https://www.embrapa.br/cerrados | Parâmetros técnicos de rotação, plantio direto na palhada, braquiária, crotalária e soja/milho/feijão (dossiês em `docs/knowledge_base/`) |
| **ZARC — MAPA (Zoneamento Agrícola de Risco Climático)** | https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico | Janelas oficiais de menor risco climático por cultura, solo e município |
| **ISRIC SoilGrids** | https://soilgrids.org/ | Referência global aberta de classes de solo, textura (argila/areia) e carbono orgânico |
| **MapBiomas Brasil** | https://brasil.mapbiomas.org/ | Uso e cobertura do solo no Cerrado e histórico de pastagens/lavouras |
| **CONAB — Safras** | https://www.conab.gov.br/ | Séries de produtividade, área plantada e custos regionais |
| **CEASA-GO** | https://www.ceasa.go.gov.br/ | Cotações estaduais de hortaliças e frutas em Goiás |

---

## 4. Ferramentas de Prototipação, Mapas e Vibe Coding (Citadas nas Mentorias)

| Ferramenta | Link | Uso |
|---|---|---|
| **Leaflet** | https://leafletjs.com/ | Biblioteca leve usada no mapa interativo de Goiás em `/rotacao` |
| **Lovable** | https://lovable.dev/ | Prototipação rápida de telas web para testes com usuários |
| **v0 (Vercel)** | https://v0.dev/ | Geração rápida de interfaces React / web para demonstrações |
| **Bolt.new** | https://bolt.new/ | Protótipos rápidos no navegador sincronizados com GitHub |
| **Google AI Studio** | https://aistudio.google.com/ | Testes rápidos com Gemini e multimodalidade (visão de plantas) |
