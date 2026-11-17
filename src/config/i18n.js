/**
 * Central de internacionalização (i18n), travamento seguro de idioma por DDI,
 * detecção conservadora de troca de idioma (sem falsos positivos com gírias/estrangeirismos)
 * e detector determinístico de vazamento de idioma na saída da IA.
 */

export const IDIOMA_PADRAO = 'pt-BR';

export const VOZES_TTS = {
    'pt-BR': { edgeVoice: 'pt-BR-AntonioNeural', googleLang: 'pt', whisperLang: 'pt', displayName: 'Português (Brasil)' },
    en: { edgeVoice: 'en-US-GuyNeural', googleLang: 'en', whisperLang: 'en', displayName: 'English' },
    es: { edgeVoice: 'es-MX-JorgeNeural', googleLang: 'es', whisperLang: 'es', displayName: 'Español' },
    fr: { edgeVoice: 'fr-FR-HenriNeural', googleLang: 'fr', whisperLang: 'fr', displayName: 'Français' },
    de: { edgeVoice: 'de-DE-ChristophNeural', googleLang: 'de', whisperLang: 'de', displayName: 'Deutsch' },
    it: { edgeVoice: 'it-IT-DiegoNeural', googleLang: 'it', whisperLang: 'it', displayName: 'Italiano' },
    hi: { edgeVoice: 'hi-IN-MadhurNeural', googleLang: 'hi', whisperLang: 'hi', displayName: 'हिन्दी (Hindi)' },
    nl: { edgeVoice: 'nl-NL-MaartenNeural', googleLang: 'nl', whisperLang: 'nl', displayName: 'Nederlands' },
    ja: { edgeVoice: 'ja-JP-KeitaNeural', googleLang: 'ja', whisperLang: 'ja', displayName: '日本語 (Japanese)' },
    zh: { edgeVoice: 'zh-CN-YunxiNeural', googleLang: 'zh-CN', whisperLang: 'zh', displayName: '中文 (Chinese)' },
    ar: { edgeVoice: 'ar-SA-HamedNeural', googleLang: 'ar', whisperLang: 'ar', displayName: 'العربية (Arabic)' },
    ru: { edgeVoice: 'ru-RU-DmitryNeural', googleLang: 'ru', whisperLang: 'ru', displayName: 'Русский (Russian)' },
    ko: { edgeVoice: 'ko-KR-InJoonNeural', googleLang: 'ko', whisperLang: 'ko', displayName: '한국어 (Korean)' },
    pl: { edgeVoice: 'pl-PL-MarekNeural', googleLang: 'pl', whisperLang: 'pl', displayName: 'Polski' },
    tr: { edgeVoice: 'tr-TR-AhmetNeural', googleLang: 'tr', whisperLang: 'tr', displayName: 'Türkçe' },
    id: { edgeVoice: 'id-ID-ArdiNeural', googleLang: 'id', whisperLang: 'id', displayName: 'Bahasa Indonesia' },
    vi: { edgeVoice: 'vi-VN-NamMinhNeural', googleLang: 'vi', whisperLang: 'vi', displayName: 'Tiếng Việt' },
    th: { edgeVoice: 'th-TH-NiwatNeural', googleLang: 'th', whisperLang: 'th', displayName: 'ไทย (Thai)' },
    uk: { edgeVoice: 'uk-UA-OstapNeural', googleLang: 'uk', whisperLang: 'uk', displayName: 'Українська' },
    sv: { edgeVoice: 'sv-SE-MattiasNeural', googleLang: 'sv', whisperLang: 'sv', displayName: 'Svenska' },
    ro: { edgeVoice: 'ro-RO-EmilNeural', googleLang: 'ro', whisperLang: 'ro', displayName: 'Română' },
    cs: { edgeVoice: 'cs-CZ-AntoninNeural', googleLang: 'cs', whisperLang: 'cs', displayName: 'Čeština' },
    el: { edgeVoice: 'el-GR-NestorasNeural', googleLang: 'el', whisperLang: 'el', displayName: 'Ελληνικά' },
    he: { edgeVoice: 'he-IL-AvriNeural', googleLang: 'iw', whisperLang: 'he', displayName: 'עברית' },
    da: { edgeVoice: 'da-DK-JeppeNeural', googleLang: 'da', whisperLang: 'da', displayName: 'Dansk' },
    fi: { edgeVoice: 'fi-FI-HarriNeural', googleLang: 'fi', whisperLang: 'fi', displayName: 'Suomi' },
    no: { edgeVoice: 'nb-NO-FinnNeural', googleLang: 'no', whisperLang: 'no', displayName: 'Norsk' },
    nb: { edgeVoice: 'nb-NO-FinnNeural', googleLang: 'no', whisperLang: 'no', displayName: 'Norsk Bokmål' },
    hu: { edgeVoice: 'hu-HU-TamasNeural', googleLang: 'hu', whisperLang: 'hu', displayName: 'Magyar' },
    bn: { edgeVoice: 'bn-IN-BashkarNeural', googleLang: 'bn', whisperLang: 'bn', displayName: 'বাংলা' },
    ta: { edgeVoice: 'ta-IN-ValluvarNeural', googleLang: 'ta', whisperLang: 'ta', displayName: 'தமிழ்' },
    te: { edgeVoice: 'te-IN-MohanNeural', googleLang: 'te', whisperLang: 'te', displayName: 'తెలుగు' },
    mr: { edgeVoice: 'mr-IN-ManoharNeural', googleLang: 'mr', whisperLang: 'mr', displayName: 'मराठी' },
    gu: { edgeVoice: 'gu-IN-NiranjanNeural', googleLang: 'gu', whisperLang: 'gu', displayName: 'ગુજરાતી' },
    ur: { edgeVoice: 'ur-PK-AsadNeural', googleLang: 'ur', whisperLang: 'ur', displayName: 'اردو' },
    fa: { edgeVoice: 'fa-IR-FaridNeural', googleLang: 'fa', whisperLang: 'fa', displayName: 'فارسی' },
    sw: { edgeVoice: 'sw-KE-RafikiNeural', googleLang: 'sw', whisperLang: 'sw', displayName: 'Kiswahili' },
    af: { edgeVoice: 'af-ZA-WillemNeural', googleLang: 'af', whisperLang: 'af', displayName: 'Afrikaans' },
    ms: { edgeVoice: 'ms-MY-OsmanNeural', googleLang: 'ms', whisperLang: 'ms', displayName: 'Bahasa Melayu' },
    tl: { edgeVoice: 'fil-PH-AngeloNeural', googleLang: 'tl', whisperLang: 'tl', displayName: 'Filipino / Tagalog' },
    fil: { edgeVoice: 'fil-PH-AngeloNeural', googleLang: 'tl', whisperLang: 'tl', displayName: 'Filipino' },
    ca: { edgeVoice: 'ca-ES-EnricNeural', googleLang: 'ca', whisperLang: 'ca', displayName: 'Català' },
    gl: { edgeVoice: 'gl-ES-RoiNeural', googleLang: 'gl', whisperLang: 'gl', displayName: 'Galego' },
    bg: { edgeVoice: 'bg-BG-BorislavNeural', googleLang: 'bg', whisperLang: 'bg', displayName: 'Български' },
    hr: { edgeVoice: 'hr-HR-SreckoNeural', googleLang: 'hr', whisperLang: 'hr', displayName: 'Hrvatski' },
    sk: { edgeVoice: 'sk-SK-LukasNeural', googleLang: 'sk', whisperLang: 'sk', displayName: 'Slovenčina' },
    sl: { edgeVoice: 'sl-SI-RokNeural', googleLang: 'sl', whisperLang: 'sl', displayName: 'Slovenščina' },
    sr: { edgeVoice: 'sr-RS-NicholasNeural', googleLang: 'sr', whisperLang: 'sr', displayName: 'Српски' },
    lt: { edgeVoice: 'lt-LT-LeonasNeural', googleLang: 'lt', whisperLang: 'lt', displayName: 'Lietuvių' },
    lv: { edgeVoice: 'lv-LV-NilsNeural', googleLang: 'lv', whisperLang: 'lv', displayName: 'Latviešu' },
    et: { edgeVoice: 'et-EE-KertNeural', googleLang: 'et', whisperLang: 'et', displayName: 'Eesti' },
    is: { edgeVoice: 'is-IS-GunnarNeural', googleLang: 'is', whisperLang: 'is', displayName: 'Íslenska' },
    ga: { edgeVoice: 'ga-IE-ColmNeural', googleLang: 'ga', whisperLang: 'ga', displayName: 'Gaeilge' },
    cy: { edgeVoice: 'cy-GB-AledNeural', googleLang: 'cy', whisperLang: 'cy', displayName: 'Cymraeg' },
    mt: { edgeVoice: 'mt-MT-JosephNeural', googleLang: 'mt', whisperLang: 'mt', displayName: 'Malti' },
    kk: { edgeVoice: 'kk-KZ-DauletNeural', googleLang: 'kk', whisperLang: 'kk', displayName: 'Қазақша' },
    uz: { edgeVoice: 'uz-UZ-SardorNeural', googleLang: 'uz', whisperLang: 'uz', displayName: 'Oʻzbekcha' },
    az: { edgeVoice: 'az-AZ-BabekNeural', googleLang: 'az', whisperLang: 'az', displayName: 'Azərbaycanca' },
    ka: { edgeVoice: 'ka-GE-GiorgiNeural', googleLang: 'ka', whisperLang: 'ka', displayName: 'ქართული' },
    am: { edgeVoice: 'am-ET-AmehaNeural', googleLang: 'am', whisperLang: 'am', displayName: 'አማርኛ' },
    ne: { edgeVoice: 'ne-NP-SagarNeural', googleLang: 'ne', whisperLang: 'ne', displayName: 'नेपाली' },
    si: { edgeVoice: 'si-LK-SameeraNeural', googleLang: 'si', whisperLang: 'si', displayName: 'සිංහල' },
    km: { edgeVoice: 'km-KH-PisethNeural', googleLang: 'km', whisperLang: 'km', displayName: 'ខ្មែរ' },
    lo: { edgeVoice: 'lo-LA-ChanthavongNeural', googleLang: 'lo', whisperLang: 'lo', displayName: 'ລາວ' },
    my: { edgeVoice: 'my-MM-ThihaNeural', googleLang: 'my', whisperLang: 'my', displayName: 'မြန်မာ' },
    mn: { edgeVoice: 'mn-MN-BataaNeural', googleLang: 'mn', whisperLang: 'mn', displayName: 'Монгол' },
    zu: { edgeVoice: 'zu-ZA-ThembaNeural', googleLang: 'zu', whisperLang: 'zu', displayName: 'isiZulu' },
    sq: { edgeVoice: 'sq-AL-IlirNeural', googleLang: 'sq', whisperLang: 'sq', displayName: 'Shqip' },
    mk: { edgeVoice: 'mk-MK-AleksandarNeural', googleLang: 'mk', whisperLang: 'mk', displayName: 'Македонски' },
    bs: { edgeVoice: 'bs-BA-GoranNeural', googleLang: 'bs', whisperLang: 'bs', displayName: 'Bosanski' }
};

const ALIAS_IDIOMA = {
    pt: 'pt-BR',
    'pt-br': 'pt-BR',
    pt_br: 'pt-BR',
    portuguese: 'pt-BR',
    portugues: 'pt-BR',
    portugais: 'pt-BR',
    portugiesisch: 'pt-BR',
    portoghese: 'pt-BR',
    br: 'pt-BR',
    en: 'en',
    'en-us': 'en',
    'en-gb': 'en',
    en_us: 'en',
    english: 'en',
    ingles: 'en',
    anglais: 'en',
    englisch: 'en',
    inglese: 'en',
    es: 'es',
    'es-mx': 'es',
    'es-es': 'es',
    'es-ar': 'es',
    spanish: 'es',
    espanol: 'es',
    espanhol: 'es',
    espagnol: 'es',
    spanisch: 'es',
    spagnolo: 'es',
    fr: 'fr',
    french: 'fr',
    francais: 'fr',
    frances: 'fr',
    franzosisch: 'fr',
    francese: 'fr',
    de: 'de',
    german: 'de',
    deutsch: 'de',
    alemao: 'de',
    aleman: 'de',
    allemand: 'de',
    tedesco: 'de',
    it: 'it',
    italian: 'it',
    italiano: 'it',
    italien: 'it',
    italienisch: 'it',
    hi: 'hi',
    hindi: 'hi',
    nl: 'nl',
    dutch: 'nl',
    holandes: 'nl',
    ja: 'ja',
    japanese: 'ja',
    japones: 'ja',
    zh: 'zh',
    chinese: 'zh',
    mandarin: 'zh',
    chines: 'zh',
    ar: 'ar',
    arabic: 'ar',
    arabe: 'ar',
    ru: 'ru',
    russian: 'ru',
    russo: 'ru',
    ko: 'ko',
    korean: 'ko',
    coreano: 'ko',
    pl: 'pl',
    polish: 'pl',
    polones: 'pl',
    polaco: 'pl',
    polski: 'pl',
    tr: 'tr',
    turkish: 'tr',
    turco: 'tr',
    turkce: 'tr',
    id: 'id',
    indonesian: 'id',
    indonesio: 'id',
    'bahasa indonesia': 'id',
    vi: 'vi',
    vietnamese: 'vi',
    vietnamita: 'vi',
    'tieng viet': 'vi',
    th: 'th',
    thai: 'th',
    tailandes: 'th',
    uk: 'uk',
    ukrainian: 'uk',
    ucraniano: 'uk',
    sv: 'sv',
    swedish: 'sv',
    sueco: 'sv',
    svenska: 'sv',
    ca: 'ca',
    catalan: 'ca',
    catalao: 'ca',
    gl: 'gl',
    galician: 'gl',
    galego: 'gl',
    gallego: 'gl',
    nihongo: 'ja',
    jp: 'ja',
    jpn: 'ja',
    japones: 'ja',
    japonesa: 'ja',
    mandarin: 'zh',
    mandarim: 'zh',
    cantonese: 'zh',
    cantones: 'zh',
    zhongwen: 'zh',
    zho: 'zh',
    chi: 'zh',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    arabe: 'ar',
    arabi: 'ar',
    ara: 'ar',
    russo: 'ru',
    russkiy: 'ru',
    rus: 'ru',
    hangul: 'ko',
    hangugeo: 'ko',
    kor: 'ko',
    neerlandes: 'nl',
    flamengo: 'nl',
    nederlands: 'nl',
    nld: 'nl',
    ro: 'ro',
    romanian: 'ro',
    romeno: 'ro',
    rumano: 'ro',
    romana: 'ro',
    cs: 'cs',
    czech: 'cs',
    tcheco: 'cs',
    checo: 'cs',
    cesky: 'cs',
    cestina: 'cs',
    el: 'el',
    greek: 'el',
    grego: 'el',
    griego: 'el',
    he: 'he',
    iw: 'he',
    hebrew: 'he',
    hebraico: 'he',
    hebreo: 'he',
    da: 'da',
    danish: 'da',
    dinamarques: 'da',
    danes: 'da',
    fi: 'fi',
    finnish: 'fi',
    finlandes: 'fi',
    suomi: 'fi',
    no: 'no',
    nb: 'nb',
    norwegian: 'no',
    noruegues: 'no',
    noruego: 'no',
    norsk: 'no',
    hu: 'hu',
    hungarian: 'hu',
    hungaro: 'hu',
    magyar: 'hu',
    bn: 'bn',
    bengali: 'bn',
    bangla: 'bn',
    ta: 'ta',
    tamil: 'ta',
    te: 'te',
    telugu: 'te',
    mr: 'mr',
    marathi: 'mr',
    marati: 'mr',
    gu: 'gu',
    gujarati: 'gu',
    ur: 'ur',
    urdu: 'ur',
    fa: 'fa',
    persian: 'fa',
    persa: 'fa',
    farsi: 'fa',
    sw: 'sw',
    swahili: 'sw',
    suaili: 'sw',
    kiswahili: 'sw',
    af: 'af',
    afrikaans: 'af',
    africaner: 'af',
    ms: 'ms',
    malay: 'ms',
    malaio: 'ms',
    malayo: 'ms',
    tl: 'tl',
    fil: 'tl',
    filipino: 'tl',
    tagalog: 'tl',
    tagalo: 'tl',
    bg: 'bg',
    bulgarian: 'bg',
    bulgaro: 'bg',
    hr: 'hr',
    croatian: 'hr',
    croata: 'hr',
    hrvatski: 'hr',
    sk: 'sk',
    slovak: 'sk',
    eslovaco: 'sk',
    sl: 'sl',
    slovenian: 'sl',
    esloveno: 'sl',
    sr: 'sr',
    serbian: 'sr',
    servio: 'sr',
    lt: 'lt',
    lithuanian: 'lt',
    lituano: 'lt',
    lv: 'lv',
    latvian: 'lv',
    letao: 'lv',
    et: 'et',
    estonian: 'et',
    estoniano: 'et',
    ka: 'ka',
    georgian: 'ka',
    georgiano: 'ka',
    am: 'am',
    amharic: 'am',
    amarico: 'am',
    ne: 'ne',
    nepali: 'ne',
    nepales: 'ne',
    eng: 'en',
    esp: 'es',
    por: 'pt-BR',
    fra: 'fr',
    deu: 'de',
    ger: 'de',
    ita: 'it',
    indiano: 'hi'
};

// Prefixos DDI ordenados do mais específico ao mais curto
const DDIs_PT = ['351', '244', '258', '238', '245', '239', '670'];
const DDIs_ES = [
    '1809', '1829', '1849', '593', '591', '595', '598',
    '502', '503', '504', '505', '506', '507',
    '34', '52', '54', '56', '57', '51', '58', '53'
];
const DDIs_EN = ['353', '44', '61', '64', '27', '1'];

// Palavras comuns adotadas no agro brasileiro — NUNCA disparam troca para inglês nem vazamento
const ESTRANGEIRISMOS_AGRO = new Set([
    'ok', 'okay', 'link', 'pix', 'stress', 'spray', 'roundup', 'whatsapp',
    'zap', 'start', 'stop', 'top', 'app', 'bot', 'agro', 'hi', 'hello',
    'mail', 'online', 'offline', 'pdf', 'csv', 'gps', 'nasa', 'vip',
    'free', 'pro', 'live', 'check', 'print', 'bio', 'plus', 'mix', 'kit',
    'fit', 'diesel', 'npk', 'ph'
]);

const PT_MARCADORES = new Set([
    'voce', 'voces', 'nao', 'meu', 'minha', 'meus', 'minhas', 'seu', 'sua',
    'entao', 'tambem', 'porque', 'quando', 'onde', 'quero', 'preciso', 'posso',
    'tenho', 'pode', 'lavoura', 'roca', 'chuva', 'umidade', 'chao', 'folha',
    'folhas', 'feijao', 'mandioca', 'milho', 'obrigado', 'parceiro', 'colheita',
    'previsao', 'adubo', 'praga', 'doenca', 'melhor', 'fazenda', 'plantio',
    'estao', 'amanha', 'hoje', 'agora', 'aqui', 'fala', 'manda', 'ajuda',
    'compensa', 'plantar', 'terra', 'pimenta', 'tomate',
    'oi', 'opa', 'ola', 'tudo', 'bom', 'boa', 'bem', 'dia', 'tarde', 'noite', 'manha',
    'obrigada', 'valeu', 'beleza', 'certo', 'depois', 'antes', 'muito', 'pouco',
    'isso', 'esse', 'essa', 'disso', 'desse', 'dessa', 'nisso', 'pelo', 'pela',
    'pra', 'comigo', 'nosso', 'nossa', 'qual', 'quais', 'quanto', 'quantos', 'quantas',
    'custa', 'custo', 'preco', 'gasto', 'compadre', 'cumpadre', 'cumpadi',
    'colhi', 'colhendo', 'faco', 'fazer', 'planto', 'plantando', 'chover', 'chove', 'chovendo',
    'vender', 'vendo', 'compro', 'precisa', 'estou', 'tou', 'queria', 'tava', 'sera',
    'saber', 'falar', 'olha', 'ficou', 'soja', 'braquiaria', 'gergelim',
    'capim', 'semente', 'sementes', 'safra', 'safrinha', 'alqueire', 'ajudar',
    'agora', 'ontem', 'ainda', 'assim', 'mesmo', 'mesma', 'quem', 'eu', 'ele', 'ela',
    'eles', 'elas', 'uma', 'umas', 'uns', 'ao', 'aos', 'dele', 'dela', 'deles', 'delas',
    'tenho', 'temos', 'tinha', 'sei', 'acho', 'sao',
    'vc', 'vcs', 'pq', 'tb', 'tbm', 'hj', 'blz', 'obg', 'obgd', 'vlw', 'flw',
    'qto', 'qtos', 'qtas', 'cmg', 'ctg', 'td', 'mto', 'mta', 'ce', 'oce',
    'nois', 'tamo', 'bora', 'oq', 'qro', 'kero', 'pfv', 'pfvr', 'agr', 'dnv',
    'aki', 'vdd', 'msm', 'tmj', 'mio', 'foia', 'pranta', 'prantar', 'nn'
]);

// Subconjunto estrito PT que NÃO ocorre naturalmente em espanhol escrito (evita falso positivo PT<->ES)
const PT_EXCLUSIVO_VS_ES = new Set([
    'voce', 'voces', 'nao', 'entao', 'tambem', 'meu', 'minha', 'meus', 'minhas',
    'lavoura', 'chuva', 'umidade', 'chao', 'folha', 'folhas', 'feijao',
    'milho', 'obrigado', 'parceiro', 'colheita', 'previsao', 'estao',
    'amanha', 'hoje', 'ajuda', 'ajudar', 'fala', 'pimenta',
    'oi', 'tudo', 'bom', 'boa', 'bem', 'noite', 'manha',
    'obrigada', 'valeu', 'beleza', 'certo', 'depois', 'muito', 'pouco',
    'isso', 'esse', 'essa', 'disso', 'desse', 'dessa', 'nisso',
    'pra', 'comigo', 'nosso', 'nossa', 'qual', 'quais', 'quanto', 'quantos', 'quantas',
    'custa', 'custo', 'preco', 'cumpadre', 'cumpadi',
    'colhi', 'colhendo', 'faco', 'fazer', 'chover', 'chove', 'chovendo',
    'estou', 'tou', 'tava',
    'falar', 'olha', 'ficou', 'gergelim',
    'capim', 'semente', 'sementes', 'safra', 'safrinha', 'alqueire',
    'agora', 'ontem', 'ainda', 'assim', 'mesmo', 'mesma', 'quem', 'onde', 'eu', 'ele', 'ela',
    'eles', 'elas', 'uma', 'umas', 'uns', 'ao', 'aos', 'dele', 'dela', 'deles', 'delas',
    'tenho', 'temos', 'tinha', 'quero', 'posso', 'sei', 'acho', 'sao', 'plantio',
    'vc', 'vcs', 'tbm', 'hj', 'blz', 'obg', 'obgd', 'vlw', 'flw',
    'qto', 'qtos', 'qtas', 'cmg', 'ctg', 'td', 'mto', 'mta', 'ce', 'oce',
    'nois', 'tamo', 'bora', 'oq', 'qro', 'kero', 'pfv', 'pfvr', 'agr', 'dnv',
    'aki', 'vdd', 'msm', 'tmj', 'mio', 'foia', 'pranta', 'prantar', 'nn'
]);

// Tokens ingleses inequívocos (sem 'to', 'no', 'for', 'a', 'do', 'me', 'in', 'so', 'soy', 'banana' que colidem com PT/ES)
const EN_MARCADORES = new Set([
    'the', 'this', 'that', 'these', 'those', 'with', 'from', 'what', 'when',
    'where', 'which', 'why', 'how', 'who', 'should', 'would', 'could', 'cannot',
    'your', 'our', 'their', 'they', 'here', 'there', 'because', 'please',
    'need', 'want', 'crop', 'crops', 'soil', 'weather', 'rain', 'raining', 'rained', 'plant',
    'planted', 'planting', 'harvest', 'harvested', 'harvesting', 'farming', 'farmer', 'leaves',
    'yellow', 'turning', 'disease', 'pest', 'morning', 'afternoon', 'evening', 'corn', 'soybean',
    'soybeans', 'beans', 'cassava', 'rice', 'wheat', 'cotton', 'coffee', 'onion', 'potato',
    'fertilizer', 'moisture', 'forecast', 'sorry', 'recommend',
    'about', 'between', 'however', 'therefore', 'help', 'have', 'does', 'are',
    'and', 'but', 'my', 'you', 'we', 'can', 'will', 'has', 'had', 'was', 'were', 'got',
    'think', 'thinking', 'know', 'understand', 'speak', 'speaking', 'talk', 'tell',
    'grow', 'growing', 'next', 'after', 'before', 'now', 'today', 'tomorrow', 'yesterday',
    'week', 'weeks', 'month', 'months', 'days', 'water', 'good', 'better', 'best',
    'much', 'many', 'more', 'sell', 'buy', 'price', 'cost', 'field', 'farm', 'yield',
    'right', 'wrong', 'english', 'thanks', 'thank',
    'pls', 'plz', 'thx', 'idk', 'tmrw', 'abt', 'btw', 'rn', 'gonna', 'wanna', 'gotta',
    'dont', 'cant', 'wont', 'im', 'ive', 'youre', 'theyre', 'thats', 'whats',
    'heres', 'theres', 'doesnt', 'didnt', 'havent', 'hasnt', 'wouldnt', 'couldnt', 'shouldnt', 'ur'
]);

const ES_MARCADORES = new Set([
    'hola', 'buenos', 'buenas', 'buen', 'bueno', 'oye', 'usted', 'ustedes', 'quiero', 'quieres',
    'necesito', 'necesitas', 'necesita', 'tienes', 'tengo', 'puede', 'puedes', 'puedo',
    'cuando', 'cuanto', 'donde', 'pero', 'ademas', 'tambien', 'gracias', 'siembra', 'siembro',
    'cosecha', 'cosecho', 'cosechar', 'suelo', 'tierra', 'lluvia', 'llueve',
    'lloviendo', 'sequia', 'humedad', 'plaga', 'maiz', 'soya', 'riego', 'frijol', 'hojas',
    'sembrar', 'semilla', 'semillas', 'amarillas', 'llover', 'pronostico', 'cual',
    'tus', 'sus', 'hace', 'hoy', 'ahora', 'tiempo', 'bien', 'precio',
    'costo', 'costos', 'abono', 'entonces', 'despues', 'manana', 'noche', 'ayer', 'mucho',
    'ayuda', 'ayudar', 'ajonjoli', 'parcela', 'finca', 'yo', 'entiendo', 'entiendes',
    'empezar', 'empiezo', 'empezando', 'estoy', 'tampoco', 'siempre', 'cuesta',
    'haciendo', 'trabajar', 'muy', 'mejor', 'peor', 'mucha', 'hablar', 'hablo', 'hablando', 'espanol',
    'xq', 'tmb', 'porfa', 'xfi', 'xfa', 'bn', 'dnd', 'msj', 'nds', 'ntp', 'mnn',
    'grax', 'kiero', 'tngo', 'qiero', 'pueds', 'weno', 'ke'
]);

const FR_MARCADORES = new Set([
    'bonjour', 'bonsoir', 'salut', 'merci', 'vous', 'votre', 'nous', 'notre',
    'pourquoi', 'quand', 'comment', 'combien', 'quel', 'quelle', 'pluie', 'pleuvoir',
    'pleut', 'recolte', 'recolter', 'semis', 'semer', 'planter', 'terre', 'soleil',
    'besoin', 'pouvez', 'avec', 'dans', 'meteo', 'humidite', 'feuille', 'feuilles',
    'engrais', 'secheresse', 'champ', 'agricole', 'agriculteur', 'prix', 'cout', 'coute',
    'vendre', 'acheter', 'aider', 'francais', 'voudrais', 'beaucoup', 'demain', 'hier', 'aujourd'
]);

const DE_MARCADORES = new Set([
    'hallo', 'guten', 'morgen', 'abend', 'danke', 'bitte', 'ich', 'wir', 'ihr',
    'mein', 'meine', 'dein', 'nicht', 'auch', 'aber', 'oder', 'und', 'mit',
    'warum', 'wann', 'wieviel', 'woher', 'boden', 'regen', 'regnet', 'ernte', 'ernten',
    'wetter', 'pflanzen', 'saat', 'aussaat', 'feuchtigkeit', 'dunger', 'duenger',
    'schadling', 'schaedling', 'krankheit', 'hilfe', 'helfen', 'kosten', 'preis',
    'verkaufen', 'kaufen', 'sprache', 'deutsch', 'heute', 'konnen', 'koennen',
    'mochte', 'moechte', 'brauche', 'gestern'
]);

const IT_MARCADORES = new Set([
    'ciao', 'grazie', 'buongiorno', 'buonasera', 'perche', 'voglio', 'vorrei', 'vorremmo',
    'abbiamo', 'pioggia', 'piove', 'suolo', 'raccolto', 'raccogliere', 'coltivare',
    'seminare', 'semina', 'coltura', 'foglie', 'umidita', 'consiglio', 'aiuto', 'aiutare',
    'italiano', 'prezzo', 'concime', 'parassiti', 'malattia', 'domani', 'oggi', 'adesso',
    'ieri', 'favore', 'nostro', 'vostro', 'dopo', 'meglio', 'molto', 'vendere', 'comprare'
]);

const idiomaNomesDinamicos = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null;

const ISO_639_1_CODIGOS = (
    'aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy ' +
    'da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy ' +
    'hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ' +
    'ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa ' +
    'pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ' +
    'ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'
).split(' ');

const NOMES_DINAMICOS_IDIOMA = (() => {
    const mapa = new Map();
    if (typeof Intl === 'undefined' || !Intl.DisplayNames) return mapa;
    const locales = ['en', 'pt', 'es', 'fr', 'de', 'it'];
    const dns = locales.map((loc) => {
        try { return new Intl.DisplayNames([loc], { type: 'language' }); } catch { return null; }
    }).filter(Boolean);
    for (const code of ISO_639_1_CODIGOS) {
        const destino = code === 'pt' ? 'pt-BR' : code;
        for (const dn of dns) {
            try {
                const raw = dn.of(code);
                if (!raw) continue;
                const clean = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                if (clean.length >= 4 && !mapa.has(clean)) {
                    mapa.set(clean, destino);
                }
            } catch {}
        }
    }
    return mapa;
})();

const ALIAS_IDIOMA_NATIVOS = [
    [/日本語|にほんご|ニホンゴ/u, 'ja'],
    [/中文|汉语|漢語|普通话|國語/u, 'zh'],
    [/한국어|조선말|한글/u, 'ko'],
    [/العربية|عربي|عربى/u, 'ar'],
    [/русский|по-русски/iu, 'ru'],
    [/українська|українською/iu, 'uk'],
    [/हिन्दी|हिंदी/u, 'hi'],
    [/ภาษาไทย/u, 'th'],
    [/ελληνικά/iu, 'el'],
    [/עברית/u, 'he'],
    [/বাংলা/u, 'bn'],
    [/தமிழ்/u, 'ta'],
    [/اردو/u, 'ur'],
    [/فارسی/u, 'fa'],
    [/português|portugues/iu, 'pt-BR'],
    [/español|espanol|castellano/iu, 'es'],
    [/english/iu, 'en'],
    [/français|francais/iu, 'fr'],
    [/deutsch/iu, 'de'],
    [/italiano/iu, 'it'],
    [/nederlands/iu, 'nl'],
    [/polski|polsku/iu, 'pl'],
    [/türkçe|turkce/iu, 'tr'],
    [/tiếng\s*việt|tieng\s*viet/iu, 'vi'],
    [/kiswahili/iu, 'sw']
];

export function normSemAcentoLower(texto = '') {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function normalizarCodigoIdioma(raw) {
    if (!raw) return null;
    const rawStr = String(raw).trim();
    if (!rawStr) return null;
    if (rawStr.length <= 40) {
        for (const [re, code] of ALIAS_IDIOMA_NATIVOS) {
            if (re.test(rawStr)) return code;
        }
    }
    const clean = normSemAcentoLower(rawStr).replace(/_/g, '-');
    if (ALIAS_IDIOMA[clean]) return ALIAS_IDIOMA[clean];
    const prefix = clean.split('-')[0];
    if (ALIAS_IDIOMA[prefix]) return ALIAS_IDIOMA[prefix];
    if (NOMES_DINAMICOS_IDIOMA.has(clean)) return NOMES_DINAMICOS_IDIOMA.get(clean);
    if (clean.length >= 4) {
        const semParens = clean.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        if (ALIAS_IDIOMA[semParens]) return ALIAS_IDIOMA[semParens];
        if (NOMES_DINAMICOS_IDIOMA.has(semParens)) return NOMES_DINAMICOS_IDIOMA.get(semParens);
    }
    if (/^[a-z]{2}$/.test(prefix) && ISO_639_1_CODIGOS.includes(prefix)) return prefix === 'pt' ? 'pt-BR' : prefix;
    if (/^[a-z]{2}-[a-z0-9]{2,4}$/i.test(clean) && ISO_639_1_CODIGOS.includes(prefix)) {
        return prefix === 'pt' ? 'pt-BR' : prefix;
    }
    return null;
}

export function obterConfigVoz(idioma = IDIOMA_PADRAO) {
    const norm = normalizarCodigoIdioma(idioma) || IDIOMA_PADRAO;
    if (VOZES_TTS[norm]) return { ...VOZES_TTS[norm], code: norm, hasNativeEdgeVoice: true };
    let displayName = norm;
    try {
        displayName = idiomaNomesDinamicos?.of(norm) || norm;
        if (displayName) displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    } catch {}
    return {
        code: norm,
        edgeVoice: VOZES_TTS.en.edgeVoice,
        hasNativeEdgeVoice: false,
        googleLang: norm,
        whisperLang: norm,
        displayName
    };
}

export function extrairDigitosTelefone(whatsappNumber = '') {
    return String(whatsappNumber || '').split('@')[0].replace(/\D/g, '');
}

export function ehNumeroBrasileiro(whatsappNumber = '') {
    const digits = extrairDigitosTelefone(whatsappNumber);
    // Sem número ou ID de teste interno não-E164 -> trata como Brasil por segurança
    if (!digits || !/^\d{7,15}$/.test(digits)) return true;
    return digits.startsWith('55');
}

export function idiomaPadraoPorNumero(whatsappNumber = '') {
    if (ehNumeroBrasileiro(whatsappNumber)) return IDIOMA_PADRAO;
    const digits = extrairDigitosTelefone(whatsappNumber);
    if (DDIs_PT.some((p) => digits.startsWith(p))) return 'pt-BR';
    if (DDIs_ES.some((p) => digits.startsWith(p))) return 'es';
    if (DDIs_EN.some((p) => digits.startsWith(p))) return 'en';
    // Outros DDIs internacionais (+91, +33, +49, etc.) permitem auto-detecção na 1ª mensagem
    return null;
}

function tokenizarSemRuido(texto = '') {
    const semUrls = String(texto || '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\[PRODUCT_IMAGE:[^\]]+\]/gi, ' ')
        .replace(/\[\[FOLLOWUP\]\]/gi, ' ')
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/\b[\w.-]+\.(?:com|org|net|gov|edu|br|io)\S*/gi, ' ');
    const norm = normSemAcentoLower(semUrls);
    return (norm.match(/(?:don't|can't|won't|it's|you're|we're|they're|that's|what's|where's|there's|here's|let's|doesn't|didn't|isn't|aren't|haven't|hasn't|wouldn't|couldn't|shouldn't|i'm|i've|i'll|i'd|you've|you'll|you'd|c'est|j'ai|n'est|s'il|qu'est|d'accord|[a-z]{2,})/g) || [])
        .filter((tok) => !ESTRANGEIRISMOS_AGRO.has(tok));
}

function contarMarcadores(tokens, rawTexto = '') {
    let pt = 0;
    let ptVsEs = 0;
    let en = 0;
    let es = 0;
    let fr = 0;
    let de = 0;
    let it = 0;
    const seenPt = new Set();
    const seenEn = new Set();
    const seenEs = new Set();
    const seenFr = new Set();
    const seenDe = new Set();
    const seenIt = new Set();

    for (const t of tokens) {
        if (PT_MARCADORES.has(t) && !seenPt.has(t)) {
            seenPt.add(t);
            pt += 1;
            if (PT_EXCLUSIVO_VS_ES.has(t)) ptVsEs += 1;
        }
        if (EN_MARCADORES.has(t) && !seenEn.has(t)) {
            seenEn.add(t);
            en += 1;
        }
        if (ES_MARCADORES.has(t) && !seenEs.has(t)) {
            seenEs.add(t);
            es += 1;
        }
        if (FR_MARCADORES.has(t) && !seenFr.has(t)) {
            seenFr.add(t);
            fr += 1;
        }
        if (DE_MARCADORES.has(t) && !seenDe.has(t)) {
            seenDe.add(t);
            de += 1;
        }
        if (IT_MARCADORES.has(t) && !seenIt.has(t)) {
            seenIt.add(t);
            it += 1;
        }
    }

    const rawNorm = normSemAcentoLower(String(rawTexto || '').replace(/[\u2018\u2019]/g, "'"));

    // Sinais ortográficos inequívocos de espanhol / contrações e abreviações / alemão / francês / português
    if (/[¿¡ñ]/i.test(rawTexto)) es += 2;
    if (/\b(?:don't|can't|won't|you're|we're|they're|it's|that's|what's|where's|there's|here's|let's|i'm|i've|i'll|i'd|you've|you'll|you'd|isn't|aren't|haven't|hasn't|doesn't|didn't|wouldn't|couldn't|shouldn't|here is|you can)\b/i.test(rawNorm)) en += 2;
    const temU = /\bu\b/.test(rawNorm);
    const temR = /\br\b/.test(rawNorm);
    if ((temU && temR) || (en >= 1 && (temU || temR))) {
        if (temU) en += 1;
        if (temR) en += 1;
    }
    if (/\b(?:x\s*fa|x\s*fi|q\s+tal|q\s+hago|q\s+siembro)\b/.test(rawNorm)) es += 1;
    if (/\b(?:c'est|j'ai|qu'est|n'est|s'il|d'accord|aujourd'hui)\b/.test(rawNorm)) fr += 2;
    if (/ß/.test(rawTexto)) de += 2;
    if (/[ãõ]/i.test(rawTexto)) {
        pt += 2;
        ptVsEs += 2;
    } else if (/ç/i.test(rawTexto) && fr === 0) {
        pt += 1;
        ptVsEs += 1;
    }

    return { pt, ptVsEs, en, es, fr, de, it };
}

const CODIGOS_CURTOS_SEGUROS_COMANDO = new Set([
    'pt', 'pt-br', 'en', 'eng', 'es', 'esp', 'fr', 'de', 'it',
    'ja', 'jp', 'zh', 'ar', 'ru', 'ko', 'hi', 'nl', 'pl', 'tr', 'uk', 'vi', 'th', 'id', 'ro', 'cs', 'sv', 'el', 'he', 'sw'
]);

const PALAVRAS_COLISAO_NOME_IDIOMA = new Set([
    'afar', 'akan', 'alta', 'cree', 'ewe', 'fond', 'ga', 'ho', 'io', 'mina', 'no', 'or', 'si', 'so', 'ta', 'te', 'to'
]);

export function resolverNomeIdiomaEmTexto(candidato = '', { permitirCodigoCurto = false } = {}) {
    const bruto = String(candidato || '').trim();
    if (!bruto) return null;

    for (const [reNat, codeNat] of ALIAS_IDIOMA_NATIVOS) {
        if (reNat.test(bruto)) return codeNat;
    }

    const clean = normSemAcentoLower(bruto)
        .replace(/^[^\p{L}0-9]+|[^\p{L}0-9]+$/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!clean) return null;
    if (PALAVRAS_COLISAO_NOME_IDIOMA.has(clean)) return null;

    if (clean.length <= 3 && !permitirCodigoCurto && !['en', 'pt', 'es'].includes(clean)) {
        if (!CODIGOS_CURTOS_SEGUROS_COMANDO.has(clean)) return null;
    }

    if (ALIAS_IDIOMA[clean]) {
        if (clean.length <= 3 && !permitirCodigoCurto && !CODIGOS_CURTOS_SEGUROS_COMANDO.has(clean)) return null;
        if (clean.length <= 2 && !permitirCodigoCurto) return null;
        return ALIAS_IDIOMA[clean];
    }

    if (clean.length >= 4 && NOMES_DINAMICOS_IDIOMA.has(clean)) {
        return NOMES_DINAMICOS_IDIOMA.get(clean);
    }
    return null;
}

/**
 * Identifica idioma imediatamente por sistema de escrita não-latino (zero tokens, O(n) local).
 */
export function detectarScriptIdioma(texto = '') {
    const clean = String(texto || '')
        .replace(/\[PRODUCT_IMAGE:[^\]]+\]/g, ' ')
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/\p{Extended_Pictographic}/gu, ' ')
        .trim();
    if (!clean) return null;

    const contar = (re) => (clean.match(re) || []).length;

    const kana = contar(/[\u3040-\u309F\u30A0-\u30FF]/g);
    const cjk = contar(/[\u4E00-\u9FFF\u3400-\u4DBF]/g);
    if (kana >= 1) return 'ja';
    if (cjk >= 2 || (cjk === 1 && clean.length <= 4)) return 'zh';

    if (contar(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) >= 1) return 'ko';
    if (contar(/[\u0900-\u097F]/g) >= 2) return 'hi';

    if (contar(/[\u0600-\u06FF\u0750-\u077F]/g) >= 2) {
        if (/[\u0679\u0688\u0691\u06BA\u06BE\u06C1\u06D2]/.test(clean)) return 'ur';
        if (/[\u067E\u0686\u0698\u06AF\u06A9\u06CC]/.test(clean) && !/[\u0643\u064A\u0629]/.test(clean)) return 'fa';
        return 'ar';
    }

    if (contar(/[\u0400-\u04FF]/g) >= 2) {
        if (/[єіїґ]/i.test(clean)) return 'uk';
        if (/[ђјљњћџ]/i.test(clean)) return 'sr';
        if (/[әғқңөұүһі]/i.test(clean)) return 'kk';
        return 'ru';
    }

    if (contar(/[\u0E00-\u0E7F]/g) >= 2) return 'th';
    if (contar(/[\u0370-\u03FF]/g) >= 2) return 'el';
    if (contar(/[\u0590-\u05FF]/g) >= 2) return 'he';
    if (contar(/[\u0980-\u09FF]/g) >= 2) return 'bn';
    if (contar(/[\u0B80-\u0BFF]/g) >= 2) return 'ta';
    if (contar(/[\u0C00-\u0C7F]/g) >= 2) return 'te';
    if (contar(/[\u0A80-\u0AFF]/g) >= 2) return 'gu';
    if (contar(/[\u0A00-\u0A7F]/g) >= 2) return 'pa';
    if (contar(/[\u10A0-\u10FF]/g) >= 2) return 'ka';
    if (contar(/[\u0530-\u058F]/g) >= 2) return 'hy';
    if (contar(/[\u1200-\u137F]/g) >= 2) return 'am';
    if (contar(/[\u1780-\u17FF]/g) >= 2) return 'km';
    if (contar(/[\u0E80-\u0EFF]/g) >= 2) return 'lo';
    if (contar(/[\u1000-\u109F]/g) >= 2) return 'my';

    // Vietnamita com diacríticos empilhados exclusivos no alfabeto latino
    if (/[ơưđảạấầẩẫậắằẳẵặẻẽẹếềểễệỉĩịỏọốồổỗộớờởỡợủũụứừửữựỳỷỹỵ]/i.test(clean)) return 'vi';

    return null;
}

const MARCADORES_LATINOS_EXTRAS = {
    nl: new Set([
        'hallo', 'hoi', 'bedankt', 'dank', 'alstublieft', 'alsjeblieft', 'jij', 'wij',
        'mijn', 'onze', 'niet', 'geen', 'ook', 'maar', 'waarom', 'wanneer', 'hoe',
        'hoeveel', 'weer', 'regen', 'regent', 'bodem', 'grond', 'oogst', 'planten',
        'zaaien', 'mest', 'hulp', 'vandaag', 'morgen', 'gisteren', 'nederlands', 'spreek', 'spreken'
    ]),
    pl: new Set([
        'czesc', 'dzien', 'dobry', 'dziekuje', 'prosze', 'jestem', 'chce', 'moge',
        'dlaczego', 'kiedy', 'jak', 'ile', 'gdzie', 'gleba', 'ziemia', 'deszcz',
        'pada', 'pogoda', 'kukurydza', 'plon', 'zbiory', 'siac', 'sadzic', 'nawoz',
        'pomoc', 'dzis', 'dzisiaj', 'jutro', 'wczoraj', 'polski', 'polsku', 'mowisz'
    ]),
    tr: new Set([
        'merhaba', 'selam', 'tesekkur', 'tesekkurler', 'lutfen', 'evet', 'hayir',
        'neden', 'zaman', 'nasil', 'nerede', 'hava', 'yagmur', 'toprak', 'misir',
        'ekim', 'hasat', 'gubre', 'yardim', 'bugun', 'yarin', 'turkce', 'konus'
    ]),
    id: new Set([
        'halo', 'terima', 'kasih', 'tolong', 'saya', 'aku', 'kamu', 'kami',
        'mengapa', 'kenapa', 'kapan', 'bagaimana', 'berapa', 'dimana', 'cuaca',
        'hujan', 'tanah', 'jagung', 'tanam', 'menanam', 'panen', 'pupuk', 'bantuan', 'besok', 'kemarin'
    ]),
    sw: new Set([
        'habari', 'hujambo', 'asante', 'tafadhali', 'ndiyo', 'hapana', 'mimi', 'wewe',
        'sisi', 'lini', 'vipi', 'wapi', 'mvua', 'udongo', 'mahindi', 'kupanda',
        'mavuno', 'mbolea', 'msaada', 'leo', 'kesho', 'jana', 'kiswahili'
    ]),
    ro: new Set([
        'multumesc', 'vreau', 'cand', 'cum', 'unde', 'vreme', 'ploaie',
        'porumb', 'recolta', 'semanat', 'ajutor', 'azi', 'maine', 'ieri', 'romana'
    ]),
    cs: new Set([
        'ahoj', 'dekuji', 'prosim', 'chci', 'muzu', 'proc', 'kdy', 'kolik',
        'kde', 'pocasi', 'dest', 'puda', 'kukurice', 'sklizen', 'sazet', 'hnojivo',
        'pomoc', 'dnes', 'zitra', 'vcera', 'cesky'
    ]),
    sv: new Set([
        'hej', 'tack', 'snalla', 'jag', 'varfor', 'nar', 'hur', 'vader',
        'regn', 'jord', 'majs', 'skord', 'plantera', 'hjalp', 'idag', 'imorgon', 'igar', 'svenska'
    ])
};

function contarMarcadoresExtras(tokens = [], raw = '') {
    const scores = {};
    const rawLower = String(raw || '').toLowerCase();
    for (const [lang, set] of Object.entries(MARCADORES_LATINOS_EXTRAS)) {
        let count = 0;
        for (const t of tokens) {
            if (ESTRANGEIRISMOS_AGRO.has(t)) continue;
            if (set.has(t)) count += 1;
        }
        scores[lang] = count;
    }
    if (/[łążźćńśęó]/i.test(rawLower) && scores.pl > 0) scores.pl += 1;
    if (/[şğıİ]/u.test(rawLower) && scores.tr > 0) scores.tr += 1;
    if (/[řěůčšž]/i.test(rawLower) && scores.cs > 0) scores.cs += 1;
    if (/[ăâîșț]/i.test(rawLower) && scores.ro > 0) scores.ro += 1;
    return scores;
}

const VERBO_IDIOMA_RE = /(?:fala|falar|falando|responde|responder|responda|escreve|escreva|escrever|conversa|conversar|volta|voltar|muda|mudar|altera|alterar|troca|trocar|speak|speaking|talk|talking|answer|reply|respond|write|switch|change|habla|hablar|hablas|responde|responder|contesta|escribe|escribir|cambia|cambiar|parle|parler|parles|reponds?|sprich|sprechen|sprichst|antworte|parla|parlare|rispondi|spreek|spreken|konus)/i;

const NEGACAO_IDIOMA_RE = /\b(?:(?:eu|i|yo|nosotros|we|je|ich|io)\s+)?(?:(?:do\s+not|don'?t|can'?t|cannot|nao|n|no|ne|nicht|kein|non)\s+(?:really\s+|consigo\s+|puedo\s+|can\s+)?(?:falo|falar|entendo|compreendo|sei|speak|talk|understand|read|know|hablo|hablar|entiendo|comprendo|se|parle|comprends|spreche|verstehe|parlo|capisco)|speak\s+no)\s+(?:well\s+|bem\s+|bien\s+|in\s+|en\s+|em\s+|o\s+|el\s+|no\s+|na\s+)?([\p{L}-]{2,30})(?:\s+(language|idioma|lingua))?/giu;

const COMANDO_POSITIVO_RE = /(?:(?:vc\s+pode|voce\s+pode|pode|puedes|podrias|consegue|can\s+you|could\s+you|would\s+you|do\s+you|can\s+u|you\s+can|tu\s+peux|kannst\s+du|puoi)\s+)?\b(?:fala|falar|falando|responde|responder|responda|escreve|escreva|escrever|conversa|conversar|volta|voltar|muda|mudar|altera|alterar|troca|trocar|speak|speaking|talk|talking|answer|reply|respond|write|switch|change|habla|hablar|hablas|responde|responder|contesta|escribe|escribir|cambia|cambiar|parle|parler|parles|reponds?|sprich|sprechen|sprichst|antworte|parla|parlare|rispondi)\b(?:\s+(?:cmg|comigo|with\s+me|to\s+me|conmigo|para\s+mim|pra\s+mim|a\s+mi))?(?:(?:\s+p\/\s*|\s+(?:pra|pro|para|em|no|na|to|back\s+to|in|into|en|a|al|auf)(?:\s+(?:o|el|the))?\s+)(?:(?:idioma|language|lingua|lengua)\s+)?|\s+(?:(?:idioma|language|lingua|lengua)\s+)?)([\p{L}0-9-]{2,32})/giu;

const COMANDO_MUDAR_IDIOMA_RE = /\b(?:mudar|trocar|alterar|switch|change|cambiar|muda|troca|cambia)\s+(?:(?:o|my|el|the)\s+)?(?:idioma|language|lingua|lengua)(?:\s+p\/\s*|\s+(?:(?:para|pra|to|back\s+to|into|a|al|en)(?:\s+o)?\s+)|\s+)([\p{L}0-9-]{2,32})/giu;

const COMANDO_NATIVO_CJK_RE = /([\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0600-\u06FF\u0400-\u04FF]{2,15})(?:で話して|でお願い|にお願い|어로\s*말해|语|文|어로)?/;

function extrairPedidoIdioma(raw = '', norm = '') {
    const semAspas = String(norm || '').replace(/[’‘`]/g, "'");
    let idiomaRecusado = null;
    const trechosRecusa = [];

    const textoParaPositivo = semAspas.replace(NEGACAO_IDIOMA_RE, (full, cand) => {
        const res = resolverNomeIdiomaEmTexto(cand, { permitirCodigoCurto: false });
        if (res && !idiomaRecusado) idiomaRecusado = res;
        trechosRecusa.push(full);
        return ' '.repeat(full.length);
    });

    const tentarMatchesPositivos = (textoBusca, originalRaw) => {
        const regexes = [COMANDO_MUDAR_IDIOMA_RE, COMANDO_POSITIVO_RE];
        for (const re of regexes) {
            re.lastIndex = 0;
            let m;
            while ((m = re.exec(textoBusca)) !== null) {
                const cand = m[1];
                const resolved = resolverNomeIdiomaEmTexto(cand, { permitirCodigoCurto: true });
                if (resolved) {
                    return { idiomaAlvo: resolved, trechoMatch: m[0] };
                }
            }
        }

        // Padrões curtos: "in japanese please", "em russo pfv", "japanese please", "日本語で話して"
        const curtoPrep = textoBusca.match(/^(?:(?:please|pls|plz|por\s+favor|pfv|pfvr|porfa|agora|now|hey|hi|oi|ola|hola)\s+)?(?:em|in|en|to|auf)\s+([\p{L}0-9-]{2,32})(?:\s+(?:please|pls|plz|por\s+favor|pfv|pfvr|porfa|gracias|merci|danke|grazie|now|agora|with\s+me|comigo))?$/iu);
        if (curtoPrep) {
            const resolved = resolverNomeIdiomaEmTexto(curtoPrep[1], { permitirCodigoCurto: true });
            if (resolved) return { idiomaAlvo: resolved, trechoMatch: curtoPrep[0] };
        }

        const curtoNome = textoBusca.match(/^([\p{L}-]{3,32})(?:\s+(?:please|pls|plz|por\s+favor|pfv|pfvr|porfa|gracias|merci|danke|grazie|language|idioma))?$/iu);
        if (curtoNome) {
            const resolved = resolverNomeIdiomaEmTexto(curtoNome[1], { permitirCodigoCurto: false });
            if (resolved) return { idiomaAlvo: resolved, trechoMatch: curtoNome[0] };
        }

        if (VERBO_IDIOMA_RE.test(textoBusca) || /で話|でお願|말해|ب?العرب|по-русски/iu.test(originalRaw)) {
            const mNat = String(originalRaw || '').match(COMANDO_NATIVO_CJK_RE);
            if (mNat) {
                const resolved = resolverNomeIdiomaEmTexto(mNat[1], { permitirCodigoCurto: false });
                if (resolved) return { idiomaAlvo: resolved, trechoMatch: mNat[0] };
            }
        }
        return null;
    };

    const achado = tentarMatchesPositivos(textoParaPositivo, raw);
    if (achado) {
        let restante = semAspas.replace(achado.trechoMatch, ' ');
        for (const tRec of trechosRecusa) {
            restante = restante.replace(tRec, ' ');
        }
        restante = restante
            .replace(/\b(?:vc\s+pode|voce\s+pode|pode|puedes|podrias|consegue|can\s+you|could\s+you|would\s+you|do\s+you|you\s+can|can\s+u|with\s+me|cmg|comigo|conmigo|to\s+me|para\s+mim|please|pls|plz|por\s+favor|pfv|pfvr|porfa|per\s+favore|bitte|merci|gracias|grax|danke|grazie|now|agora|meu\s+amigo|my\s+friend|amigo|parceiro|cumpadi|ze\s+agro|hi|hello|oi|ola|opa|hola|bonjour|hallo|ciao)\b/gi, ' ')
            .replace(/[^\p{L}0-9]/gu, '');
        return {
            idiomaAlvo: achado.idiomaAlvo,
            idiomaRecusado,
            apenasComando: restante.length < 4
        };
    }

    return { idiomaAlvo: null, idiomaRecusado, trechosRecusa };
}

const SAUDACOES_RETORNO_POR_IDIOMA = {
    en: /^(?:hi+|hello+|hey+|thanks?|thank\s+you|thx|good\s+(?:morning|afternoon|evening)|how\s+are\s+you)(?:\s+.*)?$/i,
    es: /^(?:hola+|buenos\s+dias|buenas\s+(?:tardes|noches)|muchas\s+gracias|gracias|grax|que\s+tal|como\s+estas)(?:\s+.*)?$/i,
    fr: /^(?:bonjour|bonsoir|salut|merci(?:\s+beaucoup)?)(?:\s+.*)?$/i,
    de: /^(?:hallo|guten\s+(?:morgen|tag|abend)|danke(?:\s+schon)?)(?:\s+.*)?$/i,
    it: /^(?:ciao|buongiorno|buonasera|grazie(?:\s+mille)?)(?:\s+.*)?$/i
};

/**
 * Resolve o idioma ativo do usuário para TODOS os idiomas do mundo com consistência entre turnos:
 * - Reconhece pedidos explícitos de troca para qualquer idioma (ex.: "speak Japanese", "fala em russo").
 * - Identifica sistemas de escrita não-latinos instantaneamente (japonês, chinês, coreano, árabe, russo, hindi, etc.).
 * - Detecta recusa ao idioma atual ("Eu não falo português", "I don't speak Spanish") sem responder à força no idioma rejeitado.
 * - Protege números +55 contra falsos positivos em empréstimos do agro ("ok", "link", "pix", "stress", "spray", "Roundup").
 * - Sinaliza `possivelOutroIdioma: true` para mensagens latinas ambíguas de 3º+ idioma para classificação leve por IA.
 */
export function detectarTrocaIdioma(texto = '', idiomaAtual = null, whatsappNumber = '') {
    const raw = String(texto || '').trim();
    const normApost = raw.replace(/[’‘`]/g, "'");
    const norm = normSemAcentoLower(normApost).replace(/[?!.,;:]+$/g, '').trim();
    const fallbackDdi = idiomaPadraoPorNumero(whatsappNumber);
    const atualNorm = normalizarCodigoIdioma(idiomaAtual);
    const idiomaBase = atualNorm || fallbackDdi || IDIOMA_PADRAO;

    if (!norm && !raw) {
        return { idioma: idiomaBase, alterado: false, motivo: 'vazio', apenasComando: false };
    }

    // 1. Comando explícito ou pedido para qualquer idioma do mundo (inclui "You can speak Japanese with me?")
    const pedido = extrairPedidoIdioma(raw, norm);
    if (pedido.idiomaAlvo) {
        return {
            idioma: pedido.idiomaAlvo,
            alterado: pedido.idiomaAlvo !== atualNorm,
            idiomaRecusado: pedido.idiomaRecusado || null,
            motivo: 'comando_explicito',
            apenasComando: pedido.apenasComando
        };
    }

    // 2. Escrita não-latina (japonês, chinês, coreano, árabe, hindi, russo, ucraniano, tailandês, grego, hebraico etc.)
    const scriptDetectado = detectarScriptIdioma(raw);
    if (scriptDetectado) {
        return {
            idioma: scriptDetectado,
            alterado: scriptDetectado !== atualNorm,
            motivo: 'script_unicode',
            apenasComando: false
        };
    }

    const tokens = tokenizarSemRuido(normApost);
    const { pt, ptVsEs, en, es, fr, de, it } = contarMarcadores(tokens, normApost);
    const extras = contarMarcadoresExtras(tokens, raw);
    const esComSinais = es + (/[¿¡ñ]/i.test(raw) ? 1 : 0);
    const scoresPorIdioma = {
        'pt-BR': pt,
        en,
        es: esComSinais,
        fr,
        de,
        it,
        ...extras
    };

    // 3. Recusa explícita ao idioma atual (ex.: "I don't speak Spanish", "Eu não falo português")
    if (pedido.idiomaRecusado) {
        const candidatosNaoRecusados = Object.entries(scoresPorIdioma)
            .filter(([k]) => k !== pedido.idiomaRecusado)
            .sort((a, b) => b[1] - a[1]);
        const melhorOutro = candidatosNaoRecusados[0];
        if (melhorOutro && melhorOutro[1] >= 1) {
            return {
                idioma: melhorOutro[0],
                alterado: melhorOutro[0] !== atualNorm,
                idiomaRecusado: pedido.idiomaRecusado,
                motivo: 'recusa_outro_idioma',
                apenasComando: false
            };
        }
        if (pedido.idiomaRecusado === idiomaBase) {
            let restoSemRecusa = norm;
            for (const tRec of pedido.trechosRecusa || []) {
                restoSemRecusa = restoSemRecusa.replace(tRec, ' ');
            }
            restoSemRecusa = restoSemRecusa
                .replace(/\b(?:meu\s+amigo|my\s+friend|mi\s+amigo|amigo|parceiro|please|por\s+favor|pfv|pls|porfa|desculpa|sorry)\b/gi, ' ')
                .replace(/[^a-z0-9]/gi, '');
            return {
                idioma: idiomaBase,
                alterado: false,
                idiomaRecusado: pedido.idiomaRecusado,
                recusouApenas: restoSemRecusa.length < 4,
                motivo: 'recusa_idioma_atual',
                apenasComando: false
            };
        }
    }

    // 4. 1º contato de DDI internacional aberto (ex.: +91 Índia, +33 França)
    const primeiroContatoInternacional = !atualNorm && !fallbackDdi && !ehNumeroBrasileiro(whatsappNumber);
    if (primeiroContatoInternacional) {
        if (/^(?:hi+|hello+|hey+|good\s+(?:morning|afternoon|evening)|help|menu)$/i.test(norm)) {
            return { idioma: 'en', alterado: true, motivo: 'auto_ddi_aberto', apenasComando: false };
        }
        if (/^(?:hola+|buenos\s+dias|buenas\s+(?:tardes|noches)|ayuda)$/i.test(norm)) {
            return { idioma: 'es', alterado: true, motivo: 'auto_ddi_aberto', apenasComando: false };
        }
        if (/^(?:bonjour|bonsoir|salut|aide)$/i.test(norm)) {
            return { idioma: 'fr', alterado: true, motivo: 'auto_ddi_aberto', apenasComando: false };
        }
        if (/^(?:hallo|guten\s+(?:morgen|tag|abend)|hilfe)$/i.test(norm)) {
            return { idioma: 'de', alterado: true, motivo: 'auto_ddi_aberto', apenasComando: false };
        }
        if (/^(?:ciao|buongiorno|buonasera|aiuto)$/i.test(norm)) {
            return { idioma: 'it', alterado: true, motivo: 'auto_ddi_aberto', apenasComando: false };
        }
    }

    const semConflitoOutros = (codigoAlvo) => Object.entries(scoresPorIdioma)
        .filter(([k]) => k !== codigoAlvo)
        .every(([, v]) => (v || 0) === 0);

    // 5. Retorno imediato em saudações/interjeições curtas inequívocas ao Português
    if (idiomaBase !== IDIOMA_PADRAO && semConflitoOutros(IDIOMA_PADRAO)) {
        const saudacaoPtEstrita = /^(?:oi+|opa+|obrigad[oa]|obg|obgd|valeu|vlw|flw|beleza|blz|tmj|tudo\s+(?:bem|certo)|bom\s+dia|boa\s+noite|e\s+ai|e\s+agora)(?:\s+.*)?$/i.test(norm);
        const saudacaoPtRelaxada = (idiomaBase !== 'es' || fallbackDdi === IDIOMA_PADRAO)
            && /^(?:ola+|boa\s+tarde)(?:\s+.*)?$/i.test(norm);
        if (saudacaoPtEstrita || saudacaoPtRelaxada) {
            return { idioma: IDIOMA_PADRAO, alterado: true, motivo: 'retorno_pt_saudacao', apenasComando: false };
        }
    }

    // 6. Retorno/alternância em saudação inequívoca entre idiomas
    if (idiomaBase !== fallbackDdi || idiomaBase !== IDIOMA_PADRAO) {
        for (const [codigo, reSaud] of Object.entries(SAUDACOES_RETORNO_POR_IDIOMA)) {
            const podeSaudacao = codigo === fallbackDdi || idiomaBase !== IDIOMA_PADRAO;
            if (podeSaudacao && codigo !== idiomaBase && semConflitoOutros(codigo) && reSaud.test(norm)) {
                return { idioma: codigo, alterado: true, motivo: `retorno_${codigo}_saudacao`, apenasComando: false };
            }
        }
    }

    const minimoPara = (codigo) => {
        if (primeiroContatoInternacional) return 2;
        if (idiomaBase !== codigo && (codigo === fallbackDdi || codigo === IDIOMA_PADRAO)) return 2;
        if (idiomaBase !== fallbackDdi && idiomaBase !== IDIOMA_PADRAO) return 2;
        return 3;
    };

    const scorePara = (codigo) => (codigo === IDIOMA_PADRAO && idiomaBase === 'es' ? ptVsEs : scoresPorIdioma[codigo] || 0);
    const conflitoPara = (codigo) => {
        if (idiomaBase === 'pt-BR' && codigo === 'es') return ptVsEs;
        if (idiomaBase === 'es' && codigo === 'pt-BR') return esComSinais;
        return scoresPorIdioma[idiomaBase] || 0;
    };

    const listaIdiomasScore = Object.keys(scoresPorIdioma);
    const candidatos = listaIdiomasScore
        .map((codigo) => ({
            codigo,
            score: scorePara(codigo),
            conflitoCurrent: conflitoPara(codigo)
        }))
        .sort((a, b) => b.score - a.score);

    const topo = candidatos[0];
    const segundo = candidatos[1];
    const minNecessario = topo ? minimoPara(topo.codigo) : 4;
    const retornoDominante = topo
        && (topo.codigo === fallbackDdi || topo.codigo === IDIOMA_PADRAO || idiomaBase !== fallbackDdi)
        && topo.score >= 3
        && topo.conflitoCurrent <= 1
        && topo.score >= topo.conflitoCurrent * 3;
    // Se já estamos fora do português (ex.: es -> en -> es -> fr), evita exigir 3 palavras quando há sinal limpo de outro idioma sem conflito
    const alternanciaLimpaChat = topo
        && topo.codigo !== idiomaBase
        && topo.conflitoCurrent === 0
        && (scoresPorIdioma[IDIOMA_PADRAO] || 0) === 0
        && tokens.length >= 2
        && (topo.score >= 2 || (idiomaBase !== IDIOMA_PADRAO && topo.score >= 1 && (topo.score > (segundo?.score || 0)) && !ESTRANGEIRISMOS_AGRO.has(norm)));

    if (
        topo
        && topo.codigo !== idiomaBase
        && topo.score > (segundo?.score || 0)
        && (
            (topo.score >= minNecessario && (topo.conflitoCurrent === 0 || retornoDominante))
            || alternanciaLimpaChat
        )
    ) {
        return {
            idioma: topo.codigo,
            alterado: true,
            motivo: primeiroContatoInternacional ? 'auto_ddi_aberto' : 'sentenca_inequivoca',
            apenasComando: false
        };
    }

    // 7. Frase latina longa/média sem marcadores do idioma ativo (ex.: tcheco, húngaro, finlandês, tagalo ou frase curta ambígua em espanhol/inglês)
    const tokensSemRuido = tokens.filter((t) => !ESTRANGEIRISMOS_AGRO.has(t) && /[a-z]/i.test(t));
    const scoreAtivo = scoresPorIdioma[idiomaBase] || 0;
    const naoEhSoSaudacaoBr = !/^(?:oi+|opa+|ola+|blz|vlw|obg|ok+|sim|nao|talvez|beleza|fechado|certo)$/i.test(norm);
    const minTokensLlm = idiomaBase !== IDIOMA_PADRAO ? 2 : 3;
    const possivelOutroIdioma = tokensSemRuido.length >= minTokensLlm && scoreAtivo === 0 && naoEhSoSaudacaoBr;

    return {
        idioma: idiomaBase,
        alterado: !atualNorm && Boolean(fallbackDdi),
        motivo: 'mantido',
        apenasComando: false,
        possivelOutroIdioma
    };
}

/**
 * Detector determinístico pós-LLM para impedir vazamento de idioma errado na resposta final.
 */
export function detectarVazamentoIdioma(texto = '', idiomaAlvo = IDIOMA_PADRAO) {
    const alvo = normalizarCodigoIdioma(idiomaAlvo) || IDIOMA_PADRAO;
    const raw = String(texto || '').trim();
    const scoreVazio = { pt: 0, ptVsEs: 0, en: 0, es: 0, fr: 0, de: 0, it: 0 };
    if (!raw || raw.length < 15) {
        return { vazou: false, idiomaDetectado: null, scores: scoreVazio };
    }

    const tokens = tokenizarSemRuido(raw.replace(/[’‘`]/g, "'"));
    const { pt, ptVsEs, en, es, fr, de, it } = contarMarcadores(tokens, raw);
    const extras = contarMarcadoresExtras(tokens, raw);
    const scriptDetectado = detectarScriptIdioma(raw);
    const scores = { pt, ptVsEs, en, es, fr, de, it, ...extras, ...(scriptDetectado ? { scriptDetectado } : {}) };

    const SCRIPTS_NAO_LATINOS = new Set([
        'ja', 'zh', 'ko', 'hi', 'ar', 'ru', 'uk', 'th', 'el', 'he',
        'bn', 'ta', 'te', 'gu', 'pa', 'fa', 'ur', 'ka', 'hy', 'am', 'km', 'lo', 'my', 'sr', 'kk'
    ]);

    if (SCRIPTS_NAO_LATINOS.has(alvo)) {
        if (scriptDetectado && scriptDetectado !== alvo) {
            // Japonês às vezes pode ter só Kanji em frase curtíssima, mas resposta da IA sempre usa Kana/script alvo
            if (!(alvo === 'ja' && scriptDetectado === 'zh' && raw.length < 25)) {
                return { vazou: true, idiomaDetectado: scriptDetectado, scores };
            }
        }
        const letrasLatinas = (raw.replace(/\[PRODUCT_IMAGE:[^\]]+\]|https?:\/\/\S+/gi, '').match(/[A-Za-zÀ-ÿ]/g) || []).length;
        if (!scriptDetectado && letrasLatinas >= 12) {
            const topLat = [['pt-BR', pt], ['en', en], ['es', es], ['fr', fr], ['de', de], ['it', it]]
                .sort((a, b) => b[1] - a[1])[0];
            return { vazou: true, idiomaDetectado: topLat?.[1] > 0 ? topLat[0] : 'en', scores };
        }
        return { vazou: false, idiomaDetectado: alvo, scores };
    }

    if (scriptDetectado && scriptDetectado !== alvo) {
        return { vazou: true, idiomaDetectado: scriptDetectado, scores };
    }

    const scoreKey = { 'pt-BR': pt, en, es, fr, de, it, ...extras };
    const outros = (codigoAlvo) => Object.keys(scoreKey)
        .filter((c) => c !== codigoAlvo)
        .map((c) => ({ code: c, s: codigoAlvo === 'es' && c === 'pt-BR' ? ptVsEs : scoreKey[c] }));

    if (alvo === 'pt-BR') {
        for (const outro of outros('pt-BR')) {
            const vazouOutro = outro.code === 'es'
                ? (outro.s >= 4 && outro.s > ptVsEs)
                : ((outro.s >= 3 && outro.s >= pt) || (outro.s >= 4 && pt <= 1));
            if (vazouOutro) {
                return { vazou: true, idiomaDetectado: outro.code, scores };
            }
        }
        return { vazou: false, idiomaDetectado: 'pt-BR', scores };
    }

    const scoreAlvo = scoreKey[alvo];
    if (scoreAlvo !== undefined) {
        const ptScore = alvo === 'es' ? ptVsEs : pt;
        if (ptScore >= 3 || (ptScore >= 2 && scoreAlvo < ptScore * 2)) {
            return { vazou: true, idiomaDetectado: 'pt-BR', scores };
        }
        for (const outro of outros(alvo).filter((x) => x.code !== 'pt-BR')) {
            if (outro.s >= 3 && outro.s >= scoreAlvo) {
                return { vazou: true, idiomaDetectado: outro.code, scores };
            }
        }
        return { vazou: false, idiomaDetectado: alvo, scores };
    }

    // Demais idiomas latinos sem dicionário completo (tl, ms, af, ca, gl, da, fi, no, hu...): bloqueia vazamento óbvio em PT/EN/ES/FR/DE/IT
    const maiorVazamento = outros(alvo).sort((a, b) => b.s - a.s)[0];
    if (maiorVazamento && maiorVazamento.s >= 3) {
        return { vazou: true, idiomaDetectado: maiorVazamento.code, scores };
    }
    return { vazou: false, idiomaDetectado: alvo, scores };
}

const TROCA_IDIOMA_OK_NATIVOS = {
    hi: 'ठीक है! अब से मैं आपसे *हिन्दी (Hindi)* में बात करूँगा। 🤝 आप लिखकर, वॉइस मैसेज से या फसल की फोटो भेजकर पूछ सकते हैं!',
    ja: 'かしこまりました！これからは*日本語*でお答えします。🤝 テキスト・音声・作物の写真どれでも気軽に送ってください！',
    zh: '好的！从现在起我会用*中文*为你解答。🤝 欢迎随时发文字、语音或作物照片！',
    ko: '알겠습니다! 이제부터 *한국어*로 답변해 드릴게요. 🤝 텍스트, 음성, 작물 사진 무엇이든 보내주세요!',
    ar: 'تم! سأرد عليك من الآن باللغة *العربية*. 🤝 يمكنك إرسال سؤالك الزراعي بالكتابة أو الصوت أو صورة للنبات!',
    ru: 'Договорились! Теперь отвечаю на *Русском*. 🤝 Присылайте вопрос текстом, голосом или фото растения!',
    uk: 'Домовились! Тепер відповідаю *Українською*. 🤝 Надсилайте питання текстом, голосовим чи фото!',
    nl: 'Afgesproken! Vanaf nu antwoord ik in het *Nederlands*. 🤝 Stuur je vraag gerust per tekst, spraakbericht of foto!',
    pl: 'Zgoda! Od teraz odpowiadam po *Polsku*. 🤝 Wyślij pytanie tekstem, głosówką lub zdjęciem rośliny!',
    tr: 'Tamam! Bundan sonra *Türkçe* yanıt vereceğim. 🤝 Sorunu yazılı, sesli mesajla veya bitki fotoğrafıyla gönderebilirsin!',
    id: 'Siap! Mulai sekarang saya balas dalam *Bahasa Indonesia*. 🤝 Kirim pertanyaan tani lewat teks, suara, atau foto tanaman!',
    vi: 'Đã rõ! Từ giờ tôi sẽ trả lời bằng *Tiếng Việt*. 🤝 Hãy gửi câu hỏi bằng tin nhắn, ghi âm hoặc ảnh cây trồng nhé!',
    th: 'ได้เลยครับ! จากนี้ผมจะตอบเป็น*ภาษาไทย*นะครับ 🤝 ส่งข้อความ เสียง หรือรูปพืชมาได้เลย!',
    ro: 'De acord! De acum îți răspund în *Română*. 🤝 Trimite întrebarea prin text, mesaj vocal sau poză!',
    cs: 'Domluveno! Od teď odpovídám v *Češtině*. 🤝 Pošli dotaz textem, hlasovkou nebo fotkou!',
    sv: 'Toppen! Från nu svarar jag på *Svenska*. 🤝 Skicka din fråga som text, röstmeddelande eller bild!',
    el: 'Έγινε! Από τώρα θα σου απαντάω στα *Ελληνικά*. 🤝 Στείλε την ερώτησή σου με μήνυμα, ηχητικό ή φωτογραφία!',
    he: 'סגור! מעכשיו אענה לך ב*עברית*. 🤝 שלח את השאלה בטקסט, הקלטה או תמונה מהשדה!',
    sw: 'Sawa! Kuanzia sasa nitajibu kwa *Kiswahili*. 🤝 Tuma swali lako kwa ujumbe, sauti, au picha ya shamba!'
};

export const MSG_I18N = {
    'pt-BR': {
        erro_conexao: 'Eita, deu uma oscilada na conexão aqui agora. Pode me mandar de novo, por favor?',
        erro_geracao_llm: 'Desculpe, não consegui formular uma resposta agora.',
        anti_spam: 'Calma aí, parceiro, tô terminando de responder sua mensagem anterior.',
        audio_ruido: 'Opa, parceiro! Deu um chiado no áudio aqui na minha ponta e cortou o que você falou. Consegue me mandar outro áudio bem pertinho do microfone, ou uma foto do que tá acontecendo aí?',
        troca_idioma_ok: 'Fechado! A partir de agora falo com você em *Português*. 🤝 Pode mandar sua dúvida da lavoura por texto, áudio ou foto!',
        recusa_idioma_pergunta: 'Sem problema! Eu falo e entendo qualquer idioma. Qual língua você prefere usar agora? Pode responder direto nela ou pedir pelo nome (ex.: English, Español, 日本語, Français, العربية, Italiano, Deutsch, Nederlands, 中文).',
        followup_audio: 'Ficou alguma dúvida?',
        imagem_produto_caption: '📸 Produto encontrado:',
        ajuda_audio: 'Opa, eu sou o Zé Agro, teu parceiro de lavoura aqui no zap. Pode me mandar áudio ou foto da planta pra saber o que plantar depois da colheita, quanto custa por hectare, como cuidar do plantio, a melhor janela de chuva ou onde vender perto de você. Me conta: o que tá pegando aí na tua terra hoje?',
        ajuda_texto: `🌾 *Opa! Eu sou o Zé Agro, teu parceiro de lavoura aqui no zap.*

Pode conversar comigo normal por *texto*, *áudio* 🎙️ ou mandar *foto* 📸 da planta:

• *O que plantar depois da colheita e rotação:* _"Colhi soja em Rio Verde, compensa plantar de novo?"_ ou _"Minha terra tá cansada e seca, o que aguenta?"_
• *Custos, manejo e onde vender:* _"Quanto gasto pra plantar braquiária?"_, _"São 10 hectares"_ ou _"Pra quem eu vendo gergelim aqui perto?"_
• *Clima, chuva e janela de plantio:* _"Qual a melhor janela? Vai me avisando aí"_

Me conta: *o que tá pegando aí na tua terra hoje?* 🤝`,
        apagar_dados_ok: 'Pronto, apaguei teu perfil, caderno, lembretes e contas por aqui. 🤝 Se mandar mensagem de novo, a gente começa do zero.',
        falar_tecnico_vazio: 'Fechado. Me conta rapidinho o que tá acontecendo (cultura ou criação, sintoma e quando começou) que eu monto um resumo certinho pra você levar ao agrônomo, veterinário ou Emater.',
        quero_vip: 'Fica tranquilo, sô! O Zé Agro tá 100% liberado e gratuito por aqui — não precisa pagar nada nem assinar VIP. Pode mandar tua dúvida de lavoura, áudio ou foto à vontade! 🤝',
        aviso_ativado: "Fechou! 🌅 Vou te mandar o resumo do tempo toda manhã às 6h, com dica pra tua lavoura. Se eu ainda não souber tua cidade, me fala de onde você tá que eu guardo! (Se um dia quiser parar, é só falar 'para de mandar o aviso de manhã'.)",
        aviso_desativado: "Tranquilo, parei os avisos! 👍 Se mudar de ideia é só me pedir 'me manda o tempo todo dia de manhã' que eu volto a enviar.",
        csv_vazio: '📓 Teu caderno tá vazio nesse período. Pode mandar um áudio ou texto falando _"anota aí que abasteci 40 litros de diesel no trator"_ que eu já guardo pra você.',
        csv_caption: '📓 Teu caderno dos últimos {dias} dias ({qtd} registros).',
        guardrail_injection: 'Sou o Zé Agro e meu foco aqui é manejo de lavoura, solo, dados climáticos da NASA, rotação de culturas e escoamento no campo. Como posso ajudar sua produção hoje?',
        guardrail_ilegal: 'Por segurança da sua lavoura e exigência legal, não indico misturas proibidas nem uso de defensivos fora da bula ou sem receituário agronômico. Consulte um engenheiro agrônomo ou a Emater da sua região.',
        guardrail_off_topic: 'Sou o Zé Agro e atuo exclusivamente com apoio agronômico, clima da NASA, manejo de solo, rotação de culturas, pecuária e gestão da propriedade rural. Como posso ajudar sua produção hoje?',
        fallback_sem_dados: 'Opa, tô na escuta! Me fala de qual cidade você tá falando e o que tá plantando aí pra eu cruzar com os dados de clima e solo da NASA pra você.',
        convite_forma_profissional: '*Quer saber o custo ou algo do tipo?* Posso te passar por área, como tratar, a melhor janela no zap ou a *forma profissional* (opcional).',
        rotacao_audio_closing: 'Se quiser saber quanto custa pra sua área ou como plantar passo a passo, é só me mandar outro áudio.',
        abuso_bloqueado: 'Tô te segurando mais {mins} min pra não travar tudo aqui — respira, organiza a dúvida e manda de novo que eu te atendo bem. 🤝',
        abuso_rajada_1: 'Opa, calma aí sô 😅 manda uma de cada vez que eu respondo tudo, prometo.',
        abuso_rajada_n: 'Segurei por {mins} min porque veio avalanche de mensagem. Volta já já que eu te atendo bem. 🌾',
        abuso_midia: 'Calma com as fotos e áudios, manda uma leva de cada vez que eu analiso tudo. 📸',
        abuso_audio_longo: 'Áudio grandão demais pra eu processar (passou de 3 min). Manda em partes menores? 🎙️',
        abuso_repetida: 'Recebi 3x a mesma mensagem — tenta me contar de outro jeito? 🤔',
        rotacao_modo_pro_header: '📋 *Aqui tá no modo profissional (ficha técnica completa):*',
        rotacao_modo_pro_footer: 'Se quiser olhar pra outra cidade ou outra lavoura, é só me falar normal: _"colhi milho em Jataí, o que eu planto agora?"_ ou _"pra quem eu vendo?"_'
    },
    en: {
        erro_conexao: 'Oops! I hit a brief connection hiccup here. Could you send that again, please?',
        erro_geracao_llm: "Sorry, I couldn't put together an answer right now.",
        anti_spam: "Hold on, partner — I'm still finishing your previous message.",
        audio_ruido: 'Hey partner! Your audio came through noisy or cut off on my end. Could you send another voice note close to the mic, or a photo of the crop?',
        troca_idioma_ok: "Got it! I'll reply in *English* from now on. 🤝 Send me your crop question by text, voice note, or photo!",
        recusa_idioma_pergunta: "No problem! I speak every language. Just reply directly in the language you prefer (Español, Português, 日本語, Français, العربية, Deutsch, 中文...) or tell me its name and I'll switch right away.",
        followup_audio: 'Any questions?',
        imagem_produto_caption: '📸 Product found:',
        ajuda_audio: "Hey, I'm Zé Agro, your farming partner here on WhatsApp. Send me a voice note or a plant photo to check what to plant after harvest, estimated cost per hectare, field management, rain windows, or local buyers. Tell me: what's happening in your field today?",
        ajuda_texto: `🌾 *Hey! I'm Zé Agro, your farming partner on WhatsApp.*

You can message me normally by *text*, *voice note* 🎙️, or *photo* 📸 of your plant:

• *Post-harvest crop rotation:* _"Just harvested soy, should I repeat corn?"_ or _"My soil is dry and tired, what holds up best?"_
• *Costs, management & buyers:* _"How much to plant brachiaria on 10 hectares?"_ or _"Where can I sell sesame nearby?"_
• *Weather & planting window:* _"When is the best rain window to plant?"_

Tell me: *what's going on in your field today?* 🤝`,
        apagar_dados_ok: 'Done — I deleted your profile, field log, reminders, and accounts here. 🤝 If you message me again, we start fresh.',
        falar_tecnico_vazio: "Sure thing. Tell me briefly what's going on (crop or livestock, symptoms, and when it started) so I can prepare a clean summary for your agronomist or extension agent.",
        quero_vip: "No worries! Zé Agro is 100% free and unlocked right now — no payment or VIP plan needed. Feel free to send crop questions, voice notes, or photos anytime! 🤝",
        aviso_ativado: "Done! 🌅 I'll send your morning weather briefing at 6 AM with a tip for your crop. If I don't know your city yet, just tell me where you are! (To stop anytime, say 'stop morning alerts'.)",
        aviso_desativado: "No problem, I paused your daily alerts! 👍 Whenever you want them back, just ask me to send the morning weather.",
        csv_vazio: '📓 Your field log is empty for that period. You can say _"log that I bought 40 liters of tractor diesel"_ and I will track it for you.',
        csv_caption: '📓 Your field log from the last {dias} days ({qtd} entries).',
        guardrail_injection: "I'm Zé Agro and my focus here is crop management, soil, NASA weather data, crop rotation, and selling your harvest. How can I help your farm today?",
        guardrail_ilegal: 'For crop safety and legal compliance, I cannot recommend banned tank mixes or off-label pesticide usage without an agronomy prescription. Please consult a licensed agronomist.',
        guardrail_off_topic: "I'm Zé Agro and I focus exclusively on agronomy, NASA weather, soil care, crop rotation, livestock, and farm operations. How can I help your farm today?",
        fallback_sem_dados: "Hey, I'm listening! Tell me your city and what crop you're planting so I can cross-check it with NASA climate and soil data for you.",
        convite_forma_profissional: '*Want to check estimated costs or next steps?* I can break down costs by area, field care, the best rain window, or the full technical summary.',
        rotacao_audio_closing: 'If you want cost estimates for your area or step-by-step planting tips, just send me another voice note.',
        abuso_bloqueado: "Holding messages for {mins} min so things don't jam up — take a breath and send your question again soon. 🤝",
        abuso_rajada_1: 'Whoa, slow down a bit 😅 send one message at a time and I will answer everything.',
        abuso_rajada_n: 'Paused for {mins} min after too many messages at once. Message back soon and I will help you out. 🌾',
        abuso_midia: 'Easy on the photos and voice notes — send one batch at a time so I can review everything carefully. 📸',
        abuso_audio_longo: 'That voice note is too long to process (over 3 min). Could you split it into shorter parts? 🎙️',
        abuso_repetida: 'Got the exact same message 3 times — could you rephrase what you need? 🤔',
        rotacao_modo_pro_header: '📋 *Technical summary (full breakdown):*',
        rotacao_modo_pro_footer: 'If you want to check another city or crop, just ask naturally in your own words.'
    },
    es: {
        erro_conexao: '¡Ups! Se cortó un poco la conexión por aquí. ¿Me lo puedes enviar de nuevo, por favor?',
        erro_geracao_llm: 'Disculpa, no pude armar una respuesta en este momento.',
        anti_spam: 'Espera un segundo, amigo, ya estoy terminando de responder tu mensaje anterior.',
        audio_ruido: '¡Oye amigo! El audio llegó con mucho ruido o cortado por aquí. ¿Puedes grabarlo de nuevo cerca del micrófono o mandar una foto del cultivo?',
        troca_idioma_ok: '¡Listo! Desde ahora te respondo en *Español*. 🤝 ¡Mándame tu duda del campo por texto, audio o foto!',
        recusa_idioma_pergunta: '¡Sin problema! Hablo todos los idiomas. Responde directamente en tu idioma (English, Português, 日本語, Français, العربية, Deutsch...) o dime su nombre y cambio enseguida.',
        followup_audio: '¿Te quedó alguna duda?',
        imagem_produto_caption: '📸 Producto encontrado:',
        ajuda_audio: 'Hola, soy Zé Agro, tu compañero de cultivo aquí en WhatsApp. Mándame audio o foto de la planta para saber qué sembrar después de la cosecha, cuánto cuesta por hectárea, cómo cuidar el cultivo, la mejor ventana de lluvia o dónde vender cerca. Cuéntame: ¿qué está pasando en tu campo hoy?',
        ajuda_texto: `🌾 *¡Hola! Soy Zé Agro, tu compañero de campo en WhatsApp.*

Puedes hablar conmigo normal por *texto*, *audio* 🎙️ o mandar *foto* 📸 de tu cultivo:

• *Qué sembrar tras la cosecha y rotación:* _"Coseché soya, ¿conviene repetir?"_ o _"Mi suelo está seco, ¿qué aguanta mejor?"_
• *Costos, manejo y dónde vender:* _"¿Cuánto cuesta sembrar pasto en 10 hectáreas?"_ o _"¿Dónde vendo ajonjolí cerca?"_
• *Clima, lluvia y siembra:* _"¿Cuál es la mejor ventana de lluvia?"_

Cuéntame: *¿qué está pasando en tu campo hoy?* 🤝`,
        apagar_dados_ok: 'Listo, borré tu perfil, cuaderno, recordatorios y cuentas por aquí. 🤝 Si escribes de nuevo, empezamos desde cero.',
        falar_tecnico_vazio: 'Perfecto. Cuéntame rápido qué está pasando (cultivo o ganado, síntomas y cuándo empezó) para armar un resumen claro para tu agrónomo o técnico.',
        quero_vip: '¡Tranquilo, amigo! Zé Agro está 100% libre y gratuito por aquí — no hace falta pagar nada ni suscribirse a VIP. ¡Manda tus dudas, audios o fotos cuando quieras! 🤝',
        aviso_ativado: "¡Listo! 🌅 Te mandaré el resumen del clima cada mañana a las 6 a.m. con un consejo para tu cultivo. Si aún no sé tu ciudad, dímela para guardarla. (Para detenerlo, solo di 'dejar de enviar avisos'.)",
        aviso_desativado: "¡Listo, pausé los avisos diarios! 👍 Cuando quieras volver a recibirlos, solo pídeme el clima de la mañana.",
        csv_vazio: '📓 Tu cuaderno está vacío en ese período. Puedes mandarme un audio o texto diciendo _"anota que cargué 40 litros de diésel"_ y yo lo guardo.',
        csv_caption: '📓 Tu cuaderno de los últimos {dias} días ({qtd} registros).',
        guardrail_injection: 'Soy Zé Agro y mi enfoque aquí es manejo de cultivos, suelo, datos climáticos de la NASA, rotación y venta de cosecha. ¿Cómo ayudo a tu campo hoy?',
        guardrail_ilegal: 'Por seguridad de tu cultivo y ley agronómica, no indico mezclas prohibidas ni agroquímicos fuera de etiqueta sin receta técnica. Consulta a un ingeniero agrónomo local.',
        guardrail_off_topic: 'Soy Zé Agro y trabajo solo con apoyo agronómico, clima NASA, suelo, rotación, ganadería y gestión del campo. ¿Cómo puedo ayudar a tu producción hoy?',
        fallback_sem_dados: '¡Hola, aquí estoy! Dime tu ciudad y qué estás sembrando para cruzar los datos de clima y suelo de la NASA para ti.',
        convite_forma_profissional: '*¿Quieres ver costos o próximos pasos?* Puedo pasarte por área, cómo manejarlo, la mejor ventana de lluvia o el detalle técnico completo.',
        rotacao_audio_closing: 'Si quieres saber el costo para tu terreno o cómo sembrar paso a paso, mándame otro audio.',
        abuso_bloqueado: 'Pauso por {mins} min para evitar trabas — respira, ordena tu duda y escríbeme de nuevo pronto. 🤝',
        abuso_rajada_1: '¡Oye, despacio amigo 😅 manda un mensaje a la vez que te respondo todo!',
        abuso_rajada_n: 'Pausé por {mins} min por exceso de mensajes seguidos. Vuelve enseguida y te atiendo bien. 🌾',
        abuso_midia: 'Calma con las fotos y audios — manda una tanda a la vez para revisarlo bien. 📸',
        abuso_audio_longo: 'Ese audio es muy largo para procesarlo (más de 3 min). ¿Puedes enviarlo en partes más cortas? 🎙️',
        abuso_repetida: 'Recibí el mismo mensaje 3 veces — ¿intentas contármelo de otra manera? 🤔',
        rotacao_modo_pro_header: '📋 *Ficha técnica completa:*',
        rotacao_modo_pro_footer: 'Si quieres revisar otra ciudad u otro cultivo, pregúntame normalmente.'
    },
    fr: {
        erro_conexao: 'Oups, petite coupure de connexion ici. Peux-tu me renvoyer ton message ?',
        erro_geracao_llm: "Désolé, je n'ai pas pu préparer de réponse pour le moment.",
        anti_spam: 'Un instant, l’ami — je finis encore de répondre à ton message précédent.',
        audio_ruido: 'Ton message vocal était trop bruité ou coupé ici. Peux-tu m’en renvoyer un plus près du micro ou une photo du champ ?',
        troca_idioma_ok: "C'est noté ! Je te réponds désormais en *Français*. 🤝 Envoie-moi ta question agricole par texte, audio ou photo !",
        followup_audio: 'Une autre question ?',
        imagem_produto_caption: '📸 Produit trouvé :',
        fallback_sem_dados: "Je suis à l'écoute ! Dis-moi ta ville et ce que tu cultives pour croiser les données météo et sol de la NASA.",
        rotacao_audio_closing: 'Si tu veux connaître le coût pour ta parcelle ou les étapes de semis, envoie-moi un autre message vocal.',
        rotacao_modo_pro_header: '📋 *Fiche technique complète :*',
        rotacao_modo_pro_footer: 'Si tu veux vérifier une autre ville ou une autre culture, demande-moi simplement.'
    },
    de: {
        erro_conexao: 'Kurze Verbindungsstörung hier. Kannst du mir das bitte noch einmal schicken?',
        erro_geracao_llm: 'Entschuldigung, ich konnte gerade keine Antwort erstellen.',
        anti_spam: 'Einen Moment bitte — ich beantworte noch deine vorherige Nachricht.',
        audio_ruido: 'Deine Sprachnachricht hatte zu viel Rauschen. Kannst du sie näher am Mikrofon wiederholen oder ein Foto vom Feld schicken?',
        troca_idioma_ok: 'Alles klar! Ab jetzt antworte ich dir auf *Deutsch*. 🤝 Schick mir deine Frage per Text, Sprachnachricht oder Foto!',
        followup_audio: 'Noch Fragen?',
        imagem_produto_caption: '📸 Gefundenes Produkt:',
        fallback_sem_dados: 'Ich höre zu! Nenne mir deine Stadt und welche Kultur du anbaust, dann prüfe ich die NASA-Klima- und Bodendaten für dich.',
        rotacao_audio_closing: 'Wenn du Kosten pro Hektar oder Schritt-für-Schritt-Tipps brauchst, schick einfach noch eine Sprachnachricht.',
        rotacao_modo_pro_header: '📋 *Vollständige technische Übersicht:*',
        rotacao_modo_pro_footer: 'Wenn du eine andere Stadt oder Kultur prüfen möchtest, frag mich einfach ganz normal.'
    },
    it: {
        erro_conexao: 'Piccolo problema di connessione qui. Puoi rimandarmi il messaggio per favore?',
        erro_geracao_llm: 'Scusa, non sono riuscito a preparare una risposta in questo momento.',
        anti_spam: 'Un attimo, amico — sto ancora finendo di rispondere al tuo messaggio precedente.',
        audio_ruido: 'Il tuo messaggio vocale era troppo disturbato. Puoi mandarne un altro vicino al microfono o una foto della coltura?',
        troca_idioma_ok: 'Perfetto! Da adesso ti rispondo in *Italiano*. 🤝 Mandami la tua domanda agricola per testo, vocale o foto!',
        followup_audio: 'Hai altre domande?',
        imagem_produto_caption: '📸 Prodotto trovato:',
        fallback_sem_dados: 'Ti ascolto! Dimmi la tua città e cosa stai coltivando così incrocio i dati meteo e suolo della NASA per te.',
        rotacao_audio_closing: 'Se vuoi sapere i costi per il tuo terreno o come seminare passo passo, mandami un altro messaggio vocale.',
        rotacao_modo_pro_header: '📋 *Scheda tecnica completa:*',
        rotacao_modo_pro_footer: 'Se vuoi controllare un’altra città o un’altra coltura, chiedi pure normalmente.'
    }
};

export function tMsg(idioma = IDIOMA_PADRAO, chave, vars = {}) {
    const norm = normalizarCodigoIdioma(idioma);
    if (chave === 'troca_idioma_ok' && norm && TROCA_IDIOMA_OK_NATIVOS[norm]) {
        return TROCA_IDIOMA_OK_NATIVOS[norm];
    }
    const fallbackPacote = norm && norm !== IDIOMA_PADRAO ? MSG_I18N.en : MSG_I18N[IDIOMA_PADRAO];
    const pacote = MSG_I18N[norm] || fallbackPacote;
    let txt = pacote?.[chave] ?? fallbackPacote?.[chave] ?? MSG_I18N[IDIOMA_PADRAO]?.[chave] ?? '';
    if (chave === 'troca_idioma_ok' && norm && !MSG_I18N[norm]) {
        const { displayName } = obterConfigVoz(norm);
        txt = `Got it! I'll reply in *${displayName}* from now on. 🤝 Send me your crop question by text, voice note, or photo!`;
    }
    if (chave === 'recusa_idioma_pergunta' && (!norm || !MSG_I18N[norm]?.recusa_idioma_pergunta)) {
        txt = 'No problem! I speak every language. Tell me which language you prefer (English, Español, 日本語, Français, العربية, Deutsch, Português...) or write directly in your language and I will switch immediately!';
    }
    for (const [k, v] of Object.entries(vars || {})) {
        txt = txt.replaceAll(`{${k}}`, String(v ?? ''));
    }
    return txt;
}
