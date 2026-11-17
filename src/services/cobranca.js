/**
 * Cobrança automática VIP (sem webhook — o bot roda local):
 * - Intents de Pix com expiração (60min) e chave de idempotência própria.
 * - Poller a cada 5min confere pendentes; aprovado → libera VIP + avisa.
 * - Idempotência total: flags vipAplicado/avisado (nunca libera/avisa 2x),
 *   retry de rede reusa a mesma intent (nunca cobra 2x), expiração vira
 *   'expirado' (usuário gera outro código).
 */
import cron from 'node-cron';
import { createJsonStore } from './opsStore.js';
import path from 'path';
import { getActiveSock } from './whatsapp.js';
import { criarPagamentoPix } from './pagamentos.js';
import { supabase } from '../config/supabase.js';
import { limparQueroVip } from './persuasao.js';

export const cobrancaStore = createJsonStore(path.resolve('./data/mp_cobrancas.json'));

function novoIntentId(numero) {
    return `${numero}-${Date.now().toString(36)}`;
}

// Intent ativa do número: pendente válida ou aguardando CPF
export function intencaoAtiva(store = cobrancaStore, numero, agora = Date.now()) {
    const lista = store
        .list((r) => r.numero === numero && (r.status === 'pendente' || r.status === 'aguardando_cpf'))
        .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
    const top = lista[0] || null;
    if (top?.status === 'pendente' && top.expiraEm && new Date(top.expiraEm).getTime() <= agora) {
        store.update(top.id, { status: 'expirado' });
        return null;
    }
    return top;
}

// Gera (ou reaproveita) o Pix do intent ativo. Retorna {reusado?, ...dadosPix} ou {erro, precisaCpf?}
export async function gerarOuReusarPix(store = cobrancaStore, { numero, email, cpf } = {}) {
    const ativo = intencaoAtiva(store, numero);
    if (ativo?.status === 'pendente' && ativo.qr_code) {
        return { reusado: true, ...ativo };
    }
    // Mesmo intent (e mesma chave de idempotência) só se for a mesma tentativa:
    // e-mail trocado = intent novo = cobrança nova.
    const mesmoEmail = !ativo?.email || !email || ativo.email === email;
    const intentId = (ativo?.status === 'aguardando_cpf' && mesmoEmail && ativo.intentId)
        ? ativo.intentId
        : novoIntentId(numero);
    const r = await criarPagamentoPix({ numero, email, cpf, intentId });
    if (!r.ok) {
        if (r.precisaCpf) {
            if (ativo) store.update(ativo.id, { status: 'aguardando_cpf', email, intentId });
            else store.add({ numero, email, intentId, status: 'aguardando_cpf', criadoEm: new Date().toISOString() });
            return { erro: 'cpf', precisaCpf: true };
        }
        return { erro: r.erro };
    }
    const rec = {
        numero, email, intentId,
        paymentId: r.id, status: 'pendente',
        qr_code: r.qr_code, qr_code_base64: r.qr_code_base64 || null,
        ticket_url: r.ticket_url || null,
        expiraEm: r.expiraEm, criadoEm: new Date().toISOString(),
        vipAplicado: false, avisado: false
    };
    if (ativo) store.update(ativo.id, rec);
    else store.add(rec);
    return { reusado: false, ...rec };
}

// Aplica o VIP no banco (idempotente: update repetido é inofensivo)
export async function aplicarVip(numero) {
    const { error } = await supabase.from('profiles').update({ plan_type: 'premium' }).eq('whatsapp_number', numero);
    if (error) throw new Error(`supabase: ${error.message}`);
    try { limparQueroVip(undefined, numero); } catch {}
}

// Poller: confere pendentes. Deps injetáveis (testes usam fakes).
export async function verificarCobrancas({ store = cobrancaStore, consultar, agora = Date.now(), aplicarVip: aplicar = aplicarVip, avisar } = {}) {
    if (typeof consultar !== 'function') throw new Error('verificarCobrancas precisa de consultar(paymentId)');
    const resumo = { verificadas: 0, aprovadas: 0, expiradas: 0 };
    const pendentes = store.list((r) => r.status === 'pendente');
    for (const p of pendentes) {
        if (p.expiraEm && new Date(p.expiraEm).getTime() <= agora) {
            store.update(p.id, { status: 'expirado' });
            resumo.expiradas += 1;
            continue;
        }
        let pag = null;
        try {
            pag = await consultar(p.paymentId);
        } catch (e) {
            console.error(`Poll MP ${p.paymentId} falhou:`, e.message);
            continue;
        }
        if (!pag) continue;
        resumo.verificadas += 1;
        if (pag.status === 'approved') {
            try {
                if (!p.vipAplicado) {
                    await aplicar(p.numero);
                    store.update(p.id, { vipAplicado: true });
                }
                if (!p.avisado) {
                    if (typeof avisar === 'function') await avisar(p, pag);
                    store.update(p.id, { avisado: true });
                }
                store.update(p.id, { status: 'aprovado' });
                resumo.aprovadas += 1;
            } catch (e) {
                console.error(`Aplicação VIP ${p.numero} falhou (tenta no próximo ciclo):`, e.message);
            }
        } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(pag.status)) {
            store.update(p.id, { status: 'falhou' });
        }
    }
    return resumo;
}

async function avisarAprovacao(p, pag, sock, ownerNumber) {
    const msgUser = `✅ Pagamento confirmado, sô! Teu *VIP tá liberado* — foto, áudio, clima, tudo ilimitado a partir de agora. Valeu pela confiança! 💎`;
    await sock.sendMessage(`${p.numero}@s.whatsapp.net`, { text: msgUser });
    if (ownerNumber) {
        try {
            await sock.sendMessage(`${ownerNumber}@s.whatsapp.net`, { text: `💰 VIP auto-liberado: ${p.numero} pagou R$ ${pag.valor ?? '?'} via MP (id ${pag.id}).` });
        } catch {}
    }
}

export function startCobranca() {
    cron.schedule('*/5 * * * *', async () => {
        const sock = getActiveSock();
        if (!sock) return;
        try {
            const { consultarPagamentoMP } = await import('./pagamentos.js');
            const ownerNumber = process.env.OWNER_NUMBER;
            const r = await verificarCobrancas({
                consultar: consultarPagamentoMP,
                avisar: (p, pag) => avisarAprovacao(p, pag, sock, ownerNumber)
            });
            if (r.aprovadas > 0 || r.verificadas > 0) {
                console.log(`💳 Poll MP: ${r.verificadas} verificadas, ${r.aprovadas} aprovadas, ${r.expiradas} expiradas.`);
            }
        } catch (e) {
            console.error('Erro no poll de cobranças:', e.message);
        }
    }, { timezone: 'America/Sao_Paulo' });

    console.log('💳 Poll de cobranças MP agendado a cada 5min (America/Sao_Paulo)');
}
