import cron from 'node-cron';
import { listarUsuariosProativos } from './database.js';
import { lembretesParaDigest, aplicarDigestLembretes } from './reminders.js';
import { contasParaDigest, fmtBRL } from './finance.js';
import { getWeatherAndRainRisk } from './weather.js';
import { getMoonPhase } from './moon.js';
import { getActiveSock } from './whatsapp.js';
import { garantirIdiomaSaida } from './ai.js';
import { IDIOMA_PADRAO, idiomaPadraoPorNumero } from '../config/i18n.js';

// Gera dica operacional dinâmica a partir da previsão real do dia/semana e cultura do produtor
export function gerarDicaOperacionalDoDia({ weather = {}, selectedCrop = '' } = {}) {
    const criaGado = Boolean(selectedCrop && /gad|boi|vac|leit|pecu|bezer|past/i.test(selectedCrop));
    const dias = Array.isArray(weather?.previsaoDias) ? weather.previsaoDias : [];
    const hojeDia = dias[0];
    const chanceHoje = parseInt(String(hojeDia?.chanceDeChuvaMaxima || weather?.chanceDeChuva || '0').replace('%', ''), 10) || 0;
    const maxHoje = parseInt(String(hojeDia?.maxima || weather?.temperaturaMaximaHoje || '0').replace('°C', ''), 10);
    const minHoje = parseInt(String(hojeDia?.minima || weather?.temperaturaMinimaHoje || '99').replace('°C', ''), 10);
    const chances3d = dias.slice(0, 3).map((d) => parseInt(String(d.chanceDeChuvaMaxima || '0').replace('%', ''), 10) || 0);
    const diasUmidosSeguidos = chances3d.filter((c) => c >= 55).length >= 2;

    if (criaGado) {
        if (!Number.isNaN(maxHoje) && maxHoje >= 32) {
            return `Com máxima de ${maxHoje}°C hoje, garante água fresca no bebedouro e sombra pro lote — vaca leiteira bebe até 100 litros por dia no calor forte.`;
        }
        if (chanceHoje >= 60) {
            return `Chuva forte prevista (${chanceHoje}%): evita mexer no curral pesado pra não atolar e confere se o sal mineral está coberto sem empedrar.`;
        }
        if (diasUmidosSeguidos) {
            return `Sequência de dias úmidos favorece carrapato e verminose: aproveita a passagem no manejo pra inspecionar entre pernas e orelhas do rebanho.`;
        }
        return `Tempo mais firme hoje (${chanceHoje}% de chuva): ótima janela para rodar cerca, revisar cocho e ajustar a lotação dos piquetes.`;
    }

    if (!Number.isNaN(minHoje) && minHoje <= 6) {
        return `Mínima baixa de ${minHoje}°C: protege mudas sensíveis, segura irrigação para depois da geada e evita transplante nas primeiras horas.`;
    }
    if (chanceHoje >= 65) {
        return `Com ${chanceHoje}% de chuva hoje, evita pulverização pra não lavar calda e prioriza checar drenagem ou curvas de nível na área.`;
    }
    if (diasUmidosSeguidos) {
        return `Dois ou mais dias úmidos seguidos aumentam pressão de fungos: dá uma volta nas folhas baixeiras cedo pra pegar foco no começo.`;
    }
    if (!Number.isNaN(maxHoje) && maxHoje >= 32 && chanceHoje < 30) {
        return `Calor previsto de ${maxHoje}°C com pouca chuva (${chanceHoje}%): concentra pulverizações e irrigação bem cedinho ou no fim da tarde pra render mais.`;
    }
    return `Janela firme hoje (${chanceHoje}% de chuva${!Number.isNaN(maxHoje) ? `, máx. ${maxHoje}°C` : ''}): bom momento pra regulagem de plantadeira/pulverizador e vistoria rápida de pragas no começo da manhã.`;
}

export function startBroadcast() {
    cron.schedule('0 6 * * *', async () => {
        const sock = getActiveSock();
        if (!sock) {
            console.log('📣 Broadcast: WhatsApp ainda não conectado, pulando.');
            return;
        }

        try {
            const users = await listarUsuariosProativos();
            if (users.length === 0) {
                console.log('📣 Broadcast matinal: nenhum usuário com opt-in hoje.');
                return;
            }

            console.log(`📣 Broadcast matinal para ${users.length} usuário(s)...`);
            const lua = getMoonPhase();

            for (const user of users) {
                try {
                    const weather = await getWeatherAndRainRisk(user.city);
                    const dica = gerarDicaOperacionalDoDia({ weather, selectedCrop: user.selected_crop });
                    const cultura = user.selected_crop && user.selected_crop !== 'indefinido'
                        ? `Pra tua ${user.selected_crop}: ${dica} `
                        : `${dica} `;

                    // Alerta de chuva de amanhã (decisão clássica: pulverizar hoje ou amanhã?)
                    const dias = weather.previsaoDias || [];
                    const amanha = dias[1];
                    let alertaAmanha = '';
                    if (amanha) {
                        const chance = parseInt(amanha.chanceDeChuvaMaxima, 10) || 0;
                        if (chance >= 60) {
                            alertaAmanha = `⚠️ Amanhã aperta: ${amanha.chanceDeChuvaMaxima} de chuva (${amanha.condicao}). Se for pulverizar, corre hoje! `;
                        } else if (chance >= 30) {
                            alertaAmanha = `Amanhã tem ${amanha.chanceDeChuvaMaxima} de chance de chuva. `;
                        } else {
                            alertaAmanha = `Amanhã segue seco (${amanha.chanceDeChuvaMaxima} de chuva). `;
                        }
                    }

                    // Alerta de GEADA (mínima ≤5°C nos próximos 2 dias)
                    let alertaGeada = '';
                    for (const d of dias.slice(0, 2)) {
                        const min = parseInt((d.minima || '').replace('°C', ''), 10);
                        if (!isNaN(min) && min <= 5) {
                            alertaGeada = `🥶 ALERTA DE FRIO: mínima de ${d.minima} ${d.dia} — protege mudas e hortaliças, molha o solo no fim da tarde e cobre o que der! `;
                            break;
                        }
                    }

                    // Alerta de VERANICO (3 dias seguidos com <30% de chuva)
                    let alertaVeranico = '';
                    if (dias.length >= 3) {
                        const chances = dias.slice(0, 3).map(d => parseInt((d.chanceDeChuvaMaxima || '').replace('%', ''), 10) || 0);
                        if (chances.every(c => c < 30)) {
                            alertaVeranico = `🏜️ Seca vindo: 3 dias seguidos sem chuva boa — se tiver irrigação, programa; se não, rega as mudas de manhãzinha. `;
                        }
                    }

                    const texto = `☀️ Bom dia! Toque do Zé Agro pra ${user.city}: ${weather.temperaturaAtual} e ${weather.chanceDeChuva} de chance de chuva. ${alertaAmanha}${alertaGeada}${alertaVeranico}${lua.emoji} Lua ${lua.nome} — ${lua.orientacao}. ${cultura}`;

                    // Digest operacional opt-in: lembretes do dia + contas próximas (sem spam)
                    const hojeDigest = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                    let lembretes = [];
                    let opsTexto = '';
                    try {
                        lembretes = lembretesParaDigest(undefined, user.whatsapp_number, hojeDigest);
                        if (lembretes.length > 0) {
                            const top = lembretes.slice(0, 2).map((l) => l.texto).join(' • ');
                            opsTexto += `⏰ Lembretes: ${top}${lembretes.length > 2 ? ` (+${lembretes.length - 2})` : ''} `;
                        }
                    } catch (e) {
                        console.error(`Digest de lembretes falhou para ${user.whatsapp_number}:`, e.message);
                    }
                    try {
                        const contas = contasParaDigest(undefined, user.whatsapp_number, hojeDigest, 7);
                        if (contas.length > 0) {
                            const top = contas.slice(0, 2).map((c) => `${c.descricao} ${fmtBRL(c.valor)}`).join(' • ');
                            opsTexto += `💵 Contas: ${top}${contas.length > 2 ? ` (+${contas.length - 2})` : ''} `;
                        }
                    } catch (e) {
                        console.error(`Digest de contas falhou para ${user.whatsapp_number}:`, e.message);
                    }

                    let textoFinal = `${texto}${opsTexto}Pra parar os avisos, manda PARAR AVISO.`;
                    const idiomaUser = user.language || idiomaPadraoPorNumero(user.whatsapp_number) || IDIOMA_PADRAO;
                    if (idiomaUser !== IDIOMA_PADRAO) {
                        textoFinal = await garantirIdiomaSaida(textoFinal, idiomaUser, { registro: 'neutro_direto' });
                    }

                    const jid = `${user.whatsapp_number}@s.whatsapp.net`;
                    await sock.sendMessage(jid, { text: textoFinal });
                    if (lembretes.length > 0) {
                        aplicarDigestLembretes(undefined, lembretes, hojeDigest);
                    }
                    console.log(`✅ Aviso enviado para ${user.whatsapp_number} (${user.city})`);
                } catch (e) {
                    console.error(`Falha ao enviar aviso para ${user.whatsapp_number}:`, e.message);
                }

                // Espaça os envios para não parecer spam pro WhatsApp
                await new Promise(r => setTimeout(r, 8000));
            }
        } catch (e) {
            console.error('Erro no broadcast matinal:', e);
        }
    }, { timezone: 'America/Sao_Paulo' });

    console.log('⏰ Aviso matinal do Zé Agro agendado para 06:00 (America/Sao_Paulo)');
}
