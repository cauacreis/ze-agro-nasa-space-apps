// Previsão do tempo via Open-Meteo (grátis, sem chave, confiável)
// Fallback: wttr.in. Cache em memória de 10 min por cidade.
const weatherCache = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutos

// Códigos WMO de tempo -> descrição em português
const WMO = {
    0: 'Céu limpo', 1: 'Predomínio de sol', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Neblina', 48: 'Neblina com geada',
    51: 'Garoa fraca', 53: 'Garoa', 55: 'Garoa forte',
    61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte',
    66: 'Chuva congelante', 67: 'Chuva congelante forte',
    71: 'Neve fraca', 73: 'Neve', 75: 'Neve forte',
    80: 'Pancadas de chuva fracas', 81: 'Pancadas de chuva', 82: 'Pancadas de chuva fortes',
    95: 'Trovoadas', 96: 'Trovoadas com granizo', 99: 'Trovoadas com granizo forte'
};

async function geocodificar(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Geocoding falhou: ${r.status}`);
    const j = await r.json();
    if (!j.results || j.results.length === 0) throw new Error('Cidade não encontrada');
    const g = j.results[0];
    return { lat: g.latitude, lon: g.longitude, nome: g.name, uf: g.admin1 || '' };
}

async function viaOpenMeteo(city) {
    const geo = await geocodificar(city);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
        `&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
        `&timezone=auto&forecast_days=7`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Open-Meteo falhou: ${r.status}`);
    const j = await r.json();

    const rotulosEspeciais = ['hoje', 'amanhã', 'depois de amanhã'];
    const previsaoDias = j.daily.time.map((data, i) => {
        const dataDia = new Date(data + 'T12:00:00');
        let rotulo = rotulosEspeciais[i];
        if (!rotulo) {
            rotulo = dataDia.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' });
        }
        return {
            dia: rotulo,
            data: data,
            minima: `${Math.round(j.daily.temperature_2m_min[i])}°C`,
            maxima: `${Math.round(j.daily.temperature_2m_max[i])}°C`,
            chanceDeChuvaMaxima: `${j.daily.precipitation_probability_max[i] ?? 0}%`,
            condicao: WMO[j.daily.weather_code[i]] || 'Tempo indefinido'
        };
    });

    const hoje = previsaoDias[0];
    const amanha = previsaoDias[1];

    return {
        cidade: geo.nome + (geo.uf ? ` (${geo.uf})` : ''),
        temperaturaAtual: `${Math.round(j.current.temperature_2m)}°C`,
        temperaturaMaximaHoje: hoje.maxima,
        temperaturaMinimaHoje: hoje.minima,
        chanceDeChuva: hoje.chanceDeChuvaMaxima,
        previsaoDias: previsaoDias,
        resumo: `A temperatura em ${geo.nome} é de ${Math.round(j.current.temperature_2m)}°C (máxima de ${hoje.maxima} e mínima de ${hoje.minima} hoje) com ${hoje.chanceDeChuvaMaxima} de chance de chuva. Amanhã: ${amanha.condicao}, de ${amanha.minima} a ${amanha.maxima}, com até ${amanha.chanceDeChuvaMaxima} de chance de chuva. Previsão completa de 7 dias disponível no campo previsaoDias.`
    };
}

// Reserva caso a Open-Meteo esteja fora
async function viaWttrIn(city) {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!response.ok) throw new Error(`Erro na API de clima: ${response.status}`);
    const data = await response.json();

    const currentTemp = data.current_condition[0].temp_C;
    const todayWeather = data.weather[0];
    const chanceOfRain = todayWeather.hourly[0].chanceofrain;

    const rotulos = ['hoje', 'amanhã', 'depois de amanhã'];
    const previsao3Dias = data.weather.slice(0, 3).map((dia, i) => {
        const chances = dia.hourly.map(h => parseInt(h.chanceofrain, 10) || 0);
        const chanceMaxima = Math.max(...chances);
        const meio = dia.hourly[Math.floor(dia.hourly.length / 2)];
        const condicao = meio?.weatherDesc?.[0]?.value || '';
        return {
            dia: rotulos[i],
            data: dia.date,
            minima: `${dia.mintempC}°C`,
            maxima: `${dia.maxtempC}°C`,
            chanceDeChuvaMaxima: `${chanceMaxima}%`,
            condicao: condicao
        };
    });

    const amanha = previsao3Dias[1];

    return {
        cidade: city,
        temperaturaAtual: `${currentTemp}°C`,
        temperaturaMaximaHoje: `${todayWeather.maxtempC}°C`,
        temperaturaMinimaHoje: `${todayWeather.mintempC}°C`,
        chanceDeChuva: `${chanceOfRain}%`,
        previsaoDias: previsao3Dias,
        resumo: `A temperatura em ${city} é de ${currentTemp}°C (máxima de ${todayWeather.maxtempC}°C e mínima de ${todayWeather.mintempC}°C hoje) com ${chanceOfRain}% de chance de chuva. Amanhã: ${amanha.condicao}, de ${amanha.minima} a ${amanha.maxima}, com até ${amanha.chanceDeChuvaMaxima} de chance de chuva.`
    };
}

export async function getWeatherAndRainRisk(city) {
    const key = city.trim().toLowerCase();
    const cached = weatherCache.get(key);
    if (cached && (Date.now() - cached.ts) < TTL_MS) {
        console.log(`Clima em cache para ${city} (TTL ${Math.round((TTL_MS - (Date.now() - cached.ts)) / 1000)}s)`);
        return cached.data;
    }

    try {
        let result;
        try {
            result = await viaOpenMeteo(city);
        } catch (ePrimaria) {
            console.warn(`Open-Meteo falhou para '${city}' (${ePrimaria.message}), tentando wttr.in...`);
            result = await viaWttrIn(city);
        }
        weatherCache.set(key, { ts: Date.now(), data: result });
        return result;
    } catch (error) {
        console.error("Erro ao buscar clima:", error.message);
        return {
            cidade: city,
            temperaturaAtual: "Desconhecida",
            chanceDeChuva: "Desconhecida",
            previsaoDias: [],
            resumo: "Não consegui obter a previsão do tempo no momento."
        };
    }
}
