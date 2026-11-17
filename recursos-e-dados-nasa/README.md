# Recursos, Sites, Dados e CSVs — PersonalAgro (NASA Space Apps Goiânia)

Esta pasta centraliza todos os **sites oficiais, APIs abertas, arquivos CSV prontos para planilha e JSONs consolidados** utilizados pelo **PersonalAgro ("Zé Agro")** no desafio de **Rotação de Culturas & Resiliência do Solo**.

---

## Estrutura desta Pasta

| Caminho | O que contém | Para que serve |
|---|---|---|
| [01-SITES-APIS-E-LINKS-UTEIS.md](01-SITES-APIS-E-LINKS-UTEIS.md) | Portais NASA Earth, APIs de clima/solo, fontes Embrapa/ZARC e ferramentas de prototipação | Referência rápida para equipe, slides do pitch e auditoria dos jurados |
| [csv/nasa_power_resumo_municipios_goias.csv](csv/nasa_power_resumo_municipios_goias.csv) | Resumo de 6 polos de Goiás (umidade na raiz `GWETROOT`, superfície, chuva 30d, calor $\ge 34^\circ\text{C}$, previsão 14d e saldo hídrico) | Importação rápida em Excel, Google Sheets, Power BI ou ferramentas de vibe coding |
| [csv/nasa_power_serie_diaria_14d_goias.csv](csv/nasa_power_serie_diaria_14d_goias.csv) | Série histórica diária (84 linhas: últimos 14 dias válidos por município) da NASA POWER | Gráficos de evolução de umidade na raiz e chuva nos slides |
| [csv/previsao_14d_open_meteo_goias.csv](csv/previsao_14d_open_meteo_goias.csv) | Previsão diária para os próximos 14 dias (84 linhas: chuva, temperaturas e evapotranspiração `ET0` FAO) | Balanço hídrico futuro por município |
| [csv/solos_cerrado_goias.csv](csv/solos_cerrado_goias.csv) | Perfis agronômicos de solo do Cerrado usados no motor | Referência de capacidade de água disponível (CAD) e compactação |
| [csv/culturas_embrapa_cerrado.csv](csv/culturas_embrapa_cerrado.csv) | Catálogo com 11 culturas e plantas de cobertura (família, ciclo, demanda hídrica, N fixado, palhada, raiz, pragas) | Base técnica para análise de rotação |
| [csv/canais_escoamento_polos_goias.csv](csv/canais_escoamento_polos_goias.csv) | Corredores rodoviários/ferroviários, distância média e compradores locais por cultura nos 6 polos de Goiás | Liquidez regional e planejamento de escoamento dentro da rotação |
| [json/catalogo_agronomico_cerrado.json](json/catalogo_agronomico_cerrado.json) | JSON consolidado com solos, culturas, canais de escoamento, resumo municipal e simulações de referência | Insumo único para integrações externas ou testes |

---

## Como Atualizar Todos os Dados

1. **Coletar os dados mais recentes da NASA POWER API e Open-Meteo (14 dias):**
   ```powershell
   node scripts/fetch-nasa-goias.js
   ```
   Atualiza [src/data/nasa_goias_baseline.json](../src/data/nasa_goias_baseline.json) e [src/data/nasa_goias_baseline.csv](../src/data/nasa_goias_baseline.csv).

2. **Reexportar os 5 CSVs organizados e o JSON consolidado nesta pasta:**
   ```powershell
   node scripts/export-recursos-csv.js
   ```

3. **Baixar o CSV diretamente pela aplicação web:**
   Com o servidor rodando, acesse `GET /api/rotacao/csv` ou clique em **"Baixar Dados CSV (NASA + Clima Goiás)"** no rodapé de `/rotacao`.
