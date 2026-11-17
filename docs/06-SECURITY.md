# 06 — Segurança: Análise Completa e Checklist

*Auditoria baseada em pesquisa (ago/2026) das práticas de segurança de Supabase, WhatsApp/Baileys, bots de IA e LGPD. Severidades: 🔴 crítico · 🟠 alto · 🟡 médio · 🔵 info.*

## 1. Supabase

| # | Risco | Sev. | Status |
|---|---|---|---|
| 1.1 | **Tabela sem RLS** — a falha nº 1 do Supabase (padrão do CVE-2025-48757/escândalo Lovable): com a tabela `profiles` sem RLS, qualquer pessoa com a chave pública lê/escreve TODOS os perfis (números de telefone = PII) | 🔴 | ✅ **FEITO (24/08/2026)** — RLS habilitado via SQL Editor, `rowsecurity=true` confirmado |
| 1.2 | **service_role no cliente** — bypassa tudo; ~15% dos apps IA têm ela no bundle | 🔴 | ✅ Server-side only. Nunca levar a front/app |
| 1.3 | **Higiene de credenciais e histórico Git** — auditoria confirmou **zero chaves ou segredos versionados no GitHub** | 🟠 | ✅ Boas práticas ativas: manter `.env` fora do Git, rotacionar periodicamente `SUPABASE_KEY` / senha do banco e manter chaves de IA apenas em variáveis de ambiente |
| 1.4 | Conexão direta `db.*.supabase.co` é IPv6-only | 🔵 | Scripts locais devem usar a API REST ou o pooler (IPv4) |
| 1.5 | 2FA no painel Supabase | 🟠 | **Ação do usuário**: ativar em Account → Security |
| 1.6 | Backup: free tier não tem PITR | 🟡 | Estrutura de tabelas e políticas RLS versionadas no setup do Supabase |

## 2. WhatsApp / Baileys

| # | Risco | Sev. | Status |
|---|---|---|---|
| 2.1 | **Ban do número** — Baileys viola os ToS; estudo de 2026: 68% dos que usam libs não-oficiais levaram ≥1 ban em 12 meses. Fatores: volume alto, mensagens idênticas em massa, número frio, IP de datacenter | 🔴 | Mitigado: número secundário, "digitando..." simulado, delays humanos, broadcast espaçado (8s), mensagens variadas. **Nunca** fazer disparo em massa; aquecer número novo (volume baixo nas 2 primeiras semanas) |
| 2.2 | **`auth_info_baileys/` = sequestro total da conta** — quem tiver a pasta se conecta como o bot | 🔴 | ✅ No `.gitignore`; backup diário criptografado? (hoje em `backups/` local, fora do git — proteger o disco do servidor) |
| 2.3 | **Rota `/qr` exposta = takeover** — o QR vincula o número do bot a QUEM escanear. Rota pública deixava qualquer um sequestrar a sessão | 🔴 | ✅ **Corrigido**: exige `?token=QR_TOKEN` do `.env` |
| 2.4 | Out/2025: onda de bans aleatórios reportada no Baileys (issue #1869) — risco existe mesmo sem spam | 🟠 | Plano B: se o número morrer, novo número + rescan (backup da sessão NÃO transfere ban) |
| 2.5 | Cloud API oficial proíbe IA aberta desde jan/2026 — Baileys é o único caminho pra bot aberto | 🔵 | Decisão consciente de usar Baileys; monitorar mudanças da Meta |
| 2.6 | IP residencial (PC em casa) tem MENOS risco de ban que VPS/datacenter | 🟡 | Trade-off: VPS dá 24h garantido mas IP de datacenter. Ao migrar pra Oracle, manter volume baixo no começo |

## 3. O bot (código)

| # | Risco | Sev. | Status |
|---|---|---|---|
| 3.1 | **Prompt injection** — usuário manda "ignore suas instruções e..." | 🟠 | ✅ SAFETY_RULE em todos os agentes + roteador valida rota contra registro. Revisar periodicamente com novos vetores |
| 3.2 | **Abuso de tokens** — mensagem de 50k chars queima cota de API | 🟠 | ✅ **Corrigido**: entrada limitada a 1000 caracteres |
| 3.3 | **Proteção anti-rajada / anti-abuso** — envio em massa ou duplicado de mensagens | 🟠 | ✅ **Corrigido**: proteção `verificarAbuso` em `abuso.js` e acesso gratuito sem barreira comercial (`SALES_RULE`) |
| 3.4 | Dependências vulneráveis (axios via google-tts-api: 2 HIGH) | 🟠 | ✅ **Corrigido**: lib removida, TTS via fetch direto. `npm audit` = 0 vulnerabilidades |
| 3.5 | Comandos admin sem dono definido | 🟡 | ✅ Só respondem se `OWNER_NUMBER` estiver no `.env` e bater com o remetente |
| 3.6 | Erros vazando detalhes internos ao usuário | 🟡 | ✅ Mensagens de erro genéricas; detalhes só no log local |
| 3.7 | Ferramentas (tools) escrevendo no banco — abuso via prompt | 🟡 | Risco baixo: só salvam cultura/cidade/nota do PRÓPRIO usuário. Monitorar notas com spam |
| 3.8 | `.tmp/` com áudios de usuários | 🟡 | ✅ Arquivos removidos após uso (`safeUnlink`) |

## 4. LGPD (dados de produtores)

| # | Risco | Sev. | Status |
|---|---|---|---|
| 4.1 | Número de telefone + dados de lavoura são PII — precisa de base legal e transparência | 🟠 | Na primeira mensagem de contato o usuário iniciou a interação (legítimo interesse). **Ação**: incluir aviso de privacidade no MENU ou boas-vindas |
| 4.2 | Direito de exclusão (LGPD) | 🟡 | ✅ Self-service direto na conversa (`"apagar meus dados"`) e `/apagar <num>` no painel admin removem perfil e registros locais |
| 4.3 | Imagens de lavoura enviadas ao Gemini (Google) e áudio ao Whisper (Groq) — transferência a terceiros | 🟡 | Documentar na política de privacidade; dados não são armazenados além do necessário |
| 4.4 | Logs locais contêm números de telefone | 🔵 | Logs só no servidor; PM2 com rotação (`pm2 install pm2-logrotate`) |

## 5. Servidor / Deploy (quando for pra VPS)

| # | Risco | Sev. | Status |
|---|---|---|---|
| 5.1 | Porta 3000 exposta — `/ping` ok; `/qr` já protegido por token | 🟡 | No VPS: firewall liberando só SSH + 3000 (ou proxy reverso com HTTPS) |
| 5.2 | SSH com senha | 🔴 | Usar só chave SSH + fail2ban |
| 5.3 | Backups da sessão no mesmo disco | 🟡 | Copiar `backups/` pra fora do servidor periodicamente |

## Checklist operacional contínuo (Deploy e Produção)

1. [x] RLS habilitado no Supabase (via SQL Editor)
2. [x] `.env`, `auth_info_baileys/`, `data/` e `backups/` fora do controle de versão (`.gitignore`)
3. [ ] Manter 2FA ativo no Supabase e no provedor de e-mail da conta
4. [ ] Definir `QR_TOKEN` forte e exclusivo em ambiente de produção
5. [ ] Rotacionar periodicamente credenciais (`SUPABASE_KEY`, tokens de IA e senha do banco)
6. [ ] Nunca compartilhar `auth_info_baileys/` nem `backups/`
7. [ ] Aquecer o número do bot em produção (volume orgânico e delays humanos no Baileys)
