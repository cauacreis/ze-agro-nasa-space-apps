import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SIGNALS_PATH = path.resolve(__dirname, '../data/community_signals.json');

function carregarArquivo() {
    try {
        const raw = fs.readFileSync(SIGNALS_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return { atualizado_em: new Date().toISOString(), regioes: {} };
    }
}

function salvarArquivo(data) {
    try {
        data.atualizado_em = new Date().toISOString();
        fs.writeFileSync(SIGNALS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Aviso ao salvar sinais regionais:', err.message);
    }
}

/**
 * Normaliza chaves de municípios para o formato padrão (ex.: "Rio Verde" -> "rio_verde").
 */
export function normalizarMunicipioKey(input) {
    const clean = String(input || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    if (clean.includes('rio_verde')) return 'rio_verde';
    if (clean.includes('jatai')) return 'jatai';
    if (clean.includes('cristalina')) return 'cristalina';
    if (clean.includes('itaguaru')) return 'itaguaru';
    if (clean.includes('anapolis')) return 'anapolis';
    if (clean.includes('goiania')) return 'goiania';
    return clean || 'rio_verde';
}

/**
 * Extrai chave canônica da cultura de entrada a partir do título do plano (ex.: "Sorgo Granífero → Crotalária → Soja" -> "sorgo").
 */
export function extrairCulturaEntradaSignal(planoTitulo = '') {
    const primeiraEtapa = String(planoTitulo || '').split('→')[0] || '';
    const clean = primeiraEtapa
        .replace(/\([^)]*\)/g, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (!clean) return '';
    if (clean.includes('braqui')) return 'braquiaria';
    if (clean.includes('gergelim')) return 'gergelim';
    if (clean.includes('crotal')) return 'crotalaria';
    if (clean.includes('sorgo')) return 'sorgo';
    if (clean.includes('girassol')) return 'girassol';
    if (clean.includes('feij')) return 'feijao';
    if (clean.includes('milho')) return 'milho';
    if (clean.includes('soja')) return 'soja';
    if (clean.includes('mandioc')) return 'mandioca';
    if (clean.includes('tomate')) return 'tomate';
    return clean.split(/\s+/)[0] || '';
}

/**
 * Calcula métricas agregadas de concentração regional para a trava anti-efeito manada (sem PII).
 */
export function calcularSaturacaoRegional(pulso) {
    const mapaPlanos = pulso?.planos_mais_buscados || {};
    const planos = {};
    const culturas = {};
    let totalPlanos = 0;

    for (const [titulo, rawCount] of Object.entries(mapaPlanos)) {
        const count = Number(rawCount) || 0;
        if (count <= 0) continue;
        totalPlanos += count;
    }

    let planoMaisConcentrado = null;
    for (const [titulo, rawCount] of Object.entries(mapaPlanos)) {
        const count = Number(rawCount) || 0;
        if (count <= 0) continue;
        const share = totalPlanos > 0 ? count / totalPlanos : 0;
        const entry = { titulo, count, share, pct: Math.round(share * 100) };
        planos[titulo] = entry;
        if (!planoMaisConcentrado || entry.count > planoMaisConcentrado.count) {
            planoMaisConcentrado = entry;
        }
        const culturaKey = extrairCulturaEntradaSignal(titulo);
        if (culturaKey) {
            culturas[culturaKey] = {
                key: culturaKey,
                count: (culturas[culturaKey]?.count || 0) + count,
                share: 0,
                pct: 0
            };
        }
    }

    let culturaMaisConcentrada = null;
    for (const cEntry of Object.values(culturas)) {
        cEntry.share = totalPlanos > 0 ? cEntry.count / totalPlanos : 0;
        cEntry.pct = Math.round(cEntry.share * 100);
        if (!culturaMaisConcentrada || cEntry.count > culturaMaisConcentrada.count) {
            culturaMaisConcentrada = cEntry;
        }
    }

    const ativa = totalPlanos >= 3;
    const temConcentracao = ativa && (
        (planoMaisConcentrado?.share || 0) >= 0.35
        || (culturaMaisConcentrada?.share || 0) >= 0.45
    );

    return {
        ativa,
        tem_concentracao: temConcentracao,
        total_consultas_planos: totalPlanos,
        planos,
        culturas,
        plano_mais_concentrado: planoMaisConcentrado,
        cultura_mais_concentrada: culturaMaisConcentrada
    };
}

/**
 * Retorna o pulso agregado da microrregião, sem qualquer dado pessoal.
 */
export function obterPulsoRegional(municipioKey) {
    const key = normalizarMunicipioKey(municipioKey);
    const db = carregarArquivo();
    const regiao = db.regioes?.[key];

    if (!regiao) {
        return {
            municipio_key: key,
            municipio: key,
            culturas_em_alta: ['Soja', 'Milho', 'Braquiária'],
            alerta_fitossanitario: 'Acompanhar pressão regional de pragas de solo e evitar repetição da mesma cultura.',
            tendencia_solo_agua: 'Produtores buscando maior cobertura vegetal para conservar água no perfil do solo.',
            total_relatos_regiao: 0,
            planos_mais_buscados: {},
            culturas_recomendadas: {}
        };
    }

    return {
        municipio_key: key,
        ...regiao
    };
}

export function enriquecerPulsoComIBGE(pulso, ibgePam) {
    if (!ibgePam || !Array.isArray(ibgePam.culturas_dominantes) || !ibgePam.culturas_dominantes.length) {
        return pulso;
    }
    const culturasReais = ibgePam.culturas_dominantes
        .slice(0, 4)
        .map((c) => c.nome_curto);

    return {
        ...pulso,
        municipio: ibgePam.municipio ? `${ibgePam.municipio}${ibgePam.uf ? ` - ${ibgePam.uf}` : ''}` : pulso.municipio,
        codigo_ibge: ibgePam.codigo_ibge || null,
        ano_ibge_pam: ibgePam.ano_referencia || null,
        total_area_ibge_ha: ibgePam.total_area_ha || null,
        culturas_em_alta: culturasReais,
        alerta_fitossanitario: ibgePam.alerta_fitossanitario_ibge || pulso.alerta_fitossanitario,
        tendencia_solo_agua: `Dados oficiais IBGE PAM (${ibgePam.ano_referencia || 'último censo anual'}): ${ibgePam.culturas_dominantes.slice(0, 3).map((c) => `${c.nome_curto} (${c.share_pct}%)`).join(', ')}.`,
        fonte_pulso_oficial: 'IBGE SIDRA PAM (5457) + sinais locais da plataforma'
    };
}

/**
 * Registra apenas contadores agregados da consulta (sem telefone, nome ou JID).
 */
export function registrarSinalAnonimo({ municipioKey, culturaAnterior, prioridade, planoEscolhido }) {
    const key = normalizarMunicipioKey(municipioKey);
    const db = carregarArquivo();
    if (!db.regioes) db.regioes = {};

    const atual = db.regioes[key] || {
        municipio: key,
        culturas_em_alta: [],
        alerta_fitossanitario: 'Evitar plantio sucessivo da mesma família botânica.',
        tendencia_solo_agua: 'Monitoramento regional de conservação de água e cobertura de solo.',
        total_relatos_regiao: 0,
        contagem_prioridades: { agua: 0, solo: 0, renda: 0, pragas: 0 },
        planos_mais_buscados: {},
        culturas_recomendadas: {}
    };

    atual.total_relatos_regiao = (atual.total_relatos_regiao || 0) + 1;

    if (prioridade) {
        if (!atual.contagem_prioridades) atual.contagem_prioridades = {};
        atual.contagem_prioridades[prioridade] = (atual.contagem_prioridades[prioridade] || 0) + 1;
    }

    if (planoEscolhido) {
        if (!atual.planos_mais_buscados) atual.planos_mais_buscados = {};
        atual.planos_mais_buscados[planoEscolhido] = (atual.planos_mais_buscados[planoEscolhido] || 0) + 1;

        const entradaKey = extrairCulturaEntradaSignal(planoEscolhido);
        if (entradaKey) {
            if (!atual.culturas_recomendadas) atual.culturas_recomendadas = {};
            atual.culturas_recomendadas[entradaKey] = (atual.culturas_recomendadas[entradaKey] || 0) + 1;
        }
    }

    if (culturaAnterior) {
        const formatada = String(culturaAnterior).trim();
        if (formatada && !atual.culturas_em_alta.includes(formatada)) {
            atual.culturas_em_alta = [formatada, ...atual.culturas_em_alta].slice(0, 4);
        }
    }

    db.regioes[key] = atual;
    salvarArquivo(db);
    return obterPulsoRegional(key);
}
