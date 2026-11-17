import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../src/data');

export const POLOS_GOIAS = [
    {
        key: 'rio_verde',
        nome: 'Rio Verde',
        uf: 'GO',
        microrregiao: 'Sudoeste Goiano',
        lat: -17.7923,
        lon: -50.9192,
        solo_predominante: 'Latossolo Vermelho Argiloso',
        solo_key_padrao: 'argiloso_fertil'
    },
    {
        key: 'jatai',
        nome: 'Jataí',
        uf: 'GO',
        microrregiao: 'Sudoeste Goiano',
        lat: -17.8814,
        lon: -51.7144,
        solo_predominante: 'Latossolo Vermelho Argiloso',
        solo_key_padrao: 'argiloso_fertil'
    },
    {
        key: 'cristalina',
        nome: 'Cristalina',
        uf: 'GO',
        microrregiao: 'Entorno do DF / Leste Goiano',
        lat: -16.7686,
        lon: -47.6136,
        solo_predominante: 'Latossolo Vermelho-Amarelo',
        solo_key_padrao: 'medio_cerrado'
    },
    {
        key: 'itaguaru',
        nome: 'Itaguaru',
        uf: 'GO',
        microrregiao: 'Anápolis / Centro Goiano',
        lat: -15.7589,
        lon: -49.6033,
        solo_predominante: 'Cambissolo / Argissolo',
        solo_key_padrao: 'medio_cerrado'
    },
    {
        key: 'anapolis',
        nome: 'Anápolis',
        uf: 'GO',
        microrregiao: 'Centro Goiano',
        lat: -16.3281,
        lon: -48.9530,
        solo_predominante: 'Latossolo Vermelho-Amarelo',
        solo_key_padrao: 'medio_cerrado'
    },
    {
        key: 'goiania',
        nome: 'Goiânia',
        uf: 'GO',
        microrregiao: 'Metropolitana de Goiânia',
        lat: -16.6869,
        lon: -49.2648,
        solo_predominante: 'Latossolo Vermelho',
        solo_key_padrao: 'argiloso_fertil'
    }
];

function round(val, decimals = 1) {
    const f = 10 ** decimals;
    return Math.round(val * f) / f;
}

function fmtPowerDate(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function powerToIso(yyyymmdd) {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function validEntries(seriesObj, lastN = 30) {
    return Object.entries(seriesObj || {})
        .filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v > -900)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-lastN);
}

/**
 * Busca observações agroclimatológicas dos últimos ~45 dias na NASA POWER API
 * e calcula métricas dos últimos 30 dias válidos.
 */
async function fetchNasaPower(polo) {
    const hoje = new Date();
    const inicio = new Date(hoje.getTime() - 45 * 86400000);
    const params = 'PRECTOTCORR,T2M_MAX,T2M_MIN,GWETTOP,GWETROOT,ALLSKY_SFC_SW_DWN';
    const url =
        `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}` +
        `&community=AG&longitude=${polo.lon}&latitude=${polo.lat}` +
        `&start=${fmtPowerDate(inicio)}&end=${fmtPowerDate(hoje)}&format=JSON`;

    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
        throw new Error(`NASA POWER HTTP ${res.status} para ${polo.nome}`);
    }
    const json = await res.json();
    const p = json?.properties?.parameter;
    if (!p || !p.GWETROOT) {
        throw new Error(`Resposta NASA POWER incompleta para ${polo.nome}`);
    }

    const rootSeries = validEntries(p.GWETROOT, 30);
    const topSeries = validEntries(p.GWETTOP, 30);
    const rainSeries = validEntries(p.PRECTOTCORR, 30);
    const tmaxSeries = validEntries(p.T2M_MAX, 30);
    const tminSeries = validEntries(p.T2M_MIN, 30);
    const radSeries = validEntries(p.ALLSKY_SFC_SW_DWN, 30);

    if (!rootSeries.length || !rainSeries.length || !tmaxSeries.length) {
        throw new Error(`Sem dias válidos suficientes na NASA POWER para ${polo.nome}`);
    }

    const [ultimaDataRaw, gwetrootAtual] = rootSeries[rootSeries.length - 1];
    const gwettopAtual = topSeries.length ? topSeries[topSeries.length - 1][1] : gwetrootAtual;

    const chuva30d = rainSeries.reduce((acc, [, v]) => acc + v, 0);
    const tmaxMedia = tmaxSeries.reduce((acc, [, v]) => acc + v, 0) / tmaxSeries.length;
    const tminMedia = tminSeries.length
        ? tminSeries.reduce((acc, [, v]) => acc + v, 0) / tminSeries.length
        : null;
    const diasCalorExtremo = tmaxSeries.filter(([, v]) => v >= 34).length;
    const radiacaoMedia = radSeries.length
        ? radSeries.reduce((acc, [, v]) => acc + v, 0) / radSeries.length
        : null;

    const rootMap = new Map(rootSeries);
    const rainMap = new Map(rainSeries);
    const tmaxMap = new Map(tmaxSeries);
    const serieUltimos14d = rootSeries.slice(-14).map(([d]) => ({
        data: powerToIso(d),
        gwetroot: round(rootMap.get(d), 2),
        chuva_mm: round(rainMap.get(d) ?? 0, 1),
        temp_max: round(tmaxMap.get(d) ?? 0, 1)
    }));

    return {
        data_referencia_nasa: powerToIso(ultimaDataRaw),
        dias_validos_nasa: rootSeries.length,
        gwetroot_atual: round(gwetrootAtual, 2),
        gwettop_atual: round(gwettopAtual, 2),
        chuva_30d_mm: round(chuva30d, 1),
        temp_max_media_30d: round(tmaxMedia, 1),
        temp_min_media_30d: tminMedia !== null ? round(tminMedia, 1) : null,
        dias_calor_extremo_30d: diasCalorExtremo,
        radiacao_media: radiacaoMedia !== null ? round(radiacaoMedia, 1) : null,
        serie_ultimos_14d: serieUltimos14d
    };
}

/**
 * Busca previsão diária para 14 dias na Open-Meteo (chuva, temperatura e ET0 FAO).
 */
async function fetchOpenMeteo14d(polo) {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${polo.lat}&longitude=${polo.lon}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration` +
        `&timezone=auto&forecast_days=14`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status} para ${polo.nome}`);
    }
    const json = await res.json();
    const d = json?.daily;
    if (!d || !Array.isArray(d.time) || !d.time.length) {
        throw new Error(`Previsão Open-Meteo vazia para ${polo.nome}`);
    }

    const previsaoDias = d.time.map((data, i) => ({
        data,
        temp_max: round(d.temperature_2m_max[i] ?? 0, 1),
        temp_min: round(d.temperature_2m_min[i] ?? 0, 1),
        chuva_mm: round(d.precipitation_sum[i] ?? 0, 1),
        prob_chuva_pct: Math.round(d.precipitation_probability_max[i] ?? 0),
        et0_mm: round(d.et0_fao_evapotranspiration[i] ?? 0, 1)
    }));

    const chuvaPrevista = previsaoDias.reduce((acc, x) => acc + x.chuva_mm, 0);
    const et0Previsto = previsaoDias.reduce((acc, x) => acc + x.et0_mm, 0);
    const diasChuvaForte = previsaoDias.filter((x) => x.chuva_mm >= 25).length;
    const tempMaxPrevista = Math.max(...previsaoDias.map((x) => x.temp_max));

    return {
        chuva_prevista_14d_mm: round(chuvaPrevista, 1),
        et0_previsto_14d_mm: round(et0Previsto, 1),
        balanco_hidrico_14d_mm: round(chuvaPrevista - et0Previsto, 1),
        dias_chuva_forte_14d: diasChuvaForte,
        temp_max_prevista_14d: round(tempMaxPrevista, 1),
        previsao_14d: previsaoDias
    };
}

function toCsv(records) {
    const headers = [
        'municipio_key',
        'nome',
        'uf',
        'microrregiao',
        'lat',
        'lon',
        'solo_predominante',
        'data_referencia_nasa',
        'gwetroot_atual',
        'gwettop_atual',
        'chuva_30d_mm',
        'temp_max_media_30d',
        'temp_min_media_30d',
        'dias_calor_extremo_30d',
        'radiacao_media',
        'chuva_prevista_14d_mm',
        'et0_previsto_14d_mm',
        'balanco_hidrico_14d_mm',
        'dias_chuva_forte_14d'
    ];
    const rows = [headers.join(';')];
    for (const r of records) {
        rows.push(
            headers
                .map((h) => {
                    const val = r[h] ?? '';
                    const str = String(val);
                    return str.includes(';') ? `"${str}"` : str;
                })
                .join(';')
        );
    }
    return rows.join('\n') + '\n';
}

/**
 * Executa a coleta completa de todos os polos de Goiás e salva JSON + CSV.
 */
export async function coletarDadosGoias() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const municipios = {};
    const lista = [];

    for (const polo of POLOS_GOIAS) {
        const [nasa, meteo] = await Promise.all([
            fetchNasaPower(polo),
            fetchOpenMeteo14d(polo)
        ]);

        const registro = {
            municipio_key: polo.key,
            ...polo,
            ...nasa,
            ...meteo
        };
        municipios[polo.key] = registro;
        lista.push(registro);
    }

    const payload = {
        atualizado_em: new Date().toISOString(),
        fontes: {
            nasa: 'NASA POWER Agroclimatology API (community=AG)',
            previsao: 'Open-Meteo 14-day FAO ET0 Forecast'
        },
        municipios
    };

    const jsonPath = path.join(DATA_DIR, 'nasa_goias_baseline.json');
    const csvPath = path.join(DATA_DIR, 'nasa_goias_baseline.csv');
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
    fs.writeFileSync(csvPath, toCsv(lista), 'utf-8');

    return { jsonPath, csvPath, total: lista.length, payload };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    coletarDadosGoias()
        .then(({ jsonPath, csvPath, total, payload }) => {
            console.log(`✅ Baseline NASA + Clima gerado para ${total} municípios de Goiás:`);
            console.log(`   JSON: ${jsonPath}`);
            console.log(`   CSV:  ${csvPath}`);
            for (const m of Object.values(payload.municipios)) {
                console.log(
                    `   - ${m.nome}: GWETROOT=${m.gwetroot_atual} (${m.data_referencia_nasa}), ` +
                    `Chuva30d=${m.chuva_30d_mm}mm, Prev14d=${m.chuva_prevista_14d_mm}mm, ` +
                    `Balanço14d=${m.balanco_hidrico_14d_mm}mm`
                );
            }
        })
        .catch((err) => {
            console.error('❌ Erro ao coletar dados NASA:', err);
            process.exit(1);
        });
}
