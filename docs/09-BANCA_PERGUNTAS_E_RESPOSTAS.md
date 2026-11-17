# Guia de Perguntas da Banca — Personal Agro (Zé Agro / Cumpadre Digital)

> Respostas curtas, humanas e diretas para falar em voz alta na banca, **100% alinhadas à missão humanitária e gratuita** (combater fome, seca, exclusão digital e escassez de alimentos — sem foco em lucro sobre o produtor).  
> Ver também: [10-PITCH_HUMANITARIO_NASA.md](./10-PITCH_HUMANITARIO_NASA.md) e [11-MAPA_DOR_SOLUCAO_E_FLUXO.md](./11-MAPA_DOR_SOLUCAO_E_FLUXO.md).

---

## 0. RESPOSTAS RÁPIDAS DE OURO (Direto ao ponto, sem rodeios)

### 0.1 "Qual base da NASA vocês usam? O quê, como e para quê?"
- **O quê:** Usamos a **NASA POWER Agroclimatology (`community=AG`)**, lendo especificamente **umidade do solo na zona da raiz (`GWETROOT`)**, **umidade de superfície (`GWETTOP`)**, **chuva acumulada** e **dias de calor extremo acima de 34 °C**.
- **Como:** Cruzamos esses dados de satélite com o balanço hídrico de **14 dias (Open-Meteo FAO ET0)**, regras agronômicas da **Embrapa** e o **pulso anônimo da região** para dar uma nota de 0 a 100 para cada plano de rotação.
- **Para quê:** Para impedir que o Seu José plante no escuro em solo seco ou cansado, indicando a cultura que economiza água, quebra pragas sem veneno extra e garante colheita na mesa.

### 0.2 "O que já está pronto de fato hoje vs. o que é futuro?"
- **Resposta objetiva:**
  > "Não é protótipo de slide — **já está construído e rodando agora no WhatsApp**. Hoje ele já recebe áudio com ruído de roça, analisa foto de praga na lavoura, calcula rotação com dados reais da **NASA POWER** nos **6 polos produtivos de Goiás** (Rio Verde, Jataí, Cristalina, Itaguaru, Anápolis e Goiânia), aplica o freio anti-efeito manada, anota caderno de campo e responde em voz natural."

### 0.3 "Como vocês vão chegar até o Seu José? Como ele descobre que o bot existe?"
- **Resposta objetiva (Canais de confiança que o produtor já frequenta):**
  > "Produtor rural não descobre solução por anúncio de internet — ele confia em quem já está no campo. Nossa entrada é por **3 canais reais**:  
  > 1) **Técnicos da EMATER, SEAPA e sindicatos rurais**, que deixam o contato salvo no celular do produtor durante a visita;  
  > 2) **Cartaz com QR Code e número direto** no balcão da cooperativa, CEASA e casa agropecuária;  
  > 3) **Compartilhamento de vizinho pra vizinho no WhatsApp** — quando o produtor recebe o plano da NASA, já vem um link de 1 clique pra mandar pro cumpadre da cerca ao lado."

### 0.4 "Como vocês vão implementar e escalar isso agora?"
- **Resposta objetiva (Escala técnica + institucional em 3 passos):**
  > "**Passo 1 (Agora — Goiás):** piloto fechado acompanhando uma safra real junto a produtores familiares e técnicos da EMATER nos 6 polos de Goiás que já estão calibrados no sistema.  
  > **Passo 2 (Escala Técnica — Nordeste e Brasil):** como a API da **NASA POWER** é global por latitude e longitude, escalar para o semiárido nordestino exige apenas plugar as coordenadas dos novos polos e o catálogo de culturas resistentes à seca (mandioca, feijão-caupi, sorgo, gergelim, palma).  
  > **Passo 3 (Sustentabilidade Pública):** operar conveniado a programas estaduais (**SEAPA / PAA Goiás**) e federais (**PAA e PNAE**), mantendo custo de centavos por usuário com nosso rodízio de IAs gratuitas e **R$ 0 para o Seu José**."

### 0.5 "Por que a equipe de vocês consegue entregar isso?"
- **Resposta objetiva:**
  > "Porque nós unimos **engenharia prática de IA e dados espaciais** com **vivência real do problema aqui em Goiás**. Em vez de parar na teoria, construímos um sistema completo em produção que traduz satélite da NASA, visão computacional e voz para a realidade de quem alimenta o país."

### 0.6 "Por que não fizeram um mapa interativo cheio de camadas (SMAP/Landsat/NDVI), já que o desafio cita visualização geoespacial?"
- **Resposta objetiva:**
  > "O próprio desafio pede acessibilidade para quem tem pouca experiência técnica ou geoespacial. Quase 1 em cada 4 produtores no Brasil não lê nem escreve. Um mapa com sliders excluiria o Seu José; transformar umidade da raiz, evapotranspiração e risco em áudio simples no WhatsApp é inclusão de verdade — e deixamos o resumo estruturado ('forma profissional') para técnicos e cooperativas."

### 0.7 "Satélite tem grade grande — como vocês lidam com incerteza e diferenças dentro da propriedade?"
- **Resposta objetiva:**
  > "A base **NASA POWER** dá a tendência climática e hídrica da microrregião, não de cada metro de terra. Por isso o produtor informa o tipo de solo e histórico da roça, e o sistema deixa claro que atua como **apoio** — recomendando análise de solo e validação local, sem nunca substituir o julgamento do agricultor."

### 0.8 "Como vocês traduzem termos como evapotranspiração, umidade na raiz e nitrogênio para quem quase não lê?"
- **Resposta objetiva:**
  > "Fazemos as contas técnicas nos bastidores (`GWETROOT`, `FAO ET0`, balanço hídrico e fixação biológica de nitrogênio), e uma camada de tradução converte tudo antes de virar áudio em palavras do campo: 'caixa d'água da raiz', 'sol secando a terra mais rápido que a chuva repõe' e 'planta que devolve força pra terra sem adubo químico'."

### 0.9 "Como NASA, Embrapa e CONAB entram de fato nos dados (o que é API ao vivo e o que é base curada)?"
- **Resposta objetiva (transparência técnica total):**
  > "**1) NASA (dados reais de satélite e API):** pegamos da **NASA POWER (`community=AG`)** umidade na raiz (`GWETROOT`), umidade superficial (`GWETTOP`), chuva 30d (`PRECTOTCORR`), temperatura máxima/mínima e dias acima de 34 °C via script coletor para o baseline dos 6 polos de Goiás — e no painel web `/rotacao` exibimos também camadas ao vivo da **NASA GIBS** (`MODIS NDVI` e `SMAP`), cruzadas com previsão de 7d/14d e evapotranspiração da **Open-Meteo**.  
  > **2) Embrapa (base curada no código, sem API):** transformamos os Sistemas de Produção da Embrapa em **9 dossiês por cultura** para o WhatsApp e em **parâmetros numéricos** (`ciclo`, `demanda de água`, `tolerância à seca/calor`, `palhada`, `fixação de nitrogênio` e `quebra de nematoides`) no motor de rotação.  
  > **3) CONAB & Mercado:** hoje não consumimos API da CONAB — ela entra como **referência mapeada de escoamento institucional** (junto ao **PAA e PNAE** no polo de Itaguaru para feijão e mandioca, ao lado de cooperativas e `CEASA-GO/DF`), enquanto as **cotações de preço ao vivo** no chat vêm por scraping diário oficial da **CEASA-PR** como referência de mercado."

### 0.10 "O que cada perfil (produtor, técnico/cooperativa e sistema regional) vê na prática?"
- **Resposta objetiva:**
  > "**O Seu José (Produtor no WhatsApp):** vê ou ouve só o essencial em linguagem humana (e áudio quando manda áudio), sem aplicativo, senha, siglas ou gráficos complexos: risco de repetir a cultura, sugestão prática, janela de início e onde vender perto.  
  > **O Técnico / Cooperativa / Banca:** pode pedir a `'forma profissional'` no WhatsApp (escore `0–100`, economia de água `%`, palhada `t/ha`, N `kg/ha` e distância em `km`) ou abrir o **Painel Web `/rotacao`** para simular em 4 cliques, ver telemetria NASA + 14 dias, alternar camadas **NASA GIBS (`MODIS NDVI` / `SMAP`)** no mapa e baixar o **CSV**.  
  > **O Radar Anti-Manada (`communitySignals.js`):** vê apenas contadores anônimos por microrregião (prioridades e planos mais buscados), sem nenhum telefone ou dado pessoal, para diversificar as recomendações."

---

## 1. "VAI TER" (quase 100% de chance — inclusive provocações sobre o pitch)

### 1.1 "Sem senha, sem login e sem cadastro — isso não torna o sistema inseguro?" *(Provocação clássica!)*
- **O que querem testar:** se vocês pensaram em segurança vs inclusão real.
- **Resposta simples:**
  > "Para quem mal consegue preencher um formulário — e quase 1 em cada 4 pessoas no campo declara não saber ler ou escrever — login longo não é segurança, é exclusão. A conta do produtor já chega autenticada e criptografada pelo próprio WhatsApp, os dados ficam separados por número, e se ele quiser apagar tudo basta mandar 'apagar meus dados'."

### 1.2 "Por que no WhatsApp e não um aplicativo próprio?"
- **O que querem testar:** se conhecem a realidade do agricultor familiar (Seu José).
- **Resposta simples:**
  > "Porque mais de 80% das propriedades estão sem assistência técnica, mas 96% dos produtores já usam WhatsApp todo dia. Sem baixar app e sem cadastro, o Seu José manda um áudio ou foto da lavoura em segundos e já recebe ajuda pra não perder a safra da família."

### 1.3 "Como vocês combatem a escassez de alimentos e o 'efeito manada' com IA?"
- **O que querem testar:** se a IA não empurra todo mundo a plantar a mesma coisa.
- **Resposta simples:**
  > "Se uma IA comum mandar 80% da região plantar só milho ou só feijão na mesma semana, aquele alimento cai de preço, outros alimentos somem do mercado e falta caminhão na colheita. Nosso código lê de forma anônima o que a região já tá consultando, dá pontuação extra pra diversificar o plantio e garante comida variada na mesa e frete menos congestionado."

### 1.4 "Qual a diferença entre usar o Zé Agro e perguntar direto no ChatGPT?"
- **O que querem testar:** se há engenharia, ciência espacial e proteção contra erro real.
- **Resposta simples:**
  > "O ChatGPT dá resposta genérica e chuta quando não sabe. Nós fazemos conta antes de responder: cruzamos umidade do solo na raiz e calor da NASA, chuva prevista de 14 dias, base da Embrapa, sinais anônimos da região e pontos reais de entrega — como cooperativas, CEASA e CONAB. A IA entra só para conversar de um jeito que o Seu José entenda."

### 1.5 "Os dados da NASA estão mesmo sendo usados na conta ou são só enfeite?"
- **O que querem testar:** rigor técnico por trás da promessa espacial.
- **Resposta simples:**
  > "Entram direto no cálculo. Nosso motor lê a umidade na zona da raiz, os dias de calor extremo acima de 34 °C e o saldo de água previsto para medir o risco de repetir a cultura no solo cansado, priorizar plantas mais tolerantes à seca e apontar a melhor janela de início."

### 1.6 "E se a IA errar uma dose de defensivo e matar a planta ou o animal?"
- **O que querem testar:** responsabilidade ética e segurança no campo.
- **Resposta simples:**
  > "Ele é travado contra isso. É proibido inventar dose, produto fora de bula ou receita. Se faltar informação na base ou o problema for grave, ele informa o nível de confiança, orienta confirmar na bula e encaminha direto para agrônomo, veterinário ou Emater. E ainda ajudamos a quebrar pragas com rotação de culturas para reduzir a dependência de veneno."

### 1.7 "Se é 100% gratuito e vocês não focam em dinheiro, como isso se sustenta e por que importa?"
- **O que querem testar:** se o impacto social se sustenta sem virar promessa vazia.
- **Resposta simples:**
  > "Porque comida na mesa, solo vivo e água protegida não são luxo — é subsistência humana. Hoje o sistema roda quase sem custo usando rodízio de APIs gratuitas e contas locais no código. E na expansão pública ele se sustenta por editais, universidades e convênios com órgãos como EMATER, SEAPA e prefeituras — sempre mantendo R$ 0 para o Seu José."

### 1.8 "Como funciona quando o produtor manda foto de uma planta doente ou áudio?"
- **O que querem testar:** se a acessibilidade multimodal funciona na roça.
- **Resposta simples:**
  > "Se mandar foto, uma IA visual procura manchas, pragas e sinais na folha e traduz tudo em português simples, sem latim — e avisa se a foto veio borrada. Se mandar áudio, limpamos o ruído do vento, entendemos termos rurais e respondemos **só em áudio**, sem jogar textão pra quem não quer ler."

### 1.9 "Vocês já testaram na prática? Como validaram?"
- **O que querem testar:** honestidade sobre estágio e evidências reais.
- **Resposta simples:**
  > "Validamos em conversas reais no WhatsApp com áudios, fotos, perguntas coloquiais e rotas reais em Goiás, além de testes automatizados simulando jornadas completas do produtor. O próximo passo após a banca é acompanhar uma safra fechada com propriedades parceiras."

### 1.10 "Qual foi a maior dificuldade técnica do projeto?"
- **O que querem testar:** domínio real da construção.
- **Resposta simples:**
  > "Fazer ciência espacial e agronomia complexa caberem numa conversa simples e respeitosa — sem parecer robô, sem imitar sotaque do produtor como deboche e garantindo que as travas contra alucinação, o clima da NASA e o anti-efeito manada nunca quebrem."

---

## 2. "TALVEZ" (depende do perfil técnico, social ou agronômico dos jurados)

### 2.1 "Como vocês levam isso para áreas secas e para o Nordeste, onde a situação é mais grave?"
- **O que querem testar:** se a expansão social/ambiental é viável de verdade.
- **Resposta simples:**
  > "No Nordeste, apenas 7,4% dos estabelecimentos têm assistência técnica — é onde mais dói. Como o nosso motor cruza coordenadas da NASA POWER (umidade na raiz e ondas de calor) com culturas rústicas resistentes à seca, basta cadastrar os polos do semiárido e o catálogo regional de plantas e programas locais para o mesmo Cumpadre Digital operar lá."

### 2.2 "Por que citar políticas públicas como EMATER, SEAPA, PAA e PNAE?"
- **O que querem testar:** se vocês entendem o ecossistema público de segurança alimentar.
- **Resposta simples:**
  > "Porque não basta o pequeno produtor colher — ele precisa escoar sem perder a safra para atravessador ou falta de frete. Conectar o pequeno agricultor ao PAA e ao PNAE (onde 30% da merenda escolar deve vir da agricultura familiar) garante comida fresca na escola e subsistência digna na roça."

### 2.3 "O que acontece se a API de IA cair ou atingir limite?"
- **Resposta simples:**
  > "O sistema reveza automaticamente entre provedores gratuitos (Groq, Gemini e Cerebras). Se algum cai, pula pro próximo na hora; e se todos oscilarem, entra um modo econômico curto ou nossos resumos calculados direto do motor NASA para ninguém ficar sem assistência."

### 2.4 "Como vocês entendem sotaque forte, erro de escrita e barulho da roça?"
- **Resposta simples:**
  > "Passamos filtro no áudio (FFmpeg) para tirar vento e ruído antes de enviar ao Whisper treinado com palavras do campo; se ainda ficar fraco, outra IA ouve o áudio direto. No texto, normalizamos escrita fonética como 'mio', 'foia' e 'blaquiara' e travamos a resposta pra acolher com clareza, sem imitar sotaque."

### 2.5 "Com que frequência os dados da NASA são atualizados e quais cidades já têm cobertura?"
- **Resposta simples:**
  > "A previsão curta de chuva é puxada em tempo real por cidade. Os indicadores da NASA e os 14 dias cobrem hoje 6 polos de Goiás e cidades vizinhas via baseline atualizado pelo nosso script coletor — e o próximo passo já desenhado é rodar esse coletor automático todo dia e abrir coordenadas dinâmicas pro país todo."

### 2.6 "Como fica a privacidade e LGPD se vocês usam sinais regionais da comunidade?"
- **Resposta simples:**
  > "Cada propriedade tem seu cadastro separado por usuário e pode pedir exclusão na conversa ('apagar meus dados'). O radar de saturação regional soma apenas contagens anônimas por microrregião — nunca expõe nome, telefone nem história individual de ninguém."

### 2.7 "O Zé Agro lembra do produtor de uma semana para outra?"
- **Resposta simples:**
  > "Lembra sim. Cidade, cultura, variedade, anotações do caderno de campo e lembretes ficam salvos em banco de dados fixo — então quando o Seu José volta dias depois, o bot já sabe qual é a lavoura e a região dele."

### 2.8 "E se alguém tentar desviar o bot pra assunto fora de agro ou pedir comando interno?"
- **Resposta simples:**
  > "Filtros antes mesmo da IA bloqueiam tentativa de invadir instruções, assuntos aleatórios e pedidos ilegais de defensivo, mantendo o foco 100% na proteção do produtor."

### 2.9 "Por que ainda aparece fase da lua se a base é NASA e Embrapa?"
- **Resposta simples:**
  > "Porque respeitamos a cultura de quem está no campo quando ele pergunta sobre poda ou raiz no dia a dia. Mas nos cálculos de rotação, risco de seca e segurança alimentar da NASA a decisão técnica é 100% baseada em água, solo e pragas."

### 2.10 "E se um técnico da EMATER ou agrônomo usar? Fica raso?"
- **Resposta simples:**
  > "Não — o bot adapta a fala ao jeito técnico de quem pergunta e ainda oferece a 'forma profissional' opcional com dados estruturados por hectare pra quem quiser usar em relatório técnico."

---

## 3. "QUASE CERTEZA QUE NÃO" (perguntas de nicho profundo — boas de ter na manga)

### 3.1 "Por que usaram Baileys em vez da API Oficial do WhatsApp (Meta)?"
- **Resposta simples:**
  > "Porque num projeto gratuito e sem fins lucrativos, a API oficial cobraria por janela de conversa. Como a camada do WhatsApp fica isolada do cérebro agronômico no código, se surgir parceria institucional que custeie a Meta oficial no futuro, a troca é limpa."

### 3.2 "Por que não treinaram (fine-tuning) um modelo próprio de IA?"
- **Resposta simples:**
  > "Porque chuva de 14 dias, umidade da raiz e saturação regional mudam toda semana — modelo treinado estático ficaria velho rápido e continuaria chutando número. Conectar IA em ferramentas com conta fixa atualiza na hora e é auditável."

### 3.3 "Como definiram os pesos das notas no motor de rotação?"
- **Resposta simples:**
  > "Com regras agronômicas do Cerrado — penalizar repetição da mesma família botânica, priorizar tolerância à seca quando a raiz está abaixo de 50%, somar palhada e evitar saturação regional — sempre recomendando análise de solo quando necessário."

### 3.4 "Já mediram ganho estatístico de produtividade numa safra inteira colhida?"
- **Resposta simples:**
  > "Ainda não fechamos um ciclo completo de colheita em campo: nesta etapa validamos consistência com Embrapa, dados reais da NASA e fluxo real no WhatsApp. Medir uma safra completa com produtores parceiros e Emater é a fase seguinte."

### 3.5 "Como suportam muitas mensagens ao mesmo tempo ou rajadas?"
- **Resposta simples:**
  > "Já temos trava anti-rajada, anti-duplicata e enxugamento automático de histórico. Para escalar para milhares de famílias no Nordeste e no Brasil todo, basta plugar fila assíncrona entre o WhatsApp e o processamento."

### 3.6 "Como tratam o alqueire se ele muda de tamanho pelo Brasil?"
- **Resposta simples:**
  > "No foco atual de Goiás usamos o alqueire goiano (4,84 hectares) deixando a conta em hectares explícita. Ao expandir para regiões como o Nordeste (onde se usa mais tarefa ou hectare), ajustamos a tabela local pela cidade do produtor."

### 3.7 "O áudio de resposta não fica mecânico lendo sigla como 'mm' e '14d'?"
- **Resposta simples:**
  > "Antes de virar voz, um tradutor fonético converte siglas e números para português falado ('14 dias', 'milímetros', 'por cento') e limpa símbolos visuais para sair como uma conversa natural."

### 3.8 "Qual a tecnologia principal por trás do sistema?"
- **Resposta simples:**
  > "Servidor Node.js com Express, integração WhatsApp via Baileys, memória no Supabase, tratamento de áudio com FFmpeg + Whisper, visão e linguagem com failover entre Groq, Gemini e Cerebras, e dados espaciais/climáticos da NASA POWER e Open-Meteo."
