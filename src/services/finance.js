// Calculadora de safra/contas com disclaimers educativos.
// Números exatos, sem recomendação financeira personalizada.
import { accountsStore } from './opsStore.js';
import { diffDias, hojeStr, parseISODate } from './datas.js';
import { parseNumeroBR } from './field.js';

export const AVISO_FINANCEIRO = 'Conta educativa, não recomendação financeira. Confirma valores, frete e impostos antes de decidir; para dívida/crédito, fala com banco, contador ou Emater.';

export function fmtBRL(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return null;
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function somarCustos({ custo_total, custos, frete_total, outros }) {
    const lista = Array.isArray(custos) ? custos.map(parseNumeroBR).filter((x) => typeof x === 'number') : [];
    const frete = parseNumeroBR(frete_total) || 0;
    const extra = parseNumeroBR(outros) || 0;
    if (custo_total !== undefined && custo_total !== null && custo_total !== '') {
        const fixo = parseNumeroBR(custo_total);
        if (fixo === null || fixo < 0) return { erro: 'Custo total inválido.' };
        return { total: fixo + frete + extra, detalhado: false };
    }
    if (lista.length === 0 && !frete && !extra) return { total: null, detalhado: true, sem_custo: true };
    return { total: lista.reduce((a, b) => a + b, 0) + frete + extra, detalhado: true };
}

export function calcularSafra(input = {}) {
    const area = parseNumeroBR(input.area_ha);
    const produtividade = parseNumeroBR(input.produtividade_por_ha);
    const preco = parseNumeroBR(input.preco_por_unidade);
    if (!(area > 0)) return { ok: false, erro: 'Me passa a área em hectares (ex: 2,5 ha).' };
    if (!(produtividade >= 0)) return { ok: false, erro: 'Me passa a produtividade por hectare (ex: 60 sacas/ha).' };
    if (!(preco >= 0)) return { ok: false, erro: 'Me passa o preço por unidade (ex: R$ 120 por saca).' };

    const producao = area * produtividade;
    const receita = producao * preco;
    const custos = somarCustos(input);
    if (custos.erro) return { ok: false, erro: custos.erro };

    const resultado = {
        ok: true,
        unidade: input.unidade || 'un',
        area_ha: area,
        producao_total: Math.round(producao * 100) / 100,
        receita_total: Math.round(receita * 100) / 100,
        receita_por_ha: Math.round((receita / area) * 100) / 100,
        custo_total: custos.total === null ? null : Math.round(custos.total * 100) / 100,
        sem_custo: !!custos.sem_custo,
        aviso: AVISO_FINANCEIRO
    };

    if (custos.total !== null) {
        const margem = receita - custos.total;
        resultado.margem_total = Math.round(margem * 100) / 100;
        resultado.margem_pct = receita > 0 ? Math.round((margem / receita) * 1000) / 10 : null;
        resultado.custo_por_ha = Math.round((custos.total / area) * 100) / 100;
        resultado.preco_equilibrio = producao > 0 ? Math.round((custos.total / producao) * 100) / 100 : null;
        resultado.alertas = [];
        if (margem < 0) resultado.alertas.push('Margem negativa: com esses números, a conta não fecha.');
        if (resultado.preco_equilibrio !== null && preco < resultado.preco_equilibrio) {
            resultado.alertas.push('Preço abaixo do ponto de equilíbrio: cada unidade vendida aumenta o prejuízo.');
        }
    }

    return resultado;
}

export function formatarCalculoSafra(r) {
    if (!r.ok) return r.erro;
    let texto = `*💵 Conta da safra*\nReceita: ${fmtBRL(r.receita_total)} (${r.producao_total} ${r.unidade} x ${fmtBRL(r.receita_total / r.producao_total)})`;
    texto += `\nReceita/ha: ${fmtBRL(r.receita_por_ha)}`;
    if (r.sem_custo) {
        texto += `\nCusto: não informado — me passa os custos que eu fecho a margem.`;
    } else {
        texto += `\nCusto total: ${fmtBRL(r.custo_total)} (${fmtBRL(r.custo_por_ha)}/ha)`;
        texto += `\nMargem: ${fmtBRL(r.margem_total)}${r.margem_pct === null ? '' : ` (${r.margem_pct}%)`}`;
        if (r.preco_equilibrio !== null) texto += `\nPonto de equilíbrio: ${fmtBRL(r.preco_equilibrio)}/${r.unidade}`;
        if (r.alertas?.length) texto += `\n⚠️ ${r.alertas.join(' ')}`;
    }
    texto += `\n\n_${r.aviso}_`;
    return texto;
}

export function relacaoTroca(precoProduto, precoInsumo, unidadeProduto = 'un', unidadeInsumo = 'un') {
    const pp = parseNumeroBR(precoProduto);
    const pi = parseNumeroBR(precoInsumo);
    if (!(pp > 0) || !(pi > 0)) return { ok: false, erro: 'Me passa os dois preços para calcular a troca.' };
    const razao = pi / pp;
    return {
        ok: true,
        razao: Math.round(razao * 100) / 100,
        texto: `1 ${unidadeInsumo} de insumo = ${Math.round(razao * 100) / 100} ${unidadeProduto} do teu produto.`,
        aviso: AVISO_FINANCEIRO
    };
}

export function formatarRelacaoTroca(r) {
    if (!r.ok) return r.erro;
    return `*🔄 Relação de troca*\n${r.texto}\n\n_${r.aviso}_`;
}

export function compararCustoAplicacao(areaHa, opcoes = []) {
    const area = parseNumeroBR(areaHa);
    if (!(area > 0)) return { ok: false, erro: 'Me passa a área em hectares para comparar.' };
    if (!Array.isArray(opcoes) || opcoes.length === 0) return { ok: false, erro: 'Me passa pelo menos uma opção com preço, tamanho da embalagem e dose por hectare.' };
    if (opcoes.length > 5) return { ok: false, erro: 'Compara até 5 opções por vez.' };

    const linhas = [];
    for (const [i, o] of opcoes.entries()) {
        const nome = String(o?.nome || `Opção ${i + 1}`).slice(0, 60);
        const preco = parseNumeroBR(o?.preco_embalagem);
        const tamanho = parseNumeroBR(o?.tamanho_embalagem);
        const dose = parseNumeroBR(o?.dose_por_ha);
        if (!(preco > 0) || !(tamanho > 0) || !(dose > 0)) {
            return { ok: false, erro: `Na "${nome}", faltou preço, tamanho da embalagem ou dose por hectare. Uso só a dose que você informar — nunca invento dose.` };
        }
        const custoHa = (preco * dose) / tamanho;
        linhas.push({
            nome,
            custo_por_ha: Math.round(custoHa * 100) / 100,
            custo_total: Math.round(custoHa * area * 100) / 100,
            alerta_unidade: o?.unidade_embalagem && o?.unidade_dose && String(o.unidade_embalagem).toLowerCase() !== String(o.unidade_dose).toLowerCase()
        });
    }
    linhas.sort((a, b) => a.custo_por_ha - b.custo_por_ha);
    return { ok: true, area_ha: area, opcoes: linhas, aviso: 'Comparação usa a dose informada por você. Confirma dose e carência na bula antes de aplicar.' };
}

export function formatarComparacaoAplicacao(r) {
    if (!r.ok) return r.erro;
    const linhas = r.opcoes.map((o, i) => `${i + 1}. ${o.nome}: ${fmtBRL(o.custo_por_ha)}/ha • total ${fmtBRL(o.custo_total)}${o.alerta_unidade ? ' (confere as unidades!)' : ''}`).join('\n');
    return `*🧪 Custo por hectare (${r.area_ha} ha)*\n${linhas}\n\n_${r.aviso}_`;
}

// --- CONTAS A PAGAR/RECEBER ---

export function criarConta(store = accountsStore, { numero, descricao, valor, vencimento, tipo = 'pagar' } = {}) {
    if (!numero || !descricao) return { ok: false, erro: 'Me passa a descrição da conta.' };
    const v = parseNumeroBR(valor);
    if (!(v > 0)) return { ok: false, erro: 'Me passa o valor da conta (ex: R$ 350).' };
    const data = parseISODate(vencimento);
    if (!data) return { ok: false, erro: 'Me passa o vencimento em AAAA-MM-DD (ex: 2026-09-20).' };
    if (!['pagar', 'receber'].includes(tipo)) return { ok: false, erro: 'Tipo inválido: usa pagar ou receber.' };
    const conta = store.add({ numero, descricao: String(descricao).slice(0, 90), valor: v, vencimento: data, tipo, status: 'pendente' });
    return { ok: true, conta };
}

export function listarContas(store = accountsStore, { numero, status = 'pendente', hoje = hojeStr() } = {}) {
    const todas = store.list((c) => c.numero === numero && (status === 'todas' || c.status === status));
    return todas
        .map((c) => {
            const dias = diffDias(c.vencimento, hoje);
            const situacao = c.status !== 'pendente' ? c.status : dias < 0 ? 'vencida' : dias === 0 ? 'vence_hoje' : 'a_vencer';
            return { ...c, dias_para_vencer: dias, situacao };
        })
        .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1));
}

export function baixarConta(store = accountsStore, numero, id, status = 'paga') {
    if (!['paga', 'cancelada'].includes(status)) return { ok: false, erro: 'Status inválido: usa paga ou cancelada.' };
    const conta = store.list((c) => c.id === id && c.numero === numero)[0];
    if (!conta) return { ok: false, erro: 'Não achei essa conta. Manda MINHAS CONTAS para ver os IDs.' };
    const atualizada = store.update(id, { status });
    return { ok: true, conta: atualizada };
}

export function contasParaDigest(store = accountsStore, numero, hoje = hojeStr(), dias = 7) {
    return listarContas(store, { numero, status: 'pendente', hoje }).filter((c) => c.dias_para_vencer <= dias);
}

export function formatarContas(contas) {
    if (!contas.length) return '💵 Nenhuma conta pendente por aqui. Para registrar, manda "conta luz R$ 180 vence 2026-09-20".';
    const linhas = contas.slice(0, 6).map((c) => {
        const quando = c.situacao === 'vencida' ? `vencida há ${Math.abs(c.dias_para_vencer)}d` : c.situacao === 'vence_hoje' ? 'vence hoje' : `vence em ${c.dias_para_vencer}d`;
        return `- ${c.descricao} • ${fmtBRL(c.valor)} • ${quando} (${c.tipo})`;
    }).join('\n');
    return `*💵 Contas pendentes*\n${linhas}`;
}
