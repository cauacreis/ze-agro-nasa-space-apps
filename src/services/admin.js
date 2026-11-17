import { supabase } from '../config/supabase.js';
import { lerUso } from './provedores.js';
import { consultarPagamentoMP } from './pagamentos.js';
import { limparQueroVip } from './persuasao.js';

// Comandos exclusivos do dono do bot, enviados pelo próprio WhatsApp.
// Todos começam com "/" e só respondem se o número for o OWNER_NUMBER.
export async function handleAdminCommand(rawText) {
    const partes = rawText.trim().split(/\s+/);
    const cmd = partes[0].toUpperCase();
    const alvo = partes[1];

    const ajuda = `🔧 COMANDOS ADMIN ZÉ AGRO
/stats — estatísticas gerais
/vip 5562... — vira usuário em VIP
/pago <id> — confere pagamento MP e libera VIP se aprovado
/free 5562... — volta pra plano grátis
/zerar 5562... — zera a cota mensal (+30d)
/apagar 5562... — apaga o perfil (teste)
/avisos — lista quem tem aviso ativo
/custos — gasto de tokens de IA por provedor (hoje + 7 dias)`;

    try {
        switch (cmd) {
            case '/STATS': {
                const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                const { count: vips } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan_type', 'premium');
                const { count: optin } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('proactive_optin', true);
                const { data: msgs } = await supabase.from('profiles').select('messages_used');
                const totalMsgs = (msgs || []).reduce((s, p) => s + (p.messages_used || 0), 0);
                return `📊 ZÉ AGRO — STATS
👥 Usuários: ${total ?? 0}
💎 VIPs: ${vips ?? 0}
🌅 Avisos ativos: ${optin ?? 0}
💬 Consultas totais: ${totalMsgs}`;
            }
            case '/VIP': {
                if (!alvo) return 'Uso: /vip 5562999999999';
                const { error } = await supabase.from('profiles').update({ plan_type: 'premium' }).eq('whatsapp_number', alvo);
                if (error) return `❌ ${error.message}`;
                return `✅ ${alvo} agora é VIP! 💎`;
            }
            case '/PAGO': {
                if (!alvo) return 'Uso: /pago <id do pagamento MP>';
                const pag = await consultarPagamentoMP(alvo);
                if (!pag) return '❌ Não achei esse pagamento no Mercado Pago (confere o ID e o MP_ACCESS_TOKEN).';
                if (pag.status !== 'approved') {
                    return `⏳ Pagamento ${pag.id}: ${pag.status}${pag.status_detail ? ` (${pag.status_detail})` : ''}. Ainda não aprovado — tenta de novo já já.`;
                }
                const numero = String(pag.referencia || '').replace(/^vip_/, '');
                if (!numero || numero === 'avulso') {
                    return `✅ Pagamento aprovado (R$ ${pag.valor ?? '?'}), mas sem número vinculado. Libera manual: /vip NUMERO`;
                }
                const { error } = await supabase.from('profiles').update({ plan_type: 'premium' }).eq('whatsapp_number', numero);
                if (error) return `❌ ${error.message}`;
                try { limparQueroVip(undefined, numero); } catch {}
                return `✅ Pagamento aprovado! ${numero} agora é VIP! 💎`;
            }
            case '/FREE': {
                if (!alvo) return 'Uso: /free 5562999999999';
                const { error } = await supabase.from('profiles').update({ plan_type: 'low_ticket' }).eq('whatsapp_number', alvo);
                if (error) return `❌ ${error.message}`;
                return `✅ ${alvo} voltou pro plano grátis.`;
            }
            case '/ZERAR': {
                if (!alvo) return 'Uso: /zerar 5562999999999';
                const novoCiclo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                const { error } = await supabase.from('profiles').update({ messages_used: 0, quota_reset_at: novoCiclo }).eq('whatsapp_number', alvo);
                if (error) return `❌ ${error.message}`;
                return `✅ Cota de ${alvo} zerada com ciclo de +30 dias.`;
            }
            case '/APAGAR': {
                if (!alvo) return 'Uso: /apagar 5562999999999';
                const { error } = await supabase.from('profiles').delete().eq('whatsapp_number', alvo);
                if (error) return `❌ ${error.message}`;
                return `🗑️ Perfil ${alvo} apagado (vai nascer de novo na próxima mensagem dele).`;
            }
            case '/AVISOS': {
                const { data } = await supabase.from('profiles').select('whatsapp_number, city').eq('proactive_optin', true);
                if (!data || data.length === 0) return 'Ninguém com aviso ativo ainda.';
                return '🌅 Avisos ativos:\n' + data.map(u => `- ${u.whatsapp_number} (${u.city || 'sem cidade'})`).join('\n');
            }
            case '/CUSTOS': {
                const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
                const { dias, totais } = lerUso(7);
                const hoje = dias[dias.length - 1];
                const nomes = { groq: 'Groq', gemini: 'Gemini', cerebras: 'Cerebras', local: 'Instantâneas (0 tokens)' };
                const linhas = Object.entries(hoje?.provedores || {}).map(([p, v]) =>
                    `- ${nomes[p] || p}: ${v.req} req • ${fmtK(v.in)} in / ${fmtK(v.out)} out`
                );
                const tReq = Object.values(totais).reduce((s, v) => s + (v.req || 0), 0);
                const tIn = Object.values(totais).reduce((s, v) => s + (v.in || 0), 0);
                return `💰 CUSTOS IA — hoje (${hoje?.data || 'sem dados'})
${linhas.length ? linhas.join('\n') : '(nada registrado hoje)'}

7 dias: ${tReq} req • ~${fmtK(tIn)} tokens in.
Tetos grátis: Groq 120b 200k/dia • Gemini 1,5k req/dia • Cerebras 1M/dia.`;
            }
            default:
                return ajuda;
        }
    } catch (e) {
        return `❌ Erro no comando admin: ${e.message}`;
    }
}
