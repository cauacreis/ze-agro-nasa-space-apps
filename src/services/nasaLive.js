// Cliente ao vivo de clima e solo superficial/raiz para todo o Brasil:
// - NASA POWER Agroclimatology API (GWETROOT, GWETTOP, PRECTOTCORR, T2M_MAX)
// - Open-Meteo Forecast 14 dias (precipitacao_mm, ET0 FAO, temperatura)
// Com cache em disco (data/nasa_live_cache.json, TTL 6h) e timeout seguro.
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_PATH = path.resolve(__dirname, '../../data/nasa_live_cache.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const UF_NOME_PARA_SIGLA = {
    'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM', 'bahia': 'BA',
    'ceara': 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES', 'goias': 'GO',
    'maranhao': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG',
    'para': 'PA', 'paraiba': 'PB', 'parana': 'PR', 'pernambuco': 'PE', 'piaui': 'PI',
    'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
    'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP',
    'sergipe': 'SE', 'tocantins': 'TO'
};

function normText(v = '') {
    return String(v || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function carregarCacheDisco() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

function salvarCacheDisco(cache) {
    try {
        fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    } catch {}
}

function formatYmd(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function parseUfFromQuery(rawCity = '') {
    const m = String(rawCity || '').match(/[-–/,\s]\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\s*$/i);
    if (!m) return { cleanName: String(rawCity || '').trim(), ufHint: '' };
    const cleanName = String(rawCity || '').slice(0, m.index).replace(/[-–/,\s]+$/, '').trim();
    return { cleanName: cleanName || String(rawCity || '').trim(), ufHint: m[1].toUpperCase() };
}

export function resolverSiglaUf(admin1 = '') {
    const n = normText(admin1);
    if (/^[a-z]{2}$/.test(n)) return n.toUpperCase();
    return UF_NOME_PARA_SIGLA[n] || '';
}

export async function geocodificarCidadeBrasil(cidade, { timeoutMs = 4500 } = {}) {
    const { cleanName, ufHint } = parseUfFromQuery(cidade);
    if (!cleanName) return null;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=6&language=pt&format=json&countryCode=BR`;
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`Geocoding HTTP ${r.status}`);
    const j = await r.json();
    const results = Array.isArray(j?.results) ? j.results : [];
    if (!results.length) return null;

    let chosen = results[0];
    if (ufHint) {
        const byUf = results.find((item) => resolverSiglaUf(item.admin1) === ufHint);
        if (byUf) chosen = byUf;
    }

    const uf = ufHint || resolverSiglaUf(chosen.admin1) || '';
    return {
        nome: chosen.name || cleanName,
        uf,
        lat: Number(chosen.latitude),
        lon: Number(chosen.longitude)
    };
}

async function fetchNasaPowerSerie(lat, lon, { timeoutMs = 5500 } = {}) {
    const hoje = new Date();
    const endDate = new Date(hoje.getTime() - 1 * 86400000);
    const startDate = new Date(hoje.getTime() - 40 * 86400000);
    const params = 'GWETROOT,GWETTOP,PRECTOTCORR,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN';
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=${formatYmd(startDate)}&end=${formatYmd(endDate)}&format=JSON`;

    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`NASA POWER HTTP ${r.status}`);
    const json = await r.json();
    const p = json?.properties?.parameter;
    if (!p?.GWETROOT) throw new Error('NASA POWER sem parâmetro GWETROOT');

    const datasValidas = Object.keys(p.GWETROOT)
        .filter((d) => Number(p.GWETROOT[d]) > -900)
        .sort();
    if (!datasValidas.length) throw new Error('NASA POWER sem leituras válidas nos últimos dias');

    const ultimos30 = datasValidas.slice(-30);
    const ultimaData = ultimos30[ultimos30.length - 1];
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const chuvas = ultimos30.map((d) => Number(p.PRECTOTCORR?.[d])).filter((v) => Number.isFinite(v) && v >= 0);
    const tmaxs = ultimos30.map((d) => Number(p.T2M_MAX?.[d])).filter((v) => Number.isFinite(v) && v > -100);
    const tmins = ultimos30.map((d) => Number(p.T2M_MIN?.[d])).filter((v) => Number.isFinite(v) && v > -100);
    const rads = ultimos30.map((d) => Number(p.ALLSKY_SFC_SW_DWN?.[d])).filter((v) => Number.isFinite(v) && v >= 0);

    const gwetrootAtual = Number(p.GWETROOT[ultimaData]);
    const gwettopRaw = Number(p.GWETTOP?.[ultimaData]);
    const gwettopAtual = Number.isFinite(gwettopRaw) && gwettopRaw > -900 ? gwettopRaw : gwetrootAtual;

    return {
        data_referencia_nasa: `${ultimaData.slice(0, 4)}-${ultimaData.slice(4, 6)}-${ultimaData.slice(6, 8)}`,
        dias_validos_nasa: ultimos30.length,
        gwetroot_atual: Math.round(gwetrootAtual * 100) / 100,
        gwettop_atual: Math.round(gwettopAtual * 100) / 100,
        chuva_30d_mm: Math.round(chuvas.reduce((a, b) => a + b, 0)),
        temp_max_media_30d: Math.round(avg(tmaxs) * 10) / 10,
        temp_min_media_30d: Math.round(avg(tmins) * 10) / 10,
        dias_calor_extremo_30d: tmaxs.filter((t) => t >= 34).length,
        radiacao_media: Math.round(avg(rads) * 10) / 10
    };
}

async function fetchOpenMeteo14d(lat, lon, { timeoutMs = 4500 } = {}) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=14`;
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`Open-Meteo 14d HTTP ${r.status}`);
    const j = await r.json();
    const d = j?.daily;
    if (!Array.isArray(d?.precipitation_sum) || !Array.isArray(d?.et0_fao_evapotranspiration)) {
        throw new Error('Open-Meteo sem série diária');
    }

    const chuvas = d.precipitation_sum.map((v) => Number(v) || 0);
    const et0s = d.et0_fao_evapotranspiration.map((v) => Number(v) || 0);
    const chuva14 = Math.round(chuvas.reduce((a, b) => a + b, 0));
    const et014 = Math.round(et0s.reduce((a, b) => a + b, 0));

    return {
        chuva_prevista_14d_mm: chuva14,
        et0_previsto_14d_mm: et014,
        balanco_hidrico_14d_mm: chuva14 - et014,
        dias_chuva_forte_14d: chuvas.filter((mm) => mm >= 20).length
    };
}

/**
 * Busca dados reais de solo/chuva/calor (NASA POWER + Open-Meteo 14d) para qualquer cidade do Brasil.
 * Retorna null silenciosamente se as APIs estiverem indisponíveis, permitindo fallback controlado.
 */
export async function obterDadosNasaAoVivo(cidade, { timeoutMs = 5500, usarCache = true } = {}) {
    const chave = normText(cidade);
    if (!chave) return null;

    if (usarCache) {
        const cache = carregarCacheDisco();
        const hit = cache[chave];
        if (hit && hit.ts && Date.now() - hit.ts < CACHE_TTL_MS && hit.dados) {
            return { ...hit.dados, from_cache: true };
        }
    }

    try {
        const geo = await geocodificarCidadeBrasil(cidade, { timeoutMs: Math.min(timeoutMs, 4000) });
        if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return null;

        const [nasaRes, omRes] = await Promise.allSettled([
            fetchNasaPowerSerie(geo.lat, geo.lon, { timeoutMs }),
            fetchOpenMeteo14d(geo.lat, geo.lon, { timeoutMs: Math.min(timeoutMs, 4500) })
        ]);

        if (nasaRes.status !== 'fulfilled' && omRes.status !== 'fulfilled') return null;

        const nasa = nasaRes.status === 'fulfilled' ? nasaRes.value : null;
        const om = omRes.status === 'fulfilled' ? omRes.value : null;
        if (!nasa && !om) return null;

        const dados = {
            nome: geo.nome,
            uf: geo.uf,
            lat: Math.round(geo.lat * 10000) / 10000,
            lon: Math.round(geo.lon * 10000) / 10000,
            ...(nasa || {
                data_referencia_nasa: new Date().toISOString().slice(0, 10),
                dias_validos_nasa: 0,
                gwetroot_atual: 0.5,
                gwettop_atual: 0.5,
                chuva_30d_mm: 0,
                temp_max_media_30d: 30,
                temp_min_media_30d: 20,
                dias_calor_extremo_30d: 0,
                radiacao_media: 18
            }),
            ...(om || {
                chuva_prevista_14d_mm: 0,
                et0_previsto_14d_mm: 0,
                balanco_hidrico_14d_mm: 0,
                dias_chuva_forte_14d: 0
            }),
            fonte_nasa_ao_vivo: Boolean(nasa),
            fonte_previsao_ao_vivo: Boolean(om)
        };

        if (usarCache) {
            const cache = carregarCacheDisco();
            cache[chave] = { ts: Date.now(), dados };
            salvarCacheDisco(cache);
        }

        return dados;
    } catch {
        return null;
    }
}
