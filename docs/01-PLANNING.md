# Roadmap e Princípios Fundamentais do Projeto

## Missão Central e Propósito (Inviolável)
- **Propósito humanitário e social:** prevenir a fome, combater a escassez de alimentos, ajudar a recuperar áreas secas e degradação de solo, e proteger a subsistência do agricultor familiar (personificado no **Seu José**) para que o alimento chegue à mesa da população.
- **100% gratuito para o produtor:** atendimento aberto e sem cobrança no WhatsApp (`SALES_RULE` impede planos pagos/VIP no atendimento ao usuário). Sustentabilidade prevista via impacto público/institucional (convênios, editais, **EMATER**, **SEAPA**, **PAA**, **PNAE — 30% da merenda escolar**).
- **Acesso sem barreiras:** sem aplicativo próprio, sem senha, sem login e sem formulário longo (porque para quem tem dificuldade de leitura/escrita, *"login não é segurança, é exclusão"*); exclusão simples via `"apagar meus dados"`.
- **Acessibilidade e respeito:** compreende áudio rural com filtro de ruído (`FFmpeg` + `Whisper` + fallback Gemini) e escrita fonética; responde áudio **apenas em áudio**; adapta o nível sem nunca imitar sotaque ou usar tom de deboche.
- **Combate ao efeito manada e à escassez (`communitySignals.js` + `rotation.js`):** evita que todos plantem a mesma cultura na mesma semana (o que derruba preço, falta frete e gera escassez de outros alimentos), cruzando **NASA POWER** + **Open-Meteo 14d** + **Embrapa** + escoamento regional (cooperativas, CEASA, CONAB).
- **Expansão prioritária:** validado inicialmente em 6 polos de Goiás com visão direta de adaptação para áreas secas e agricultura familiar do **Nordeste** (onde apenas 7,4% têm assistência técnica — IBGE).
- **Referências completas:** ver [docs/10-PITCH_HUMANITARIO_NASA.md](./10-PITCH_HUMANITARIO_NASA.md) e [docs/09-BANCA_PERGUNTAS_E_RESPOSTAS.md](./09-BANCA_PERGUNTAS_E_RESPOSTAS.md).

## Fase Atual: Setup e Refinamento Humanitário (V2)
- [x] Inicialização do projeto Node.js
- [x] Configuração do repositório Git
- [x] Criação do Sistema de Memória de Contexto
- [x] Configuração do script de auto-push
- [x] Setup de Banco e Middleware

## Próximas Fases
- [x] Integração Baileys (Conexão com o WhatsApp)
- [x] Integração Groq (Llama 3 e Whisper)
- [x] RAG Embrapa (Integração de base de conhecimento agrícola)
- [x] Agent Routing (Roteamento de agentes com IA)
- [x] Visão Computacional (Gemini 1.5 Flash para imagens)
