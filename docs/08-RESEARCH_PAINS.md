# 08 — Pesquisa de Dores e Oportunidades (ago/2026)

*Fontes: IPEA, Embrapa, G1, Globo Rural, Câmara dos Deputados, CEASAs estaduais, Hotmart, grupos de WhatsApp, portais de tendências agro 2026.*

## A dor-mãe que valida o projeto
- **80% dos estabelecimentos rurais brasileiros NÃO recebem nenhum tipo de orientação técnica** (IPEA/Censo Agro).
- Presidente da Embrapa: "O Brasil tem 5 milhões de produtores, apenas 1 milhão têm condições de contratar consultoria. **Os outros 4 milhões não têm acesso à informação**."
- Globo Rural (2026): Ater "restrita e insuficiente" até pra crise climática.
- **Conclusão: o Zé Agro não é um app a mais — é o único "técnico" que milhões de produtores terão.**

## Dores mapeadas → Features priorizadas

### 🥇 1. PECUÁRIA (o bot só cobre plantas hoje!)
**Evidências da dor:**
- Grupos de WhatsApp de pecuaristas lotam; gente **COBRANDO** por consulta técnica via grupo de WhatsApp no Hotmart ("Clube da Consulta Técnica").
- Embrapa Gado de Corte tem FAQ com **700+ perguntas/respostas gratuitas** (pastagem, carrapato, verminose, mineração, cria/recria/engorda).
- Embrapa Gado de Leite mantém canais no WhatsApp por demanda.
**Ação:** Agente BOI (corte + leite) com dossiês: pastagens (braquiária/mombaça), carrapato-e-verminose (contato com carrapaticidas), mineralização, calendário sanitário (aftosa/brucelose), manejo de leite (ordenha, mastite), suplementação a pasto. Gemini já analisa fotos de animais sem mudança de código.

### 🥈 2. COTAÇÃO DE PREÇOS (a dor da venda)
**Evidências:**
- "Entreguei produto de primeira e recebi um preço que mal paga o custo" (Aegro/blog setor).
- **CEASA/SC envia cotação via WhatsApp MANUALMENTE** (número pra receber) — demanda comprovada no canal exato do nosso bot.
- CEASA-PR publica cotação em página HTML simples (scrappable). Agrolink publica por produto/CEASA. 60% das hortaliças do Brasil passam por Ceasas.
**Ação:** Tool `consultar_preco` (produto + CEASA) com scraping/cache diário; no aviso matinal, opcional: "tomate em Goiânia: R$ 2,80/kg (↑12%)". Ajuda o produtor a decidir QUANDO e ONDE vender.

### 🥉 3. CRÉDITO / PRONAF (a dor da burocracia)
**Evidências:**
- Pronaf 2026/27: R$ 85 bi, juros 1-2% a.a. — mas exige CAF ativo, CAR, e **projeto técnico**.
- "Falta de informação: agricultores não sabem que têm direito" + gente PAGANDO consultorias (E-plan etc.) só pra escrever o projeto.
**Ação:** Dossiê `pronaf_credito.md` + fluxo guiado: Zé Agro explica linhas (Microcrédito, Mulher, Jovem, Agroecologia), faz checklist de documentos do produtor e ajuda a **esboçar o projeto técnico simplificado** usando a memória que já tem da lavoura dele. Upsell natural do VIP.

### 4. CONFIANÇA / ANTI-ALUCINAÇÃO
**Evidências:** A própria Embrapa está criando IA agro focada em precisão pra evitar "alucinações"; produtores relatam desconfiança de respostas erradas de IAs generalistas.
**Ação:** Regras nos prompts: citar a fonte ("segundo a Embrapa...") quando usar o dossiê; admitir incerteza e recomendar técnico presencial em casos graves (defensivo off-label = NUNCA); nunca inventar dose de produto.

### 5. CLIMA EXTREMO (já coberto, dá pra turbinar)
- Seca/chuva fora de época = dor citada em todo levantamento.
**Ação:** Alertas severos no broadcast: geada (mín <5°C), veranico (3+ dias sem chuva previstos), rajadas. Open-Meteo entrega tudo de graça.

### 6. Tendências 2026 que validam o caminho
- "Talking Tractor" da Valtra na Agrishow: voz como interface do campo.
- IA preditiva e agentes digitais consolidando; conectividade rural ainda só 34% — **WhatsApp é o canal que funciona onde 4G não chega**.
- Bioinsumos e agricultura regenerativa como temas quentes de conteúdo.

## Roadmap sugerido (ordem de impacto)
1. Agente Pecuária (expande o mercado 2x)
2. Cotações CEASA (dor universal de venda)
3. Assistente Pronaf (valor percebido altíssimo)
4. Regras anti-alucinação + citação de fonte
5. Alertas severos de clima
