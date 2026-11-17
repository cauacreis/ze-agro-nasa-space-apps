import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SOLOS_CERRADO, CULTURAS_CERRADO, CANAIS_ESCOAMENTO_GOIAS, avaliarRotacaoNasa } from '../src/services/rotation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BASELINE_JSON = path.join(ROOT, 'src/data/nasa_goias_baseline.json');
const OUT_ROOT = path.join(ROOT, 'recursos-e-dados-nasa');
const OUT_CSV = path.join(OUT_ROOT, 'csv');
const OUT_JSON = path.join(OUT_ROOT, 'json');

function csvEscape(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '';
    let s = String(val);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(headers, rows) {
    const lines = [headers.join(';')];
    for (const row of rows) {
        lines.push(headers.map((h) => csvEscape(row[h])).join(';'));
    }
    return '\ufeff' + lines.join('\n') + '\n';
}

function writeOut(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Exporta todos os CSVs organizados e o JSON consolidado para `recursos-e-dados-nasa/`.
 */
export async function exportarRecursosNasa() {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_JSON, 'utf-8'));
    const municipiosLista = Object.values(baseline.municipios || {});

    // 1. Resumo por município (NASA POWER + Open-Meteo 14d)
    const resumoHeaders = [
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
    writeOut(
        path.join(OUT_CSV, 'nasa_power_resumo_municipios_goias.csv'),
        buildCsv(resumoHeaders, municipiosLista)
    );

    // 2. Série histórica diária (últimos 14 dias válidos NASA POWER por polo)
    const serieRows = [];
    for (const m of municipiosLista) {
        for (const d of m.serie_ultimos_14d || []) {
            serieRows.push({
                municipio_key: m.municipio_key,
                nome: m.nome,
                data: d.data,
                gwetroot: d.gwetroot,
                chuva_mm: d.chuva_mm,
                temp_max: d.temp_max
            });
        }
    }
    writeOut(
        path.join(OUT_CSV, 'nasa_power_serie_diaria_14d_goias.csv'),
        buildCsv(['municipio_key', 'nome', 'data', 'gwetroot', 'chuva_mm', 'temp_max'], serieRows)
    );

    // 3. Previsão diária dos próximos 14 dias (Open-Meteo FAO ET0)
    const prevRows = [];
    for (const m of municipiosLista) {
        for (const d of m.previsao_14d || []) {
            prevRows.push({
                municipio_key: m.municipio_key,
                nome: m.nome,
                data: d.data,
                temp_max: d.temp_max,
                temp_min: d.temp_min,
                chuva_mm: d.chuva_mm,
                prob_chuva_pct: d.prob_chuva_pct,
                et0_mm: d.et0_mm
            });
        }
    }
    writeOut(
        path.join(OUT_CSV, 'previsao_14d_open_meteo_goias.csv'),
        buildCsv(
            ['municipio_key', 'nome', 'data', 'temp_max', 'temp_min', 'chuva_mm', 'prob_chuva_pct', 'et0_mm'],
            prevRows
        )
    );

    // 4. Solos do Cerrado
    const solosLista = Object.values(SOLOS_CERRADO);
    writeOut(
        path.join(OUT_CSV, 'solos_cerrado_goias.csv'),
        buildCsv(['key', 'nome', 'cad_mm_cm', 'retencao_label', 'fator_agua', 'fator_compactacao', 'resumo'], solosLista)
    );

    // 5. Culturas e Plantas de Cobertura (Embrapa Cerrados)
    const culturasLista = Object.values(CULTURAS_CERRADO).map((c) => ({
        ...c,
        quebra_nematoides: c.quebra_nematoides ? 'sim' : 'nao',
        pragas_comuns: (c.pragas_comuns || []).join(' | ')
    }));
    writeOut(
        path.join(OUT_CSV, 'culturas_embrapa_cerrado.csv'),
        buildCsv(
            [
                'key',
                'nome',
                'familia',
                'papel',
                'ciclo_dias',
                'demanda_agua_mm',
                'tolerancia_seca',
                'tolerancia_calor',
                'fixa_nitrogenio_kg_ha',
                'aporte_palhada_t_ha',
                'profundidade_raiz_cm',
                'retorno_economico',
                'quebra_nematoides',
                'pragas_comuns'
            ],
            culturasLista
        )
    );

    // 6. Canais de escoamento e liquidez regional por polo de Goiás
    const escoamentoRows = Object.values(CANAIS_ESCOAMENTO_GOIAS).map((c) => ({
        municipio_key: c.municipio_key,
        nome: c.nome,
        corredor_rodoviario: c.corredor_rodoviario,
        distancia_media_entrega_km: c.distancia_media_entrega_km,
        compradores_principais: c.compradores_principais,
        escoamento_soja: c.canais_por_cultura?.soja || '',
        escoamento_milho: c.canais_por_cultura?.milho || '',
        escoamento_feijao: c.canais_por_cultura?.feijao || '',
        escoamento_sorgo: c.canais_por_cultura?.sorgo || '',
        escoamento_mandioca: c.canais_por_cultura?.mandioca || '',
        escoamento_gergelim: c.canais_por_cultura?.gergelim || '',
        escoamento_girassol: c.canais_por_cultura?.girassol || ''
    }));
    writeOut(
        path.join(OUT_CSV, 'canais_escoamento_polos_goias.csv'),
        buildCsv(
            [
                'municipio_key',
                'nome',
                'corredor_rodoviario',
                'distancia_media_entrega_km',
                'compradores_principais',
                'escoamento_soja',
                'escoamento_milho',
                'escoamento_feijao',
                'escoamento_sorgo',
                'escoamento_mandioca',
                'escoamento_gergelim',
                'escoamento_girassol'
            ],
            escoamentoRows
        )
    );

    // 7. JSON consolidado (solos + culturas + escoamento + resumo climático + simulações de referência)
    const [exRioVerde, exItaguaru] = await Promise.all([
        avaliarRotacaoNasa({ cidade: 'Rio Verde', cultura_anterior: 'soja', tipo_solo: 'arenoso_seco', prioridade: 'agua' }),
        avaliarRotacaoNasa({ cidade: 'Itaguaru', cultura_anterior: 'milho', tipo_solo: 'degradado_compactado', prioridade: 'solo' })
    ]);

    const catalogoJson = {
        atualizado_em: new Date().toISOString(),
        fontes: baseline.fontes,
        solos_cerrado: SOLOS_CERRADO,
        culturas_cerrado: CULTURAS_CERRADO,
        canais_escoamento_goias: CANAIS_ESCOAMENTO_GOIAS,
        resumo_municipios: municipiosLista.map(({ serie_ultimos_14d, previsao_14d, ...rest }) => rest),
        simulacoes_referencia: {
            rio_verde_soja_agua: exRioVerde,
            itaguaru_milho_solo: exItaguaru
        }
    };
    writeOut(
        path.join(OUT_JSON, 'catalogo_agronomico_cerrado.json'),
        JSON.stringify(catalogoJson, null, 2) + '\n'
    );

    return {
        csvDir: OUT_CSV,
        jsonDir: OUT_JSON,
        serieLinhas: serieRows.length,
        prevLinhas: prevRows.length,
        solos: solosLista.length,
        culturas: culturasLista.length,
        polosEscoamento: escoamentoRows.length
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    exportarRecursosNasa()
        .then((res) => {
            console.log('✅ Recursos CSV e JSON exportados com sucesso:');
            console.log(`   CSV:  ${res.csvDir} (série 14d: ${res.serieLinhas} linhas, previsão 14d: ${res.prevLinhas} linhas)`);
            console.log(`   JSON: ${res.jsonDir} (${res.solos} solos, ${res.culturas} culturas)`);
        })
        .catch((err) => {
            console.error('❌ Erro ao exportar recursos:', err);
            process.exit(1);
        });
}
