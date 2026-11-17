// Utilidades de data/hora para caderno, lembretes e contas.
// Tudo em data local YYYY-MM-DD para comparar sem dor de fuso no digest.

export function pad2(n) {
    return String(n).padStart(2, '0');
}

export function toStr(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function hojeStr(date = new Date()) {
    return toStr(date);
}

export function parseISODate(value) {
    if (typeof value !== 'string') return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) {
        return null;
    }
    return toStr(d);
}

export function addDaysStr(yyyyMmDd, dias) {
    const base = parseISODate(yyyyMmDd);
    if (!base) return null;
    const [y, m, d] = base.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + dias);
    return toStr(dt);
}

export function diffDias(a, b) {
    const da = parseISODate(a);
    const db = parseISODate(b);
    if (!da || !db) return null;
    const [ya, ma, daa] = da.split('-').map(Number);
    const [yb, mb, dbb] = db.split('-').map(Number);
    const ta = new Date(ya, ma - 1, daa).getTime();
    const tb = new Date(yb, mb - 1, dbb).getTime();
    return Math.round((ta - tb) / 86400000);
}

export function normalizarTexto(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ' ');
}

function extrairHora(raw) {
    const t = String(raw || '');
    let m = t.match(/(\d{1,2})\s*h(\d{2})?/i);
    if (!m) m = t.match(/as\s*(\d{1,2})(?::(\d{2}))?/i);
    if (!m) m = t.match(/(\d{1,2}):(\d{2})/);
    if (!m) return '08:00';
    const h = Number(m[1]);
    const min = Number(m[2] || 0);
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(min) || min < 0 || min > 59) return '08:00';
    return `${pad2(h)}:${pad2(min)}`;
}

function dataValidaMesDia(ano, mes, dia) {
    const dt = new Date(ano, mes - 1, dia);
    return dt.getFullYear() === ano && dt.getMonth() === mes - 1 && dt.getDate() === dia;
}

function proximoDiaUtil(ano, mes, dia) {
    if (dataValidaMesDia(ano, mes, dia)) return `${ano}-${pad2(mes)}-${pad2(dia)}`;
    return null;
}

// Interpreta "amanhã 6h", "sexta 9h", "dia 10", "12/09", "2026-09-12", "em 3 dias".
export function parseQuando(texto, agora = new Date()) {
    if (!texto) return null;
    const raw = String(texto);
    const t = ` ${normalizarTexto(raw)} `;
    const hora = extrairHora(raw);
    const hoje = toStr(agora);

    let m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        const data = parseISODate(`${m[1]}-${m[2]}-${m[3]}`);
        if (!data) return null;
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }

    m = raw.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (m) {
        let dia = Number(m[1]);
        let mes = Number(m[2]);
        let ano = m[3] ? Number(m[3]) : agora.getFullYear();
        if (ano < 100) ano += 2000;
        if (!m[3]) {
            const candidato = `${ano}-${pad2(mes)}-${pad2(dia)}`;
            if (!dataValidaMesDia(ano, mes, dia)) return null;
            if (candidato < hoje) ano += 1;
        }
        const data = proximoDiaUtil(ano, mes, dia);
        if (!data) return null;
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }

    m = t.match(/dia\s+(\d{1,2})/);
    if (m) {
        const dia = Number(m[1]);
        let ano = agora.getFullYear();
        let mes = agora.getMonth() + 1;
        if (dia < agora.getDate()) {
            mes += 1;
            if (mes > 12) {
                mes = 1;
                ano += 1;
            }
        }
        const data = proximoDiaUtil(ano, mes, dia);
        if (!data) return null;
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }

    const dow = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].findIndex((d) => t.includes(d));
    if (dow >= 0) {
        const delta = (dow - agora.getDay() + 7) % 7;
        const dt = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        dt.setDate(dt.getDate() + delta);
        const data = toStr(dt);
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }

    if (t.includes('depois de amanha')) {
        const data = addDaysStr(hoje, 2);
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }
    if (t.includes('amanha')) {
        const data = addDaysStr(hoje, 1);
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }
    if (t.includes('hoje')) {
        return { data: hoje, hora, iso: `${hoje}T${hora}:00`, original: raw };
    }

    m = t.match(/em\s+(\d{1,2})\s+dias?/);
    if (m) {
        const data = addDaysStr(hoje, Number(m[1]));
        return { data, hora, iso: `${data}T${hora}:00`, original: raw };
    }

    return null;
}
