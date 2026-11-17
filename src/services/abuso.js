/**
 * Blindagem anti-abuso (local, sem banco):
 * - Grupos: ignorados (responder grupo = custo infinito + spam).
 * - Rajada: >6 msgs/min = strike (aviso → 2min → 15min). Normal nunca bate.
 * - Mídia: >5 fotos/áudios em 10min = pausa; áudio >3min = recusa educada.
 * - Repetida: mesma mensagem 3x seguidas = pede pra reformular (sem gastar IA).
 * Tudo com store injetável (testável) e sem tocar na cota (verificação pré-cota).
 */
import { createJsonStore } from './opsStore.js';
import path from 'path';
import { IDIOMA_PADRAO, tMsg } from '../config/i18n.js';

export const abusoStore = createJsonStore(path.resolve('./data/abuso.json'));

const JANELA_MS = 60 * 1000;
const LIMITE_MINUTO = 6;
const LIMITE_MIDIA_10MIN = 5;
const MAX_AUDIO_SEG = 180;
const RESET_STRIKES_MS = 30 * 60 * 1000;

function getOuCria(store, numero) {
    return store.list((r) => r.numero === numero)[0]
        || store.add({ numero, ts: [], strikes: 0, strikeTs: 0, bloqueadoAte: 0, ultimas: [], mediaTs: [] });
}

function salvar(store, rec) {
    store.update(rec.id, rec);
}

export function verificarAbuso(store = abusoStore, { numero, texto, msgType, audioSeconds, agora = Date.now(), idioma = IDIOMA_PADRAO } = {}) {
    const rec = getOuCria(store, numero);

    // Strikes zeram após 30min de bom comportamento
    if (rec.strikes > 0 && agora - (rec.strikeTs || 0) > RESET_STRIKES_MS) {
        rec.strikes = 0;
        rec.bloqueadoAte = 0;
    }

    // Bloqueio ativo?
    if (agora < (rec.bloqueadoAte || 0)) {
        const mins = Math.max(1, Math.ceil((rec.bloqueadoAte - agora) / 60000));
        salvar(store, rec);
        return { bloqueado: true, resposta: tMsg(idioma, 'abuso_bloqueado', { mins }) };
    }

    // Rajada por minuto
    rec.ts = (rec.ts || []).filter((t) => agora - t < JANELA_MS);
    rec.ts.push(agora);
    if (rec.ts.length > LIMITE_MINUTO) {
        rec.strikes = (rec.strikes || 0) + 1;
        rec.strikeTs = agora;
        if (rec.strikes === 1) {
            salvar(store, rec);
            return { bloqueado: true, resposta: tMsg(idioma, 'abuso_rajada_1') };
        }
        const mins = rec.strikes === 2 ? 2 : 15;
        rec.bloqueadoAte = agora + mins * 60000;
        salvar(store, rec);
        return { bloqueado: true, resposta: tMsg(idioma, 'abuso_rajada_n', { mins }) };
    }

    // Enxurrada de mídia (cada foto/áudio = IA cara)
    if (msgType === 'imageMessage' || msgType === 'audioMessage') {
        rec.mediaTs = (rec.mediaTs || []).filter((t) => agora - t < 10 * 60 * 1000);
        rec.mediaTs.push(agora);
        if (rec.mediaTs.length > LIMITE_MIDIA_10MIN) {
            salvar(store, rec);
            return { bloqueado: true, resposta: tMsg(idioma, 'abuso_midia') };
        }
    }
    if (msgType === 'audioMessage' && (audioSeconds || 0) > MAX_AUDIO_SEG) {
        salvar(store, rec);
        return { bloqueado: true, resposta: tMsg(idioma, 'abuso_audio_longo') };
    }

    // Mesma mensagem 3x seguidas (loop/cola)
    if (texto && texto.length > 0) {
        rec.ultimas = [...(rec.ultimas || []), texto].slice(-3);
        if (rec.ultimas.length === 3 && rec.ultimas.every((t) => t === texto)) {
            salvar(store, rec);
            return { bloqueado: true, resposta: tMsg(idioma, 'abuso_repetida') };
        }
    }

    salvar(store, rec);
    return { bloqueado: false };
}
