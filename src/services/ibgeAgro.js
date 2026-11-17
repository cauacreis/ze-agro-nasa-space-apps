// Cliente oficial do IBGE para municípios (5.570 do Brasil / 246 de Goiás) e Produção Agrícola Municipal (SIDRA PAM 5457).
// Cache persistente em disco (data/ibge_municipios_cache.json e data/ibge_pam_cache.json) para velocidade e economia de rede.
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { geocodificarCidadeBrasil } from './nasaLive.js';

dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MUN_CACHE_PATH = path.resolve(__dirname, '../../data/ibge_municipios_cache.json');
const PAM_CACHE_PATH = path.resolve(__dirname, '../../data/ibge_pam_cache.json');

const MUN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PAM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function norm(v = '') {
    return String(v || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function lerJson(p) {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch {
        return {};
    }
}

function salvarJson(p, obj) {
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {}
}

function normalizarCulturaIbgeKey(nomeIbge = '') {
    const n = norm(nomeIbge);
    if (n.includes('soja')) return 'soja';
    if (n.includes('milho')) return 'milho';
    if (n.includes('feijao')) return 'feijao';
    if (n.includes('sorgo')) return 'sorgo';
    if (n.includes('mandioca')) return 'mandioca';
    if (n.includes('tomate')) return 'tomate';
    if (n.includes('cana')) return 'cana';
    if (n.includes('cafe')) return 'cafe';
    if (n.includes('arroz')) return 'arroz';
    if (n.includes('trigo')) return 'trigo';
    if (n.includes('algodao')) return 'algodao';
    if (n.includes('girassol')) return 'girassol';
    if (n.includes('banana')) return 'banana';
    if (n.includes('laranja') || n.includes('limao') || n.includes('tangerina')) return 'citros';
    if (n.includes('castanha de caju') || n.includes('caju')) return 'caju';
    if (n.includes('amendoim')) return 'amendoim';
    if (n.includes('batata')) return 'batata';
    if (n.includes('melancia')) return 'melancia';
    if (n.includes('cebola')) return 'cebola';
    return n.split('(')[0].trim().replace(/\s+/g, '_');
}

export async function listarMunicipiosPorUF(uf = 'GO', { timeoutMs = 4500 } = {}) {
    const sigla = String(uf || 'GO').toUpperCase().trim();
    if (!/^[A-Z]{2}$/.test(sigla)) return [];

    const cache = lerJson(MUN_CACHE_PATH);
    const hit = cache[sigla];
    if (hit && hit.ts && Date.now() - hit.ts < MUN_TTL_MS && Array.isArray(hit.lista) && hit.lista.length) {
        return hit.lista;
    }

    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios`, {
        signal: AbortSignal.timeout(timeoutMs)
    });
    if (!r.ok) throw new Error(`IBGE municípios HTTP ${r.status}`);
    const bruto = await r.json();
    const lista = (Array.isArray(bruto) ? bruto : []).map((m) => ({
        codigo_ibge: String(m.id),
        nome: m.nome,
        uf: sigla,
        microrregiao: m.microrregiao?.nome || '',
        mesorregiao: m.microrregiao?.mesorregiao?.nome || ''
    }));

    cache[sigla] = { ts: Date.now(), lista };
    salvarJson(MUN_CACHE_PATH, cache);
    return lista;
}

export async function resolverMunicipioIBGE(cidade, ufPreferida = '', { timeoutMs = 4500 } = {}) {
    if (!cidade) return null;
    try {
        let nomeBusca = String(cidade || '').trim();
        let uf = String(ufPreferida || '').toUpperCase();
        let lat = null;
        let lon = null;

        const mUf = nomeBusca.match(/[-–/,\s]\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\s*$/i);
        if (mUf) {
            uf = mUf[1].toUpperCase();
            nomeBusca = nomeBusca.slice(0, mUf.index).replace(/[-–/,\s]+$/, '').trim();
        }

        if (!uf) {
            const geo = await geocodificarCidadeBrasil(cidade, { timeoutMs }).catch(() => null);
            if (geo) {
                nomeBusca = geo.nome || nomeBusca;
                uf = geo.uf || '';
                lat = geo.lat;
                lon = geo.lon;
            }
        }
        if (!uf) uf = 'GO';

        const lista = await listarMunicipiosPorUF(uf, { timeoutMs });
        const alvo = norm(nomeBusca);
        const match = lista.find((m) => norm(m.nome) === alvo)
            || lista.find((m) => norm(m.nome).startsWith(alvo))
            || lista.find((m) => norm(m.nome).includes(alvo));

        if (!match) return null;
        return { ...match, lat, lon };
    } catch {
        return null;
    }
}

export async function consultarPamPorCodigoIBGE(codigoIbge, nomeCidade = '', uf = '', { timeoutMs = 5000 } = {}) {
    const id = String(codigoIbge || '').replace(/\D/g, '');
    if (!id) return null;

    const cache = lerJson(PAM_CACHE_PATH);
    const hit = cache[id];
    if (hit && hit.ts && Date.now() - hit.ts < PAM_TTL_MS && hit.dados) {
        return { ...hit.dados, from_cache: true };
    }

    const url = `https://servicodados.ibge.gov.br/api/v3/agregados/5457/periodos/-1/variaveis/216|112?localidades=N6[${id}]&classificacao=782[all]`;
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`IBGE PAM HTTP ${r.status}`);
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return null;

    const varArea = data.find((v) => String(v.id) === '216')?.resultados || [];
    const varProd = data.find((v) => String(v.id) === '112')?.resultados || [];

    const mapaProd = {};
    for (const item of varProd) {
        const catObj = item?.classificacoes?.[0]?.categoria || {};
        const catId = Object.keys(catObj)[0];
        const serie = item?.series?.[0]?.serie || {};
        const val = Number(Object.values(serie)[0]);
        if (catId && Number.isFinite(val) && val > 0) {
            mapaProd[catId] = val;
        }
    }

    let anoRef = '';
    const itens = [];
    for (const item of varArea) {
        const catObj = item?.classificacoes?.[0]?.categoria || {};
        const catId = Object.keys(catObj)[0];
        const nomeBruto = Object.values(catObj)[0] || '';
        const serie = item?.series?.[0]?.serie || {};
        anoRef = anoRef || Object.keys(serie)[0] || '';
        const areaHa = Number(Object.values(serie)[0]);
        if (!nomeBruto || /total/i.test(nomeBruto) || !Number.isFinite(areaHa) || areaHa <= 0) continue;

        itens.push({
            id_ibge_cultura: catId,
            key: normalizarCulturaIbgeKey(nomeBruto),
            nome_ibge: nomeBruto,
            nome_curto: nomeBruto.replace(/\s*\([^)]+\)/g, '').trim(),
            area_ha: areaHa,
            produtividade_kg_ha: mapaProd[catId] || null
        });
    }

    const totalArea = itens.reduce((s, i) => s + i.area_ha, 0);
    const ordenadas = itens
        .sort((a, b) => b.area_ha - a.area_ha)
        .map((i) => ({
            ...i,
            share_pct: totalArea > 0 ? Math.round((i.area_ha / totalArea) * 100) : 0
        }));

    const top1 = ordenadas[0];
    const top2 = ordenadas[1];
    const dominanciaTop2 = (top1?.share_pct || 0) + (top2?.share_pct || 0);
    const alertaDinamico = top1
        ? (dominanciaTop2 >= 75
            ? `Pelo IBGE PAM (${anoRef || 'último ciclo'}), ${top1.nome_curto}${top2 ? ` e ${top2.nome_curto}` : ''} somam ${dominanciaTop2}% da área colhida em ${nomeCidade || 'município'} — alta pressão por repetição de família botânica e concentração de frete.`
            : `Cultura líder no município pelo IBGE PAM (${anoRef || 'último ciclo'}): ${top1.nome_curto} (${top1.share_pct}% da área agrícola).`)
        : 'Diversificar culturas ajuda a cortar pragas de solo e proteger liquidez regional.';

    const dados = {
        codigo_ibge: id,
        municipio: nomeCidade,
        uf,
        ano_referencia: anoRef,
        total_area_ha: totalArea,
        culturas_dominantes: ordenadas,
        produtividade_por_key: Object.fromEntries(
            ordenadas
                .filter((x) => x.produtividade_kg_ha)
                .map((x) => [x.key, { kg_ha: x.produtividade_kg_ha, sacas_60kg_ha: Math.round((x.produtividade_kg_ha / 60) * 10) / 10, area_ha: x.area_ha }])
        ),
        alerta_fitossanitario_ibge: alertaDinamico
    };

    cache[id] = { ts: Date.now(), dados };
    salvarJson(PAM_CACHE_PATH, cache);
    return dados;
}

export async function obterDadosAgricolasMunicipioIBGE(cidade, ufPreferida = '', { timeoutMs = 5000 } = {}) {
    try {
        const mun = await resolverMunicipioIBGE(cidade, ufPreferida, { timeoutMs });
        if (!mun?.codigo_ibge) return null;
        const pam = await consultarPamPorCodigoIBGE(mun.codigo_ibge, mun.nome, mun.uf, { timeoutMs });
        if (!pam) return { ...mun, culturas_dominantes: [], produtividade_por_key: {} };
        return { ...mun, ...pam };
    } catch {
        return null;
    }
}
