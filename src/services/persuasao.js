/**
 * Persuasão HONESTA (sem dark patterns):
 * - Urgência real: a cota de 20 existe de verdade, o aviso usa o número real.
 * - Prova real: recapitulamos o que ELE usou (contadores verdadeiros), zero
 *   número inventado, zero countdown fake, zero culpa.
 * - Frequência limitada: nudge 1x por marco, transição 1x/mês, pitch a cada
 *   3 respostas degradadas. VIP nunca recebe pitch.
 */
import { createJsonStore } from './opsStore.js';
import path from 'path';

export const persuasaoStore = createJsonStore(path.resolve('./data/persuasao.json'));

const ROTULOS = {
    foto: ['foto analisada', 'fotos analisadas'],
    audio: ['áudio trocado', 'áudios trocados'],
    clima: ['previsão do tempo', 'previsões do tempo'],
    ceasa: ['cotação CEASA', 'cotações CEASA'],
    produto: ['produto achado', 'produtos achados'],
    caderno: ['registro no caderno', 'registros no caderno'],
    safra: ['conta de safra', 'contas de safra'],
    contas: ['conta organizada', 'contas organizadas'],
    lembretes: ['lembrete criado', 'lembretes criados'],
    janela: ['janela de manejo', 'janelas de manejo']
};

function fraseRecurso(chave, n) {
    const [s, p] = ROTULOS[chave] || [chave, chave];
    return `${n} ${n === 1 ? s : p}`;
}

function mesKey(date = new Date()) {
    return date.toISOString().slice(0, 7);
}

function getRec(store, numero) {
    return store.list((r) => r.numero === numero)[0] || null;
}

function getOuCria(store, numero) {
    return getRec(store, numero) || store.add({ numero, recursos: {} });
}

// Conta 1 uso de um recurso premium (chamado a cada tool/foto/áudio com sucesso)
export function registrarUsoRecurso(store = persuasaoStore, numero, recurso) {
    if (!numero || !recurso || !ROTULOS[recurso]) return;
    const rec = getOuCria(store, numero);
    const recursos = { ...(rec.recursos || {}) };
    recursos[recurso] = (recursos[recurso] || 0) + 1;
    store.update(rec.id, { recursos });
}

// Resumo real do que o produtor usou: "3 fotos analisadas, 2 cotações CEASA e 1 conta de safra"
export function resumoUso(store = persuasaoStore, numero) {
    const recursos = getRec(store, numero)?.recursos || {};
    const entries = Object.entries(recursos).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { total: 0, texto: null, top: [] };
    const total = entries.reduce((s, [, n]) => s + n, 0);
    const frases = entries.slice(0, 3).map(([k, n]) => fraseRecurso(k, n));
    const texto = frases.join(', ').replace(/, ([^,]*)$/, ' e $1');
    return { total, texto, top: entries.slice(0, 3).map(([k]) => k) };
}

// --- Flags mensais (1x por marco, sem repeteco) ---

function flagFeita(store, numero, campo) {
    return getRec(store, numero)?.[campo] === mesKey();
}

function marcarFlag(store, numero, campo) {
    const rec = getOuCria(store, numero);
    store.update(rec.id, { [campo]: mesKey() });
}

export function deveNudge(store = persuasaoStore, numero, remaining) {
    if (remaining === 5 && !flagFeita(store, numero, 'nudge5Mes')) return 'n5';
    if (remaining === 2 && !flagFeita(store, numero, 'nudge2Mes')) return 'n2';
    return null;
}

export function marcarNudge(store = persuasaoStore, numero, kind) {
    marcarFlag(store, numero, kind === 'n5' ? 'nudge5Mes' : 'nudge2Mes');
}

export function deveTransicao(store = persuasaoStore, numero) {
    return !flagFeita(store, numero, 'transicaoMes');
}

export function marcarTransicao(store = persuasaoStore, numero) {
    marcarFlag(store, numero, 'transicaoMes');
}

// Conta respostas degradadas do mês; pitch a cada 3ª (3, 6, 9...)
export function contarDegradado(store = persuasaoStore, numero) {
    const rec = getOuCria(store, numero);
    const mes = mesKey();
    const n = rec.degMes === mes ? (rec.degCount || 0) + 1 : 1;
    store.update(rec.id, { degMes: mes, degCount: n });
    return n;
}

// --- Copies (curtas, caipiras, verdadeiras) ---

export function textoNudge(kind, resumo) {
    if (kind === 'n5') return `\n\n_(faltam 5 consultas cheias — depois continuo no básico)_`;
    const base = `_(só mais 2 cheias`;
    const meio = resumo?.texto ? `. Esse mês: ${resumo.texto}` : '';
    return `\n\n${base}${meio}. VIP R$ 84,99 = ilimitado)_`;
}

export function textoTransicao(resumo) {
    const meio = resumo?.texto ? ` Tu aproveitou: ${resumo.texto}.` : '';
    return `🌾 Mês cheio usado!${meio}\nAgora tô no modo básico — continuo ajudando no simples. Pra voltar ao cheio ilimitado: *VIP R$ 84,99/mês*. Manda QUERO VIP.`;
}

const PITCHES = [
    (destaque) => `💎 Lembra o cheio? ${destaque}. VIP R$ 84,99/mês, ilimitado — manda QUERO VIP.`,
    () => `📸 No cheio eu leio foto e respondo áudio. VIP destrava tudo: QUERO VIP.`,
    () => `Tu já viu que eu funciono — o VIP é continuar assim, sem limite. R$ 84,99/mês.`,
    () => `1 Pix e acabou o limite: VIP R$ 84,99/mês. Manda QUERO VIP que eu te passo a chave.`
];

export function textoPitch(count, resumo) {
    const d = resumo?.texto ? resumo.texto.split(' e ')[0].split(', ')[0] : 'diagnóstico, clima e preço';
    return `\n\n${PITCHES[Math.floor(count / 3) % PITCHES.length](d)}`;
}

// --- Fluxo QUERO VIP ---

export function marcarQueroVip(store = persuasaoStore, numero) {
    const rec = getOuCria(store, numero);
    store.update(rec.id, { queroVipTs: Date.now() });
}

export function temQueroVip(store = persuasaoStore, numero) {
    const ts = getRec(store, numero)?.queroVipTs || 0;
    return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
}

export function limparQueroVip(store = persuasaoStore, numero) {
    const rec = getRec(store, numero);
    if (rec) store.update(rec.id, { queroVipTs: 0 });
}

const PAGAMENTO_RE = /pag(uei|o|amento)|comprovante|transfer[iê]ncia|fiz o pix|segue o pagamento|mercadopago\.com/i;

export function parecePagamento(texto) {
    return PAGAMENTO_RE.test(String(texto || ''));
}
