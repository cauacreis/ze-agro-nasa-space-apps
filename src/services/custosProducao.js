// Motor determinístico de Custos Reais de Produção, Maquinário/Diesel e Retorno Financeiro Estimado:
// - Preço REAL do óleo diesel por UF (combustivelapi.com.br — atualizado diariamente)
// - Coeficientes técnicos operacionais por cultura (horas de máquina, consumo diesel L/h, sementes/mudas, adubo, manejo)
// - Cruzamento determinístico com Produtividade IBGE PAM + Cotação física do dia (sem alucinação pelo LLM)
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIESEL_CACHE_PATH = path.resolve(__dirname, '../../data/diesel_cache.json');
const DIESEL_TTL_MS = 12 * 60 * 60 * 1000;
const DIESEL_FALLBACK_BR = 6.35;

function carregarDieselCache() {
    try {
        return JSON.parse(fs.readFileSync(DIESEL_CACHE_PATH, 'utf-8'));
    } catch {
        return null;
    }
}

function salvarDieselCache(obj) {
    try {
        fs.mkdirSync(path.dirname(DIESEL_CACHE_PATH), { recursive: true });
        fs.writeFileSync(DIESEL_CACHE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {}
}

function parseBrNum(v) {
    const n = Number.parseFloat(String(v || '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
}

export async function obterPrecoDieselPorUF(uf = 'GO', { timeoutMs = 4000, usarApi = true } = {}) {
    const sigla = String(uf || 'GO').toLowerCase().trim();
    const cache = carregarDieselCache();
    if (cache && cache.ts && Date.now() - cache.ts < DIESEL_TTL_MS && cache.precos) {
        const val = parseBrNum(cache.precos[sigla]) || parseBrNum(cache.precos.br) || DIESEL_FALLBACK_BR;
        return {
            uf: sigla.toUpperCase(),
            preco_litro: val,
            data_coleta: cache.data_coleta || '',
            fonte: cache.fonte || 'CombustivelAPI (cache local)',
            estimado: false
        };
    }

    if (usarApi) {
        try {
            const r = await fetch('https://combustivelapi.com.br/api/precos', { signal: AbortSignal.timeout(timeoutMs) });
            if (r.ok) {
                const j = await r.json();
                const dieselMap = j?.precos?.diesel;
                if (dieselMap && typeof dieselMap === 'object') {
                    const payload = {
                        ts: Date.now(),
                        data_coleta: j.data_coleta || '',
                        fonte: 'CombustivelAPI / ANP',
                        precos: dieselMap
                    };
                    salvarDieselCache(payload);
                    const val = parseBrNum(dieselMap[sigla]) || parseBrNum(dieselMap.br) || DIESEL_FALLBACK_BR;
                    return {
                        uf: sigla.toUpperCase(),
                        preco_litro: val,
                        data_coleta: payload.data_coleta,
                        fonte: payload.fonte,
                        estimado: false
                    };
                }
            }
        } catch {}
    }

    const valFallback = (cache?.precos && (parseBrNum(cache.precos[sigla]) || parseBrNum(cache.precos.br))) || DIESEL_FALLBACK_BR;
    return {
        uf: sigla.toUpperCase(),
        preco_litro: valFallback,
        data_coleta: cache?.data_coleta || 'referência local',
        fonte: cache?.precos ? 'CombustivelAPI (último snapshot)' : 'referência média nacional estimada',
        estimado: !cache?.precos
    };
}

// Coeficientes operacionais médios por hectare (base técnica Embrapa/CONAB/mecanização Cerrado/Brasil):
// - diesel_litros_ha: consumo somado de preparo/plantio, pulverizações, tratos e colheita/carreta
// - horas_maquina_ha: soma de hora-trator + implementos + colheitadeira (sem contar combustível)
// - custo_hora_maquina_reais: manutenção, depreciação e operador por hora de conjunto mecanizado
export const COEFICIENTES_PRODUCAO_CULTURA = {
    soja: {
        nome: 'Soja',
        unidade_colheita: 'sc 60 kg',
        kg_por_unidade: 60,
        diesel_litros_ha: 58,
        horas_maquina_ha: 4.8,
        custo_hora_maquina_reais: 175,
        insumos_ha: { semente_muda: 680, fertilizante_corretivo: 1450, defensivo_manejo: 1120, servicos_outros: 260 },
        retorno_texto: 'Só fecha bem em área rotacionada e com controle firme de ferrugem e percevejo.'
    },
    milho: {
        nome: 'Milho',
        unidade_colheita: 'sc 60 kg',
        kg_por_unidade: 60,
        diesel_litros_ha: 64,
        horas_maquina_ha: 5.1,
        custo_hora_maquina_reais: 170,
        insumos_ha: { semente_muda: 840, fertilizante_corretivo: 1580, defensivo_manejo: 720, servicos_outros: 240 },
        retorno_texto: 'Exige mais adubo e semente cara — compensa quando há umidade firme e controle de cigarrinha/lagarta.'
    },
    sorgo: {
        nome: 'Sorgo Granífero',
        unidade_colheita: 'sc 60 kg',
        kg_por_unidade: 60,
        diesel_litros_ha: 44,
        horas_maquina_ha: 3.6,
        custo_hora_maquina_reais: 155,
        insumos_ha: { semente_muda: 260, fertilizante_corretivo: 760, defensivo_manejo: 310, servicos_outros: 150 },
        retorno_texto: 'Custo 35% a 45% abaixo do milho safrinha, aguenta veranico e escoa bem pra ração/confinamento.'
    },
    feijao: {
        nome: 'Feijão',
        unidade_colheita: 'sc 60 kg',
        kg_por_unidade: 60,
        diesel_litros_ha: 54,
        horas_maquina_ha: 4.6,
        custo_hora_maquina_reais: 160,
        insumos_ha: { semente_muda: 560, fertilizante_corretivo: 1080, defensivo_manejo: 780, servicos_outros: 260 },
        retorno_texto: 'Ciclo rápido (< 90d) gira caixa cedo, mas pede vigília forte contra mosca-branca e fungos.'
    },
    gergelim: {
        nome: 'Gergelim',
        unidade_colheita: 'kg',
        kg_por_unidade: 1,
        diesel_litros_ha: 34,
        horas_maquina_ha: 2.9,
        custo_hora_maquina_reais: 145,
        insumos_ha: { semente_muda: 110, fertilizante_corretivo: 490, defensivo_manejo: 260, servicos_outros: 180 },
        retorno_texto: 'Baixo desembolso inicial, tolerante a calor e com saída direta para cerealistas.'
    },
    girassol: {
        nome: 'Girassol',
        unidade_colheita: 'kg',
        kg_por_unidade: 1,
        diesel_litros_ha: 46,
        horas_maquina_ha: 3.7,
        custo_hora_maquina_reais: 155,
        insumos_ha: { semente_muda: 320, fertilizante_corretivo: 840, defensivo_manejo: 390, servicos_outros: 170 },
        retorno_texto: 'Raiz pivotante busca água no fundo e gera receita por óleo/silagem.'
    },
    braquiaria: {
        nome: 'Braquiária (Cobertura / Palhada)',
        unidade_colheita: 'benefício direto na área',
        kg_por_unidade: 1,
        diesel_litros_ha: 16,
        horas_maquina_ha: 1.4,
        custo_hora_maquina_reais: 135,
        insumos_ha: { semente_muda: 210, fertilizante_corretivo: 120, defensivo_manejo: 95, servicos_outros: 60 },
        retorno_texto: 'Retorna cortando fungicida, herbicida e risco de seca na safra principal (e rende pastejo se houver gado).'
    },
    crotalaria: {
        nome: 'Crotalária (Adubo Verde)',
        unidade_colheita: 'N biológico + quebra de nematoide',
        kg_por_unidade: 1,
        diesel_litros_ha: 18,
        horas_maquina_ha: 1.6,
        custo_hora_maquina_reais: 135,
        insumos_ha: { semente_muda: 310, fertilizante_corretivo: 110, defensivo_manejo: 80, servicos_outros: 70 },
        retorno_texto: 'Injeta nitrogênio biológico no solo e derruba nematoides reduzindo gasto com ureia e nematicida.'
    },
    mandioca: {
        nome: 'Mandioca',
        unidade_colheita: 't',
        kg_por_unidade: 1000,
        diesel_litros_ha: 68,
        horas_maquina_ha: 5.5,
        custo_hora_maquina_reais: 155,
        insumos_ha: { semente_muda: 650, fertilizante_corretivo: 780, defensivo_manejo: 340, servicos_outros: 950 },
        retorno_texto: 'Garante caixa resistente à estiagem vendendo raiz fresca ou para farinheira/fecularia.'
    },
    tomate: {
        nome: 'Tomate',
        unidade_colheita: 'cx 20 kg',
        kg_por_unidade: 20,
        diesel_litros_ha: 95,
        horas_maquina_ha: 9.0,
        custo_hora_maquina_reais: 165,
        insumos_ha: { semente_muda: 2900, fertilizante_corretivo: 4600, defensivo_manejo: 4200, servicos_outros: 3900 },
        retorno_texto: 'Alta margem potencial por caixa, mas exige irrigação, manejo semanal de pragas e comprador alinhado.'
    },
    pasto_fraco: {
        nome: 'Reforma de Pastagem',
        unidade_colheita: 'ganho de lotação',
        kg_por_unidade: 1,
        diesel_litros_ha: 26,
        horas_maquina_ha: 2.2,
        custo_hora_maquina_reais: 145,
        insumos_ha: { semente_muda: 260, fertilizante_corretivo: 360, defensivo_manejo: 120, servicos_outros: 80 },
        retorno_texto: 'Reforma bem feita dobra a lotação e devolve ganho de peso na seca.'
    },
    trigo: {
        nome: 'Trigo',
        unidade_colheita: 'sc 60 kg',
        kg_por_unidade: 60,
        diesel_litros_ha: 52,
        horas_maquina_ha: 4.3,
        custo_hora_maquina_reais: 165,
        insumos_ha: { semente_muda: 520, fertilizante_corretivo: 1220, defensivo_manejo: 780, servicos_outros: 200 },
        retorno_texto: 'Aproveita janela de inverno subtropical em sucessão após soja.'
    },
    arroz: {
        nome: 'Arroz Irrigado',
        unidade_colheita: 'sc 50 kg',
        kg_por_unidade: 50,
        diesel_litros_ha: 82,
        horas_maquina_ha: 6.4,
        custo_hora_maquina_reais: 175,
        insumos_ha: { semente_muda: 610, fertilizante_corretivo: 1420, defensivo_manejo: 980, servicos_outros: 850 },
        retorno_texto: 'Manejo intensivo de várzea/irrigação; rotacionar com soja ou azevém corta arroz-vermelho.'
    }
};

function ajusteFatoresSemente(culturaKey, tipoSementeKey = '') {
    const k = String(tipoSementeKey || '').toLowerCase();
    if (culturaKey === 'milho') {
        if (k === 'crioulo') return { sementeMult: 0.35, defensivoMult: 0.85, nota: 'Semente variedade/crioula reduz em ~65% o gasto com semente frente ao híbrido simples.' };
        if (k === 'hibrido_duplo') return { sementeMult: 0.72, defensivoMult: 0.95, nota: 'Híbrido duplo/triplo reduz desembolso inicial mantendo boa rusticidade.' };
    }
    if (culturaKey === 'soja') {
        if (k === 'convencional') return { sementeMult: 0.78, defensivoMult: 1.05, nota: 'Soja convencional economiza royalty de semente (atenção ao manejo de daninhas).' };
    }
    if (culturaKey === 'feijao') {
        if (k === 'caupi') return { sementeMult: 0.65, defensivoMult: 0.75, nota: 'Feijão-caupi reduz gasto com adubo/defensivo e suporta calor forte.' };
    }
    if (culturaKey === 'sorgo' && k === 'forrageiro') {
        return { sementeMult: 0.9, defensivoMult: 0.9, nota: 'Sorgo forrageiro entrega alto volume de silagem com custo por ha enxuto.' };
    }
    return { sementeMult: 1, defensivoMult: 1, nota: '' };
}

export async function calcularCustoDetalhadoCultivo({
    culturaKey = 'sorgo',
    uf = 'GO',
    soloKey = 'medio_cerrado',
    tipoSementeKey = '',
    sobrePalhada = true,
    areaHa = 1,
    ibgePam = null,
    cotacaoAgro = null,
    dieselInfo = null,
    usarApiDiesel = true
} = {}) {
    const coef = COEFICIENTES_PRODUCAO_CULTURA[culturaKey] || COEFICIENTES_PRODUCAO_CULTURA.sorgo;
    const diesel = dieselInfo || await obterPrecoDieselPorUF(uf, { usarApi: usarApiDiesel });
    const precoDiesel = diesel.preco_litro;

    // Plantio em solo compactado exige mais hora-máquina/diesel; plantio direto sobre palhada economiza gradeação
    const fatorSoloMaquina = soloKey === 'degradado_compactado'
        ? 1.18
        : (sobrePalhada && ['soja', 'milho', 'sorgo', 'feijao'].includes(culturaKey) ? 0.92 : 1.0);

    const dieselLitrosHa = Math.round(coef.diesel_litros_ha * fatorSoloMaquina * 10) / 10;
    const horasMaquinaHa = Math.round(coef.horas_maquina_ha * fatorSoloMaquina * 10) / 10;
    const dieselReaisHa = Math.round(dieselLitrosHa * precoDiesel);
    const operacaoHoraMaquinaHa = Math.round(horasMaquinaHa * coef.custo_hora_maquina_reais);
    const maquinarioTotalHa = dieselReaisHa + operacaoHoraMaquinaHa;

    const ajSemente = ajusteFatoresSemente(culturaKey, tipoSementeKey);
    const sementeHa = Math.round(coef.insumos_ha.semente_muda * ajSemente.sementeMult);
    const fertilizanteHa = Math.round(coef.insumos_ha.fertilizante_corretivo * (soloKey === 'degradado_compactado' ? 1.1 : 1));
    const defensivoHa = Math.round(coef.insumos_ha.defensivo_manejo * ajSemente.defensivoMult);
    const servicosHa = Math.round(coef.insumos_ha.servicos_outros);

    const insumosTotalHa = sementeHa + fertilizanteHa + defensivoHa + servicosHa;
    const coePorHa = maquinarioTotalHa + insumosTotalHa;
    const faixaCoeHa = [Math.round(coePorHa * 0.88), Math.round(coePorHa * 1.12)];

    // Cruzamento financeiro real quando há Produtividade IBGE PAM + Cotação ao vivo
    const prodInfo = ibgePam?.produtividade_por_key?.[culturaKey];
    let retornoReal = null;
    if (prodInfo?.kg_ha && cotacaoAgro?.preco_referencia && coef.kg_por_unidade >= 50) {
        const unidadesHa = Math.round((prodInfo.kg_ha / coef.kg_por_unidade) * 10) / 10;
        const precoUnidade = cotacaoAgro.preco_referencia;
        const receitaHa = Math.round(unidadesHa * precoUnidade);
        const margemHa = receitaHa - coePorHa;
        const pontoEquilibrioUnid = precoUnidade > 0 ? Math.round((coePorHa / precoUnidade) * 10) / 10 : null;
        retornoReal = {
            produtividade_unidades_ha: unidadesHa,
            unidade: coef.unidade_colheita,
            preco_unitario: precoUnidade,
            praca_cotacao: cotacaoAgro.praca_referencia?.praca || 'Indicador nacional',
            data_cotacao: cotacaoAgro.data,
            ano_ibge: ibgePam.ano_referencia,
            receita_bruta_ha: receitaHa,
            margem_operacional_ha: margemHa,
            ponto_equilibrio_unidades_ha: pontoEquilibrioUnid
        };
    }

    const ha = Math.max(0.1, Number(areaHa) || 1);
    return {
        cultura: coef.nome,
        uf: diesel.uf,
        diesel_preco_litro: precoDiesel,
        diesel_fonte: `${diesel.fonte}${diesel.data_coleta ? ` (${diesel.data_coleta})` : ''}`,
        maquinario: {
            horas_maquina_ha: horasMaquinaHa,
            diesel_litros_ha: dieselLitrosHa,
            diesel_reais_ha: dieselReaisHa,
            operacao_manutencao_ha: operacaoHoraMaquinaHa,
            total_maquinario_ha: maquinarioTotalHa
        },
        insumos: {
            sementes_mudas_ha: sementeHa,
            fertilizantes_corretivos_ha: fertilizanteHa,
            defensivos_manejo_ha: defensivoHa,
            servicos_outros_ha: servicosHa,
            total_insumos_ha: insumosTotalHa
        },
        coe_por_ha: coePorHa,
        faixa_coe_ha: faixaCoeHa,
        coe_area_total: Math.round(coePorHa * ha),
        nota_semente: ajSemente.nota || null,
        retorno_texto: coef.retorno_texto,
        retorno_financeiro_real: retornoReal
    };
}
