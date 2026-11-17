import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizarMunicipioKey, obterPulsoRegional, calcularSaturacaoRegional, enriquecerPulsoComIBGE } from './communitySignals.js';
import { obterDadosNasaAoVivo } from './nasaLive.js';
import { obterDadosAgricolasMunicipioIBGE } from './ibgeAgro.js';
import { consultarCotacaoAgro } from './market.js';
import { calcularCustoDetalhadoCultivo, obterPrecoDieselPorUF } from './custosProducao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASELINE_PATH = path.resolve(__dirname, '../data/nasa_goias_baseline.json');

export const SOLOS_CERRADO = {
    argiloso_fertil: {
        key: 'argiloso_fertil',
        nome: 'Terra Argilosa Boa (Latossolo)',
        cad_mm_cm: 1.4,
        retencao_label: 'Alta retenção de água',
        fator_agua: 1.0,
        fator_compactacao: 0.75,
        resumo: 'Segura bem a umidade na raiz, mas compacta fácil se repetir a mesma raiz.'
    },
    medio_cerrado: {
        key: 'medio_cerrado',
        nome: 'Terra Mista de Cerrado',
        cad_mm_cm: 1.0,
        retencao_label: 'Retenção média de água',
        fator_agua: 0.85,
        fator_compactacao: 0.65,
        resumo: 'Equilibrada para grãos, mas perde umidade rápido sem cobertura de palhada.'
    },
    arenoso_seco: {
        key: 'arenoso_seco',
        nome: 'Terra Arenosa (Seca Rápido)',
        cad_mm_cm: 0.6,
        retencao_label: 'Baixa retenção de água',
        fator_agua: 0.65,
        fator_compactacao: 0.35,
        resumo: 'Esquenta e seca rápido nos veranicos; exige raiz profunda e palhada contínua.'
    },
    degradado_compactado: {
        key: 'degradado_compactado',
        nome: 'Terra Cansada / Sem Palhada',
        cad_mm_cm: 0.75,
        retencao_label: 'Baixa infiltração no solo',
        fator_agua: 0.68,
        fator_compactacao: 0.95,
        resumo: 'Pouca matéria orgânica e camada dura; precisa de descompactação biológica e nitrogênio.'
    }
};

export const CULTURAS_CERRADO = {
    soja: {
        key: 'soja',
        nome: 'Soja',
        familia: 'leguminosa',
        papel: 'Comercial (proteína / renda)',
        ciclo_dias: 115,
        demanda_agua_mm: 550,
        tolerancia_seca: 3,
        tolerancia_calor: 3,
        fixa_nitrogenio_kg_ha: 90,
        aporte_palhada_t_ha: 2.5,
        profundidade_raiz_cm: 45,
        retorno_economico: 5,
        quebra_nematoides: false,
        pragas_comuns: ['Ferrugem-asiática', 'Percevejo-marrom', 'Nematoides']
    },
    milho: {
        key: 'milho',
        nome: 'Milho',
        familia: 'graminea',
        papel: 'Comercial + boa palhada',
        ciclo_dias: 125,
        demanda_agua_mm: 580,
        tolerancia_seca: 3,
        tolerancia_calor: 3,
        fixa_nitrogenio_kg_ha: -45,
        aporte_palhada_t_ha: 6.5,
        profundidade_raiz_cm: 75,
        retorno_economico: 4,
        quebra_nematoides: false,
        pragas_comuns: ['Cigarrinha-do-milho', 'Lagarta-do-cartucho']
    },
    feijao: {
        key: 'feijao',
        nome: 'Feijão',
        familia: 'leguminosa',
        papel: 'Comercial ciclo curto',
        ciclo_dias: 85,
        demanda_agua_mm: 360,
        tolerancia_seca: 3,
        tolerancia_calor: 2,
        fixa_nitrogenio_kg_ha: 45,
        aporte_palhada_t_ha: 2.0,
        profundidade_raiz_cm: 35,
        retorno_economico: 4,
        quebra_nematoides: false,
        pragas_comuns: ['Mosca-branca', 'Mofo-branco', 'Antracnose']
    },
    sorgo: {
        key: 'sorgo',
        nome: 'Sorgo Granífero',
        familia: 'graminea',
        papel: 'Comercial rústico anti-seca',
        ciclo_dias: 105,
        demanda_agua_mm: 380,
        tolerancia_seca: 5,
        tolerancia_calor: 5,
        fixa_nitrogenio_kg_ha: -25,
        aporte_palhada_t_ha: 7.5,
        profundidade_raiz_cm: 110,
        retorno_economico: 3,
        quebra_nematoides: true,
        pragas_comuns: ['Pulgão-do-sorgo']
    },
    mandioca: {
        key: 'mandioca',
        nome: 'Mandioca',
        familia: 'euforbiacea',
        papel: 'Comercial rústica / segurança alimentar',
        ciclo_dias: 300,
        demanda_agua_mm: 520,
        tolerancia_seca: 5,
        tolerancia_calor: 5,
        fixa_nitrogenio_kg_ha: -30,
        aporte_palhada_t_ha: 4.0,
        profundidade_raiz_cm: 90,
        retorno_economico: 4,
        quebra_nematoides: true,
        pragas_comuns: ['Mandarová', 'Ácaro-verde']
    },
    tomate: {
        key: 'tomate',
        nome: 'Tomate',
        familia: 'solanacea',
        papel: 'Hortaliça de alto valor',
        ciclo_dias: 110,
        demanda_agua_mm: 500,
        tolerancia_seca: 1,
        tolerancia_calor: 2,
        fixa_nitrogenio_kg_ha: -50,
        aporte_palhada_t_ha: 1.5,
        profundidade_raiz_cm: 40,
        retorno_economico: 5,
        quebra_nematoides: false,
        pragas_comuns: ['Traça-do-tomateiro', 'Mosca-branca', 'Requeima']
    },
    pasto_fraco: {
        key: 'pasto_fraco',
        nome: 'Pasto Fraco / Degradado',
        familia: 'graminea',
        papel: 'Área em reforma',
        ciclo_dias: 180,
        demanda_agua_mm: 400,
        tolerancia_seca: 3,
        tolerancia_calor: 4,
        fixa_nitrogenio_kg_ha: -20,
        aporte_palhada_t_ha: 2.0,
        profundidade_raiz_cm: 50,
        retorno_economico: 2,
        quebra_nematoides: false,
        pragas_comuns: ['Cigarrinha-das-pastagens', 'Compactação superficial']
    },
    braquiaria: {
        key: 'braquiaria',
        nome: 'Braquiária (Cobertura / Palhada)',
        familia: 'graminea',
        papel: 'Cobertura e descompactação',
        ciclo_dias: 90,
        demanda_agua_mm: 300,
        tolerancia_seca: 5,
        tolerancia_calor: 5,
        fixa_nitrogenio_kg_ha: 0,
        aporte_palhada_t_ha: 9.0,
        profundidade_raiz_cm: 160,
        retorno_economico: 2,
        quebra_nematoides: true,
        pragas_comuns: ['Baixo risco em rotação curta']
    },
    crotalaria: {
        key: 'crotalaria',
        nome: 'Crotalária (Adubo Verde)',
        familia: 'leguminosa',
        papel: 'Fixação de nitrogênio e controle de nematoides',
        ciclo_dias: 75,
        demanda_agua_mm: 280,
        tolerancia_seca: 4,
        tolerancia_calor: 5,
        fixa_nitrogenio_kg_ha: 110,
        aporte_palhada_t_ha: 5.5,
        profundidade_raiz_cm: 130,
        retorno_economico: 2,
        quebra_nematoides: true,
        pragas_comuns: ['Supressora de nematoides de solo']
    },
    girassol: {
        key: 'girassol',
        nome: 'Girassol',
        familia: 'asteracea',
        papel: 'Ciclagem de nutrientes e quebra de família',
        ciclo_dias: 100,
        demanda_agua_mm: 380,
        tolerancia_seca: 4,
        tolerancia_calor: 4,
        fixa_nitrogenio_kg_ha: -20,
        aporte_palhada_t_ha: 4.5,
        profundidade_raiz_cm: 140,
        retorno_economico: 3,
        quebra_nematoides: false,
        pragas_comuns: ['Mancha-de-alternária']
    },
    gergelim: {
        key: 'gergelim',
        nome: 'Gergelim',
        familia: 'pedaliacea',
        papel: 'Comercial muito tolerante à seca e calor',
        ciclo_dias: 95,
        demanda_agua_mm: 310,
        tolerancia_seca: 5,
        tolerancia_calor: 5,
        fixa_nitrogenio_kg_ha: -15,
        aporte_palhada_t_ha: 3.0,
        profundidade_raiz_cm: 100,
        retorno_economico: 4,
        quebra_nematoides: true,
        pragas_comuns: ['Baixa incidência de pragas no Cerrado']
    }
};

// Sequências validadas pela pesquisa agronômica do Cerrado (Embrapa / Plantio Direto)
const PLANOS_CANDIDATOS = [
    {
        id: 'soja_sorgo_crotalaria',
        titulo: 'Sorgo Granífero → Crotalária → Soja',
        etapas: ['sorgo', 'crotalaria', 'soja'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Cobertura)', '3ª Etapa (Próxima Safra)'],
        foco: 'Segura umidade em clima quente, produz muita palhada e limpa nematoides antes da soja.'
    },
    {
        id: 'milho_braquiaria_soja',
        titulo: 'Milho → Braquiária (Cobertura) → Soja',
        etapas: ['milho', 'braquiaria', 'soja'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Cobertura Viva)', '3ª Etapa (Próxima Safra)'],
        foco: 'Cria tapete espesso de palhada com raízes profundas que reduzem a evaporação do solo.'
    },
    {
        id: 'feijao_sorgo_mandioca',
        titulo: 'Feijão Curto → Sorgo Granífero → Braquiária',
        etapas: ['feijao', 'sorgo', 'braquiaria'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Sucessão)', '3ª Etapa (Proteção)'],
        foco: 'Entrada rápida de caixa com ciclo curto de feijão seguida de palhada rústica de sorgo e braquiária.'
    },
    {
        id: 'gergelim_braquiaria_feijao',
        titulo: 'Gergelim → Braquiária → Feijão',
        etapas: ['gergelim', 'braquiaria', 'feijao'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Cobertura)', '3ª Etapa (Próxima Safra)'],
        foco: 'Alternativa rentável para pouca chuva e calor forte, quebrando pragas de soja, milho e tomate.'
    },
    {
        id: 'crotalaria_mandioca_feijao',
        titulo: 'Crotalária (Adubo Verde) → Mandioca → Feijão',
        etapas: ['crotalaria', 'mandioca', 'feijao'],
        rotulos: ['1ª Etapa (Recuperação)', '2ª Etapa (Safra Principal)', '3ª Etapa (Sucessão)'],
        foco: 'Reconstrói terra cansada com nitrogênio natural antes de plantar cultura rústica de longa duração.'
    },
    {
        id: 'sorgo_feijao_girassol',
        titulo: 'Sorgo Granífero → Feijão → Girassol',
        etapas: ['sorgo', 'feijao', 'girassol'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Sucessão)', '3ª Etapa (Diversificação)'],
        foco: 'Alterna três famílias botânicas distintas, puxa água em camadas fundas e corta doenças de solo.'
    },
    {
        id: 'braquiaria_soja_milho',
        titulo: 'Braquiária (Palhada) → Soja → Milho',
        etapas: ['braquiaria', 'soja', 'milho'],
        rotulos: ['1ª Etapa (Proteção)', '2ª Etapa (Safra Principal)', '3ª Etapa (Safrinha)'],
        foco: 'Ideal para terra compactada ou com calor extremo: primeiro cobre e abre canais no solo, depois colhe alto.'
    },
    {
        id: 'crotalaria_milho_soja',
        titulo: 'Crotalária → Milho → Soja',
        etapas: ['crotalaria', 'milho', 'soja'],
        rotulos: ['1ª Etapa (Adubação Verde)', '2ª Etapa (Safra)', '3ª Etapa (Próxima Safra)'],
        foco: 'Injeta até 110 kg/ha de nitrogênio biológico que reduz gasto com adubo químico no milho seguinte.'
    },
    {
        id: 'girassol_crotalaria_feijao',
        titulo: 'Girassol → Crotalária → Feijão',
        etapas: ['girassol', 'crotalaria', 'feijao'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Adubo Verde)', '3ª Etapa (Comercial)'],
        foco: 'Excelente para quebrar ciclos severos de mosca-branca e pragas de hortaliças como tomate.'
    },
    {
        id: 'feijao_crotalaria_milho',
        titulo: 'Feijão → Crotalária → Milho',
        etapas: ['feijao', 'crotalaria', 'milho'],
        rotulos: ['1ª Etapa (Agora)', '2ª Etapa (Cobertura)', '3ª Etapa (Próxima Safra)'],
        foco: 'Equilibra retorno rápido no feijão com recuperação biológica antes da lavoura de milho.'
    }
];

// Canais reais de escoamento, liquidez regional e corredores logísticos por polo de Goiás
export const CANAIS_ESCOAMENTO_GOIAS = {
    rio_verde: {
        municipio_key: 'rio_verde',
        nome: 'Rio Verde',
        corredor_rodoviario: 'BR-060 / BR-452 (Polo Agroindustrial Sudoeste)',
        distancia_media_entrega_km: 28,
        compradores_principais: 'Cooperativas (COMIGO), esmagadoras, confinamentos e usinas de etanol de milho',
        canais_por_cultura: {
            soja: 'Cooperativas locais (COMIGO), tradings na BR-060 e esmagadoras de óleo/farelo.',
            milho: 'Usinas de etanol de milho, fábricas de ração avícola/suína e cooperativas locais.',
            feijao: 'Empacotadoras do Sudoeste Goiano e atacado regional via BR-060 rumo a Goiânia/DF.',
            sorgo: 'Confinamentos bovinos, granjas integradas de aves/suínos e fábricas de ração do polo.',
            mandioca: 'Feiras regionais, agroindústrias de farinha/polvilho e atacado do Sudoeste.',
            gergelim: 'Cerealistas exportadoras no corredor BR-060/BR-364 e processadoras de grãos.',
            girassol: 'Esmagadoras regionais de óleo vegetal, fábricas de ração e sementeiras.',
            tomate: 'Indústrias de polpa do eixo GO/DF e centrais de abastecimento via BR-060.'
        }
    },
    jatai: {
        municipio_key: 'jatai',
        nome: 'Jataí',
        corredor_rodoviario: 'BR-364 / BR-158 (Corredor Sudoeste–Ferrovia Norte-Sul)',
        distancia_media_entrega_km: 35,
        compradores_principais: 'Armazéns graneleiros, usinas de etanol de milho, confinamentos e tradings',
        canais_por_cultura: {
            soja: 'Armazéns graneleiros na BR-364, tradings e terminal multimodal Ferrovia Norte-Sul (Rio Verde/São Simão).',
            milho: 'Usinas de etanol de milho na região e fábricas de ração animal do Sudoeste.',
            feijao: 'Beneficiadoras de grãos de Jataí/Rio Verde e atacado interestadual pela BR-364.',
            sorgo: 'Confinamentos de gado de corte e indústrias de ração animal no eixo BR-364/BR-158.',
            mandioca: 'Agroindústrias locais de farinha e abastecimento direto ao varejo regional.',
            gergelim: 'Tradings exportadoras de grãos especiais e cerealistas do Sudoeste Goiano.',
            girassol: 'Unidades de extração de óleo e suplementação proteica para pecuária intensiva.',
            tomate: 'Atacado regional e CEASA-GO por carga fracionada via BR-060/BR-364.'
        }
    },
    cristalina: {
        municipio_key: 'cristalina',
        nome: 'Cristalina',
        corredor_rodoviario: 'BR-040 / BR-050 (Eixo Brasília–Sudeste)',
        distancia_media_entrega_km: 25,
        compradores_principais: 'Beneficiadoras de feijão/sementes, agroindústrias de processados e atacado do DF',
        canais_por_cultura: {
            soja: 'Cooperativas do Entorno/Cristalina, sementeiras certificadas e esmagadoras pela BR-040.',
            milho: 'Indústrias de alimentos, granjas do DF/Entorno e cooperativas locais (COACIL).',
            feijao: 'Beneficiadoras e empacotadoras de Cristalina/Unaí com entrega direta para DF e Sudeste.',
            sorgo: 'Pecuária leiteira do Entorno do DF e confinamentos ao longo da BR-040.',
            mandioca: 'Centrais de abastecimento do DF (CEASA-DF) e agroindústrias de minimamente processados.',
            gergelim: 'Cerealistas do Planalto Central com escoamento rápido pelo eixo BR-040/BR-050.',
            girassol: 'Extratoras de óleo do Entorno e mistura para silagem/ração leiteira regional.',
            tomate: 'Agroindústrias de extrato/molho e CEASA-DF a menos de 130 km pela BR-040.'
        }
    },
    itaguaru: {
        municipio_key: 'itaguaru',
        nome: 'Itaguaru',
        corredor_rodoviario: 'GO-070 / BR-153 (Vale do São Patrício–Goiânia)',
        distancia_media_entrega_km: 45,
        compradores_principais: 'CEASA-GO, compras públicas PAA/PNAE (merenda/CONAB), feiras, laticínios e farinheiras',
        canais_por_cultura: {
            soja: 'Cerealistas e armazéns do eixo Jaraguá/Anápolis/Inhumas pela GO-070 e BR-153.',
            milho: 'Laticínios e pecuária leiteira do Vale do São Patrício (silagem/ração) e avícolas locais.',
            feijao: 'CEASA-GO, compras públicas PAA/PNAE (merenda escolar/CONAB) e empacotadores de Itaberaí/Goiânia.',
            sorgo: 'Silagem e grão para propriedades leiteiras e pequenos confinamentos da região.',
            mandioca: 'Farinheiras artesanais, descascadoras locais, CEASA-GO e chamadas públicas PNAE/CONAB.',
            gergelim: 'Cooperativas da agricultura familiar e atacadistas de alimentos naturais em Goiânia/Anápolis.',
            girassol: 'Fábricas de ração do Vale do São Patrício e apicultura/óleos artesanais.',
            tomate: 'Box atacadistas na CEASA-GO pela GO-070 e redes de varejo da Grande Goiânia.'
        }
    },
    anapolis: {
        municipio_key: 'anapolis',
        nome: 'Anápolis',
        corredor_rodoviario: 'BR-153 / BR-060 / Ferrovia Norte-Sul (Porto Seco & DAIA)',
        distancia_media_entrega_km: 20,
        compradores_principais: 'Agroindústrias do DAIA, empacotadoras, Porto Seco Centro-Oeste e CEASA-GO',
        canais_por_cultura: {
            soja: 'Esmagadoras e terminal ferroviário do Porto Seco (DAIA) conectados à BR-153/BR-060.',
            milho: 'Agroindústrias de derivados de milho no DAIA, avícolas regionais e escoamento ferroviário.',
            feijao: 'Empacotadoras e distribuidoras atacadistas de Anápolis com escoamento direto para DF e Goiânia.',
            sorgo: 'Fábricas de ração animal no eixo Anápolis–Leopoldo de Bulhões e pecuária intensiva.',
            mandioca: 'Indústrias de alimentos/congelados em Anápolis–Goiânia e CEASA-GO.',
            gergelim: 'Indústrias alimentícias, panificação no DAIA e exportação conteinerizada via Porto Seco.',
            girassol: 'Processadoras de óleo/ingredientes alimentícios no polo industrial e fábricas de ração.',
            tomate: 'Agroindústrias processadoras do eixo Goiânia–Anápolis e abastecimento rápido pela BR-060.'
        }
    },
    goiania: {
        municipio_key: 'goiania',
        nome: 'Goiânia',
        corredor_rodoviario: 'BR-153 / BR-060 / GO-020 (CEASA-GO e Região Metropolitana)',
        distancia_media_entrega_km: 18,
        compradores_principais: 'CEASA-GO, redes de supermercados, panificação/congelados e programas PAA/PNAE',
        canais_por_cultura: {
            soja: 'Cerealistas e armazéns do cinturão metropolitano na BR-060/BR-153.',
            milho: 'Varejo de milho verde/pamonharias, fábricas de ração e atacado da Região Metropolitana.',
            feijao: 'CEASA-GO, redes supermercadistas da capital e entregas institucionais PAA/PNAE.',
            sorgo: 'Pecuária leiteira do cinturão verde metropolitano e indústrias de nutrição animal na BR-153.',
            mandioca: 'CEASA-GO, indústrias de mandioca congelada/à vácuo e merenda escolar (PNAE).',
            gergelim: 'Redes de panificação, lojas de produtos naturais e distribuidoras atacadistas na capital.',
            girassol: 'Processadoras alimentícias e extratoras regionais na Região Metropolitana.',
            tomate: 'Entrega direta no pavilhão da CEASA-GO (BR-153) e redes hortifrúti de Goiânia.'
        }
    }
};

let baselineCache = null;

function carregarBaseline() {
    if (baselineCache) return baselineCache;
    const raw = fs.readFileSync(BASELINE_PATH, 'utf-8');
    baselineCache = JSON.parse(raw);
    return baselineCache;
}

/**
 * Normaliza o nome da cultura informada pelo usuário ou LLM para uma chave do catálogo.
 */
export function normalizarCulturaKey(input) {
    const clean = String(input || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (clean.includes('soja')) return 'soja';
    if (clean.includes('milho') || clean.includes('safrinha')) return 'milho';
    if (clean.includes('feij')) return 'feijao';
    if (clean.includes('sorgo')) return 'sorgo';
    if (clean.includes('mandioca') || clean.includes('macaxeira') || clean.includes('aipim')) return 'mandioca';
    if (clean.includes('tomate')) return 'tomate';
    if (clean.includes('banana') || clean.includes('bananeira')) return 'banana';
    if (clean.includes('pasto') || clean.includes('capim')) return 'pasto_fraco';
    if (clean.includes('braqui')) return 'braquiaria';
    if (clean.includes('crotal')) return 'crotalaria';
    if (clean.includes('girassol')) return 'girassol';
    if (clean.includes('gergelim')) return 'gergelim';
    if (clean.includes('cafe')) return 'cafe';
    if (clean.includes('laranja') || clean.includes('limao') || clean.includes('tangerina') || clean.includes('citros')) return 'citros';
    if (clean.includes('cana')) return 'cana';
    if (clean.includes('trigo')) return 'trigo';
    if (clean.includes('arroz')) return 'arroz';
    if (!clean || clean === 'indefinido' || clean === 'indefinida' || clean === 'nenhuma') return 'soja';
    return clean.replace(/\s+/g, '_');
}

export const GRUPOS_CULTIVO_BRASIL = {
    perene_frutifera: {
        key: 'perene_frutifera',
        rotulo: 'perene / fruticultura',
        naoArrancarAposColheita: true,
        termoMaterial: 'muda certificada ou porta-enxerto'
    },
    semiperene: {
        key: 'semiperene',
        rotulo: 'semiperene (ciclo multi-colheita)',
        naoArrancarAposColheita: true,
        termoMaterial: 'muda sadia, rebento ou tolete'
    },
    anual_inverno_sul: {
        key: 'anual_inverno_sul',
        rotulo: 'anual de inverno / subtropical',
        naoArrancarAposColheita: false,
        termoMaterial: 'semente certificada'
    },
    varzea_irrigada: {
        key: 'varzea_irrigada',
        rotulo: 'várzea / irrigado por inundação',
        naoArrancarAposColheita: false,
        termoMaterial: 'semente pré-germinada ou certificada'
    },
    hortalica_protegida: {
        key: 'hortalica_protegida',
        rotulo: 'hortaliça / cultivo intensivo',
        naoArrancarAposColheita: false,
        termoMaterial: 'semente híbrida ou muda enxertada'
    },
    raiz_tuberculo: {
        key: 'raiz_tuberculo',
        rotulo: 'raiz / tubérculo',
        naoArrancarAposColheita: false,
        termoMaterial: 'maniva ou tubérculo-semente sadio'
    },
    forrageira_ilp: {
        key: 'forrageira_ilp',
        rotulo: 'forrageira / integração lavoura-pecuária',
        naoArrancarAposColheita: false,
        termoMaterial: 'semente forrageira tratada'
    },
    anual_grao_fibra: {
        key: 'anual_grao_fibra',
        rotulo: 'anual de grão / fibra',
        naoArrancarAposColheita: false,
        termoMaterial: 'semente / cultivar'
    }
};

const CULTURA_PARA_GRUPO = {
    cafe: 'perene_frutifera',
    caju: 'perene_frutifera',
    citros: 'perene_frutifera',
    laranja: 'perene_frutifera',
    limao: 'perene_frutifera',
    tangerina: 'perene_frutifera',
    manga: 'perene_frutifera',
    uva: 'perene_frutifera',
    cacau: 'perene_frutifera',
    acai: 'perene_frutifera',
    coco: 'perene_frutifera',
    maca: 'perene_frutifera',
    pessego: 'perene_frutifera',
    ameixa: 'perene_frutifera',
    caqui: 'perene_frutifera',
    kiwi: 'perene_frutifera',
    goiaba: 'perene_frutifera',
    abacate: 'perene_frutifera',
    acerola: 'perene_frutifera',
    maracuja: 'perene_frutifera',
    jabuticaba: 'perene_frutifera',
    cupuacu: 'perene_frutifera',
    eucalipto: 'perene_frutifera',
    seringueira: 'perene_frutifera',
    cana: 'semiperene',
    banana: 'semiperene',
    abacaxi: 'semiperene',
    mamao: 'semiperene',
    palma: 'semiperene',
    trigo: 'anual_inverno_sul',
    aveia: 'anual_inverno_sul',
    cevada: 'anual_inverno_sul',
    centeio: 'anual_inverno_sul',
    canola: 'anual_inverno_sul',
    azevem: 'anual_inverno_sul',
    arroz: 'varzea_irrigada',
    tomate: 'hortalica_protegida',
    alface: 'hortalica_protegida',
    morango: 'hortalica_protegida',
    pimentao: 'hortalica_protegida',
    pepino: 'hortalica_protegida',
    repolho: 'hortalica_protegida',
    cenoura: 'hortalica_protegida',
    cebola: 'hortalica_protegida',
    alho: 'hortalica_protegida',
    melancia: 'hortalica_protegida',
    melao: 'hortalica_protegida',
    maxixe: 'hortalica_protegida',
    quiabo: 'hortalica_protegida',
    berinjela: 'hortalica_protegida',
    jilo: 'hortalica_protegida',
    abobora: 'hortalica_protegida',
    pimenta: 'hortalica_protegida',
    mandioca: 'raiz_tuberculo',
    batata: 'raiz_tuberculo',
    inhame: 'raiz_tuberculo',
    gengibre: 'raiz_tuberculo',
    braquiaria: 'forrageira_ilp',
    pasto_fraco: 'forrageira_ilp',
    mombaca: 'forrageira_ilp',
    capim: 'forrageira_ilp',
    buffel: 'forrageira_ilp',
    milheto: 'forrageira_ilp'
};

export function resolverGrupoCultivo(culturaKey) {
    const normKey = normalizarCulturaKey(culturaKey);
    const grupoKey = CULTURA_PARA_GRUPO[normKey] || 'anual_grao_fibra';
    return GRUPOS_CULTIVO_BRASIL[grupoKey] || GRUPOS_CULTIVO_BRASIL.anual_grao_fibra;
}

export const MATERIAIS_POR_CULTIVO = {
    soja: {
        convencional: {
            key: 'convencional',
            rotulo: 'Soja Convencional (não-OGM)',
            exigeUmidadeMin: 48,
            focoEscoamento: 'Cerealistas e esmagadoras que pagam bonificação/prêmio por grão não-transgênico segregado.',
            quandoUsar: 'Boa para reduzir custo de royalty e aproveitar prêmio de mercado onde há comprador segregado.'
        },
        rr: {
            key: 'rr',
            rotulo: 'Soja RR',
            exigeUmidadeMin: 48,
            focoEscoamento: 'Cooperativas, armazéns e tradings convencionais da região.',
            quandoUsar: 'Semente de custo intermediário para áreas sem pressão severa de lagartas.'
        },
        intacta: {
            key: 'intacta',
            rotulo: 'Soja Intacta / Conkesta (Bt)',
            exigeUmidadeMin: 52,
            focoEscoamento: 'Fluxo padrão de cooperativas, esmagadoras e armazéns graneleiros.',
            quandoUsar: 'Justifica o custo maior quando há histórico de lagarta e solo/chuva garantindo bom teto.'
        },
        superprecoce: {
            key: 'superprecoce',
            rotulo: 'Soja Ciclo Superprecoce (100–108 dias)',
            exigeUmidadeMin: 45,
            focoEscoamento: 'Entrega antecipada na abertura de recepção dos armazéns, fugindo de pico de frete.',
            quandoUsar: 'Ideal para liberar a área mais cedo e não perder a janela da 2ª safra.'
        }
    },
    milho: {
        hibrido_simples: {
            key: 'hibrido_simples',
            rotulo: 'Milho Híbrido Simples (alto teto)',
            exigeUmidadeMin: 55,
            focoEscoamento: 'Usinas de etanol de milho, fábricas de ração e armazéns de grande volume.',
            quandoUsar: 'Só compensa com umidade firme na raiz e adubação cheia; em janela tardia ou seca, o risco financeiro sobe.'
        },
        hibrido_duplo: {
            key: 'hibrido_duplo',
            rotulo: 'Milho Híbrido Duplo/Triplo (rústico)',
            exigeUmidadeMin: 45,
            focoEscoamento: 'Fábricas de ração, granjas, confinamentos e cooperativas regionais.',
            quandoUsar: 'Melhor custo-benefício e estabilidade quando há veranico ou plantio fora da janela ideal.'
        },
        crioulo: {
            key: 'crioulo',
            rotulo: 'Milho Variedade / Crioulo',
            exigeUmidadeMin: 42,
            focoEscoamento: 'Silagem própria, consumo na propriedade, pamonharias, feiras locais e PAA/PNAE.',
            quandoUsar: 'Baixíssimo custo de semente por hectare para agricultura familiar e segurança de silagem.'
        },
        bt: {
            key: 'bt',
            rotulo: 'Milho Bt (PRO / Viptera)',
            exigeUmidadeMin: 50,
            focoEscoamento: 'Usinas, cooperativas e cerealistas regionais.',
            quandoUsar: 'Indicado quando há histórico de lagarta-do-cartucho, mantendo vigília contra cigarrinha.'
        }
    },
    feijao: {
        carioca: {
            key: 'carioca',
            rotulo: 'Feijão Carioca',
            exigeUmidadeMin: 50,
            focoEscoamento: 'Empacotadoras regionais, atacadistas e CEASA estadual.',
            quandoUsar: 'Liquidez rápida, mas sensível a chuva na colheita (mancha grão) e calor excessivo na florada.'
        },
        preto: {
            key: 'preto',
            rotulo: 'Feijão Preto',
            exigeUmidadeMin: 48,
            focoEscoamento: 'Empacotadoras com rota interestadual (Sudeste/Sul) e atacado.',
            quandoUsar: 'Alternativa de mercado quando o carioca está sobreofertado.'
        },
        caupi: {
            key: 'caupi',
            rotulo: 'Feijão-Caupi / de Corda',
            exigeUmidadeMin: 36,
            focoEscoamento: 'Comércio regional, cerealistas, feiras e programas PAA/PNAE.',
            quandoUsar: 'Melhor opção quando há calor forte ou pouca água — aguenta bem onde o carioca aborta flor.'
        }
    },
    sorgo: {
        granifero: {
            key: 'granifero',
            rotulo: 'Sorgo Granífero',
            exigeUmidadeMin: 35,
            focoEscoamento: 'Confinamentos bovinos, granjas integradas e fábricas de ração.',
            quandoUsar: 'Substituto direto do milho em janela seca ou safrinha tardia gastando bem menos.'
        },
        forrageiro: {
            key: 'forrageiro',
            rotulo: 'Sorgo Forrageiro / Silagem',
            exigeUmidadeMin: 35,
            focoEscoamento: 'Pecuária leiteira e de corte local (silagem de alto volume) ou venda de volumoso.',
            quandoUsar: 'Ideal para garantir cocho na seca com custo muito abaixo do milho.'
        }
    },
    braquiaria: {
        ruziziensis: {
            key: 'ruziziensis',
            rotulo: 'Braquiária Ruziziensis (palhada/dessecação fácil)',
            exigeUmidadeMin: 35,
            focoEscoamento: 'Economia interna de adubo e água na palhada para plantar soja/feijão direto em cima.',
            quandoUsar: 'A melhor escolha quando o objetivo é fazer tapete de palha e dessecar fácil antes da próxima safra.'
        },
        brizantha: {
            key: 'brizantha',
            rotulo: 'Braquiária Brizantha (Marandu / Paiaguás / Xaraés)',
            exigeUmidadeMin: 35,
            focoEscoamento: 'Pastejo de entressafra (ILP) + venda de sementes ou feno regional.',
            quandoUsar: 'Indicado quando você vai colocar gado na área antes de retomar a lavoura.'
        }
    },
    crotalaria: {
        spectabilis: {
            key: 'spectabilis',
            rotulo: 'Crotalária Spectabilis (controle forte de nematoide)',
            exigeUmidadeMin: 38,
            focoEscoamento: 'Retorno dentro da própria lavoura derrubando nematoides de galha e cisto sem nematicida caro.',
            quandoUsar: 'Melhor opção se há reboleiras de nematoides e precisa de porte mais baixo pra acamar fácil.'
        },
        juncea: {
            key: 'juncea',
            rotulo: 'Crotalária Juncea / Ochroleuca (biomassa e N)',
            exigeUmidadeMin: 38,
            focoEscoamento: 'Ganho direto na redução de ureia/nitrogênio da lavoura seguinte ou venda de semente.',
            quandoUsar: 'Ideal para solo fraco/compactado que precisa de muita massa verde e nitrogênio natural.'
        }
    },
    mandioca: {
        mansa: {
            key: 'mansa',
            rotulo: 'Mandioca Mansa / Mesa (macaxeira / aipim)',
            exigeUmidadeMin: 40,
            focoEscoamento: 'Feiras, CEASA estadual, minimamente processados à vácuo e merenda (PAA/PNAE).',
            quandoUsar: 'Colheita mais cedo (8–12 meses) com venda direta para mesa e melhor giro.'
        },
        brava: {
            key: 'brava',
            rotulo: 'Mandioca Brava / Indústria (farinha e fécula)',
            exigeUmidadeMin: 38,
            focoEscoamento: 'Farinheiras artesanais e fecularias industriais da região.',
            quandoUsar: 'Maior teor de amido e rusticidade para ciclo de 14–18 meses voltado à indústria.'
        }
    }
};

export function normalizarSementeKey(culturaKey, input = '') {
    const clean = String(input || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    if (!clean) return '';

    if (culturaKey === 'soja') {
        if (clean.includes('convencional') || clean.includes('nao ogm') || clean.includes('livre')) return 'convencional';
        if (clean.includes('intacta') || clean.includes('conkesta') || /\bbt\b/.test(clean)) return 'intacta';
        if (clean.includes('superprecoce') || clean.includes('precoce') || clean.includes('ciclo curto')) return 'superprecoce';
        if (/\brr\b/.test(clean) || clean.includes('roundup')) return 'rr';
    }
    if (culturaKey === 'milho') {
        if (clean.includes('simples')) return 'hibrido_simples';
        if (clean.includes('duplo') || clean.includes('triplo') || clean.includes('rustic')) return 'hibrido_duplo';
        if (clean.includes('crioul') || clean.includes('variedade')) return 'crioulo';
        if (/\bbt\b/.test(clean) || clean.includes('viptera') || clean.includes('pro')) return 'bt';
    }
    if (culturaKey === 'feijao') {
        if (clean.includes('caupi') || clean.includes('corda') || clean.includes('fradinho') || clean.includes('macacar')) return 'caupi';
        if (clean.includes('preto')) return 'preto';
        if (clean.includes('carioca')) return 'carioca';
    }
    if (culturaKey === 'sorgo') {
        if (clean.includes('forrageir') || clean.includes('silagem')) return 'forrageiro';
        if (clean.includes('granifer')) return 'granifero';
    }
    if (culturaKey === 'braquiaria') {
        if (clean.includes('ruziz')) return 'ruziziensis';
        if (clean.includes('brizant') || clean.includes('marandu') || clean.includes('paiagua') || clean.includes('xarae')) return 'brizantha';
    }
    if (culturaKey === 'crotalaria') {
        if (clean.includes('spectab')) return 'spectabilis';
        if (clean.includes('juncea') || clean.includes('ochroleuca')) return 'juncea';
    }
    if (culturaKey === 'mandioca') {
        if (clean.includes('brava') || clean.includes('industria') || clean.includes('farinha') || clean.includes('fecula')) return 'brava';
        if (clean.includes('mansa') || clean.includes('mesa') || clean.includes('macaxeira') || clean.includes('aipim')) return 'mansa';
    }
    return '';
}

export function obterPerfilMaterial(culturaKey, sementeRaw = '') {
    const mapa = MATERIAIS_POR_CULTIVO[culturaKey];
    if (!mapa) return null;
    const key = normalizarSementeKey(culturaKey, sementeRaw);
    return (key && mapa[key]) ? mapa[key] : null;
}

const CANAIS_ESCOAMENTO_NACIONAIS = {
    soja: 'Cooperativas graneleiras, armazéns e tradings regionais da sua praça.',
    milho: 'Fábricas de ração, avícolas/suinoculturas, confinamentos bovinos e cerealistas da região.',
    feijao: 'Empacotadoras locais, atacado regional, CEASA do estado e compras públicas (PAA/PNAE).',
    sorgo: 'Confinamentos bovinos, pecuária leiteira e fábricas de ração da sua região.',
    mandioca: 'Farinheiras, fecularias, feiras locais, CEASA estadual e programas PAA/PNAE.',
    gergelim: 'Cerealistas regionais, processadoras de grãos especiais e tradings exportadoras.',
    girassol: 'Extratoras de óleo vegetal, fábricas de ração e sementeiras regionais.',
    tomate: 'CEASA estadual, redes supermercadistas locais e indústrias de polpa/molho.',
    padrao: 'Cooperativas locais, cerealistas, agroindústrias, feiras regionais, CEASA estadual e compras públicas (PAA/PNAE).'
};

const MAPA_CIDADES_POLO_GOIAS = {
    // Polo Vale do São Patrício / Médio Norte (Itaguaru)
    uruana: 'itaguaru',
    ceres: 'itaguaru',
    rialma: 'itaguaru',
    jaragua: 'itaguaru',
    itaberai: 'itaguaru',
    goianesia: 'itaguaru',
    rubiataba: 'itaguaru',
    itapaci: 'itaguaru',
    inhumas: 'itaguaru',
    carmo_do_rio_verde: 'itaguaru',
    aguas_lindas: 'cristalina',
    valparaiso: 'cristalina',
    novo_gama: 'cristalina',
    planaltina: 'cristalina',
    porangatu: 'itaguaru',
    itapuranga: 'itaguaru',
    cidade_de_goias: 'itaguaru',
    santa_helena_de_goias: 'rio_verde',
    quirinopolis: 'rio_verde',
    montividiu: 'rio_verde',
    acreuna: 'rio_verde',
    caldas_novas: 'anapolis',
    morrinhos: 'anapolis',
    palmeiras_de_goias: 'goiania',
    sao_simao: 'jatai',
    // Polo Entorno / Leste / Sudeste (Cristalina)
    luziania: 'cristalina',
    formosa: 'cristalina',
    catalao: 'cristalina',
    ipameri: 'cristalina',
    posse: 'cristalina',
    // Polo Sudoeste Extremo (Jataí)
    mineiros: 'jatai',
    chapadao_do_ceu: 'jatai',
    caiaponia: 'jatai',
    // Polo Centro (Anápolis)
    silvania: 'anapolis',
    vianopolis: 'anapolis',
    pires_do_rio: 'anapolis',
    pirenopolis: 'anapolis',
    neropolis: 'anapolis',
    // Polo Metropolitana (Goiânia)
    aparecida_de_goiania: 'goiania',
    trindade: 'goiania',
    senador_canedo: 'goiania',
    bela_vista_de_goias: 'goiania'
};

function capitalizarMunicipio(raw = '') {
    const limpo = String(raw || '')
        .replace(/\s*[-–]\s*[A-Z]{2}\s*$/i, '')
        .trim();
    if (!limpo) return '';
    return limpo
        .split(/\s+/)
        .map((w, i) => (i > 0 && /^(da|de|do|das|dos)$/i.test(w)
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join(' ');
}

function resolverPoloGoias(cidade, municipios = {}) {
    const rawKey = normalizarMunicipioKey(cidade);
    if (municipios[rawKey]) {
        return {
            poloKey: rawKey,
            nomeExibicao: municipios[rawKey].nome,
            ufExibicao: municipios[rawKey].uf || 'GO',
            poloConhecido: true
        };
    }
    const mapaMatch = MAPA_CIDADES_POLO_GOIAS[rawKey]
        || Object.entries(MAPA_CIDADES_POLO_GOIAS).find(([slug]) => rawKey.includes(slug))?.[1];
    const poloKey = mapaMatch || 'rio_verde';
    const nomeLimpo = capitalizarMunicipio(cidade);
    const ehNomeInformado = Boolean(nomeLimpo) && !/^(indefinid[oa]|nao\s+informad[oa])$/i.test(nomeLimpo);
    const poloConhecido = Boolean(mapaMatch) || !ehNomeInformado;
    const ufMatch = String(cidade || '').match(/[-–/\s,]\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\s*$/i);
    const ufExibicao = poloConhecido
        ? (municipios[poloKey]?.uf || 'GO')
        : (ufMatch?.[1]?.toUpperCase() || '');
    return {
        poloKey,
        nomeExibicao: ehNomeInformado ? nomeLimpo : (municipios[poloKey]?.nome || 'Rio Verde'),
        ufExibicao,
        poloConhecido
    };
}

function formatarMunicipioExibicao(nomeExibicao, ufExibicao) {
    return ufExibicao ? `${nomeExibicao} - ${ufExibicao}` : nomeExibicao;
}

/**
 * Normaliza o tipo de solo informado para as 4 classes do Cerrado.
 */
export function normalizarSoloKey(input, fallbackKey = 'medio_cerrado') {
    const clean = String(input || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (!clean) return SOLOS_CERRADO[fallbackKey] ? fallbackKey : 'medio_cerrado';
    if (clean.includes('argil') || clean.includes('vermelho') || clean.includes('boa')) return 'argiloso_fertil';
    if (clean.includes('aren') || clean.includes('leve') || clean.includes('seco')) return 'arenoso_seco';
    if (clean.includes('cansad') || clean.includes('degrad') || clean.includes('compact') || clean.includes('frac')) return 'degradado_compactado';
    if (clean.includes('mist') || clean.includes('medi') || clean.includes('cerrado')) return 'medio_cerrado';
    return SOLOS_CERRADO[clean] ? clean : (SOLOS_CERRADO[fallbackKey] ? fallbackKey : 'medio_cerrado');
}

/**
 * Normaliza a prioridade principal do produtor.
 */
export function normalizarPrioridade(input) {
    const clean = String(input || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (clean.includes('agua') || clean.includes('sec') || clean.includes('chuv')) return 'agua';
    if (clean.includes('solo') || clean.includes('terra') || clean.includes('adub') || clean.includes('palha')) return 'solo';
    if (clean.includes('prag') || clean.includes('doen') || clean.includes('cigar') || clean.includes('nemat')) return 'pragas';
    if (clean.includes('escoa') || clean.includes('vend') || clean.includes('fret') || clean.includes('mercad') || clean.includes('comerc')) return 'escoamento';
    if (clean.includes('rend') || clean.includes('dinheir') || clean.includes('lucr') || clean.includes('caix')) return 'renda';
    return 'agua';
}

function classificarUmidadeRaiz(gwetroot) {
    const pct = Math.round((gwetroot || 0) * 100);
    if (pct >= 60) {
        return { pct, nivel: 'Boa', classe: 'ok', resumo: 'Boa reserva de umidade na zona da raiz.' };
    }
    if (pct >= 45) {
        return { pct, nivel: 'Atenção', classe: 'alerta', resumo: 'Reserva moderada: evapora rápido se o solo ficar descoberto.' };
    }
    return { pct, nivel: 'Seca na Raiz', classe: 'critico', resumo: 'Baixa reserva na raiz: priorize espécies rústicas e cobertura morta.' };
}

function classificarCalor(diasCalor30d, tempMaxMedia) {
    if (diasCalor30d >= 15 || tempMaxMedia >= 34) {
        return {
            nivel: 'Alto',
            resumo: `${diasCalor30d} dias acima de 34°C nos últimos 30 dias (média ${tempMaxMedia}°C).`
        };
    }
    return {
        nivel: 'Moderado',
        resumo: `${diasCalor30d} dias acima de 34°C nos últimos 30 dias (média ${tempMaxMedia}°C).`
    };
}

/**
 * Lista os municípios de Goiás com leitura NASA POWER, previsão 14d e pulso regional.
 */
export function listarMunicipiosGoias() {
    const baseline = carregarBaseline();
    return Object.values(baseline.municipios).map((m) => {
        const umidade = classificarUmidadeRaiz(m.gwetroot_atual);
        const calor = classificarCalor(m.dias_calor_extremo_30d, m.temp_max_media_30d);
        const canal = CANAIS_ESCOAMENTO_GOIAS[m.municipio_key] || CANAIS_ESCOAMENTO_GOIAS.rio_verde;
        return {
            ...m,
            caixa_agua_solo_pct: umidade.pct,
            status_umidade: umidade.nivel,
            classe_umidade: umidade.classe,
            resumo_umidade: umidade.resumo,
            status_calor: calor.nivel,
            resumo_calor: calor.resumo,
            corredor_logistico: canal.corredor_rodoviario,
            compradores_principais: canal.compradores_principais,
            pulso_regional: obterPulsoRegional(m.municipio_key)
        };
    });
}

function calcularJanelaPlantio(nasa, culturaEtapa1) {
    const rootPct = Math.round(nasa.gwetroot_atual * 100);
    const balanco = nasa.balanco_hidrico_14d_mm;

    if (nasa.dias_chuva_forte_14d >= 2 && rootPct >= 55) {
        return 'Espere passar o pico de chuva forte dos próximos dias para não compactar na semeadura.';
    }
    if (balanco >= 30 && rootPct >= 42) {
        return `Janela favorável nos próximos 14 dias (+${balanco} mm de saldo hídrico sobre a evaporação), desde que plante sobre palhada.`;
    }
    if (culturaEtapa1.tolerancia_seca >= 4) {
        return `Umidade da raiz em ${rootPct}% exige cuidado: entre logo após uma chuva firme de pelo menos 20 mm.`;
    }
    return `Atenção: com umidade da raiz em ${rootPct}% e calor recente forte, segure o plantio até firmar chuva contínua ou prefira a opção rústica #1.`;
}

function avaliarMonocultura(anterior, nasa, solo, pulso, grupoCultivo = GRUPOS_CULTIVO_BRASIL.anual_grao_fibra) {
    const rootPct = Math.round(nasa.gwetroot_atual * 100);
    if (grupoCultivo?.naoArrancarAposColheita) {
        return {
            cultura: anterior.nome,
            modo_manejo: 'entrelinha_e_renovacao',
            score_resiliencia: Math.max(52, Math.min(84, rootPct + 12)),
            nivel_risco: 'Manter cultivo (manejar entrelinhas)',
            perda_agua_estimada: solo.key === 'arenoso_seco' ? '-18% sem cobertura nas ruas' : '-10% sem palhada nas ruas',
            pragas_em_risco: anterior.pragas_comuns.slice(0, 2),
            risco_escoamento: `Em cultivos ${grupoCultivo.rotulo}, não se arranca a área após cada colheita; o ganho está em proteger o solo entre as linhas e planejar renovação apenas em talhão velho ou doente.`,
            motivos: [
                `${anterior.nome} é cultivo ${grupoCultivo.rotulo}: manter a planta e cobrir as entrelinhas segura umidade (raiz atual em ${rootPct}%) e reduz mato/adubo sem perder anos de formação.`,
                `Só compensa arrancar e rotacionar antes de replantar quando a produtividade cair por ciclos seguidos ou houver doença severa no talhão.`
            ]
        };
    }

    let risco = 55;
    if (solo.key === 'degradado_compactado' || solo.key === 'arenoso_seco') risco += 15;
    if (rootPct < 50) risco += 12;
    if (nasa.dias_calor_extremo_30d >= 15 && anterior.tolerancia_calor <= 3) risco += 10;
    risco = Math.min(96, risco);

    const perdaAguaEstimada = solo.key === 'arenoso_seco' || anterior.aporte_palhada_t_ha < 3.5 ? '-22%' : '-12%';
    const riscoEscoamento = `Colher ${anterior.nome} junto com toda a região concentra a saída no mesmo pico, disputa caminhão e pressiona o frete e o preço.`;

    return {
        cultura: anterior.nome,
        modo_manejo: 'rotacao_anual',
        score_resiliencia: Math.max(12, 100 - risco),
        nivel_risco: risco >= 75 ? 'Risco Alto' : 'Risco Moderado-Alto',
        perda_agua_estimada: perdaAguaEstimada,
        pragas_em_risco: anterior.pragas_comuns.slice(0, 2),
        risco_escoamento: riscoEscoamento,
        motivos: [
            `Mantém as mesmas raízes na mesma profundidade, favorecendo ${anterior.pragas_comuns.slice(0, 2).join(' e ')}.`,
            `Com ${nasa.dias_calor_extremo_30d} dias de calor forte e raiz em ${rootPct}%, solo sem alternância perde até ${perdaAguaEstimada.replace('-', '')} de umidade útil.`,
            pulso.alerta_fitossanitario,
            riscoEscoamento
        ]
    };
}

function obterCanalRegional(nasa, { poloConhecido = true, nomeExibicao = '' } = {}) {
    if (poloConhecido) {
        return CANAIS_ESCOAMENTO_GOIAS[nasa.municipio_key] || CANAIS_ESCOAMENTO_GOIAS.rio_verde;
    }
    const localLabel = nomeExibicao || 'sua região';
    return {
        municipio_key: 'nacional_generico',
        nome: localLabel,
        corredor_rodoviario: `Eixo rodoviário e polos compradores da região de ${localLabel}`,
        distancia_media_entrega_km: 35,
        compradores_principais: CANAIS_ESCOAMENTO_NACIONAIS.padrao,
        canais_por_cultura: CANAIS_ESCOAMENTO_NACIONAIS,
        nacional_generico: true
    };
}

function calcularEscoamentoPlano(plano, { nasa, pulso, saturacao, poloConhecido = true, nomeExibicao = '', sementeInfo = null }) {
    const etapas = plano.etapas.map((k) => CULTURAS_CERRADO[k]);
    const e1 = etapas[0];
    const culturaFoco = etapas.find((c) => c.retorno_economico >= 3) || e1;
    const canal = obterCanalRegional(nasa, { poloConhecido, nomeExibicao });
    const topRegional = String((pulso?.culturas_em_alta || ['Soja'])[0] || 'Soja');
    const topRegionalNorm = topRegional.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const focoNomeBaseNorm = culturaFoco.nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const foraSaturacaoTop1 = !topRegionalNorm.includes(focoNomeBaseNorm) && !topRegionalNorm.includes(culturaFoco.key);

    const planShare = saturacao?.planos?.[plano.titulo]?.share || 0;
    const planPct = Math.round(planShare * 100);
    const saturadoNaRegiao = Boolean(saturacao?.tem_concentracao && planShare >= 0.35);
    const diversificaRegiao = Boolean(saturacao?.tem_concentracao && planShare <= 0.15);

    let indice = 72;
    indice += canal.distancia_media_entrega_km <= 30 ? 6 : 3;
    if (e1.ciclo_dias <= 110) indice += 8;
    if (nasa.gwettop_atual < 0.65) indice += 4;
    if (foraSaturacaoTop1) indice += 5;
    if (saturadoNaRegiao) indice -= 8;
    else if (diversificaRegiao) indice += 5;

    const indice_facilidade = Math.max(62, Math.min(96, Math.round(indice)));
    const umidSupPct = Math.round((nasa.gwettop_atual || 0) * 100);
    const culturaSaturadaNome = saturacao?.plano_mais_concentrado?.titulo?.split('→')[0]?.trim() || topRegional;
    const regiaoNomeAlerta = poloConhecido ? nasa.nome : (nomeExibicao || 'região');
    const alerta_saturacao_frete = saturadoNaRegiao
        ? `Risco de efeito manada: ${planPct}% das consultas em ${regiaoNomeAlerta} já vão nesse plano — vale avaliar #2 ou #3 pra não disputar caminhão e preço.`
        : saturacao?.tem_concentracao
            ? `Ajuda a fugir da superoferta de ${culturaSaturadaNome} (${saturacao.plano_mais_concentrado?.pct || 0}% das buscas no polo), protegendo frete e preço.`
            : `Evita concentrar toda a venda na mesma semana das lavouras de ${topRegional} da região.`;

    let canalRecomendado = canal.canais_por_cultura[culturaFoco.key] || canal.compradores_principais;
    if (sementeInfo?.focoEscoamento && (sementeInfo.key === 'convencional' || sementeInfo.key === 'crioulo' || sementeInfo.key === 'forrageiro' || sementeInfo.key === 'caupi' || sementeInfo.key === 'preto')) {
        canalRecomendado = `${canalRecomendado} (${sementeInfo.rotulo}: ${sementeInfo.focoEscoamento})`;
    }

    return {
        indice_facilidade,
        nivel_liquidez: indice_facilidade >= 82 ? 'Alta Liquidez no Polo' : 'Boa Saída Regional',
        cultura_comercial_foco: culturaFoco.nome,
        corredor_logistico: canal.corredor_rodoviario,
        distancia_media_km: canal.distancia_media_entrega_km,
        compradores_polo: canal.compradores_principais,
        canal_recomendado: canalRecomendado,
        condicao_estrada_colheita:
            culturaFoco.ciclo_dias <= 110
                ? `Ciclo de ~${culturaFoco.ciclo_dias} dias permite colher fora do pico de chuva pesada e do apagão de caminhões.`
                : `Planeje embarque via ${canal.corredor_rodoviario} monitorando a umidade superficial (${umidSupPct}%).`,
        alerta_saturacao_frete
    };
}

function avaliarTrocaCulturaOuSemente({ anterior, grupoCultivo, sementeInfo, nasa, solo, saturacao, rankingTop1 }) {
    const rootPct = Math.round(nasa.gwetroot_atual * 100);
    const estresseHidrico = rootPct < 50 || solo.fator_agua < 0.8 || nasa.dias_calor_extremo_30d >= 15;
    const primeiraSugerida = rankingTop1?.etapas?.[0]?.nome || rankingTop1?.titulo?.split('→')?.[0]?.trim() || 'Braquiária';

    if (grupoCultivo?.naoArrancarAposColheita) {
        return {
            acao: 'manter_entrelinha',
            titulo: 'Manter lavoura e cobrir entrelinhas (troca só na reforma)',
            resumo: `${anterior.nome} é cultivo ${grupoCultivo.rotulo}: não se arranca após uma colheita para rotacionar. Use ${primeiraSugerida} nas entrelinhas para segurar umidade e solo.`,
            recomendacao_semente: `Quando precisar renovar talhão velho ou com baixa resposta, replante com ${grupoCultivo.termoMaterial} certificado após 1 ciclo de adubação verde.`,
            quando_trocar_campo: 'Só arranque para trocar se houver queda crônica de produtividade por anos seguidos ou doença grave sem recuperação.',
            destacar_no_natural: true
        };
    }

    if (grupoCultivo?.key === 'hortalica_protegida') {
        return {
            acao: 'trocar_cultura',
            titulo: 'Alternar família no canteiro/estufa e usar muda enxertada/limpa',
            resumo: `Em hortaliças e estufa, o que manda a troca é sair da mesma família botânica no canteiro (especialmente se houver murchadeira ou nematoide).`,
            recomendacao_semente: `Se repetir área muito visada, priorize muda enxertada em porta-enxerto resistente e faça cobertura/descanso de canteiro antes.`,
            quando_trocar_campo: 'Sinal de troca imediata no campo: aumento de murcha, reboleira no canteiro ou necessidade de aplicar mais defensivo só pra segurar a mesma colheita.',
            destacar_no_natural: false
        };
    }

    if (grupoCultivo?.key === 'varzea_irrigada' || grupoCultivo?.key === 'anual_inverno_sul') {
        return {
            acao: 'trocar_cultura',
            titulo: 'Alternar ciclo estação/várzea e ajustar ciclo da cultivar',
            resumo: grupoCultivo.key === 'varzea_irrigada'
                ? `Em várzea de arroz, a virada eficiente é alternar arroz irrigado com soja de várzea ou pastagem/azevém para quebrar arroz-vermelho e compactação.`
                : `Em lavoura subtropical/inverno, alterne a gramínea de inverno (trigo/aveia/cevada) com soja/milho/cobertura no verão conforme a janela térmica.`,
            recomendacao_semente: `Prefira cultivar de ciclo ajustado à abertura térmica e menor risco de acamamento/geada na colheita.`,
            quando_trocar_campo: 'Troque imediatamente quando o histórico de plantas daninhas resistentes ou fungo foliar exigir mais entradas químicas sem ganho de saca.',
            destacar_no_natural: false
        };
    }

    if (sementeInfo && estresseHidrico && (rootPct < seSementeExige(sementeInfo) || solo.fator_agua < 0.8)) {
        const altSemente = anterior.key === 'milho'
            ? 'Milho Híbrido Duplo/Triplo ou Variedade (rústico)'
            : anterior.key === 'feijao'
                ? 'Feijão-Caupi (tolerante ao calor e seca)'
                : anterior.key === 'soja'
                    ? 'Soja Superprecoce (ciclo curto) após palhada'
                    : 'material rústico de ciclo curto';
        return {
            acao: 'trocar_cultura',
            titulo: `Trocar de cultura agora (ou migrar de ${sementeInfo.rotulo})`,
            resumo: `Com raiz em ${rootPct}% e ${nasa.dias_calor_extremo_30d} dias de calor forte, ${sementeInfo.rotulo} tem risco alto de perda. Melhor virar para ${primeiraSugerida}; se já tiver contrato em ${anterior.nome}, troque a semente para ${altSemente}.`,
            recomendacao_semente: `Semente indicada se insistir em ${anterior.nome}: ${altSemente}.`,
            quando_trocar_campo: 'Troque a cultura se repetiu a mesma família na safra passada ou se a umidade na raiz estiver abaixo de 50%. Troque só o tipo de semente quando a janela apertou ou o mercado premiar outro padrão (ex.: não-OGM, caupi, silagem).',
            destacar_no_natural: true
        };
    }

    const opcoesSemente = MATERIAIS_POR_CULTIVO[anterior.key] ? Object.values(MATERIAIS_POR_CULTIVO[anterior.key]) : [];
    const sementeSugerida = opcoesSemente.find((s) => !estresseHidrico || rootPct >= (s.exigeUmidadeMin || 45)) || opcoesSemente[0] || null;

    return {
        acao: estresseHidrico || saturacao?.tem_concentracao ? 'trocar_cultura' : 'trocar_semente',
        titulo: 'Quando trocar a cultura vs trocar só a semente',
        resumo: `Em plantio sequencial anual, trocar para ${primeiraSugerida} corta pragas e protege a umidade (${rootPct}% na raiz). Trocar só a semente/cultivar funciona quando a rotação de família já foi feita e você precisa ajustar ciclo curto, resistência a lagarta ou comprador diferente (ex.: não-OGM, carioca vs caupi/preto, silagem vs grão).`,
        recomendacao_semente: sementeSugerida
            ? `Se for manter ${anterior.nome} em área já descansada: prefira *${sementeSugerida.rotulo}* — ${sementeSugerida.quandoUsar}`
            : `Para ${primeiraSugerida}, escolha semente/cultivar certificada e adequada à umidade atual (${rootPct}%).`,
        quando_trocar_campo: 'Sinais na roça pra virar a cultura: aumento de aplicações pra colher igual, mancha de nematoide/murcha ou 2 safras seguidas na mesma família. Sinais pra trocar só a semente: atraso de chuva encurtando janela ou mercado local saturado no padrão comum.',
        destacar_no_natural: Boolean(sementeInfo)
    };
}

function seSementeExige(sementeInfo) {
    return Number(sementeInfo?.exigeUmidadeMin || 48);
}

function pontuarPlano(plano, contexto) {
    const { anterior, nasa, solo, prioridade, pulso, saturacao, poloConhecido = true, nomeExibicao = '', sementeInfo = null } = contexto;
    const [e1, e2, e3] = plano.etapas.map((k) => CULTURAS_CERRADO[k]);
    const escoamento = calcularEscoamentoPlano(plano, { nasa, pulso, saturacao, poloConhecido, nomeExibicao, sementeInfo });

    const quebraImediata = e1.familia !== anterior.familia;
    const quebraInterna = e1.familia !== e2.familia && e2.familia !== e3.familia;
    const palhadaTotal = Math.round((e1.aporte_palhada_t_ha + e2.aporte_palhada_t_ha + e3.aporte_palhada_t_ha) * 10) / 10;
    const balancoN = e1.fixa_nitrogenio_kg_ha + e2.fixa_nitrogenio_kg_ha + e3.fixa_nitrogenio_kg_ha;
    const raizMax = Math.max(e1.profundidade_raiz_cm, e2.profundidade_raiz_cm, e3.profundidade_raiz_cm);
    const temQuebraNematoides = [e1, e2, e3].some((e) => e.quebra_nematoides);
    const retornoMedio = (e1.retorno_economico + e2.retorno_economico + e3.retorno_economico) / 3;

    let score = 28;

    // 1. Regra fundamental da rotação: não repetir família botânica da cultura anterior
    score += quebraImediata ? 16 : -26;
    score += quebraInterna ? 6 : -6;
    if (e1.key === anterior.key) score -= 22;

    // 2. Cruzamento real com NASA POWER (umidade na raiz e ondas de calor) + tipo de solo
    const estresseHidrico = nasa.gwetroot_atual < 0.5 || solo.fator_agua < 0.8;
    if (estresseHidrico) {
        score += (e1.tolerancia_seca - 3) * 4;
        if (nasa.dias_calor_extremo_30d >= 15) {
            score += (e1.tolerancia_calor - 3) * 2;
        }
    } else {
        score += (e1.tolerancia_seca - 2) * 1.5;
    }

    // 3. Benefício de cobertura e solo
    score += Math.min(9, palhadaTotal * 0.5);
    score += balancoN >= 60 ? 6 : balancoN > 0 ? 3 : -2;
    if (solo.key === 'degradado_compactado' && raizMax >= 120) score += 4;

    // 4. Peso explícito da prioridade escolhida pelo produtor
    if (prioridade === 'agua') {
        score += e1.tolerancia_seca * 2.5 + Math.min(6, palhadaTotal * 0.35) - (e1.demanda_agua_mm > 500 ? 6 : 0);
    } else if (prioridade === 'solo') {
        score += (balancoN > 0 ? Math.min(8, balancoN / 15) : -3) + Math.min(7, palhadaTotal * 0.4) + (raizMax >= 120 ? 4 : 0);
    } else if (prioridade === 'renda' || prioridade === 'escoamento') {
        score += retornoMedio * 3 + (e1.retorno_economico >= 4 ? 5 : -2) + Math.round((escoamento.indice_facilidade - 75) * 0.25);
    } else if (prioridade === 'pragas') {
        score += (quebraImediata ? 8 : -8) + (quebraInterna ? 6 : 0) + (temQuebraNematoides ? 6 : 0);
    }

    const scoreAgronomico = Math.max(25, Math.min(97, Math.round(score)));

    // 5. Trava anti-efeito manada: evita concentração regional sem violar segurança agronômica nem hídrica
    const planShare = saturacao?.planos?.[plano.titulo]?.share || 0;
    const planPct = Math.round(planShare * 100);
    const cropShare = saturacao?.culturas?.[e1.key]?.share || 0;
    const soloSecoCritico = (nasa.gwetroot_atual < 0.45) || (nasa.gwetroot_atual < 0.55 && solo.fator_agua < 0.75);
    const seguroAgronomico = quebraImediata
        && e1.key !== anterior.key
        && !(soloSecoCritico && e1.tolerancia_seca <= 2)
        && scoreAgronomico >= 70;

    let ajusteAntimanada = 0;
    if (saturacao?.tem_concentracao) {
        if (planShare >= 0.35 || cropShare >= 0.45) {
            const excessoPlano = Math.max(0, planShare - 0.32);
            const excessoCultura = Math.max(0, cropShare - 0.40);
            ajusteAntimanada = -Math.min(12, Math.round(excessoPlano * 22 + excessoCultura * 10 + 2));
        } else if (seguroAgronomico && planShare <= 0.15 && cropShare <= 0.20) {
            ajusteAntimanada = Math.min(5, Math.round((0.20 - planShare) * 20) + 1);
        }
    }

    const scoreFinal = Math.max(25, Math.min(97, Math.round(score + ajusteAntimanada)));
    const economiaAguaPct = Math.min(
        38,
        Math.max(8, Math.round(palhadaTotal * 1.4 + (e1.tolerancia_seca * 2) - (solo.fator_agua < 0.75 ? 0 : 3)))
    );

    const motivos = [];
    if (quebraImediata) {
        motivos.push(`Quebra imediata de ciclo: sai de ${anterior.familia} (${anterior.nome}) para ${e1.familia} (${e1.nome}).`);
    } else {
        motivos.push(`Requer atenção extra no controle de pragas por manter família próxima na entrada.`);
    }
    motivos.push(
        `Produz ${palhadaTotal} t/ha de palhada somada com raízes até ${raizMax} cm, conservando cerca de +${economiaAguaPct}% de água no solo.`
    );
    if (balancoN > 0) {
        motivos.push(`Saldo natural estimado de +${balancoN} kg/ha de nitrogênio fixado para reduzir adubação química.`);
    } else if (temQuebraNematoides) {
        motivos.push(`Ajuda a reduzir nematoides e pressões regionais citadas em ${nasa.nome} (${pulso.culturas_em_alta.slice(0, 2).join(', ')}).`);
    } else {
        motivos.push(plano.foco);
    }
    if (ajusteAntimanada > 0 && saturacao?.plano_mais_concentrado) {
        motivos.push(
            `Trava anti-efeito manada: evita concentrar o polo só em ${saturacao.plano_mais_concentrado.titulo.split('→')[0].trim()} (${saturacao.plano_mais_concentrado.pct}% das consultas) e preserva preço e frete.`
        );
    } else if (ajusteAntimanada < 0) {
        motivos.push(
            `Alerta anti-efeito manada: ${planPct}% das consultas recentes em ${nasa.nome} já apontam para este plano — avalie #2 ou #3 para evitar superoferta.`
        );
    }

    return {
        id: plano.id,
        titulo: plano.titulo,
        score_resiliencia: scoreFinal,
        score_agronomico: scoreAgronomico,
        ajuste_antimanada: ajusteAntimanada,
        participacao_regiao_pct: planPct,
        economia_agua_pct: economiaAguaPct,
        balanco_nitrogenio_kg_ha: balancoN,
        palhada_t_ha: palhadaTotal,
        profundidade_raiz_max_cm: raizMax,
        quebra_ciclo_imediata: quebraImediata,
        janela_plantio: calcularJanelaPlantio(nasa, e1),
        escoamento,
        etapas_detalhadas: plano.etapas.map((k, idx) => ({
            ordem: idx + 1,
            momento: plano.rotulos[idx],
            cultura: CULTURAS_CERRADO[k].nome,
            familia: CULTURAS_CERRADO[k].familia,
            papel: CULTURAS_CERRADO[k].papel,
            ciclo_dias: CULTURAS_CERRADO[k].ciclo_dias
        })),
        por_que_funciona: motivos
    };
}

/**
 * Motor principal de decisão: cruza NASA POWER + Open-Meteo 14d + Solo + Cultura Anterior + Prioridade.
 */
export function obterLeituraNasaSolo(cidade = 'Rio Verde') {
    const baseline = carregarBaseline();
    const { poloKey, nomeExibicao, ufExibicao } = resolverPoloGoias(cidade, baseline.municipios);
    const nasa = baseline.municipios[poloKey] || baseline.municipios.rio_verde;
    const umidade = classificarUmidadeRaiz(nasa.gwetroot_atual);
    const calor = classificarCalor(nasa.dias_calor_extremo_30d, nasa.temp_max_media_30d);
    const umidadeSuperficiePct = Math.round(nasa.gwettop_atual * 100);
    const municipio = formatarMunicipioExibicao(nomeExibicao, ufExibicao);

    return {
        municipio,
        data_referencia: nasa.data_referencia_nasa,
        umidade_raiz_pct: umidade.pct,
        umidade_superficie_pct: umidadeSuperficiePct,
        status_umidade: umidade.nivel,
        temp_max_media_30d: nasa.temp_max_media_30d,
        dias_calor_extremo_30d: nasa.dias_calor_extremo_30d,
        status_calor: calor.nivel,
        chuva_30d_mm: nasa.chuva_30d_mm,
        chuva_prevista_14d_mm: nasa.chuva_prevista_14d_mm,
        texto: `Dados NASA POWER para ${municipio} (ref. ${nasa.data_referencia_nasa}): umidade na zona da raiz em ${umidade.pct}% (${umidade.nivel}) e superfície em ${umidadeSuperficiePct}%, temperatura máxima média de 30 dias em ${nasa.temp_max_media_30d}°C com ${nasa.dias_calor_extremo_30d} dias de calor extremo (${calor.nivel}), chuva recente de ${nasa.chuva_30d_mm} mm e previsão base de ${nasa.chuva_prevista_14d_mm} mm para os próximos 14 dias.`
    };
}

export async function obterLeituraNasaSoloAoVivo(cidade = 'Rio Verde', { usarApisAoVivo = true } = {}) {
    const fallback = obterLeituraNasaSolo(cidade);
    if (!usarApisAoVivo) return { ...fallback, fonte: 'baseline_local' };
    try {
        const aoVivo = await obterDadosNasaAoVivo(cidade, { timeoutMs: 4200 });
        if (!aoVivo) return { ...fallback, fonte: 'baseline_local' };
        const umidade = classificarUmidadeRaiz(aoVivo.gwetroot_atual);
        const calor = classificarCalor(aoVivo.dias_calor_extremo_30d, aoVivo.temp_max_media_30d);
        const umidadeSuperficiePct = Math.round(aoVivo.gwettop_atual * 100);
        const municipio = formatarMunicipioExibicao(aoVivo.nome || cidade, aoVivo.uf || '');
        return {
            municipio,
            uf: aoVivo.uf || '',
            data_referencia: aoVivo.data_referencia_nasa,
            umidade_raiz_pct: umidade.pct,
            umidade_superficie_pct: umidadeSuperficiePct,
            status_umidade: umidade.nivel,
            temp_max_media_30d: aoVivo.temp_max_media_30d,
            dias_calor_extremo_30d: aoVivo.dias_calor_extremo_30d,
            status_calor: calor.nivel,
            chuva_30d_mm: aoVivo.chuva_30d_mm,
            chuva_prevista_14d_mm: aoVivo.chuva_prevista_14d_mm,
            fonte: 'nasa_power_ao_vivo',
            texto: `Dados NASA POWER ao vivo para ${municipio} (ref. ${aoVivo.data_referencia_nasa}): umidade na zona da raiz em ${umidade.pct}% (${umidade.nivel}) e superfície em ${umidadeSuperficiePct}%, temperatura máxima média de 30 dias em ${aoVivo.temp_max_media_30d}°C com ${aoVivo.dias_calor_extremo_30d} dias de calor extremo (${calor.nivel}), chuva recente de ${aoVivo.chuva_30d_mm} mm e previsão Open-Meteo de ${aoVivo.chuva_prevista_14d_mm} mm para os próximos 14 dias.`
        };
    } catch {
        return { ...fallback, fonte: 'baseline_local' };
    }
}

export async function avaliarRotacaoNasa({
    cidade = 'Rio Verde',
    cultura_anterior = 'soja',
    tipo_solo = '',
    prioridade = 'agua',
    tipo_semente = '',
    usarApisAoVivo = true
} = {}) {
    const baseline = carregarBaseline();
    const { poloKey, nomeExibicao, ufExibicao, poloConhecido } = resolverPoloGoias(cidade, baseline.municipios);
    const nasaBase = baseline.municipios[poloKey] || baseline.municipios.rio_verde;

    let nasaAoVivo = null;
    let ibgePam = null;
    if (usarApisAoVivo !== false) {
        const [resNasa, resIbge] = await Promise.allSettled([
            obterDadosNasaAoVivo(cidade, { timeoutMs: 4200 }),
            obterDadosAgricolasMunicipioIBGE(cidade, ufExibicao, { timeoutMs: 4200 })
        ]);
        nasaAoVivo = resNasa.status === 'fulfilled' ? resNasa.value : null;
        ibgePam = resIbge.status === 'fulfilled' ? resIbge.value : null;
    }

    const nasa = nasaAoVivo
        ? {
            ...nasaBase,
            ...nasaAoVivo,
            municipio_key: poloConhecido ? nasaBase.municipio_key : normalizarMunicipioKey(cidade),
            nome: nasaAoVivo.nome || nomeExibicao,
            uf: nasaAoVivo.uf || ufExibicao || nasaBase.uf
        }
        : nasaBase;

    const ufReal = nasaAoVivo?.uf || ibgePam?.uf || ufExibicao || (poloConhecido ? nasaBase.uf : '');
    const nomeFinal = ibgePam?.municipio || nasaAoVivo?.nome || nomeExibicao;
    const municipioRotulo = formatarMunicipioExibicao(nomeFinal, ufReal);

    const anteriorKey = normalizarCulturaKey(cultura_anterior);
    const grupoCultivo = resolverGrupoCultivo(anteriorKey);
    const sementeInfo = obterPerfilMaterial(anteriorKey, tipo_semente);
    const formatarNomeCultura = (raw) => {
        const cleaned = String(raw || '').replace(/_/g, ' ').trim();
        return cleaned ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Soja';
    };
    const anterior = CULTURAS_CERRADO[anteriorKey] || {
        key: anteriorKey,
        nome: formatarNomeCultura(cultura_anterior || anteriorKey),
        familia: 'outra',
        tolerancia_calor: 3,
        tolerancia_seca: 3,
        aporte_palhada_t_ha: 3.0,
        pragas_comuns: ['doenças de solo e pragas da mesma família', 'queda de vigor por plantio contínuo']
    };
    const soloKey = normalizarSoloKey(tipo_solo, nasa.solo_key_padrao);
    const solo = SOLOS_CERRADO[soloKey] || SOLOS_CERRADO.medio_cerrado;
    const prioKey = normalizarPrioridade(prioridade);
    const pulsoBase = obterPulsoRegional(nasaBase.municipio_key);
    const pulso = enriquecerPulsoComIBGE(pulsoBase, ibgePam);
    const saturacao = calcularSaturacaoRegional(pulso);
    const canal = obterCanalRegional(nasa, { poloConhecido, nomeExibicao: nomeFinal });

    const umidade = classificarUmidadeRaiz(nasa.gwetroot_atual);
    const calor = classificarCalor(nasa.dias_calor_extremo_30d, nasa.temp_max_media_30d);

    const avaliadosBrutos = PLANOS_CANDIDATOS
        .map((plano) => pontuarPlano(plano, {
            anterior,
            nasa,
            solo,
            prioridade: prioKey,
            pulso,
            saturacao,
            poloConhecido,
            nomeExibicao: nomeFinal,
            sementeInfo
        }));

    const naturalTop = [...avaliadosBrutos].sort((a, b) =>
        (b.score_agronomico - a.score_agronomico) ||
        (Number(b.quebra_ciclo_imediata) - Number(a.quebra_ciclo_imediata)) ||
        (b.economia_agua_pct - a.economia_agua_pct)
    )[0] || null;

    const avaliados = [...avaliadosBrutos].sort((a, b) =>
        (b.score_resiliencia - a.score_resiliencia) ||
        (Number(b.quebra_ciclo_imediata) - Number(a.quebra_ciclo_imediata)) ||
        (b.economia_agua_pct - a.economia_agua_pct)
    );

    const selos = ['#1 Recomendado', '#2 Alternativa Forte', '#3 Opção Conservadora'];
    const ranking = avaliados.slice(0, 3).map((item, idx) => ({
        posicao: idx + 1,
        selo: selos[idx],
        ...item
    }));

    const diversificouTop1 = Boolean(ranking[0] && naturalTop && ranking[0].id !== naturalTop.id);
    const pulsoEnriquecido = {
        ...pulso,
        saturacao_antimanada: {
            ativa: saturacao.ativa,
            tem_concentracao: saturacao.tem_concentracao,
            diversificou_top1: diversificouTop1,
            total_consultas_planos: saturacao.total_consultas_planos,
            plano_mais_concentrado: saturacao.plano_mais_concentrado?.titulo || null,
            concentracao_top_pct: saturacao.plano_mais_concentrado?.pct || 0,
            plano_natural_sem_trava: naturalTop?.titulo || null
        }
    };

    const decisaoTroca = avaliarTrocaCulturaOuSemente({
        anterior,
        grupoCultivo,
        sementeInfo,
        nasa,
        solo,
        saturacao,
        rankingTop1: ranking[0]
    });

    // Custos reais de maquinário, diesel por UF e retorno econômico (IBGE + Notícias Agrícolas)
    const etapa1Key = resolverEtapaInicialPlano(ranking[0]).key;
    const etapa2Key = ranking[1] ? resolverEtapaInicialPlano(ranking[1]).key : null;
    const localCotacao = `${nomeFinal}${ufReal ? `/${ufReal}` : ''}`;
    const [dieselRes, cot1Res, cot2Res] = await Promise.allSettled([
        obterPrecoDieselPorUF(ufReal || 'GO', { usarApi: usarApisAoVivo !== false, timeoutMs: 2800 }),
        usarApisAoVivo !== false ? consultarCotacaoAgro(etapa1Key, localCotacao, { timeoutMs: 3200 }) : Promise.resolve(null),
        usarApisAoVivo !== false && etapa2Key && etapa2Key !== etapa1Key
            ? consultarCotacaoAgro(etapa2Key, localCotacao, { timeoutMs: 3200 })
            : Promise.resolve(null)
    ]);
    const dieselInfo = dieselRes.status === 'fulfilled' ? dieselRes.value : null;
    const cot1 = cot1Res.status === 'fulfilled' ? cot1Res.value : null;
    const cot2 = cot2Res.status === 'fulfilled' ? cot2Res.value : null;

    const chavesCustoUnicas = [...new Set([
        etapa1Key,
        ...(etapa2Key ? [etapa2Key] : []),
        ...ranking.flatMap((item) => (item.etapas_detalhadas || []).map((e) => normalizarCulturaKey(e.cultura))),
        anteriorKey
    ].filter(Boolean))];
    const entradasCusto = await Promise.all(
        chavesCustoUnicas.map(async (cKey) => {
            const cot = cKey === etapa1Key ? cot1 : (cKey === etapa2Key ? cot2 : null);
            const det = await calcularCustoDetalhadoCultivo({
                culturaKey: cKey,
                uf: ufReal || 'GO',
                soloKey,
                tipoSementeKey: cKey === anteriorKey ? (sementeInfo?.key || '') : '',
                sobrePalhada: true,
                ibgePam,
                cotacaoAgro: cot,
                dieselInfo,
                usarApiDiesel: false
            });
            return [cKey, det];
        })
    );
    const porCulturaCusto = Object.fromEntries(entradasCusto);
    const custoTop1 = porCulturaCusto[etapa1Key] || null;
    const custoAlt = etapa2Key && etapa2Key !== etapa1Key ? (porCulturaCusto[etapa2Key] || null) : null;

    return {
        ok: true,
        contexto: {
            municipio_key: nasaBase.municipio_key,
            municipio: municipioRotulo,
            uf: ufReal,
            codigo_ibge: ibgePam?.codigo_ibge || null,
            polo_referencia: poloConhecido || nasaAoVivo ? null : nasaBase.nome,
            polo_conhecido: poloConhecido,
            microrregiao: ibgePam?.microrregiao || (poloConhecido ? nasaBase.microrregiao : nomeFinal),
            lat: nasa.lat,
            lon: nasa.lon,
            cultura_anterior: anterior.nome,
            cultura_anterior_key: anterior.key,
            grupo_cultivo: grupoCultivo.key,
            grupo_rotulo: grupoCultivo.rotulo,
            nao_arrancar_apos_colheita: grupoCultivo.naoArrancarAposColheita,
            material_propagacao: grupoCultivo.termoMaterial,
            tipo_semente: sementeInfo?.rotulo || null,
            familia_anterior: anterior.familia,
            solo: solo.nome,
            solo_key: solo.key,
            solo_resumo: solo.resumo,
            prioridade: prioKey,
            corredor_logistico: canal.corredor_rodoviario,
            compradores_principais: canal.compradores_principais
        },
        leitura_nasa: {
            fonte: nasaAoVivo
                ? `NASA POWER${nasaAoVivo.fonte_previsao_ao_vivo ? ' + Open-Meteo 14d (ao vivo)' : ' (ao vivo)'}`
                : 'Baseline local',
            data_referencia: nasa.data_referencia_nasa,
            caixa_agua_raiz_pct: umidade.pct,
            umidade_superficie_pct: Math.round(nasa.gwettop_atual * 100),
            status_umidade: umidade.nivel,
            resumo_umidade: umidade.resumo,
            chuva_30d_mm: nasa.chuva_30d_mm,
            temp_max_media_30d: nasa.temp_max_media_30d,
            dias_calor_extremo_30d: nasa.dias_calor_extremo_30d,
            status_calor: calor.nivel,
            resumo_calor: calor.resumo,
            chuva_prevista_14d_mm: nasa.chuva_prevista_14d_mm,
            et0_previsto_14d_mm: nasa.et0_previsto_14d_mm,
            balanco_hidrico_14d_mm: nasa.balanco_hidrico_14d_mm
        },
        dados_ibge: ibgePam || null,
        custo_real: {
            diesel: dieselInfo,
            top1: custoTop1,
            alt: custoAlt,
            por_cultura: porCulturaCusto
        },
        pulso_regional: pulsoEnriquecido,
        risco_monocultura: avaliarMonocultura(anterior, nasa, solo, pulsoEnriquecido, grupoCultivo),
        decisao_troca: decisaoTroca,
        ranking
    };
}

export const SEPARADOR_MENSAGEM_AGREGADA = '\n[[FOLLOWUP]]\n';

export const CONVITE_FORMA_PROFISSIONAL = '*Quer saber o custo ou algo do tipo?* Posso te passar por área, como tratar, a melhor janela no zap ou a *forma profissional* (opcional).';

const GUIA_PRATICO_CULTURAS = {
    braquiaria: {
        faixa_reais: [350, 650],
        custo_ha: 'R$ 350 a R$ 650 por hectare só pra formar cobertura (semente + plantio a lanço ou na linha)',
        retorno_bolso: 'É o caminho mais barato: protege a terra do sol, segura umidade pra próxima soja/milho e ainda pode virar pasto pro gado na seca se você mexer com criação.',
        como_tratar: [
            'Joga a semente logo depois da colheita pra aproveitar a umidade que ainda tá na terra (uns 8 a 12 kg/ha de semente boa, incorporada de leve).',
            'Se for só pra fazer palhada, quase não pede adubo na saída; se quiser pastejo forte ou soltar gado, compensa jogar um pouquinho de fósforo ou ureia depois que fechar.',
            'Quando faltar umas 3 a 4 semanas pro próximo plantio de soja ou feijão, aí faz a dessecação pra baixar a palhada no ponto certo.'
        ]
    },
    crotalaria: {
        faixa_reais: [500, 900],
        custo_ha: 'R$ 500 a R$ 900 por hectare (semente e semeadura)',
        retorno_bolso: 'Corta bem o gasto com adubo nitrogenado da próxima safra porque puxa nitrogênio do ar pra dentro da terra e derruba nematoide sem depender tanto de defensivo caro.',
        como_tratar: [
            'Planta cedo aproveitando as últimas chuvas ou essa umidade atual, em linha ou a lanço com leve gradeada.',
            'Não precisa carregar no adubo químico; só cuida pra semente pegar contato com a terra úmida pra nascer parelho.',
            'Deixa ela soltar flor e começa a manejar (rolo-faca ou dessecação) antes de granar demais, pra virar adubo vivo na sua área.'
        ]
    },
    gergelim: {
        faixa_reais: [1200, 1900],
        custo_ha: 'R$ 1.200 a R$ 1.900 por hectare (bem mais enxuto que milho ou soja)',
        retorno_bolso: 'Exige pouco investimento de entrada, aguenta sol forte e dá receita direta na venda pra cerealistas e exportação — ótimo pra fazer caixa sem arriscar muito.',
        como_tratar: [
            'Semente miúda pede cama bem feitinha e rasinha (1 a 2 cm de fundo); se enterrar fundo demais falha a germinação.',
            'Segura o mato bem limpo nos primeiros 30 dias porque no começo ele cresce devagar; depois ele mesmo fecha e sombreia.',
            'Fica de olho nas cápsulas da base: quando amarelarem, já planeja o corte/colheita cedo pra não perder grão abrindo no pé.'
        ]
    },
    sorgo: {
        faixa_reais: [1800, 2600],
        custo_ha: 'R$ 1.800 a R$ 2.600 por hectare (cerca de 30% a 40% mais barato que milho safrinha)',
        retorno_bolso: 'Gasta bem menos adubo e aguenta veranico melhor que o milho, entregando grão com saída certa pra ração/confinamento e ainda deixando muita palha.',
        como_tratar: [
            'Planta em solo firme com boa regulagem de profundidade (2 a 4 cm) pra nascer tudo junto.',
            'Uma adubação de base mais leve e uma cobertura moderada já dão conta; o segredo é entrar no limpo nos primeiros 25 dias.',
            'Vigie pulgão e pássaros na fase de cacho formando; fora isso, é uma das culturas mais rústicas do Cerrado.'
        ]
    },
    milho: {
        faixa_reais: [3500, 5200],
        custo_ha: 'R$ 3.500 a R$ 5.200 por hectare dependendo da tecnologia da semente e do adubo',
        retorno_bolso: 'Custa mais caro pra pôr no chão, então só compensa se tiver umidade segura e controle firme de cigarrinha e lagarta pra colher bem e pagar a conta.',
        como_tratar: [
            'Capricha no tratamento de semente contra cigarrinha e percevejo logo na saída e respeita a profundidade de 3 a 5 cm.',
            'Faz cobertura de nitrogênio quando o milho tiver com 4 a 6 folhas bem abertas, aproveitando previsão de chuva ou solo úmido.',
            'Acompanha toda semana pra não deixar lagarta do cartucho e cigarrinha tomarem conta no começo do ciclo.'
        ]
    },
    feijao: {
        faixa_reais: [2800, 4300],
        custo_ha: 'R$ 2.800 a R$ 4.300 por hectare',
        retorno_bolso: 'Volta rápido pro bolso porque fecha ciclo em menos de 90 dias, mas pede olho vivo em mosca-branca e fungo se chover demais.',
        como_tratar: [
            'Usa semente sã e tratada e só planta se a chuva dos próximos dias estiver firme pra não falhar no arranque.',
            'Garante fósforo bom na linha e cobertura leve de nitrogênio lá pros 20 dias após nascer.',
            'Olha debaixo das folhas por causa de mosca-branca e mofo-branco, principalmente se o tempo ficar abafado e chuvoso.'
        ]
    },
    mandioca: {
        faixa_reais: [3200, 4800],
        custo_ha: 'R$ 3.200 a R$ 4.800 por hectare no primeiro ano (manivas, preparo e capina)',
        retorno_bolso: 'Aguenta seca depois de pega e garante dinheiro na venda de raiz ou farinha, mesmo em anos mais difíceis de chuva.',
        como_tratar: [
            'Escolhe maniva sadia, sem podridão nem broca, cortada em toletes de uns 15 a 20 cm na horizontal.',
            'Mantém a roça bem limpa de mato nos primeiros 90 a 100 dias — passou disso ela fecha e segura sozinha.',
            'Fica atento ao mandarová (se aparecer, pega logo no comecinho) e ajusta a colheita conforme o preço na região.'
        ]
    },
    girassol: {
        faixa_reais: [2000, 2900],
        custo_ha: 'R$ 2.000 a R$ 2.900 por hectare',
        retorno_bolso: 'Puxa água lá de baixo com raiz profunda, quebra pragas das outras lavouras e tem demanda boa pra óleo e silagem.',
        como_tratar: [
            'Solo bem drenado sem camada dura embaixo ajuda a raiz pivotante descer fundo pra buscar água.',
            'Aduba bem com boro junto na base porque girassol sente muita falta de boro pra encher capítulo.',
            'Evita plantar onde dá muita chuva pesada na época da floração pra não favorecer mancha-de-alternária.'
        ]
    },
    soja: {
        faixa_reais: [3800, 5500],
        custo_ha: 'R$ 3.800 a R$ 5.500 por hectare (semente, adubo, inoculante e defensivos)',
        retorno_bolso: 'Só paga bem se entrar em solo descansado e com palhada; repetir na mesma área aumenta gasto com fungicida e risco de perda.',
        como_tratar: [
            'Sempre inocula a semente com bactéria boa na hora de plantar e evita plantar em cima de resto da mesma soja recém-colhida.',
            'Mantém monitoramento pesado contra ferrugem-asiática e percevejo desde o florescimento.',
            'Se for área repetida, faz rotação antes com braquiária, sorgo ou crotalária pra não jogar dinheiro fora.'
        ]
    },
    tomate: {
        faixa_reais: [12000, 22000],
        custo_ha: 'Custo alto de manejo intensivo (varia muito entre estaca/gotejo e canteiro)',
        retorno_bolso: 'Dá ótimo dinheiro por caixa quando acerta o preço, mas não perdoa descuido com água, doença ou falta de comprador combinado.',
        como_tratar: [
            'Só entra se tiver água garantida na mão (irrigação) e drenagem boa pra não encharcar raiz.',
            'Monitora toda semana requeima, pinta-preta, traça e mosca-branca — perdeu janela de cuidado, cai produção rápido.',
            'Combina venda na CEASA ou supermercado regional antes mesmo de colheita forte pra não ficar na mão.'
        ]
    },
    pasto_fraco: {
        faixa_reais: [600, 1300],
        custo_ha: 'R$ 600 a R$ 1.300 por hectare na reforma (gradagem leve, semente e correção inicial)',
        retorno_bolso: 'Reformar pasto cansado ou intercalar lavoura rápida dobra a lotação depois e recupera o ganho do gado.',
        como_tratar: [
            'Descompacta só o necessário onde o gado pisoteou demais e corrige o básico antes de jogar a semente.',
            'Dá pra consorciar com sorgo ou milho na saída pra já pagar parte da reforma com silagem ou grão.',
            'Respeita o tempo de formação sem soltar o gado cedo demais antes do capim enraizar bem.'
        ]
    }
};

function limparNomeCulturaFala(nome = '') {
    return String(nome || '')
        .replace(/\((?:palhada|cobertura|adubo verde|grão|grao)\)/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function formatarSequenciaFala(top1, primeiraPlanta) {
    const etapasBrutas = Array.isArray(top1?.etapas) && top1.etapas.length
        ? top1.etapas.map((e) => limparNomeCulturaFala(e.nome))
        : String(top1?.titulo || '').split('→').map((s) => limparNomeCulturaFala(s)).filter(Boolean);
    const primeiraLimpa = limparNomeCulturaFala(primeiraPlanta) || etapasBrutas[0] || 'braquiária';
    const restantes = etapasBrutas.slice(1).filter(Boolean);
    if (restantes.length >= 2) {
        return `plantar ${primeiraLimpa} primeiro, depois seguir com ${restantes.slice(0, -1).join(', ')} e ${restantes[restantes.length - 1]}`;
    }
    if (restantes.length === 1) {
        return `plantar ${primeiraLimpa} primeiro e depois seguir com ${restantes[0]}`;
    }
    return `entrar com ${primeiraLimpa} primeiro`;
}

function limparTrechoNatural(txt = '', { removerParenteses = false } = {}) {
    let out = String(txt || '').trim();
    if (removerParenteses) {
        out = out
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/\b(BR|GO|MT|MS|DF)-(\d+)\b/gi, '$1 $2');
    } else {
        out = out.replace(/\s*\([^)]*\b(?:kg|t)\/ha\b[^)]*\)/gi, '');
    }
    return out
        .replace(/\b(\d+)\s*d\b/gi, '$1 dias')
        .replace(/\bmm\b/gi, (m) => (removerParenteses ? 'milímetros' : m))
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function resumirBeneficioComparacao(item, { paraFala = false } = {}) {
    if (!item) return '';
    const partes = [];
    if (item.economia_agua_pct) {
        partes.push(paraFala ? `segura ${item.economia_agua_pct} por cento de água` : `segura +${item.economia_agua_pct}% de água`);
    }
    if (item.balanco_nitrogenio_kg_ha >= 40) {
        partes.push('reduz adubo químico');
    } else if (item.quebra_ciclo_imediata) {
        partes.push('corta pragas com menos veneno');
    }
    return partes.join(' e ');
}

function resumirPorQueNatural(r, top1, etapa1Key) {
    const anteriorNome = r?.contexto?.cultura_anterior || 'safra anterior';
    const guia1 = GUIA_PRATICO_CULTURAS[etapa1Key];
    const partes = [];
    if (top1?.quebra_ciclo_imediata) {
        partes.push(`quebra o ciclo de pragas de ${anteriorNome} e ajuda a usar menos veneno`);
    }
    if (top1?.economia_agua_pct) {
        partes.push(`cobre a terra segurando cerca de +${top1.economia_agua_pct}% mais umidade`);
    }
    const descBolso = guia1?.retorno_bolso ? limparTrechoNatural(guia1.retorno_bolso) : '';
    if ((top1?.balanco_nitrogenio_kg_ha || 0) >= 40 && !/nitrog|adub/i.test(descBolso)) {
        partes.push('enriquece o solo com nitrogênio natural gastando menos adubo');
    }
    if (descBolso) {
        partes.push(descBolso.charAt(0).toLowerCase() + descBolso.slice(1));
    }
    return partes.join(', ').replace(/\.+$/, '') + '.';
}

/**
 * Monta um dossiê completo em fatos reais (sem jargão proibido) para a IA gerar uma resposta
 * natural, única e detalhada sobre rotação, riscos, porquê, guia de início e escoamento.
 */
export function montarContextoRotacaoParaIA(r) {
    if (!r?.ok || !r.ranking?.length) return '';
    const top1 = r.ranking[0];
    const top2 = r.ranking[1];
    const top3 = r.ranking[2];
    const n = r.leitura_nasa;
    const c = r.contexto;
    const sat = r.pulso_regional?.saturacao_antimanada;
    const etapa1 = resolverEtapaInicialPlano(top1);
    const guia1 = GUIA_PRATICO_CULTURAS[etapa1.key];
    const primeiraPlanta = top1.etapas?.[0]?.nome || top1.titulo.split('→')[0]?.trim() || etapa1.nome;
    const chuvaMm = Math.round(Number(n.chuva_prevista_14d_mm || 0));
    const motivosRisco = (r.risco_monocultura?.motivos || []).map((m) => limparTrechoNatural(m)).filter(Boolean);
    const passoInicial = guia1?.como_tratar?.[0] ? limparTrechoNatural(guia1.como_tratar[0]) : '';
    const antimanadaInfo = sat?.diversificou_top1
        ? `Trava anti-efeito manada ativa: muita gente na região já buscou ${sat.plano_mais_concentrado?.split('→')[0]?.trim()} (${sat.concentracao_top_pct}% das consultas). Recomendamos ${primeiraPlanta} pra evitar todo mundo plantar a mesma coisa e cair preço/faltar frete.`
        : sat?.tem_concentracao
            ? `Alerta regional anti-manada: ${sat.concentracao_top_pct}% das consultas no polo já vão em ${sat.plano_mais_concentrado?.split('→')[0]?.trim()}. Compare as 3 opções abaixo para não saturar a oferta.`
            : '';

    const avaliacaoAnteriorLinha = c.nao_arrancar_apos_colheita
        ? `Cultura ${c.cultura_anterior} (${c.grupo_rotulo}): NÃO se arranca após uma colheita. ${r.decisao_troca?.resumo || ''}`
        : `Avaliação de repetir ${c.cultura_anterior}: ${r.risco_monocultura?.nivel_risco || 'Risco Moderado-Alto'}. Riscos principais: ${motivosRisco.join(' ')}`;

    const custoIA1 = r.custo_real?.top1;
    const custoIA2 = r.custo_real?.alt;
    const custoResumoIA = custoIA1
        ? `Custo operacional estimado (${primeiraPlanta}): ~R$ ${custoIA1.coe_por_ha.toLocaleString('pt-BR')}/ha — Maquinário+Diesel: R$ ${custoIA1.maquinario.total_maquinario_ha.toLocaleString('pt-BR')}/ha (${custoIA1.maquinario.horas_maquina_ha}h máquina, diesel ${custoIA1.uf} R$ ${custoIA1.diesel_preco_litro.toFixed(2).replace('.', ',')}/L); Insumos: R$ ${custoIA1.insumos.total_insumos_ha.toLocaleString('pt-BR')}/ha.${custoIA1.retorno_financeiro_real ? ` Receita média estimada (${custoIA1.retorno_financeiro_real.praca_cotacao}, IBGE ${custoIA1.retorno_financeiro_real.ano_ibge}): ~R$ ${custoIA1.retorno_financeiro_real.receita_bruta_ha.toLocaleString('pt-BR')}/ha.` : ''}${custoIA2 ? ` | Alternativa #2 (${custoIA2.cultura}): COE ~R$ ${custoIA2.coe_por_ha.toLocaleString('pt-BR')}/ha (Maquinário+Diesel R$ ${custoIA2.maquinario.total_maquinario_ha.toLocaleString('pt-BR')}/ha).` : ''}`
        : '';

    return [
        `Cidade: ${c.municipio} (solo predominante: ${c.solo})${c.polo_referencia ? ` [estação NASA de referência mais próxima: ${c.polo_referencia}]` : ''}`,
        `Cultura anterior: ${c.cultura_anterior}${c.tipo_semente ? ` (${c.tipo_semente})` : ''} | Grupo: ${c.grupo_rotulo}`,
        `Clima/Solo NASA agora (${n.fonte || 'NASA POWER'}): umidade na raiz em ${n.caixa_agua_raiz_pct}% (${n.status_umidade}), previsão de ${chuvaMm} mm nos próximos 14 dias (${n.status_calor}).`,
        r.dados_ibge?.culturas_dominantes?.length
            ? `Culturas líderes no município (IBGE PAM ${r.dados_ibge.ano_referencia || ''}): ${r.dados_ibge.culturas_dominantes.slice(0, 3).map((x) => `${x.nome_curto} (${x.share_pct}%)`).join(', ')}.`
            : '',
        avaliacaoAnteriorLinha,
        r.decisao_troca?.recomendacao_semente ? `Semente/material indicado: ${r.decisao_troca.recomendacao_semente}` : '',
        r.decisao_troca?.quando_trocar_campo ? `Quando trocar no campo: ${r.decisao_troca.quando_trocar_campo}` : '',
        c.nao_arrancar_apos_colheita
            ? `Melhor manejo de entrelinha (#1): plantar ${primeiraPlanta} nas ruas (sequência ${top1.titulo}).`
            : `Melhor rotação recomendada (#1): entrar com ${primeiraPlanta} primeiro (sequência ${top1.titulo}).`,
        `Por que essa rotação funciona: ${resumirPorQueNatural(r, top1, etapa1.key)}`,
        custoResumoIA,
        antimanadaInfo,
        `Quando começar (janela): ${top1.janela_plantio}`,
        passoInicial ? `Como dar a largada (guia básico): ${passoInicial}` : '',
        top1.escoamento?.canal_recomendado ? `Onde escoar/vender perto (~${top1.escoamento.distancia_media_km} km): ${top1.escoamento.canal_recomendado}` : '',
        top2 ? `Alternativa #2 para comparar: ${top2.titulo} (${resumirBeneficioComparacao(top2)}; venda: ${top2.escoamento?.canal_recomendado || ''})` : '',
        top3 ? `Alternativa #3 para comparar: ${top3.titulo} (${resumirBeneficioComparacao(top3)}; venda: ${top3.escoamento?.canal_recomendado || ''})` : ''
    ].filter(Boolean).join('\n');
}

/**
 * Formata a recomendação completa de plantio, riscos, porquê, guia de início, 3 opções e trava anti-manada em linguagem natural,
 * deixando o acompanhamento de custos, manejo detalhado, janela e forma profissional como continuação agregada.
 */
export function formatarRotacaoNaturalWhatsApp(r, { paraFala = false } = {}) {
    if (!r?.ok || !r.ranking?.length) {
        return 'Não consegui puxar os dados daqui agora. Me fala de qual cidade você tá falando e o que colheu por último!';
    }
    const top1 = r.ranking[0];
    const top2 = r.ranking[1];
    const top3 = r.ranking[2];
    const n = r.leitura_nasa;
    const c = r.contexto;
    const sat = r.pulso_regional?.saturacao_antimanada;
    const cidadeNome = String(c.municipio || '').split(' - ')[0].trim() || c.municipio;
    const etapa1 = resolverEtapaInicialPlano(top1);
    const guia1 = GUIA_PRATICO_CULTURAS[etapa1.key];
    const primeiraPlanta = top1.etapas?.[0]?.nome || top1.titulo.split('→')[0]?.trim() || etapa1.nome;
    const chuvaMm = Math.round(Number(n.chuva_prevista_14d_mm || 0));

    const riscoBaixo = /baixo/i.test(r.risco_monocultura?.nivel_risco || '');
    const motivoBruto0 = String(r.risco_monocultura?.motivos?.[0] || 'puxa praga e doença da safra anterior').replace(/\.$/, '');
    const motivoBruto1 = String(r.risco_monocultura?.motivos?.[1] || '')
        .replace(/\.$/, '')
        .replace(/\s*e\s+raiz\s+em\s+\d+%/i, '');
    const motivo0Lower = motivoBruto0.charAt(0).toLowerCase() + motivoBruto0.slice(1);
    const motivo1Lower = motivoBruto1 ? (motivoBruto1.charAt(0).toLowerCase() + motivoBruto1.slice(1)) : '';
    const porQueSimples = resumirPorQueNatural(r, top1, etapa1.key);
    const primeiroPassoLimpo = guia1?.como_tratar?.[0]
        ? limparTrechoNatural(guia1.como_tratar[0], { removerParenteses: paraFala })
        : '';

    if (paraFala) {
        const culturaAnteriorLimpa = limparNomeCulturaFala(c.cultura_anterior);
        const primeiraPlantaFala = limparNomeCulturaFala(primeiraPlanta);
        const aberturaFala = c.nao_arrancar_apos_colheita
            ? `Em ${cidadeNome}, a raiz tá com ${n.caixa_agua_raiz_pct} por cento de umidade e ${chuvaMm} milímetros previstos em 14 dias. Como ${culturaAnteriorLimpa} é cultivo permanente, não se arranca após a colheita: o ganho é cobrir as entrelinhas.`
            : riscoBaixo
                ? `Em ${cidadeNome}, a raiz tá com ${n.caixa_agua_raiz_pct} por cento de umidade e ${chuvaMm} milímetros previstos em 14 dias. Alternar agora protege a terra.`
                : `Em ${cidadeNome}, a raiz tá com ${n.caixa_agua_raiz_pct} por cento de umidade e ${chuvaMm} milímetros em 14 dias. Repetir ${culturaAnteriorLimpa} não compensa, pois ${limparTrechoNatural(motivo0Lower, { removerParenteses: true })}.`;
        const motivoCurtoFala = top1.quebra_ciclo_imediata
            ? `quebra pragas com menos veneno e segura mais água`
            : `cobre a terra e protege a umidade`;
        const rotacaoFala = c.nao_arrancar_apos_colheita
            ? `Nas entrelinhas, a melhor opção é ${formatarSequenciaFala(top1, primeiraPlanta)}, que ${motivoCurtoFala}.`
            : `A melhor opção é ${formatarSequenciaFala(top1, primeiraPlanta)}, que ${motivoCurtoFala}.`;
        const antimanadaFala = sat?.diversificou_top1
            ? `Pra fugir do efeito manada na região, essa troca evita plantar igual à maioria.`
            : '';
        const janelaCurta = limparTrechoNatural(top1.janela_plantio, { removerParenteses: true }).split('.')[0];
        const janelaFala = `Pra começar com ${primeiraPlantaFala}: ${janelaCurta}.`;
        const canalFalaBruto = limparTrechoNatural(top1.escoamento?.canal_recomendado || '', { removerParenteses: true })
            .split(';')[0]
            .slice(0, 95)
            .replace(/[.,;:\s]+$/, '');
        const escoamentoFala = canalFalaBruto
            ? `Na venda perto, procure ${canalFalaBruto}.`
            : '';
        const nomeOpcFala = (op) => {
            if (!op) return '';
            const etapas = op.titulo.split('→').map((s) => limparNomeCulturaFala(s.trim())).filter(Boolean);
            if (!etapas[0]) return '';
            return etapas[0] === primeiraPlantaFala && etapas[1]
                ? `${etapas[0]} com ${etapas[1]}`
                : etapas[0];
        };
        const alt2Nome = nomeOpcFala(top2);
        const alt3Nome = nomeOpcFala(top3);
        const compararFala = alt2Nome && alt3Nome && alt2Nome !== alt3Nome
            ? `Outras opções pra comparar: ${alt2Nome} e ${alt3Nome}.`
            : alt2Nome
                ? `Outra opção pra comparar: ${alt2Nome}.`
                : '';
        const conviteFala = `Se quiser custo, manejo ou comparar as três, manda outro áudio.`;

        const montar = (incluirComparar, incluirAnti) => [
            aberturaFala,
            rotacaoFala,
            incluirAnti ? antimanadaFala : '',
            janelaFala,
            escoamentoFala,
            incluirComparar ? compararFala : '',
            conviteFala
        ].filter(Boolean).join(' ');

        let fala = montar(true, true);
        if (fala.length > 780) fala = montar(true, false);
        if (fala.length > 780) fala = montar(false, false);
        return fala;
    }

    const nivelRiscoCurto = String(r.risco_monocultura?.nivel_risco || 'risco alto').toLowerCase();
    const abertura = c.nao_arrancar_apos_colheita
        ? `*${c.cultura_anterior}* é cultivo *${c.grupo_rotulo}* e *não se arranca após a colheita* para rotacionar. Em *${cidadeNome}* (raiz em *${n.caixa_agua_raiz_pct}%* de umidade e *${chuvaMm} mm* previstos nos próximos 14 dias), o segredo está em proteger as *entrelinhas* — só reforme o talhão se estiver velho ou com doença severa.`
        : riscoBaixo
            ? `Em *${cidadeNome}*, a raiz está em *${n.caixa_agua_raiz_pct}%* de umidade com *${chuvaMm} mm* previstos nos próximos 14 dias. Alternar agora ajuda a proteger a terra e segurar água.`
            : `Em *${cidadeNome}*, a raiz está em *${n.caixa_agua_raiz_pct}%* de umidade com *${chuvaMm} mm* de chuva previstos nos próximos 14 dias. Repetir *${c.cultura_anterior}* agora *não vale a pena* (${nivelRiscoCurto}): ${motivo0Lower}${motivo1Lower ? `; ${motivo1Lower}` : ''}.`;

    const satCulturaNome = sat?.plano_mais_concentrado?.split('→')[0]?.trim() || '';
    const notaAntimanada = sat?.diversificou_top1 && satCulturaNome
        ? ` Além disso, como *${sat.concentracao_top_pct}%* das consultas na região já vão de ${satCulturaNome}, essa troca evita efeito manada e defende seu preço na venda.`
        : '';
    const notaSementeTroca = (!c.nao_arrancar_apos_colheita && r.decisao_troca?.destacar_no_natural && r.decisao_troca?.recomendacao_semente)
        ? ` ${r.decisao_troca.recomendacao_semente}`
        : '';

    const blocoSugestao = c.nao_arrancar_apos_colheita
        ? `• *Manejo de entrelinhas e cobertura:* semear *${primeiraPlanta}* nas ruas (*${top1.titulo}*). Essa cobertura ${porQueSimples.charAt(0).toLowerCase() + porQueSimples.slice(1)}`
        : `• *Sugestão e por quê:* entre com *${primeiraPlanta}* primeiro (*${top1.titulo}*). Essa escolha ${porQueSimples.charAt(0).toLowerCase() + porQueSimples.slice(1)}${notaAntimanada}${notaSementeTroca}`;
    const blocoGuiaInicio = `• *Quando e como começar:* ${top1.janela_plantio}${primeiroPassoLimpo ? ` Na largada: ${primeiroPassoLimpo.charAt(0).toLowerCase() + primeiroPassoLimpo.slice(1)}` : ''}`;
    const blocoEscoamento = top1.escoamento?.canal_recomendado
        ? `• *Onde vender perto:* ${top1.escoamento.canal_recomendado}`
        : '';
    const blocoComparar = top2 && top3
        ? `• *Outras opções pra comparar:* 2ª *${top2.titulo}* (${resumirBeneficioComparacao(top2)}); 3ª *${top3.titulo}* (${resumirBeneficioComparacao(top3)}).`
        : top2
            ? `• *Outra opção pra comparar:* 2ª *${top2.titulo}* (${resumirBeneficioComparacao(top2)}).`
            : '';

    const corpoPrincipal = [
        abertura,
        [blocoSugestao, blocoGuiaInicio, blocoEscoamento, blocoComparar].filter(Boolean).join('\n\n')
    ].filter(Boolean).join('\n\n');

    return `${corpoPrincipal}${SEPARADOR_MENSAGEM_AGREGADA}${CONVITE_FORMA_PROFISSIONAL}`;
}

function resolverEtapaInicialPlano(plano) {
    if (!plano) return { key: 'braquiaria', nome: 'Braquiária' };
    if (plano.etapas?.[0]?.key) return plano.etapas[0];
    const nome0 = plano.etapas_detalhadas?.[0]?.cultura
        || plano.titulo?.split('→')?.[0]?.trim()
        || '';
    const key0 = normalizarCulturaKey(nome0);
    return {
        key: key0,
        nome: CULTURAS_CERRADO[key0]?.nome || nome0 || 'Braquiária'
    };
}

function resolverDadosDetalheRotacao(r, culturaAlvoKey = null) {
    const top1 = r.ranking[0];
    const top2 = r.ranking[1];
    const c = r.contexto;
    const n = r.leitura_nasa;
    const cidadeNome = String(c.municipio || '').split(' - ')[0].trim() || c.municipio;

    const etapaAlvo = (culturaAlvoKey && CULTURAS_CERRADO[culturaAlvoKey])
        ? { key: culturaAlvoKey, nome: CULTURAS_CERRADO[culturaAlvoKey].nome }
        : resolverEtapaInicialPlano(top1);
    const etapaAlt = top2 ? resolverEtapaInicialPlano(top2) : null;

    const fmtR = (v) => `R$ ${Number(v).toLocaleString('pt-BR')}`;
    const custoRealAlvo = r.custo_real?.por_cultura?.[etapaAlvo.key] || null;
    const custoRealAlt = etapaAlt ? (r.custo_real?.por_cultura?.[etapaAlt.key] || null) : null;
    const enriquecerGuia = (guiaBase, cReal) => {
        if (!cReal) return guiaBase;
        return {
            ...guiaBase,
            faixa_reais: cReal.faixa_coe_ha,
            custo_ha: `${fmtR(cReal.coe_por_ha)} por hectare (faixa de ${fmtR(cReal.faixa_coe_ha[0])} a ${fmtR(cReal.faixa_coe_ha[1])})`,
            custo_real: cReal
        };
    };
    const guiaPrincipal = enriquecerGuia(GUIA_PRATICO_CULTURAS[etapaAlvo.key] || GUIA_PRATICO_CULTURAS.braquiaria, custoRealAlvo);
    const guiaAlt = etapaAlt ? enriquecerGuia(GUIA_PRATICO_CULTURAS[etapaAlt.key], custoRealAlt) : null;

    const planoComCultura = r.ranking.find((item) =>
        item.etapas_detalhadas?.some((e) => normalizarCulturaKey(e.cultura) === etapaAlvo.key)
    ) || top1;
    const poloConhecido = c.polo_conhecido !== false;
    const canal = obterCanalRegional({ municipio_key: c.municipio_key, nome: cidadeNome }, { poloConhecido, nomeExibicao: cidadeNome });
    let ondeVender = canal.canais_por_cultura?.[etapaAlvo.key];
    if (!ondeVender) {
        if (etapaAlvo.key === 'braquiaria') {
            ondeVender = `A braquiária costuma virar economia dentro da própria roça (palhada pra segurar umidade ou pasto pro gado na seca), mas semente e feno têm saída com pecuaristas e lojas agro na região (${canal.compradores_principais}).`;
        } else if (etapaAlvo.key === 'crotalaria') {
            ondeVender = `A crotalária trabalha primeiro como adubo verde dentro da tua terra pra cortar gasto com ureia/defensivo, ou com venda de sementes pra cerealistas e revendas da região.`;
        } else {
            ondeVender = planoComCultura?.escoamento?.canal_recomendado || canal.compradores_principais;
        }
    }
    const distKm = planoComCultura?.escoamento?.distancia_media_km || canal.distancia_media_entrega_km;
    const materiaisEtapa = MATERIAIS_POR_CULTIVO[etapaAlvo.key]
        ? Object.values(MATERIAIS_POR_CULTIVO[etapaAlvo.key])
        : (MATERIAIS_POR_CULTIVO[c.cultura_anterior_key] ? Object.values(MATERIAIS_POR_CULTIVO[c.cultura_anterior_key]) : []);

    return {
        top1, top2, c, n, cidadeNome,
        etapaAlvo, etapaAlt, guiaPrincipal, guiaAlt,
        canal, ondeVender, distKm, materiaisEtapa
    };
}

/**
 * Monta um dossiê enxuto e travado com fatos reais para a IA redigir respostas únicas e naturais.
 */
export function montarContextoDetalheRotacao(r, modo = 'custo', culturaAlvoKey = null) {
    if (!r?.ok || !r.ranking?.length) return '';
    const {
        top1, n, c, cidadeNome,
        etapaAlvo, etapaAlt, guiaPrincipal, guiaAlt,
        canal, ondeVender, distKm, materiaisEtapa
    } = resolverDadosDetalheRotacao(r, culturaAlvoKey);

    if (modo === 'semente') {
        const opcoesTexto = (materiaisEtapa || []).map((m) => `- ${m.rotulo}: ${m.quandoUsar} (Escoamento: ${m.focoEscoamento})`);
        return [
            `Cidade: ${cidadeNome} (umidade raiz: ${n.caixa_agua_raiz_pct}%)`,
            `Cultura foco: ${etapaAlvo.nome} | Cultura anterior: ${c.cultura_anterior}`,
            r.decisao_troca?.resumo ? `Decisão trocar cultura vs semente: ${r.decisao_troca.resumo}` : '',
            r.decisao_troca?.quando_trocar_campo ? `Sinais no campo para trocar: ${r.decisao_troca.quando_trocar_campo}` : '',
            ...(opcoesTexto.length ? ['Opções por tipo de semente/material:', ...opcoesTexto] : [])
        ].filter(Boolean).join('\n');
    }

    if (modo === 'custo') {
        const cr = guiaPrincipal.custo_real;
        const linhas = [
            `Cidade: ${cidadeNome}`,
            `Cultura principal: ${etapaAlvo.nome}`,
            `Investimento por hectare (COE): ${guiaPrincipal.custo_ha}`,
            cr ? `Maquinário e diesel (${cr.uf}, diesel a R$ ${cr.diesel_preco_litro.toFixed(2).replace('.', ',')}/L via ${cr.diesel_fonte}): R$ ${cr.maquinario.total_maquinario_ha.toLocaleString('pt-BR')}/ha (${cr.maquinario.horas_maquina_ha}h máquina + ${cr.maquinario.diesel_litros_ha} L diesel = R$ ${cr.maquinario.diesel_reais_ha.toLocaleString('pt-BR')})` : '',
            cr ? `Insumos e manejo por ha: Sementes/mudas R$ ${cr.insumos.sementes_mudas_ha.toLocaleString('pt-BR')} | Adubo/corretivos R$ ${cr.insumos.fertilizantes_corretivos_ha.toLocaleString('pt-BR')} | Defensivos/outros R$ ${(cr.insumos.defensivos_manejo_ha + cr.insumos.servicos_outros_ha).toLocaleString('pt-BR')}` : '',
            cr?.retorno_financeiro_real ? `Retorno real estimado (${cr.retorno_financeiro_real.praca_cotacao} em ${cr.retorno_financeiro_real.data_cotacao} × produtividade IBGE ${cr.retorno_financeiro_real.ano_ibge}): ${cr.retorno_financeiro_real.produtividade_unidades_ha} ${cr.retorno_financeiro_real.unidade}/ha a R$ ${cr.retorno_financeiro_real.preco_unitario.toFixed(2).replace('.', ',')} → receita ~R$ ${cr.retorno_financeiro_real.receita_bruta_ha.toLocaleString('pt-BR')}/ha (ponto de equilíbrio: ${cr.retorno_financeiro_real.ponto_equilibrio_unidades_ha} ${cr.retorno_financeiro_real.unidade}/ha)` : '',
            `Retorno prático esperado: ${guiaPrincipal.retorno_bolso}`
        ].filter(Boolean);
        if (etapaAlt && etapaAlt.key !== etapaAlvo.key && guiaAlt) {
            linhas.push(`Alternativa comercial (${etapaAlt.nome}): ${guiaAlt.custo_ha}. ${guiaAlt.retorno_bolso}`);
        }
        linhas.push('Se o produtor quiser conta exata fechada em reais, convide-o naturalmente a informar quantos hectares ou alqueires tem.');
        return linhas.join('\n');
    }

    if (modo === 'escoamento') {
        return [
            `Cidade: ${cidadeNome}`,
            `Cultura para venda/uso: ${etapaAlvo.nome}`,
            `Distância média de entrega: cerca de ${distKm} quilômetros`,
            `Compradores e canais locais: ${ondeVender}`,
            `Corredor logístico: ${canal.corredor_rodoviario}`
        ].join('\n');
    }

    if (modo === 'manejo') {
        return [
            `Cidade: ${cidadeNome}`,
            `Cultura recomendada no manejo: ${etapaAlvo.nome}`,
            `Quando começar (janela pela NASA/clima): ${top1.janela_plantio}`,
            `Por que vale a pena esse caminho: ${guiaPrincipal.retorno_bolso}`,
            `Passos técnicos de plantio e condução (Cerrado/Embrapa):`,
            ...guiaPrincipal.como_tratar.map((p, idx) => `- Passo ${idx + 1}: ${p}`)
        ].join('\n');
    }

    if (modo === 'janela_contato') {
        return [
            `Cidade: ${cidadeNome}`,
            `Umidade atual na raiz (NASA): ${n.caixa_agua_raiz_pct}%`,
            `Chuva prevista nos próximos 14 dias: ${Math.round(Number(n.chuva_prevista_14d_mm || 0))} mm`,
            `Melhor janela recomendada: ${top1.janela_plantio}`,
            `Ações JÁ EXECUTADAS no sistema neste momento: aviso matinal diário das 6h ativado e lembrete marcado para daqui 5 dias para reavaliar a umidade antes do plantio.`
        ].join('\n');
    }

    return '';
}

/**
 * Gera a resposta prática de acompanhamento quando o produtor responde à pergunta agregada
 * perguntando sobre custos, cálculo de área, como cuidar/tratar, escoamento ou janela + contato contínuo.
 */
export function formatarDetalheRotacaoWhatsApp(r, modo = 'custo', culturaAlvoKey = null, opcoes = {}) {
    if (!r?.ok || !r.ranking?.length) {
        return 'Me fala tua cidade e qual planta você quer ver que eu já calculo o custo e os cuidados pra você!';
    }

    const {
        top1, n, c, cidadeNome,
        etapaAlvo, etapaAlt, guiaPrincipal, guiaAlt,
        canal, ondeVender, distKm, materiaisEtapa
    } = resolverDadosDetalheRotacao(r, culturaAlvoKey);

    const ehFala = Boolean(opcoes?.paraFala);
    const nomeAlvoFala = limparNomeCulturaFala(etapaAlvo.nome);
    const nomeAltFala = etapaAlt ? limparNomeCulturaFala(etapaAlt.nome) : '';

    if (modo === 'semente') {
        const resumoTroca = r.decisao_troca?.resumo || '';
        const sinais = r.decisao_troca?.quando_trocar_campo || '';
        if (ehFala) {
            const topMat = materiaisEtapa?.[0];
            return `${resumoTroca} ${topMat ? `Sobre material, ${topMat.rotulo}: ${topMat.quandoUsar}` : ''} ${sinais}`.replace(/\s+/g, ' ').trim();
        }
        const itens = (materiaisEtapa || []).map((m) => `• *${m.rotulo}:* ${m.quandoUsar} _Escoamento:_ ${m.focoEscoamento}`);
        return [
            `Sobre *trocar o plantio ou o tipo de semente* aí em *${cidadeNome}*:`,
            resumoTroca,
            ...itens,
            sinais ? `• *Quando virar a chave na roça:* ${sinais}` : ''
        ].filter(Boolean).join('\n\n');
    }

    if (modo === 'custo') {
        const cr = guiaPrincipal.custo_real;
        if (ehFala) {
            const altTexto = (etapaAlt && etapaAlt.key !== etapaAlvo.key && guiaAlt)
                ? `Se preferir ir direto em ${nomeAltFala}, fica por volta de ${guiaAlt.custo_ha}. ${guiaAlt.retorno_bolso}`
                : '';
            const maqFala = cr
                ? `Nisso entram cerca de ${cr.maquinario.total_maquinario_ha.toLocaleString('pt-BR')} reais por hectare de maquinário e diesel a ${cr.diesel_preco_litro.toFixed(2).replace('.', ',')} reais o litro em ${cr.uf}. `
                : '';
            return [
                `Olha, falando de investimento em ${cidadeNome}, plantar ${nomeAlvoFala} sai na faixa de ${guiaPrincipal.custo_ha}. ${maqFala}${guiaPrincipal.retorno_bolso}`,
                altTexto,
                `Se quiser que eu faça a conta fechada pro tamanho da tua roça, me manda um áudio falando quantos hectares ou alqueires você vai mexer.`
            ].filter(Boolean).join(' ');
        }
        const detalheMaq = cr
            ? `• *Maquinário e diesel (${cr.uf}):* ~*R$ ${cr.maquinario.total_maquinario_ha.toLocaleString('pt-BR')}/ha* (${cr.maquinario.horas_maquina_ha}h máquina + ${cr.maquinario.diesel_litros_ha} L de diesel a R$ ${cr.diesel_preco_litro.toFixed(2).replace('.', ',')}/L via ${cr.diesel_fonte}).\n• *Sementes, adubo e manejo:* ~*R$ ${cr.insumos.total_insumos_ha.toLocaleString('pt-BR')}/ha* (sementes/mudas R$ ${cr.insumos.sementes_mudas_ha.toLocaleString('pt-BR')}, adubo R$ ${cr.insumos.fertilizantes_corretivos_ha.toLocaleString('pt-BR')}, defensivos/outros R$ ${(cr.insumos.defensivos_manejo_ha + cr.insumos.servicos_outros_ha).toLocaleString('pt-BR')}).`
            : '';
        const detalheRetornoReal = cr?.retorno_financeiro_real
            ? `• *Referência de retorno (${cr.retorno_financeiro_real.praca_cotacao} · IBGE ${cr.retorno_financeiro_real.ano_ibge}):* média de ${cr.retorno_financeiro_real.produtividade_unidades_ha} ${cr.retorno_financeiro_real.unidade}/ha × R$ ${cr.retorno_financeiro_real.preco_unitario.toFixed(2).replace('.', ',')} ≈ *R$ ${cr.retorno_financeiro_real.receita_bruta_ha.toLocaleString('pt-BR')}/ha* (equilíbrio em ${cr.retorno_financeiro_real.ponto_equilibrio_unidades_ha} ${cr.retorno_financeiro_real.unidade}/ha).`
            : '';
        const linhas = [
            `Falando de dinheiro pra tua área aí em *${cidadeNome}*:`,
            `• *${etapaAlvo.nome}:* sai na faixa de *${guiaPrincipal.custo_ha}*. ${guiaPrincipal.retorno_bolso}`,
            detalheMaq,
            detalheRetornoReal,
            (etapaAlt && etapaAlt.key !== etapaAlvo.key && guiaAlt)
                ? `• Se preferir ir direto em *${etapaAlt.nome}* (opção comercial da região): fica por volta de *${guiaAlt.custo_ha}*. ${guiaAlt.retorno_bolso}`
                : '',
            `Quer que eu faça a conta fechada pro tamanho da tua roça? Só me falar quantos hectares ou alqueires você vai mexer! Se quiser também, te explico *como cuidar desse plantio do zero* ou *fico em contato te avisando a melhor janela*.`
        ].filter(Boolean);
        return linhas.join('\n\n');
    }

    if (modo === 'calculo_area') {
        const qtd = Math.max(0.1, Number(opcoes?.areaQuantidade) || 1);
        const ehAlqueire = opcoes?.areaUnidade === 'alqueires';
        const hectares = ehAlqueire ? qtd * 4.84 : qtd;
        const [minHa, maxHa] = guiaPrincipal.faixa_reais || [350, 650];
        const totalMin = Math.round(minHa * hectares);
        const totalMax = Math.round(maxHa * hectares);
        const cr = guiaPrincipal.custo_real;
        const totalMaq = cr ? Math.round(cr.maquinario.total_maquinario_ha * hectares) : null;
        const totalIns = cr ? Math.round(cr.insumos.total_insumos_ha * hectares) : null;
        const fmtReais = (v) => `R$ ${Number(v).toLocaleString('pt-BR')}`;
        const fmtNum = (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
        const areaLabel = ehAlqueire
            ? `${fmtNum(qtd)} ${qtd === 1 ? 'alqueire goiano' : 'alqueires goianos'} (cerca de ${fmtNum(hectares)} hectares)`
            : `${fmtNum(hectares)} ${hectares === 1 ? 'hectare' : 'hectares'}`;
        if (ehFala) {
            return `Fazendo a conta fechada pra ${areaLabel} de ${nomeAlvoFala} em ${cidadeNome}, o investimento estimado fica entre ${totalMin.toLocaleString('pt-BR')} e ${totalMax.toLocaleString('pt-BR')} reais, cerca de ${minHa.toLocaleString('pt-BR')} a ${maxHa.toLocaleString('pt-BR')} reais por hectare. ${totalMaq !== null ? `Desse total, cerca de ${totalMaq.toLocaleString('pt-BR')} reais vão em maquinário e diesel em ${cr.uf}. ` : ''}${guiaPrincipal.retorno_bolso} Se quiser o passo a passo de como plantar, é só me mandar outro áudio.`;
        }
        return [
            `Fazendo a conta fechada pra *${areaLabel}* de *${etapaAlvo.nome}* aí em *${cidadeNome}*:`,
            `• Investimento estimado: entre *${fmtReais(totalMin)}* e *${fmtReais(totalMax)}* (${fmtReais(minHa)} a ${fmtReais(maxHa)}/ha). ${guiaPrincipal.retorno_bolso}`,
            totalMaq !== null ? `• *Divisão estimada (${cr.uf}):* Maquinário + Diesel ~*${fmtReais(totalMaq)}* | Sementes, adubo e manejo ~*${fmtReais(totalIns)}*.` : '',
            `Se quiser calcular outra área ou outra planta, é só falar! Quer ver também o *passo a passo de como cuidar* ou *ativar o aviso da melhor janela*?`
        ].filter(Boolean).join('\n\n');
    }

    if (modo === 'escoamento') {
        if (ehFala) {
            return `Pra vender ${nomeAlvoFala} perto de ${cidadeNome}, numa distância média de ${distKm} quilômetros, você pode procurar ${ondeVender}, usando o corredor da ${canal.corredor_rodoviario}. Se quiser saber quanto custa por hectare ou como cuidar, me manda outro áudio.`;
        }
        return [
            `Pra vender *${etapaAlvo.nome}* aí perto de *${cidadeNome}* (média de ~${distKm} km):`,
            `• *Onde entregar:* ${ondeVender}`,
            `• *Corredor logístico:* ${canal.corredor_rodoviario}.`,
            `Se quiser, já te passo também *quanto gasta por hectare* ou *como cuidar passo a passo*.`
        ].join('\n\n');
    }

    if (modo === 'manejo') {
        if (ehFala) {
            const ordinais = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto'];
            const passosFalados = guiaPrincipal.como_tratar
                .map((p, idx) => `${ordinais[idx] || `Passo ${idx + 1}`}: ${p}`)
                .join(' ');
            return `Bora direto ao ponto de como cuidar de ${nomeAlvoFala} em ${cidadeNome}. ${passosFalados} Se quiser calcular o custo pra tua área ou saber o melhor dia pela chuva, é só me mandar outro áudio.`;
        }
        const passos = guiaPrincipal.como_tratar.map((p, idx) => `${idx + 1}. ${p}`).join('\n');
        return [
            `Bora direto ao ponto de *como cuidar de ${etapaAlvo.nome}* sem complicação aí em *${cidadeNome}*:`,
            passos,
            `Se pintar qualquer dúvida quando for comprar semente ou mexer na terra, me manda foto ou áudio aqui! Quer que eu *calcule o custo* pra tua área ou *fique em contato te avisando o dia certo pela chuva*?`
        ].join('\n\n');
    }

    if (modo === 'janela_contato') {
        if (ehFala) {
            return `Olhando a terra em ${cidadeNome}, com ${n.caixa_agua_raiz_pct} por cento de umidade na raiz e previsão de ${Math.round(Number(n.chuva_prevista_14d_mm || 0))} milímetros nos próximos 14 dias: ${top1.janela_plantio}. Combinado, vou ficar em contato contigo! Já ativei seu aviso do tempo todo dia às 6 horas da manhã e marquei um lembrete pra daqui 5 dias pra gente conferir a umidade antes do plantio.`;
        }
        return [
            `Olhando a terra em *${cidadeNome}* (com *${n.caixa_agua_raiz_pct}%* de umidade na raiz e previsão de *${Math.round(Number(n.chuva_prevista_14d_mm || 0))} mm* nos próximos 14 dias): *${top1.janela_plantio}*`,
            `*Combinado: vou ficar em contato contigo por aqui!* Já ativei o teu aviso do tempo todo dia às 6h da manhã e deixei um lembrete marcado pra daqui 5 dias pra gente conferir a umidade da terra antes de você botar a semente no chão.`
        ].join('\n\n');
    }

    return formatarRotacaoNaturalWhatsApp(r, { paraFala: ehFala });
}

/**
 * Formata a resposta resumida do plano de rotação para uso direto no WhatsApp.
 */
export function formatarRotacaoWhatsApp(r) {
    if (!r?.ok || !r.ranking?.length) {
        return 'Não consegui montar o plano de rotação agora. Me diga sua cidade e o que colheu por último.';
    }
    const top1 = r.ranking[0];
    const top2 = r.ranking[1];
    const top3 = r.ranking[2];
    const n = r.leitura_nasa;
    const c = r.contexto;
    const sat = r.pulso_regional?.saturacao_antimanada;

    const sinalN = top1.balanco_nitrogenio_kg_ha >= 0 ? `+${top1.balanco_nitrogenio_kg_ha}` : `${top1.balanco_nitrogenio_kg_ha}`;
    const notaManada = sat?.tem_concentracao
        ? `• *Trava anti-manada:* região com ${sat.concentracao_top_pct}% das buscas em ${sat.plano_mais_concentrado?.split('→')[0]?.trim() || 'plano líder'}${sat.diversificou_top1 ? ' — #1 diversificado pra proteger preço e frete.' : '.'}`
        : '';
    const linhaAnterior = c.nao_arrancar_apos_colheita
        ? `• *Cultivo ${c.cultura_anterior} (${c.grupo_rotulo}):* não arrancar após colheita — priorize cobertura nas entrelinhas.`
        : `• *Se repetir ${c.cultura_anterior} agora:* ${r.risco_monocultura.nivel_risco} (${r.risco_monocultura.motivos[0]})`;
    const linhaTrocaSemente = r.decisao_troca?.recomendacao_semente
        ? `• *Troca / Tipo de material:* ${r.decisao_troca.recomendacao_semente}`
        : '';

    return [
        `*PLANO DE ROTAÇÃO — ${c.municipio}* (Base NASA ${n.data_referencia})`,
        `• *Caixa d'água na raiz:* ${n.caixa_agua_raiz_pct}% (${n.status_umidade}) | Chuva 30d: ${n.chuva_30d_mm} mm | Prev 14d: ${n.chuva_prevista_14d_mm} mm`,
        linhaAnterior,
        linhaTrocaSemente,
        notaManada,
        ``,
        `*#1 Recomendado (${top1.score_resiliencia}/100):* ${top1.titulo}`,
        `• Economia de água estimada: +${top1.economia_agua_pct}% | Palhada: ${top1.palhada_t_ha} t/ha | Nitrogênio: ${sinalN} kg/ha`,
        `• Quando entrar: ${top1.janela_plantio}`,
        top1.escoamento
            ? `• *Escoamento (${top1.escoamento.cultura_comercial_foco} · ~${top1.escoamento.distancia_media_km} km):* ${top1.escoamento.canal_recomendado}`
            : '',
        top2 ? `\n*#2 Alternativa (${top2.score_resiliencia}/100):* ${top2.titulo} (+${top2.economia_agua_pct}% água)` : '',
        top3 ? `*#3 Opção Conservadora (${top3.score_resiliencia}/100):* ${top3.titulo} (+${top3.economia_agua_pct}% água)` : ''
    ].filter(Boolean).join('\n');
}
