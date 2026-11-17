// Calcula a fase da lua atual (ciclo sinódico ~29,53 dias)
// Referência: Lua Nova de 06/01/2000 18:14 UTC
const SYNODIC = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14, 0);

export function getMoonPhase(date = new Date()) {
    const daysSinceRef = (date.getTime() - NEW_MOON_REF) / 86400000;
    const age = ((daysSinceRef % SYNODIC) + SYNODIC) % SYNODIC;

    let nome, emoji, orientacao;

    if (age < 1.85 || age >= SYNODIC - 1.85) {
        nome = 'Lua Nova';
        emoji = '🌑';
        orientacao = 'seiva concentrada nas raízes; época de preparar solo e plantar culturas de raiz';
    } else if (age < 5.54) {
        nome = 'Lua Crescente (início)';
        emoji = '🌒';
        orientacao = 'seiva começando a subir; bom para plantio de folhas e início de ciclo vegetativo';
    } else if (age < 9.23) {
        nome = 'Quarto Crescente';
        emoji = '🌓';
        orientacao = 'energia subindo forte; MELHOR período para plantio de folhas e frutos que crescem acima do solo';
    } else if (age < 12.92) {
        nome = 'Gibosa Crescente';
        emoji = '🌔';
        orientacao = 'seiva no topo; ótimo para plantio e enxertia';
    } else if (age < 16.61) {
        nome = 'Lua Cheia';
        emoji = '🌕';
        orientacao = 'máxima seiva nos frutos; excelente para COLHEITA; evitar mexer na raiz';
    } else if (age < 20.30) {
        nome = 'Gibosa Minguante';
        emoji = '🌖';
        orientacao = 'seiva descendo; bom para colheita de grãos e sementes';
    } else if (age < 23.99) {
        nome = 'Quarto Minguante';
        emoji = '🌗';
        orientacao = 'seiva descendo às raízes; ideal para podas, desbaste e controle de pragas/pragas do solo';
    } else {
        nome = 'Lua Minguante (fina)';
        emoji = '🌘';
        orientacao = 'época de tratos culturais no solo, adubação de cova e limpeza da área';
    }

    return { nome, emoji, idadeDias: Number(age.toFixed(1)), orientacao };
}

export function getTodayContext() {
    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const lua = getMoonPhase();
    return `CONTEXTO DE HOJE (${hoje}): Fase da lua atual: ${lua.emoji} ${lua.nome} (idade lunar: ${lua.idadeDias} dias). Interpretação popular: ${lua.orientacao}.`;
}
