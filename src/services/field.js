// Caderno de campo: registra operação com texto natural, resume e exporta CSV.
// Persistência local em data/field_records.json (fora do git). Sem segredos.
import { fieldStore } from './opsStore.js';
import { addDaysStr, hojeStr, normalizarTexto } from './datas.js';

export function parseNumeroBR(valor) {
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    if (valor === null || valor === undefined) return null;
    let s = String(valor).replace(/r\$\s*/gi, '').replace(/\s+/g, '').trim();
    if (!s) return null;
    if (/^-?[\d.]+,\d{1,3}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
    s = s.replace(/[^0-9.\-]/g, '');
    if (!s || s === '-' || s === '.' || s === '-.') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

const MAQUINAS = ['trator', 'rocadeira', 'roçadeira', 'colheitadeira', 'colhedeira', 'caminhao', 'caminhão', 'caminhonete', 'moto', 'bomba', 'pulverizador', 'tratorito'];
const COMBUSTIVEIS = ['diesel', 'gasolina', 'etanol', 'arla'];

function acharPalavra(n, lista) {
    return lista.find((x) => n.includes(x)) || null;
}

function extrairData(n, hoje) {
    const m = n.match(/em\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (m) {
        let ano = m[3] ? Number(m[3]) : hoje.getFullYear();
        if (ano < 100) ano += 2000;
        const data = `${ano}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
        return data;
    }
    if (n.includes('ontem')) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        d.setDate(d.getDate() - 1);
        return hojeStr(d);
    }
    return hojeStr(hoje);
}

function limparExcesso(s, max = 90) {
    return String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Interpreta "abasteci 40 litros de diesel no trator", "troquei o óleo, R$ 180", etc.
export function parseRegistroCampo(texto, hoje = new Date()) {
    const original = String(texto || '').trim();
    if (!original) return null;
    const n = ` ${normalizarTexto(original)} `;
    const data = extrairData(n, hoje);

    const ehAbastecimento = /(abastec|combust)/.test(n)
        || /(diesel|gasolina|etanol|arla)/.test(n)
        || (/(litros?|lts?)\b/.test(n) && (acharPalavra(n, COMBUSTIVEIS) || acharPalavra(n, MAQUINAS)));

    if (ehAbastecimento) {
        const m = n.match(/(\d[\d.,]*)\s*(litros?|lts?|l)\b/);
        const litros = m ? parseNumeroBR(m[1]) : null;
        const combustivel = acharPalavra(n, COMBUSTIVEIS);
        const maquina = acharPalavra(n, MAQUINAS);
        const resumo = `Abastecimento${litros ? `: ${litros} L` : ''}${combustivel ? ` ${combustivel}` : ''}${maquina ? ` no ${maquina}` : ''}`.trim();
        return { tipo: 'abastecimento', data, resumo, dados: { litros, combustivel, maquina } };
    }

    if (/(manut|troca|troquei|conserto|reparo|revisao|oleo do motor|filtro|pneu|correia)/.test(n)) {
        const m = n.match(/(?:custo|valor|gastei|pagou|paguei|r\$)\s*(\d[\d.,]*)/) || n.match(/r\$\s*(\d[\d.,]*)/);
        const custo = m ? parseNumeroBR(m[1]) : null;
        const equipamento = acharPalavra(n, MAQUINAS) || 'equipamento';
        const servico = limparExcesso(original.replace(/registra:?/i, ''));
        const resumo = `Manutenção ${equipamento}${custo ? ` (${custo})` : ''}: ${servico}`.trim();
        return { tipo: 'manutencao', data, resumo, dados: { equipamento, servico, custo } };
    }

    if (/(apliquei|aplicacao|pulverizei|pulverizacao|usei|passei veneno|passei remedio)/.test(n)) {
        const semVerbo = original.replace(/(registra:?|apliquei|aplicacao|pulverizei|pulverizacao|usei|passei)/gi, ' ').trim();
        const doseMatch = original.match(/dose[^.\n]{0,60}/i) || original.match(/(\d[\d.,]*\s*(ml|l|g|kg)\s*(?:\/\s*(ha|l|litro|bomba))?)/i);
        const culturaMatch = n.match(/\bno\b\s+([a-zà-ü ]{3,24})|\bna\b\s+([a-zà-ü ]{3,24})/);
        const produto = limparExcesso(semVerbo.split(/ no | na | de | com dose/i)[0], 70) || 'produto';
        const cultura = culturaMatch ? limparExcesso((culturaMatch[1] || culturaMatch[2] || '').split(/ com | dose/i)[0], 30) : null;
        const dose = doseMatch ? limparExcesso(doseMatch[0], 60) : null;
        const resumo = `Aplicação: ${produto}${cultura ? ` em ${cultura}` : ''}${dose ? ` (${dose})` : ''}`.trim();
        return { tipo: 'aplicacao', data, resumo, dados: { produto, cultura, dose } };
    }

    if (/(estoque|comprei|chegou|restam|restou|sobrou|sobraram|tenho em estoque)/.test(n)) {
        const m = n.match(/(\d[\d.,]*)\s*([a-zà-ü]{1,12})?/);
        const quantidade = m ? parseNumeroBR(m[1]) : null;
        const unidade = m && m[2] ? m[2] : null;
        const item = limparExcesso(original.replace(/(registra:?|estoque|comprei|chegou|restam|restou|sobrou|sobraram|tenho em estoque)/gi, ' ').split(/\d/)[0], 70) || 'item';
        const resumo = `Estoque: ${item}${quantidade ? ` (${quantidade}${unidade ? ` ${unidade}` : ''})` : ''}`.trim();
        return { tipo: 'estoque', data, resumo, dados: { item, quantidade, unidade } };
    }

    if (/(colhi|colheita|vendi|venda)/.test(n)) {
        const m = n.match(/(\d[\d.,]*)\s*([a-zà-ü]{1,12})?/);
        const quantidade = m ? parseNumeroBR(m[1]) : null;
        const unidade = m && m[2] ? m[2] : null;
        const produto = limparExcesso(original.replace(/(registra:?|colhi|colheita|vendi|venda)/gi, ' ').split(/\d/)[0], 70) || 'produto';
        const resumo = `Colheita/venda: ${produto}${quantidade ? ` (${quantidade}${unidade ? ` ${unidade}` : ''})` : ''}`.trim();
        return { tipo: 'colheita', data, resumo, dados: { produto, quantidade, unidade } };
    }

    if (/(plantei|plantio|semeadura|semei)/.test(n)) {
        const m = n.match(/(\d[\d.,]*)\s*(ha|hectares?|alqueires?)/);
        const cultura = limparExcesso(original.replace(/(registra:?|plantei|plantio|semeadura|semei)/gi, ' ').split(/ em | de | com /i)[0], 50) || 'cultura';
        const area = m ? `${m[1]} ${m[2]}` : null;
        const resumo = `Plantio: ${cultura}${area ? ` (${area})` : ''}`.trim();
        return { tipo: 'plantio', data, resumo, dados: { cultura, area } };
    }

    return { tipo: 'observacao', data, resumo: limparExcesso(original, 120), dados: { texto: limparExcesso(original, 200) } };
}

export function salvarRegistroCampo(store = fieldStore, numero, texto, opcoes = {}) {
    if (!numero || !texto) return { ok: false, erro: 'Faltou número ou texto do registro.' };
    const parsed = parseRegistroCampo(texto, opcoes.hoje);
    if (!parsed) return { ok: false, erro: 'Não entendi o registro.' };
    if (opcoes.tipo) parsed.tipo = opcoes.tipo;
    if (opcoes.data) parsed.data = opcoes.data;
    const record = store.add({ numero, ...parsed });
    return { ok: true, registro: record };
}

export function listarRegistros(store = fieldStore, numero, dias = 30, hoje = new Date()) {
    const corte = addDaysStr(hojeStr(hoje), -Math.max(1, Number(dias) || 30));
    return store
        .list((r) => r.numero === numero && r.data >= corte)
        .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

export function resumirRegistros(records, dias = 7) {
    const porTipo = {};
    let litros = 0;
    let custos = 0;
    for (const r of records) {
        porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1;
        if (typeof r.dados?.litros === 'number') litros += r.dados.litros;
        if (typeof r.dados?.custo === 'number') custos += r.dados.custo;
    }
    return {
        periodo_dias: dias,
        total: records.length,
        por_tipo: porTipo,
        litros_totais: Math.round(litros * 100) / 100,
        custos_totais: Math.round(custos * 100) / 100,
        recentes: records.slice(0, 5)
    };
}

export function formatarResumo(resumo) {
    if (!resumo || resumo.total === 0) {
        return '📓 Caderno vazio nesse período. Manda "registra: abasteci 40 litros de diesel no trator" que eu anoto.';
    }
    const tipos = Object.entries(resumo.por_tipo).map(([k, v]) => `${k}: ${v}`).join(' • ');
    const linhas = resumo.recentes.map((r) => `- ${r.data} • ${r.resumo}`).join('\n');
    let texto = `*📓 Caderno (${resumo.periodo_dias}d): ${resumo.total} registros*\n${tipos}`;
    if (resumo.litros_totais) texto += `\n⛽ ${resumo.litros_totais} L abastecidos`;
    if (resumo.custos_totais) texto += `\n💸 R$ ${resumo.custos_totais} em manutenção`;
    texto += `\n\n${linhas}\n\nPara planilha, manda EXPORTAR CSV.`;
    return texto;
}

function csvEscape(v) {
    let s = String(v ?? '');
    // Anti formula-injection: célula que começa com = + - @ (ou tab/CR) vira
    // texto inofensivo no Excel/Sheets com apóstrofo inicial.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function registrosParaCSV(records) {
    const linhas = ['data;tipo;resumo;detalhes'];
    for (const r of records) {
        linhas.push([r.data, r.tipo, r.resumo, JSON.stringify(r.dados || {})].map(csvEscape).join(';'));
    }
    return linhas.join('\n');
}
