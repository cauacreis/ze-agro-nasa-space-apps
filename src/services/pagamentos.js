/**
 * Pagamentos fase 2 — Mercado Pago (Checkout Pro / Preferences).
 * - QUERO VIP gera (ou reaproveita) um link de pagamento real: Pix ou cartão.
 * - Sem token e sem link manual: retorna null e o bot cai no Pix manual.
 * - /pago <id> (dono) consulta o status e libera o VIP se aprovado.
 * Nenhuma chave é logada. Cache local em data/ (fora do git).
 */
import fs from 'fs';
import path from 'path';

const MP_API = 'https://api.mercadopago.com';
const CACHE_PATH = path.resolve('./data/mp_links.json');
const CACHE_MS = 24 * 60 * 60 * 1000;

export function precoVip() {
    const v = Number(String(process.env.VIP_PRECO || '84.99').replace(',', '.'));
    return v > 0 ? Math.round(v * 100) / 100 : 84.99;
}

// Corpo da preferência: rastreável por número (external_reference vip_<numero>)
export function montarPreferencia(numero) {
    return {
        items: [{
            title: 'VIP Zé Agro — mensalidade',
            quantity: 1,
            unit_price: precoVip(),
            currency_id: 'BRL'
        }],
        metadata: { produto: 'vip_mensal', whatsapp: String(numero || '') },
        external_reference: `vip_${numero || 'avulso'}`
    };
}

function carregarCache() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

function salvarCache(cache) {
    try {
        fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
    } catch (e) {
        console.error('Erro ao salvar cache MP:', e.message);
    }
}

export async function criarPreferenciaMP(numero) {
    const token = process.env.MP_ACCESS_TOKEN || '';
    if (!token) return null;
    try {
        const resp = await fetch(`${MP_API}/checkout/preferences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(montarPreferencia(numero))
        });
        if (!resp.ok) {
            console.error(`MP preferência falhou: HTTP ${resp.status}`);
            return null;
        }
        const j = await resp.json();
        if (!j.init_point) {
            console.error('MP preferência sem init_point.');
            return null;
        }
        return { id: j.id || null, link: j.init_point };
    } catch (e) {
        console.error('Erro ao criar preferência MP:', e.message);
        return null;
    }
}

// Ordem: link manual do dono > cache 24h por número > cria via API > null (Pix manual)
export async function obterLinkPagamento(numero) {
    if (process.env.MP_PREFERENCE_LINK) {
        return { link: process.env.MP_PREFERENCE_LINK, origem: 'manual' };
    }
    const agora = Date.now();
    const cache = carregarCache();
    const item = cache[String(numero || '')];
    if (item && agora - (item.ts || 0) < CACHE_MS && item.link) {
        return { link: item.link, origem: 'cache' };
    }
    const nova = await criarPreferenciaMP(numero);
    if (nova?.link) {
        cache[String(numero || '')] = { link: nova.link, ts: agora };
        salvarCache(cache);
        return { ...nova, origem: 'api' };
    }
    return null;
}

// Extrai ID numérico de pagamento de um texto/link colado pelo usuário
export function extrairIdPagamento(texto) {
    const m = String(texto || '').match(/(\d{9,})/);
    return m ? m[1] : null;
}

// --- PIX AUTOMÁTICO (Payments API: Pix copia-e-cola + QR no chat) ---

// Validação de formato (o MP valida de verdade; aqui só evitamos lixo óbvio)
export function validarEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

export function extrairEmail(texto) {
    const m = String(texto || '').match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
    return m ? m[0].trim() : null;
}

export function validarCpf(s) {
    const d = String(s || '').replace(/\D/g, '');
    return /^\d{11}$/.test(d) ? d : null;
}

// Corpo do pagamento Pix: expira em 60min, rastreável por número
export function montarPagamentoPix({ numero, email, cpf, expiraEm } = {}) {
    const payer = { email: String(email || '').trim() };
    if (cpf) payer.identification = { type: 'CPF', number: String(cpf).replace(/\D/g, '') };
    return {
        transaction_amount: precoVip(),
        payment_method_id: 'pix',
        description: 'VIP Zé Agro — mensalidade',
        payer,
        external_reference: `vip_${numero || 'avulso'}`,
        date_of_expiration: expiraEm || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        metadata: { produto: 'vip_mensal', whatsapp: String(numero || '') }
    };
}

// Chave de idempotência: MESMO intent = MESMA chave (retry não cobra 2x);
// intent novo = chave nova (código novo). Nunca reutilizar entre intents.
export function chaveIdempotencia(intentId) {
    return `zeagro-vip-${intentId}`;
}

// Cria o Pix. Retorna {ok, id, qr_code, qr_code_base64, ticket_url, expiraEm}
// ou {ok:false, erro, precisaCpf?}. Retry com a MESMA intentId é seguro.
export async function criarPagamentoPix({ numero, email, cpf, intentId, expiraEm } = {}) {
    const token = process.env.MP_ACCESS_TOKEN || '';
    if (!token) return { ok: false, erro: 'Pagamento automático indisponível no momento.' };
    if (!validarEmail(email)) return { ok: false, erro: 'Me passa um e-mail válido que eu gero o Pix. 📧' };
    if (!intentId) return { ok: false, erro: 'Faltou o identificador da cobrança.' };
    try {
        const resp = await fetch(`${MP_API}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Idempotency-Key': chaveIdempotencia(intentId)
            },
            body: JSON.stringify(montarPagamentoPix({ numero, email, cpf, expiraEm }))
        });
        const j = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            const msg = JSON.stringify(j).toLowerCase();
            if (resp.status === 400 && msg.includes('identification')) {
                return { ok: false, erro: 'cpf', precisaCpf: true };
            }
            console.error(`MP Pix falhou: HTTP ${resp.status}`);
            return { ok: false, erro: 'Não consegui gerar o Pix agora. Tenta de novo em 1 min.' };
        }
        const tx = j.point_of_interaction?.transaction_data || {};
        if (!j.id || !tx.qr_code) {
            console.error('MP Pix sem qr_code na resposta.');
            return { ok: false, erro: 'Não consegui gerar o Pix agora. Tenta de novo em 1 min.' };
        }
        return {
            ok: true,
            id: String(j.id),
            status: j.status || 'pending',
            qr_code: tx.qr_code,
            qr_code_base64: tx.qr_code_base64 || null,
            ticket_url: tx.ticket_url || null,
            expiraEm: expiraEm || new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
    } catch (e) {
        console.error('Erro ao criar Pix MP:', e.message);
        return { ok: false, erro: 'Não consegui gerar o Pix agora. Tenta de novo em 1 min.' };
    }
}

// Consulta status real: approved | pending | rejected | ... (null se falhar)
export async function consultarPagamentoMP(id) {
    const token = process.env.MP_ACCESS_TOKEN || '';
    if (!token || !id) return null;
    try {
        const resp = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) {
            console.error(`MP consulta falhou: HTTP ${resp.status}`);
            return null;
        }
        const j = await resp.json();
        return {
            id: j.id,
            status: j.status || null,
            status_detail: j.status_detail || null,
            valor: j.transaction_amount ?? null,
            meio: j.payment_method_id || null,
            referencia: j.external_reference || null
        };
    } catch (e) {
        console.error('Erro ao consultar pagamento MP:', e.message);
        return null;
    }
}
