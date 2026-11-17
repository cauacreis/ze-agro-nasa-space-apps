// Melhor janela de manejo com a previsão existente (sem inventar vento/umidade).
import { getWeatherAndRainRisk } from './weather.js';

function pct(v) {
    const n = parseInt(String(v || '').replace('%', ''), 10);
    return Number.isFinite(n) ? n : 0;
}

function temp(v) {
    const n = parseInt(String(v || '').replace('°C', ''), 10);
    return Number.isFinite(n) ? n : null;
}

function flags(condicao) {
    const c = String(condicao || '').toLowerCase();
    return {
        tempestade: /(trovoada|granizo|temporal|storm|hail|thunder)/.test(c),
        chuvaForte: /(chuva forte|pancadas de chuva fortes|heavy rain)/.test(c),
        chuva: /(chuva|garoa|pancada|rain|drizzle|shower)/.test(c),
        geada: /(geada|frost|neve|snow|congelante)/.test(c)
    };
}

function pontuarDia(dia, operacao) {
    const chance = pct(dia.chanceDeChuvaMaxima);
    const min = temp(dia.minima);
    const max = temp(dia.maxima);
    const f = flags(dia.condicao);
    let score = 100;
    const motivos = [];

    if (f.tempestade) {
        score -= 80;
        motivos.push('risco de tempestade/granizo');
    } else if (f.chuvaForte) {
        score -= 70;
        motivos.push('chuva forte prevista');
    }

    if (operacao === 'pulverizar') {
        if (chance >= 60) {
            score -= 60;
            motivos.push(`chuva alta (${chance}%) lava a calda`);
        } else if (chance >= 30) {
            score -= 30;
            motivos.push(`chuva moderada (${chance}%)`);
        }
        if (f.geada || (min !== null && min <= 5)) {
            score -= 10;
            motivos.push('frio/geada: aplica só com segurança');
        }
    } else if (operacao === 'plantar') {
        if (chance >= 80) {
            score -= 40;
            motivos.push('solo pode encharcar');
        } else if (chance >= 40) {
            score -= 10;
            motivos.push('chuva moderada ajuda, mas cuidado com encharco');
        }
        if (f.geada || (min !== null && min <= 5)) {
            score -= 50;
            motivos.push('risco de geada para muda nova');
        } else if (min !== null && min <= 8) {
            score -= 20;
            motivos.push('noite fria para muda nova');
        }
    } else if (operacao === 'colher') {
        if (chance >= 60) {
            score -= 70;
            motivos.push(`chuva alta (${chance}%) atrapalha colheita`);
        } else if (chance >= 30) {
            score -= 30;
            motivos.push(`chuva moderada (${chance}%)`);
        }
        if (f.geada || (min !== null && min <= 5)) {
            score -= 30;
            motivos.push('frio/geada pode queimar produto colhido');
        }
    } else if (operacao === 'irrigar') {
        if (chance >= 60) {
            score -= 50;
            motivos.push(`chuva alta (${chance}%): talvez nem precise irrigar`);
        } else if (chance >= 30) {
            score -= 20;
            motivos.push(`chuva moderada (${chance}%)`);
        } else {
            score += 10;
            motivos.push('tempo seco: irrigação rende');
        }
        if (max !== null && max >= 32) {
            score += 10;
            motivos.push('calor: planta pede água');
        }
    }

    return { score: Math.max(0, Math.min(120, score)), motivos };
}

export async function melhorJanela(cidade, operacao, dias = 7) {
    const ops = ['pulverizar', 'plantar', 'colher', 'irrigar'];
    if (!cidade) return { ok: false, erro: 'Me diz a cidade para eu olhar a previsão (ex: Itaguaru).' };
    if (!ops.includes(operacao)) return { ok: false, erro: 'Operação inválida: usa pulverizar, plantar, colher ou irrigar.' };
    const n = Math.max(1, Math.min(7, Number(dias) || 7));

    const clima = await getWeatherAndRainRisk(cidade);
    const lista = (clima.previsaoDias || []).slice(0, n);
    if (!lista.length) return { ok: false, erro: 'Não consegui a previsão agora. Tenta de novo em alguns minutos.' };

    const avaliados = lista.map((d) => ({ ...d, ...pontuarDia(d, operacao) })).sort((a, b) => b.score - a.score);
    const alertas = [];
    if (avaliados.some((d) => flags(d.condicao).tempestade)) alertas.push('Tem dia com tempestade/granizo na janela: não opera nesses dias.');
    if (avaliados.some((d) => (temp(d.minima) ?? 99) <= 5)) alertas.push('Tem mínima de frio/geada na janela: protege muda e produto sensível.');

    return { ok: true, cidade: clima.cidade || cidade, operacao, melhores: avaliados.slice(0, 3), alertas };
}

export function formatarJanela(r) {
    if (!r.ok) return r.erro;
    const verbo = { pulverizar: 'pulverizar', plantar: 'plantar', colher: 'colher', irrigar: 'irrigar' }[r.operacao];
    const linhas = r.melhores.map((d, i) => `${i + 1}. ${d.dia}: ${d.condicao}, ${d.minima}/${d.maxima}, chuva ${d.chanceDeChuvaMaxima}${d.motivos.length ? ` — ${d.motivos.join('; ')}` : ''}`).join('\n');
    let texto = `*🌦️ Melhor janela para ${verbo} (${r.cidade})*\n${linhas}`;
    if (r.alertas.length) texto += `\n⚠️ ${r.alertas.join(' ')}`;
    texto += `\n\nSem dado de vento/umidade aqui: na hora H, confirma no campo antes de ${verbo}.`;
    return texto;
}
