// Lembretes opt-in com digest matinal (sem disparo arbitrário).
// Um lembrete avisa no digest do dia; recorrentes avançam, únicos viram "avisado".
import { remindersStore } from './opsStore.js';
import { addDaysStr, hojeStr, parseQuando } from './datas.js';

const RECORRENCIAS = ['nenhuma', 'diaria', 'semanal'];

export function criarLembrete(store = remindersStore, { numero, texto, quando, recorrencia = 'nenhuma', agora = new Date() } = {}) {
    if (!numero || !texto) return { ok: false, erro: 'Me diz o que devo lembrar.' };
    if (!RECORRENCIAS.includes(recorrencia)) return { ok: false, erro: 'Recorrência inválida: usa nenhuma, diaria ou semanal.' };
    const parsed = typeof quando === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(quando)
        ? { data: quando, hora: '08:00', iso: `${quando}T08:00:00`, original: quando }
        : parseQuando(quando, agora);
    if (!parsed) return { ok: false, erro: 'Não entendi quando. Ex: "amanhã 6h", "sexta 9h", "dia 10" ou "2026-09-20".' };
    const lembrete = store.add({ numero, texto: String(texto).slice(0, 120), proxima_data: parsed.data, hora: parsed.hora, recorrencia, status: 'ativo' });
    return { ok: true, lembrete };
}

export function listarLembretes(store = remindersStore, { numero, incluirConcluidos = false } = {}) {
    return store
        .list((l) => l.numero === numero && (incluirConcluidos || l.status === 'ativo'))
        .sort((a, b) => (a.proxima_data < b.proxima_data ? -1 : a.proxima_data > b.proxima_data ? 1 : 0));
}

export function cancelarLembrete(store = remindersStore, numero, id) {
    const item = store.list((l) => l.id === id && l.numero === numero)[0];
    if (!item) return { ok: false, erro: 'Não achei esse lembrete. Manda MEUS LEMBRETES para ver os IDs.' };
    store.update(id, { status: 'cancelado' });
    return { ok: true };
}

export function lembretesParaDigest(store = remindersStore, numero, hoje = hojeStr()) {
    return store
        .list((l) => l.numero === numero && l.status === 'ativo' && l.proxima_data <= hoje)
        .sort((a, b) => (a.proxima_data < b.proxima_data ? -1 : 1));
}

export function aplicarDigestLembretes(store = remindersStore, incluidos = [], hoje = hojeStr()) {
    let avancados = 0;
    for (const l of incluidos) {
        if (l.recorrencia === 'diaria') {
            store.update(l.id, { proxima_data: addDaysStr(l.proxima_data, 1), ultimo_aviso: hoje });
            avancados += 1;
        } else if (l.recorrencia === 'semanal') {
            store.update(l.id, { proxima_data: addDaysStr(l.proxima_data, 7), ultimo_aviso: hoje });
            avancados += 1;
        } else {
            store.update(l.id, { status: 'avisado', ultimo_aviso: hoje });
            avancados += 1;
        }
    }
    return avancados;
}

export function formatarLembretes(lembretes) {
    if (!lembretes.length) return '⏰ Nenhum lembrete ativo. Manda "me lembra de vacinar o gado amanhã 6h" que eu anoto.';
    return `*⏰ Lembretes*\n${lembretes.slice(0, 6).map((l) => `- ${l.texto} • ${l.proxima_data} ${l.hora}${l.recorrencia !== 'nenhuma' ? ` (${l.recorrencia})` : ''}`).join('\n')}`;
}
