import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import makeWASocket, { useMultiFileAuthState, downloadMediaMessage } from '@whiskeysockets/baileys';
import { parseBuffer, parseFile } from 'music-metadata';
import QRCode from 'qrcode';
import qrcode from 'qrcode-terminal';
import { checkMessageLimit, obterIdiomaLocal } from '../middlewares/subscription.js';
import { setProactiveOptin, salvarNota, salvarCidade, salvarCulturaEVariedade, salvarIdioma, apagarPerfil } from './database.js';
import { apagarDadosLocais, createJsonStore } from './opsStore.js';
import { listarRegistros, registrosParaCSV } from './field.js';
import { verificarAbuso } from './abuso.js';
import { registrarUsoRecurso } from './persuasao.js';
import { handleAdminCommand } from './admin.js';
import { generateAgroResponse, transcribeAudio, generateAudioResponse, analyzeCropImage, prepararMensagemImagem, interpretarMensagemRotacao, detectarIntencaoNatural, garantirIdiomaSaida, classificarIdiomaTextoPorLLM } from './ai.js';
import { IDIOMA_PADRAO, normalizarCodigoIdioma, idiomaPadraoPorNumero, detectarTrocaIdioma, tMsg } from '../config/i18n.js';
import { avaliarRotacaoNasa, formatarRotacaoWhatsApp, formatarDetalheRotacaoWhatsApp, montarContextoDetalheRotacao, SEPARADOR_MENSAGEM_AGREGADA } from './rotation.js';
import { criarLembrete } from './reminders.js';
import { addDaysStr, hojeStr } from './datas.js';
import { registrarSinalAnonimo } from './communitySignals.js';

const userSessions = new Map();
const processingUsers = new Set();
const MAX_SESSIONS = 1000;
const chatHistoryStore = createJsonStore(path.resolve('./data/chat_history.json'));

function resumirLog(texto) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
    return limpo.length > 140 ? `${limpo.slice(0, 140)}...` : limpo;
}

function obterHistoricoUsuario(whatsappNumber) {
    if (userSessions.has(whatsappNumber)) {
        return userSessions.get(whatsappNumber);
    }
    const saved = chatHistoryStore.list((r) => r.numero === whatsappNumber)[0];
    const history = Array.isArray(saved?.mensagens) ? saved.mensagens.slice(-10) : [];
    if (userSessions.size >= MAX_SESSIONS) {
        const oldest = userSessions.keys().next().value;
        userSessions.delete(oldest);
    }
    userSessions.set(whatsappNumber, history);
    return history;
}

function salvarHistoricoUsuario(whatsappNumber, history) {
    if (!Array.isArray(history)) return;
    while (history.length > 10) {
        history.shift();
    }
    userSessions.set(whatsappNumber, history);
    const saved = chatHistoryStore.list((r) => r.numero === whatsappNumber)[0];
    if (saved) {
        chatHistoryStore.update(saved.id, { mensagens: history });
    } else {
        chatHistoryStore.add({ numero: whatsappNumber, mensagens: history });
    }
}
let reconnectAttempts = 0;
let currentQR = null;
let activeSock = null;

export function getCurrentQR() {
    return currentQR;
}

export function getActiveSock() {
    return activeSock;
}

export function getBotWhatsAppNumber() {
    const rawId = activeSock?.user?.id || '';
    const digits = String(rawId).split(':')[0].split('@')[0].replace(/\D/g, '');
    return digits || process.env.BOT_WHATSAPP_NUMBER || '556294148425';
}

// O WhatsApp passou a entregar conversas com o JID interno (@lid) em vez do
// número real. O número verdadeiro vem no remoteJidAlt; usamos ele para o
// banco de dados e sessões, mas SEMPRE respondemos no endereço original.
function resolveSenderNumber(msg) {
    const candidates = [msg.key.remoteJidAlt, msg.key.remoteJid].filter(Boolean);
    const real = candidates.find(j => j.endsWith('@s.whatsapp.net'));
    return (real || candidates[0]).split('@')[0];
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// Divide textos longos respeitando separador de balão agregado, parágrafos, linhas ou espaços; nunca quebra menus/planos no meio
export function splitMessage(text, maxLen = 900) {
    if (text && text.includes(SEPARADOR_MENSAGEM_AGREGADA)) {
        return text
            .split(SEPARADOR_MENSAGEM_AGREGADA)
            .map((p) => p.trim())
            .filter(Boolean)
            .flatMap((p) => splitMessage(p, maxLen));
    }
    if (!text || text.length <= maxLen || text.includes('\n• ') || /z[ée]\s+agro/i.test(text) || text.includes('*PLANO DE ROTAÇÃO')) {
        return [text];
    }
    const para = text.lastIndexOf('\n\n', maxLen);
    const line = text.lastIndexOf('\n', maxLen);
    const dot = text.lastIndexOf('. ', maxLen);
    const space = text.lastIndexOf(' ', maxLen);
    const idx = para > 150
        ? para
        : line > 150
            ? line
            : dot > 150
                ? dot + 1
                : space > 150
                    ? space
                    : maxLen;
    return [text.slice(0, idx).trim(), text.slice(idx).trim()].filter(Boolean);
}

// Mostra "digitando..." proporcional ao tamanho da resposta antes de enviar
async function sendHumanLike(sock, sender, text, quotedMsg) {
    try {
        const parts = splitMessage(text);
        for (let i = 0; i < parts.length; i++) {
            try {
                await sock.sendPresenceUpdate('composing', sender);
            } catch {}
            await sleep(Math.min(3500, 900 + parts[i].length * 10));
            await sock.sendMessage(sender, { text: parts[i] }, (i === 0 && quotedMsg) ? { quoted: quotedMsg } : undefined);
            try {
                await sock.sendPresenceUpdate('paused', sender);
            } catch {}
            if (i < parts.length - 1) await sleep(1600);
        }
    } catch (e) {
        console.error('Erro no envio humanizado, fallback direto:', e.message);
        const limpo = String(text || '').replaceAll(SEPARADOR_MENSAGEM_AGREGADA, '\n\n');
        await sock.sendMessage(sender, { text: limpo }, quotedMsg ? { quoted: quotedMsg } : undefined);
    }
}

function safeUnlink(filePath) {
    try {
        fs.unlinkSync(filePath);
    } catch {}
}

function gerarWaveformVoz(buffer, samples = 64) {
    const wave = new Uint8Array(samples);
    const len = buffer?.length || 0;
    for (let i = 0; i < samples; i++) {
        if (len === 0) {
            wave[i] = 45;
            continue;
        }
        const pos = Math.floor((i / samples) * len);
        const byte = buffer[Math.min(len - 1, pos)];
        const envelope = Math.sin(((i + 0.5) / samples) * Math.PI);
        const val = Math.round(18 + ((byte / 255) * 0.65 + envelope * 0.35) * 77);
        wave[i] = Math.max(18, Math.min(95, val));
    }
    return wave;
}

const execFileAsync = promisify(execFile);

async function obterDuracaoAudioSegundos(audioFilePath, audioBuffer, isOgg) {
    try {
        if (audioFilePath && fs.existsSync(audioFilePath)) {
            const meta = await parseFile(audioFilePath, { duration: true });
            if (Number.isFinite(meta?.format?.duration) && meta.format.duration > 0) {
                return Math.max(1, Math.round(meta.format.duration));
            }
        }
    } catch {}

    try {
        const mimeType = isOgg ? 'audio/ogg' : 'audio/mpeg';
        const meta = await parseBuffer(audioBuffer, { mimeType }, { duration: true });
        if (Number.isFinite(meta?.format?.duration) && meta.format.duration > 0) {
            return Math.max(1, Math.round(meta.format.duration));
        }
    } catch {}

    try {
        if (audioFilePath && fs.existsSync(audioFilePath)) {
            const { stdout } = await execFileAsync('ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                audioFilePath
            ], { timeout: 10000 });
            const parsed = Number.parseFloat(String(stdout || '').trim());
            if (Number.isFinite(parsed) && parsed > 0) {
                return Math.max(1, Math.round(parsed));
            }
        }
    } catch {}

    return undefined;
}

async function sendAudioWithFollowup(sock, sender, fullText, quotedMsg, idioma = IDIOMA_PADRAO) {
    const textoBruto = String(fullText || '');
    const partes = textoBruto
        .split(SEPARADOR_MENSAGEM_AGREGADA)
        .map((p) => p.trim())
        .filter(Boolean);

    try {
        await sock.sendPresenceUpdate('recording', sender);
    } catch {}

    const audioFilePath = await generateAudioResponse(partes[0] || textoBruto, idioma);
    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
        try { await sock.sendPresenceUpdate('paused', sender); } catch {}
        return false;
    }

    const isOgg = audioFilePath.toLowerCase().endsWith('.ogg');
    let audioBuffer;
    let seconds;
    try {
        audioBuffer = fs.readFileSync(audioFilePath);
        if (audioBuffer && audioBuffer.length > 0) {
            seconds = await obterDuracaoAudioSegundos(audioFilePath, audioBuffer, isOgg);
        }
    } finally {
        safeUnlink(audioFilePath);
    }
    if (!audioBuffer || audioBuffer.length === 0) {
        try { await sock.sendPresenceUpdate('paused', sender); } catch {}
        return false;
    }

    const payload = isOgg
        ? {
            audio: audioBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            ...(seconds ? { seconds } : {}),
            waveform: gerarWaveformVoz(audioBuffer)
        }
        : {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            ...(seconds ? { seconds } : {})
        };

    try {
        // Quando o produtor envia áudio, responde exclusivamente em áudio (sem texto acoplado).
        await sock.sendMessage(sender, payload, quotedMsg ? { quoted: quotedMsg } : undefined);
        try { await sock.sendPresenceUpdate('paused', sender); } catch {}
        return true;
    } catch (err) {
        try { await sock.sendPresenceUpdate('paused', sender); } catch {}
        console.error('⚠️ Falha ao enviar áudio no WhatsApp, usando fallback em texto:', err?.message || err);
        return false;
    }
}

function extrairConteudoMensagem(rawMessage) {
    let messageContent = rawMessage;
    if (messageContent?.ephemeralMessage) {
        messageContent = messageContent.ephemeralMessage.message;
    }
    if (messageContent?.viewOnceMessage) {
        messageContent = messageContent.viewOnceMessage.message;
    }
    if (messageContent?.viewOnceMessageV2) {
        messageContent = messageContent.viewOnceMessageV2.message;
    }
    if (messageContent?.documentWithCaptionMessage) {
        messageContent = messageContent.documentWithCaptionMessage.message;
    }
    return messageContent;
}

async function garantirMsgSistemaIdioma(texto, idioma = IDIOMA_PADRAO, preferirAudio = false) {
    const norm = normalizarCodigoIdioma(idioma) || IDIOMA_PADRAO;
    if (!texto || ['pt-BR', 'en', 'es'].includes(norm)) return texto;
    try {
        return await garantirIdiomaSaida(texto, norm, { registro: 'neutro_direto', isAudio: preferirAudio });
    } catch {
        return texto;
    }
}

async function responderTextoOuAudio(sock, sender, texto, msg, preferirAudio = false, { bloquearFallbackTexto = preferirAudio, idioma = IDIOMA_PADRAO } = {}) {
    if (preferirAudio) {
        for (let tentativa = 0; tentativa < 2; tentativa++) {
            const enviouAudio = await sendAudioWithFollowup(sock, sender, texto, msg, idioma);
            if (enviouAudio) return true;
            if (tentativa === 0) await sleep(400);
        }
        if (bloquearFallbackTexto) {
            console.error('⚠️ Falha no TTS/envio de áudio — fallback em texto bloqueado porque o usuário enviou áudio.');
            return false;
        }
    }
    await sendHumanLike(sock, sender, texto, msg);
    return true;
}

async function responderSistemaLocalizado(sock, sender, chave, msg, { preferirAudio = false, bloquearFallbackTexto = preferirAudio, idioma = IDIOMA_PADRAO, vars = {}, evitarIa = false } = {}) {
    let texto = tMsg(idioma, chave, vars);
    if (!evitarIa && chave !== 'troca_idioma_ok') {
        texto = await garantirMsgSistemaIdioma(texto, idioma, preferirAudio);
    }
    return responderTextoOuAudio(sock, sender, texto, msg, preferirAudio, { bloquearFallbackTexto, idioma });
}

// Resumo técnico curto para levar ao agrônomo/veterinário/Emater
function resumoParaTecnico(history, idioma = IDIOMA_PADRAO) {
    const quemUser = idioma === 'en' ? 'Farmer' : idioma === 'es' ? 'Productor' : 'Produtor';
    const falas = (history || []).slice(-8).map((m) => {
        const quem = m.role === 'user' ? quemUser : 'Zé Agro';
        const texto = String(m.content || '').replace(/\s+/g, ' ').trim().slice(0, 180);
        return texto ? `${quem}: ${texto}` : null;
    }).filter(Boolean);
    if (falas.length === 0) return null;
    if (idioma === 'en') {
        return `*🧑‍🌾 Summary for your agronomist / vet*\n${falas.join('\n')}\n\nTake this summary + photos to your agronomist or extension office. If it looks urgent, do not wait.`;
    }
    if (idioma === 'es') {
        return `*🧑‍🌾 Resumen para llevar al técnico*\n${falas.join('\n')}\n\nLleva este resumen + fotos al agrónomo o veterinario. Si parece grave, no esperes.`;
    }
    return `*🧑‍🌾 Resumo para levar ao técnico*\n${falas.join('\n')}\n\nLeva esse resumo + fotos para agrônomo, veterinário ou Emater. Se for suspeita grave, não espera.`;
}

function caminhoCsvCaderno(numero) {
    const tmpDir = path.resolve('.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    // Higieniza: nome do arquivo só com dígitos (JID nunca deve virar path).
    const seguro = String(numero || 'usuario').replace(/\D/g, '') || 'usuario';
    return path.join(tmpDir, `caderno_${seguro}.csv`);
}

async function atenderIntencaoNatural(intencao, { sock, sender, msg, whatsappNumber, preferirAudio = false, idioma = IDIOMA_PADRAO }) {
    if (!intencao || !intencao.tipo) return false;
    const { tipo } = intencao;

    if (tipo === 'ajuda') {
        console.log(`Ajuda natural solicitada por ${whatsappNumber} [lang=${idioma}]`);
        await responderSistemaLocalizado(sock, sender, preferirAudio ? 'ajuda_audio' : 'ajuda_texto', msg, { preferirAudio, idioma });
        return true;
    }

    if (tipo === 'apagar_dados') {
        console.log(`🗑️ Autoatendimento LGPD: apagando dados de ${whatsappNumber}`);
        try {
            await apagarPerfil(whatsappNumber);
        } catch (e) {
            console.error('Falha ao apagar perfil:', e.message);
        }
        try {
            apagarDadosLocais(whatsappNumber);
        } catch (e) {
            console.error('Falha ao apagar dados locais:', e.message);
        }
        userSessions.delete(whatsappNumber);
        chatHistoryStore.removeByUser(whatsappNumber);
        await responderSistemaLocalizado(sock, sender, 'apagar_dados_ok', msg, { preferirAudio, idioma });
        return true;
    }

    if (tipo === 'falar_com_tecnico') {
        const resumo = resumoParaTecnico(userSessions.get(whatsappNumber), idioma);
        try {
            await salvarNota(whatsappNumber, 'Pediu resumo técnico para levar a agrônomo/veterinário/Emater.');
        } catch {}
        if (!resumo) {
            await responderSistemaLocalizado(sock, sender, 'falar_tecnico_vazio', msg, { preferirAudio, idioma });
            return true;
        }
        const resumoLocalizado = await garantirMsgSistemaIdioma(resumo, idioma, preferirAudio);
        await responderTextoOuAudio(sock, sender, resumoLocalizado, msg, preferirAudio, { idioma });
        return true;
    }

    if (tipo === 'quero_vip') {
        await responderSistemaLocalizado(sock, sender, 'quero_vip', msg, { preferirAudio, idioma });
        return true;
    }

    if (tipo === 'quero_aviso' || tipo === 'parar_aviso') {
        const ativando = tipo === 'quero_aviso';
        await setProactiveOptin(whatsappNumber, ativando);
        console.log(`Opt-in de avisos (${ativando}) para ${whatsappNumber}`);
        await responderSistemaLocalizado(sock, sender, ativando ? 'aviso_ativado' : 'aviso_desativado', msg, { preferirAudio, idioma });
        return true;
    }

    if (tipo === 'exportar_csv') {
        const dias = Math.max(1, Math.min(90, Number(intencao.dias) || 30));
        const registros = listarRegistros(undefined, whatsappNumber, dias);
        if (registros.length === 0) {
            await responderSistemaLocalizado(sock, sender, 'csv_vazio', msg, { preferirAudio, idioma });
            return true;
        }
        const csvPath = caminhoCsvCaderno(whatsappNumber);
        fs.writeFileSync(csvPath, registrosParaCSV(registros), 'utf-8');
        try {
            const captionCsv = await garantirMsgSistemaIdioma(tMsg(idioma, 'csv_caption', { dias, qtd: registros.length }), idioma, false);
            await sock.sendMessage(sender, {
                document: fs.readFileSync(csvPath),
                mimetype: 'text/csv',
                fileName: `caderno_ze_agro_${dias}d.csv`,
                caption: captionCsv
            }, { quoted: msg });
        } finally {
            safeUnlink(csvPath);
        }
        return true;
    }

    return false;
}

function arquivarSessaoExpirada() {
    const authDir = path.resolve('auth_info_baileys');
    if (!fs.existsSync(authDir)) return;
    const backupDir = path.resolve('backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const destino = path.join(backupDir, `auth_expired_${Date.now()}`);
    try {
        fs.renameSync(authDir, destino);
    } catch {
        try {
            fs.cpSync(authDir, destino, { recursive: true });
            fs.rmSync(authDir, { recursive: true, force: true });
        } catch (err) {
            console.error('⚠️ Falha ao arquivar sessão expirada:', err.message);
            return;
        }
    }
    console.log(`⚠️ Sessão WhatsApp expirada (401). Backup movido para ${destino}; gerando novo QR Code...`);
}

export async function connectToWhatsApp() {
    // Configura o salvamento da sessão
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const socketConfig = {
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreviews: false,
        markOnlineOnConnect: false
    };

    // Inicializa o socket do Baileys
    const sock = makeWASocket.default ? makeWASocket.default(socketConfig) : makeWASocket(socketConfig);
    activeSock = sock;

    // Salva as credenciais sempre que atualizadas
    sock.ev.on('creds.update', saveCreds);

    // Gerencia o status da conexão e QR Code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = qr;
            console.log('Escaneie o QR Code abaixo para conectar:');
            qrcode.generate(qr, { small: true });
            QRCode.toFile(path.resolve('qrcode.png'), qr, { width: 480, margin: 2 }).catch(() => {});
        }

        if (connection === 'close') {
            currentQR = null;
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            if (statusCode === 401) {
                arquivarSessaoExpirada();
                reconnectAttempts = 0;
                setTimeout(connectToWhatsApp, 2000);
                return;
            }
            console.log('Conexão fechada. Reconectando...', true);
            // Backoff progressivo para não martelar o servidor em caso de instabilidade
            const delay = Math.min(30000, 3000 * Math.pow(2, reconnectAttempts));
            reconnectAttempts++;
            setTimeout(connectToWhatsApp, delay);
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            currentQR = null;
            safeUnlink(path.resolve('qrcode.png'));
            console.log('✅ WhatsApp conectado com sucesso!');
        }
    });

    // Escuta novas mensagens
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        // Ignora mensagens enviadas pelo próprio bot, mensagens sem conteúdo, ou status/stories
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
            return;
        }

        // Extrai o número limpo do remetente (número real, não LID interno)
        const sender = msg.key.remoteJid;
        const whatsappNumber = resolveSenderNumber(msg);

        // Grupos: ignorados (responder grupo = custo infinito de IA + spam)
        if (sender.endsWith('@g.us')) {
            return;
        }

        const messageContent = extrairConteudoMensagem(msg.message);
        let msgType = Object.keys(messageContent || {})[0];
        if (msgType === 'senderKeyDistributionMessage' || msgType === 'messageContextInfo') {
            msgType = Object.keys(messageContent || {})[1] || msgType;
        }
        const ehAudioEntrada = msgType === 'audioMessage';

        const idiomaLocalInicial = normalizarCodigoIdioma(obterIdiomaLocal(whatsappNumber));
        let idiomaAtivo = idiomaLocalInicial || idiomaPadraoPorNumero(whatsappNumber) || IDIOMA_PADRAO;

        // Anti-spam: ignora se já estiver processando
        if (processingUsers.has(whatsappNumber)) {
            await responderTextoOuAudio(
                sock,
                sender,
                tMsg(idiomaAtivo, 'anti_spam'),
                msg,
                ehAudioEntrada,
                { bloquearFallbackTexto: ehAudioEntrada, idioma: idiomaAtivo }
            );
            return;
        }
        processingUsers.add(whatsappNumber);

        try {
            // Comandos administrativos: sempre funcionam, fora da cota mensal
            const rawText = (messageContent.conversation || messageContent.extendedTextMessage?.text || '').trim();
            let trocaIdiomaExplicitaNoTurno = false;
            let detTxtTurno = null;

            if (!ehAudioEntrada && rawText) {
                detTxtTurno = detectarTrocaIdioma(rawText, idiomaAtivo, whatsappNumber);
                if (detTxtTurno.alterado) {
                    idiomaAtivo = detTxtTurno.idioma;
                    trocaIdiomaExplicitaNoTurno = true;
                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                } else {
                    idiomaAtivo = detTxtTurno.idioma || idiomaAtivo;
                }
                if (detTxtTurno.apenasComando) {
                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                    await responderTextoOuAudio(sock, sender, tMsg(idiomaAtivo, 'troca_idioma_ok'), msg, false, { idioma: idiomaAtivo });
                    return;
                }
                if (detTxtTurno.recusouApenas) {
                    const langPerg = detTxtTurno.idiomaRecusado === 'pt-BR' ? 'en' : (idiomaPadraoPorNumero(whatsappNumber) || 'en');
                    await responderTextoOuAudio(sock, sender, tMsg(langPerg, 'recusa_idioma_pergunta'), msg, false, { idioma: langPerg });
                    return;
                }
            }

            // Painel do dono: comandos "/" só respondem pro OWNER_NUMBER
            const ownerNumber = process.env.OWNER_NUMBER;
            if (ownerNumber && whatsappNumber === ownerNumber && rawText.startsWith('/')) {
                console.log(`🔧 Comando admin de ${ownerNumber}: ${rawText}`);
                const respostaAdmin = await handleAdminCommand(rawText);
                if (respostaAdmin) {
                    await sendHumanLike(sock, sender, respostaAdmin, msg);
                    return;
                }
            }
            const ehDono = ownerNumber && whatsappNumber === ownerNumber;

            // Blindagem anti-abuso (pré-cota: flood não queima cota nem IA)
            if (!ehDono) {
                const audioSeconds = ehAudioEntrada ? (messageContent.audioMessage?.seconds || 0) : 0;
                const checagem = verificarAbuso(undefined, { numero: whatsappNumber, texto: rawText, msgType, audioSeconds, idioma: idiomaAtivo });
                if (checagem.bloqueado) {
                    const respAbuso = await garantirMsgSistemaIdioma(checagem.resposta, idiomaAtivo, ehAudioEntrada);
                    await responderTextoOuAudio(sock, sender, respAbuso, msg, ehAudioEntrada, { bloquearFallbackTexto: ehAudioEntrada, idioma: idiomaAtivo });
                    return;
                }
            }

            const intencaoTexto = detectarIntencaoNatural(rawText);
            if (intencaoTexto && intencaoTexto.tipo !== 'exportar_csv') {
                await atenderIntencaoNatural(intencaoTexto, { sock, sender, msg, whatsappNumber, preferirAudio: ehAudioEntrada, idioma: idiomaAtivo });
                return;
            }

            // Verifica/carrega perfil do produtor (cota e VIP desativados)
            const check = await checkMessageLimit(whatsappNumber);
            const langBanco = normalizarCodigoIdioma(check.language);
            if (!trocaIdiomaExplicitaNoTurno && langBanco && langBanco !== idiomaAtivo) {
                if (!ehAudioEntrada && rawText) {
                    const trocaPosCheck = detectarTrocaIdioma(rawText, langBanco, whatsappNumber);
                    detTxtTurno = trocaPosCheck;
                    if (trocaPosCheck.alterado) {
                        idiomaAtivo = trocaPosCheck.idioma;
                        trocaIdiomaExplicitaNoTurno = true;
                        try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                    } else if (!idiomaLocalInicial) {
                        idiomaAtivo = langBanco;
                    }
                } else if (!idiomaLocalInicial) {
                    idiomaAtivo = langBanco;
                }
            }

            if (!ehAudioEntrada && rawText && !trocaIdiomaExplicitaNoTurno && detTxtTurno?.possivelOutroIdioma) {
                const clsTxt = await classificarIdiomaTextoPorLLM(rawText, idiomaAtivo);
                if (clsTxt?.lang && clsTxt.confidence >= 0.8 && clsTxt.lang !== idiomaAtivo) {
                    idiomaAtivo = clsTxt.lang;
                    trocaIdiomaExplicitaNoTurno = true;
                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                    console.log(`🌐 Idioma detectado dinamicamente: ${idiomaAtivo} (conf=${clsTxt.confidence})`);
                }
            }

        if (!check.allowed) {
            await responderTextoOuAudio(sock, sender, check.reply, msg, ehAudioEntrada, { bloquearFallbackTexto: ehAudioEntrada, idioma: idiomaAtivo });
        } else {
            // Exportação do caderno em CSV
            if (intencaoTexto?.tipo === 'exportar_csv') {
                await atenderIntencaoNatural(intencaoTexto, { sock, sender, msg, whatsappNumber, idioma: idiomaAtivo });
                return;
            }
            // Boas-vindas automáticas desativadas para evitar parede de texto na primeira mensagem
            if (check.isNew) {
                console.log(`🎉 Novo lead: ${whatsappNumber} (boas-vindas automáticas desativadas)`);
            }
            // Permitido: repassa para a IA

            let textContext = '';
            
            // Anti-abuso: limita o tamanho do texto (economia de tokens e evita flood de contexto)
            const MAX_INPUT = 1000;
            const cortar = (t) => (t && t.length > MAX_INPUT ? t.slice(0, MAX_INPUT) + '... [texto cortado]' : t);
            
            if (msgType === 'conversation') {
                textContext = cortar(messageContent.conversation);
            } else if (msgType === 'extendedTextMessage') {
                textContext = cortar(messageContent.extendedTextMessage.text);
            } else if (msgType === 'imageMessage') {
                console.log('Baixando imagem para análise...');
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', { }, { 
                        logger: console, 
                        reuploadRequest: sock.updateMediaMessage 
                    });
                    
                    if (buffer) {
                        console.log('🖼️ Imagem baixada com sucesso. Tamanho:', buffer.length);
                        const mimeType = messageContent.imageMessage.mimetype || 'image/jpeg';
                        const caption = messageContent.imageMessage.caption || '';
                        if (caption) {
                            const trocaCap = detectarTrocaIdioma(caption, idiomaAtivo, whatsappNumber);
                            if (trocaCap.alterado) {
                                idiomaAtivo = trocaCap.idioma;
                                try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                            } else if (trocaCap.possivelOutroIdioma) {
                                const clsCap = await classificarIdiomaTextoPorLLM(caption, idiomaAtivo);
                                if (clsCap?.lang && clsCap.confidence >= 0.8 && clsCap.lang !== idiomaAtivo) {
                                    idiomaAtivo = clsCap.lang;
                                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                                }
                            }
                        }
                        
                        console.log(`Analisando imagem com Gemini Flash [lang=${idiomaAtivo}]...`);
                        const diagBruto = await analyzeCropImage(buffer, mimeType, caption, idiomaAtivo);
                        const imagemPreparada = prepararMensagemImagem(diagBruto, caption);
                        console.log(`Diagnóstico: "${imagemPreparada.diagnosticoLimpo}"`);
                        try { registrarUsoRecurso(undefined, whatsappNumber, 'foto'); } catch {}
                        
                        textContext = imagemPreparada.texto;
                    } else {
                        console.error('Falha: Buffer da imagem veio vazio.');
                        textContext = `[FALHA NA ANÁLISE VISUAL: Não foi possível carregar a imagem do WhatsApp.]`;
                    }
                } catch (e) {
                    console.error('Erro ao baixar mídia da imagem:', e);
                    textContext = `[FALHA NA ANÁLISE VISUAL: Ocorreu um erro na conexão ao processar a imagem do WhatsApp.]`;
                }
            } else if (msgType === 'audioMessage') {
                console.log('Baixando áudio para transcrição...');
                let audioFilePath = null;
                let resAudio = { text: '', detectedLang: null, confidence: 0 };
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', { }, { 
                        logger: console, 
                        reuploadRequest: sock.updateMediaMessage 
                    });
                    
                    const tmpDir = path.resolve('.tmp');
                    if (!fs.existsSync(tmpDir)) {
                        fs.mkdirSync(tmpDir);
                    }
                    
                    audioFilePath = path.join(tmpDir, `audio_${whatsappNumber}_${Date.now()}.ogg`);
                    fs.writeFileSync(audioFilePath, buffer);
                    
                    console.log('Transcrevendo áudio...');
                    const idiomaPreAudio = idiomaAtivo || check.language || obterIdiomaLocal(whatsappNumber) || idiomaPadraoPorNumero(whatsappNumber);
                    resAudio = await transcribeAudio(audioFilePath, {
                        idiomaAtual: idiomaPreAudio,
                        whatsappNumber,
                        retornarMetadados: true
                    });
                    textContext = resAudio?.text || '';
                } catch (e) {
                    console.error('Erro ao processar áudio:', e);
                } finally {
                    if (audioFilePath) safeUnlink(audioFilePath);
                }
                
                if (!textContext) {
                    await responderSistemaLocalizado(sock, sender, 'audio_ruido', msg, {
                        preferirAudio: true,
                        bloquearFallbackTexto: true,
                        idioma: idiomaAtivo
                    });
                    return;
                }
                console.log(`Áudio transcrito: "${textContext}"`);
                try { registrarUsoRecurso(undefined, whatsappNumber, 'audio'); } catch {}

                const trocaAudio = detectarTrocaIdioma(textContext, idiomaAtivo, whatsappNumber);
                if (trocaAudio.alterado) {
                    idiomaAtivo = trocaAudio.idioma;
                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                } else if (
                    resAudio?.detectedLang
                    && resAudio?.confidence >= 0.78
                    && resAudio.detectedLang !== idiomaAtivo
                ) {
                    idiomaAtivo = resAudio.detectedLang;
                    try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                } else if (trocaAudio.possivelOutroIdioma) {
                    const clsAudio = await classificarIdiomaTextoPorLLM(textContext, idiomaAtivo);
                    if (clsAudio?.lang && clsAudio.confidence >= 0.8 && clsAudio.lang !== idiomaAtivo) {
                        idiomaAtivo = clsAudio.lang;
                        try { await salvarIdioma(whatsappNumber, idiomaAtivo); } catch {}
                    }
                }
                if (trocaAudio.apenasComando) {
                    await responderTextoOuAudio(
                        sock,
                        sender,
                        tMsg(idiomaAtivo, 'troca_idioma_ok'),
                        msg,
                        true,
                        { bloquearFallbackTexto: true, idioma: idiomaAtivo }
                    );
                    return;
                }
                if (trocaAudio.recusouApenas) {
                    const langPergAudio = trocaAudio.idiomaRecusado === 'pt-BR' ? 'en' : (idiomaPadraoPorNumero(whatsappNumber) || 'en');
                    await responderTextoOuAudio(
                        sock,
                        sender,
                        tMsg(langPergAudio, 'recusa_idioma_pergunta'),
                        msg,
                        true,
                        { bloquearFallbackTexto: true, idioma: langPergAudio }
                    );
                    return;
                }

                const intencaoAudio = detectarIntencaoNatural(textContext);
                if (intencaoAudio) {
                    await atenderIntencaoNatural(intencaoAudio, { sock, sender, msg, whatsappNumber, preferirAudio: true, idioma: idiomaAtivo });
                    return;
                }
            } else {
                return; // Ignora outros tipos
            }

            console.log(`📩 [${whatsappNumber}]: "${resumirLog(textContext)}"`);

            // Gerencia o histórico do usuário na sessão (com persistência em disco)
            const history = obterHistoricoUsuario(whatsappNumber);

            // Adiciona a mensagem atual ao histórico e persiste (últimas 10 mensagens)
            history.push({ role: 'user', content: textContext });
            salvarHistoricoUsuario(whatsappNumber, history);

            const ehAudio = msgType === 'audioMessage';
            const rotacaoIntent = interpretarMensagemRotacao(textContext, check.city, check.selectedCrop, history);
            if (rotacaoIntent) {
                let respostaRotacao = '';
                if (rotacaoIntent.tipo === 'plano_compartilhado') {
                    try { await salvarCidade(whatsappNumber, rotacaoIntent.cidade); } catch {}
                    if (rotacaoIntent.culturaAnterior) {
                        try { await salvarCulturaEVariedade(whatsappNumber, rotacaoIntent.culturaAnterior); } catch {}
                    }
                    try { await salvarNota(whatsappNumber, `Plano #1 NASA (${rotacaoIntent.cidade}): ${rotacaoIntent.planoTop1}`); } catch {}
                    respostaRotacao = rotacaoIntent.resposta;
                } else if (rotacaoIntent.tipo === 'comando_rotacao') {
                    try { registrarUsoRecurso(undefined, whatsappNumber, 'rotacao'); } catch {}
                    const r = await avaliarRotacaoNasa({
                        cidade: rotacaoIntent.cidade,
                        cultura_anterior: rotacaoIntent.culturaAnterior,
                        prioridade: rotacaoIntent.prioridade,
                        ...(rotacaoIntent.tipoSemente ? { tipo_semente: rotacaoIntent.tipoSemente } : {})
                    });
                    const cidadeAtualizada = r.contexto?.municipio?.split(' - ')[0] || rotacaoIntent.cidade;
                    try { await salvarCidade(whatsappNumber, cidadeAtualizada); } catch {}
                    try {
                        registrarSinalAnonimo({
                            municipioKey: r.contexto?.municipio_key,
                            culturaAnterior: r.contexto?.cultura_anterior,
                            prioridade: r.contexto?.prioridade,
                            planoEscolhido: r.ranking?.[0]?.titulo
                        });
                    } catch {}

                    if (rotacaoIntent.modo === 'janela_contato') {
                        try { await setProactiveOptin(whatsappNumber, true); } catch {}
                        try {
                            const primeiraCultura = r.ranking?.[0]?.etapas_detalhadas?.[0]?.cultura
                                || r.ranking?.[0]?.etapas?.[0]?.nome
                                || r.ranking?.[0]?.titulo?.split('→')?.[0]?.trim()
                                || 'novo plantio';
                            const cidadeLabel = r.contexto?.municipio || rotacaoIntent.cidade;
                            criarLembrete(undefined, {
                                numero: whatsappNumber,
                                texto: `Conferir umidade da terra e janela de entrada para ${primeiraCultura} em ${cidadeLabel}`,
                                quando: addDaysStr(hojeStr(), 5)
                            });
                        } catch {}
                    }

                    if (rotacaoIntent.modo === 'calculo_area') {
                        respostaRotacao = formatarDetalheRotacaoWhatsApp(r, 'calculo_area', rotacaoIntent.culturaAlvo, { ...rotacaoIntent.opcoes, paraFala: ehAudio });
                    } else if (
                        rotacaoIntent.modo === 'custo'
                        || rotacaoIntent.modo === 'manejo'
                        || rotacaoIntent.modo === 'escoamento'
                        || rotacaoIntent.modo === 'janela_contato'
                        || rotacaoIntent.modo === 'semente'
                    ) {
                        const fallbackDetalhe = formatarDetalheRotacaoWhatsApp(r, rotacaoIntent.modo, rotacaoIntent.culturaAlvo, { ...rotacaoIntent.opcoes, paraFala: ehAudio });
                        const contextoDetalhe = !check.degraded
                            ? montarContextoDetalheRotacao(r, rotacaoIntent.modo, rotacaoIntent.culturaAlvo)
                            : '';
                        if (contextoDetalhe) {
                            respostaRotacao = await generateAgroResponse(
                                history,
                                check.planType || 'low_ticket',
                                rotacaoIntent.culturaAlvo || check.selectedCrop || 'indefinido',
                                check.userVariety || 'indefinido',
                                whatsappNumber,
                                false,
                                false,
                                {
                                    city: cidadeAtualizada,
                                    notes: check.notes,
                                    isAudio: msgType === 'audioMessage',
                                    language: idiomaAtivo,
                                    rotacaoDetalheTexto: contextoDetalhe,
                                    rotacaoDetalheModo: rotacaoIntent.modo,
                                    rotacaoDetalheFallback: fallbackDetalhe
                                }
                            );
                        } else {
                            respostaRotacao = fallbackDetalhe;
                        }
                    } else if (ehAudio) {
                        const top1 = r.ranking?.[0];
                        const n = r.leitura_nasa;
                        const c = r.contexto;
                        const cidadeNome = String(c?.municipio || '').split(' - ')[0].trim() || c?.municipio;
                        const sinalN = Number(top1?.balanco_nitrogenio_kg_ha || 0) >= 0
                            ? `mais ${top1?.balanco_nitrogenio_kg_ha}`
                            : `${top1?.balanco_nitrogenio_kg_ha}`;
                        respostaRotacao = [
                            `Na ficha técnica de ${cidadeNome} pela base da NASA, a raiz está com ${n?.caixa_agua_raiz_pct} por cento de umidade e previsão de ${Math.round(Number(n?.chuva_prevista_14d_mm || 0))} milímetros nos próximos 14 dias.`,
                            `A opção número 1 marcou ${top1?.score_resiliencia} de 100, com ${top1?.titulo}, trazendo economia estimada de água de ${top1?.economia_agua_pct} por cento, ${top1?.palhada_t_ha} toneladas por hectare de palhada e balanço de nitrogênio de ${sinalN} quilos por hectare.`,
                            top1?.escoamento?.canal_recomendado
                                ? `Para escoar perto de ${top1.escoamento.distancia_media_km} quilômetros, o canal indicado é ${top1.escoamento.canal_recomendado}.`
                                : ''
                        ].filter(Boolean).join(' ');
                    } else {
                        const proHeader = tMsg(idiomaAtivo, 'rotacao_modo_pro_header');
                        const proFooter = tMsg(idiomaAtivo, 'rotacao_modo_pro_footer');
                        respostaRotacao = `${proHeader}\n\n${formatarRotacaoWhatsApp(r)}\n\n${proFooter}`;
                    }
                }

                if (idiomaAtivo !== 'pt-BR' && respostaRotacao) {
                    respostaRotacao = await garantirIdiomaSaida(respostaRotacao, idiomaAtivo, { registro: 'neutro_direto', isAudio: ehAudio });
                }

                const resumoRespostaRotacao = respostaRotacao.replaceAll(SEPARADOR_MENSAGEM_AGREGADA, '\n\n');
                console.log(`📤 -> [${whatsappNumber}]: "${resumirLog(resumoRespostaRotacao)}"`);
                history.push({ role: 'assistant', content: resumoRespostaRotacao });
                salvarHistoricoUsuario(whatsappNumber, history);

                if (ehAudio) {
                    console.log('Gerando áudio de resposta...');
                    await responderTextoOuAudio(sock, sender, respostaRotacao, msg, true, { bloquearFallbackTexto: true, idioma: idiomaAtivo });
                    return;
                }
                await sendHumanLike(sock, sender, respostaRotacao, msg);
                return;
            }

            const aiResponse = await generateAgroResponse(history, check.planType || 'low_ticket', check.selectedCrop || 'indefinido', check.userVariety || 'indefinido', whatsappNumber, false, check.degraded === true, { city: check.city, notes: check.notes, isAudio: ehAudioEntrada, language: idiomaAtivo });
            
            // Extrai imagem de produto (marcador [PRODUCT_IMAGE:url])
            let productImage = null;
            let cleanResponse = aiResponse;
            const imageMatch = aiResponse.match(/\[PRODUCT_IMAGE:(https?:\/\/[^\]]+)\]/);
            if (imageMatch) {
                productImage = imageMatch[1];
                cleanResponse = aiResponse.replace(/\[PRODUCT_IMAGE:[^\]]+\]\n?/g, '').trim();
            }

            // Envia imagem do produto PRIMEIRO (se disponível), sem texto quando a entrada foi áudio
            if (productImage && !ehAudioEntrada) {
                try {
                    const captionImg = await garantirMsgSistemaIdioma(tMsg(idiomaAtivo, 'imagem_produto_caption'), idiomaAtivo, false);
                    await sock.sendMessage(sender, {
                        image: { url: productImage },
                        caption: captionImg
                    }, { quoted: msg });
                } catch (imgErr) {
                    console.log('⚠️ Erro ao enviar imagem do produto:', imgErr.message);
                }
            }
            
            // Persuasão e upsell VIP desativados
            const extras = '';

            // Adiciona a resposta do bot ao histórico (sem o marcador de imagem ou separador interno)
            const resumoRespostaIA = cleanResponse.replaceAll(SEPARADOR_MENSAGEM_AGREGADA, '\n\n');
            console.log(`📤 -> [${whatsappNumber}]: "${resumirLog(resumoRespostaIA)}"`);
            history.push({ role: 'assistant', content: resumoRespostaIA });
            salvarHistoricoUsuario(whatsappNumber, history);
            
            if (ehAudioEntrada) {
                console.log('Gerando áudio de resposta...');
                await responderTextoOuAudio(sock, sender, cleanResponse, msg, true, { bloquearFallbackTexto: true, idioma: idiomaAtivo });
            } else {
                // Mensagem de texto: resposta em texto humanizada
                await sendHumanLike(sock, sender, cleanResponse + extras, msg);
            }
        }
        } catch (globalError) {
            console.error('Erro global ao processar mensagem:', globalError);
            await responderTextoOuAudio(
                sock,
                sender,
                tMsg(idiomaAtivo, 'erro_conexao'),
                msg,
                ehAudioEntrada,
                { bloquearFallbackTexto: ehAudioEntrada, idioma: idiomaAtivo }
            );
        } finally {
            processingUsers.delete(whatsappNumber);
        }
    });
}
