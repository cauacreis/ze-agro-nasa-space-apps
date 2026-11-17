/**
 * Camada de provedores de IA com FAILOVER multi-chave e multi-modelo (100% free tier).
 * Suporta múltiplas chaves por provedor em rodízio (round-robin) + troca automática
 * de modelos dentro do mesmo provedor quando um modelo atinge TPM/RPM (HTTP 429).
 *
 * Provedores suportados (todos OpenAI-compatíveis em /chat/completions):
 * - groq      (GROQ_API_KEY / GROQ_API_KEYS / GROQ_API_KEY_2..20)
 * - gemini    (GEMINI_API_KEY / GEMINI_API_KEYS / GEMINI_API_KEY_2..20)
 * - github    (GITHUB_TOKEN / GITHUB_TOKENS / GITHUB_MODELS_TOKEN / _2..20)
 * - mistral   (MISTRAL_API_KEY / MISTRAL_API_KEYS / MISTRAL_API_KEY_2..20)
 * - openrouter(OPENROUTER_API_KEY / OPENROUTER_API_KEYS / _2..20)
 * - sambanova (SAMBANOVA_API_KEY / SAMBANOVA_API_KEYS / _2..20)
 * - nvidia    (NVIDIA_API_KEY / NVIDIA_API_KEYS / _2..20)
 * - cerebras  (CEREBRAS_API_KEY / CEREBRAS_API_KEYS / _2..20)
 */

import fs from 'fs';
import path from 'path';

const USO_DIR = './data';
const USO_FILE = 'ai_uso.json';
const slotCooldowns = new Map(); // `${id}#${keyHash}:${model}` -> timestamp(ms)
const rrCursors = new Map();     // `${id}` -> próximo índice de chave (round-robin)
const avisadoSemChave = new Set();

function usoPath() {
    return path.resolve(process.env.AI_USO_PATH || `${USO_DIR}/${USO_FILE}`);
}

function hojeSP() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function splitListaChaves(valor = '') {
    return String(valor || '')
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter((s) => s && !/^suas?_chave|^your_|^coloque_|^exemplo/i.test(s));
}

function hashCurtoChave(chave = '') {
    let h = 0;
    const s = String(chave || '');
    for (let i = 0; i < s.length; i += 1) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
}

/**
 * Coleta todas as chaves configuradas para um provedor (chave única, lista e _2.._20) sem duplicatas.
 */
export function lerChavesProvedor(...nomesBase) {
    const encontradas = [];
    const vistas = new Set();
    const adicionar = (val) => {
        for (const item of splitListaChaves(val)) {
            if (!vistas.has(item)) {
                vistas.add(item);
                encontradas.push(item);
            }
        }
    };

    for (const base of nomesBase) {
        adicionar(process.env[base]);
        adicionar(process.env[`${base}S`]);
        for (let i = 1; i <= 20; i += 1) {
            adicionar(process.env[`${base}_${i}`]);
        }
    }
    return encontradas;
}

function normalizarListaModelos(valorEnv, fallbackLista) {
    if (valorEnv && String(valorEnv).trim()) {
        return String(valorEnv).split(',').map((s) => s.trim()).filter(Boolean);
    }
    return fallbackLista;
}

function slotKey(providerId, key, model) {
    return `${providerId}#${hashCurtoChave(key)}:${model}`;
}

export function provedoresConfig() {
    const groqKeys = lerChavesProvedor('GROQ_API_KEY');
    const geminiKeys = lerChavesProvedor('GEMINI_API_KEY');
    const githubKeys = lerChavesProvedor('GITHUB_MODELS_TOKEN', 'GITHUB_TOKEN');
    const mistralKeys = lerChavesProvedor('MISTRAL_API_KEY');
    const openrouterKeys = lerChavesProvedor('OPENROUTER_API_KEY');
    const sambanovaKeys = lerChavesProvedor('SAMBANOVA_API_KEY');
    const nvidiaKeys = lerChavesProvedor('NVIDIA_API_KEY');
    const cerebrasKeys = lerChavesProvedor('CEREBRAS_API_KEY');

    const groqMainChain = normalizarListaModelos(process.env.GROQ_MODEL_MAIN, [
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b'
    ]);
    const groqFastChain = normalizarListaModelos(process.env.GROQ_MODEL_FORMAT, [
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-120b'
    ]);
    const geminiMainChain = normalizarListaModelos(process.env.GEMINI_MODEL_MAIN, [
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.5-flash-lite'
    ]);
    const geminiFastChain = normalizarListaModelos(process.env.GEMINI_MODEL_FORMAT, [
        'gemini-2.5-flash',
        'gemini-3-flash-preview',
        'gemini-3.5-flash-lite'
    ]);
    const openrouterChain = normalizarListaModelos(process.env.OPENROUTER_MODELS, [
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
        'qwen/qwen3-next-80b-a3b-instruct:free'
    ]);

    return [
        {
            id: 'groq',
            base: 'https://api.groq.com/openai/v1',
            keys: groqKeys,
            key: groqKeys[0] || '',
            keyEnv: 'GROQ_API_KEY',
            reasoningEffort: true,
            trimHistory: 4,
            models: {
                router: process.env.GROQ_MODEL_ROUTER || 'openai/gpt-oss-20b',
                main: groqMainChain[0],
                format: groqFastChain[0],
                leve: process.env.GROQ_MODEL_LEVE || 'openai/gpt-oss-20b'
            },
            modelChains: {
                router: [process.env.GROQ_MODEL_ROUTER || 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
                main: groqMainChain,
                format: groqFastChain,
                leve: [process.env.GROQ_MODEL_LEVE || 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
            }
        },
        {
            id: 'gemini',
            base: 'https://generativelanguage.googleapis.com/v1beta/openai',
            keys: geminiKeys,
            key: geminiKeys[0] || '',
            keyEnv: 'GEMINI_API_KEY',
            models: {
                router: geminiFastChain[0],
                main: geminiMainChain[0],
                format: geminiFastChain[0],
                leve: geminiFastChain[0]
            },
            modelChains: {
                router: geminiFastChain,
                main: geminiMainChain,
                format: geminiFastChain,
                leve: geminiFastChain
            }
        },
        {
            id: 'github',
            base: 'https://models.inference.ai.azure.com',
            keys: githubKeys,
            key: githubKeys[0] || '',
            keyEnv: 'GITHUB_MODELS_TOKEN',
            trimHistory: 6,
            models: {
                router: 'gpt-4o-mini',
                main: 'gpt-4o-mini',
                format: 'gpt-4o-mini',
                leve: 'gpt-4o-mini'
            },
            modelChains: {
                router: ['gpt-4o-mini'],
                main: ['gpt-4o-mini', 'Meta-Llama-3.3-70B-Instruct'],
                format: ['gpt-4o-mini', 'Meta-Llama-3.3-70B-Instruct'],
                leve: ['gpt-4o-mini']
            }
        },
        {
            id: 'mistral',
            base: 'https://api.mistral.ai/v1',
            keys: mistralKeys,
            key: mistralKeys[0] || '',
            keyEnv: 'MISTRAL_API_KEY',
            models: {
                router: 'mistral-small-latest',
                main: 'mistral-small-latest',
                format: 'mistral-small-latest',
                leve: 'open-mistral-nemo'
            },
            modelChains: {
                router: ['mistral-small-latest', 'open-mistral-nemo'],
                main: ['mistral-small-latest', 'open-mistral-nemo'],
                format: ['mistral-small-latest', 'open-mistral-nemo'],
                leve: ['open-mistral-nemo', 'mistral-small-latest']
            }
        },
        {
            id: 'sambanova',
            base: 'https://api.sambanova.ai/v1',
            keys: sambanovaKeys,
            key: sambanovaKeys[0] || '',
            keyEnv: 'SAMBANOVA_API_KEY',
            trimHistory: 6,
            models: {
                router: 'Meta-Llama-3.3-70B-Instruct',
                main: 'Meta-Llama-3.3-70B-Instruct',
                format: 'Meta-Llama-3.3-70B-Instruct',
                leve: 'Meta-Llama-3.1-8B-Instruct'
            },
            modelChains: {
                router: ['Meta-Llama-3.1-8B-Instruct', 'Meta-Llama-3.3-70B-Instruct'],
                main: ['Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct'],
                format: ['Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct'],
                leve: ['Meta-Llama-3.1-8B-Instruct']
            }
        },
        {
            id: 'openrouter',
            base: 'https://openrouter.ai/api/v1',
            keys: openrouterKeys,
            key: openrouterKeys[0] || '',
            keyEnv: 'OPENROUTER_API_KEY',
            extraHeaders: {
                'HTTP-Referer': 'https://personalagro.local',
                'X-Title': 'PersonalAgro ZeAgro'
            },
            models: {
                router: openrouterChain[0],
                main: openrouterChain[0],
                format: openrouterChain[0],
                leve: openrouterChain[0]
            },
            modelChains: {
                router: openrouterChain,
                main: openrouterChain,
                format: openrouterChain,
                leve: openrouterChain
            }
        },
        {
            id: 'nvidia',
            base: 'https://integrate.api.nvidia.com/v1',
            keys: nvidiaKeys,
            key: nvidiaKeys[0] || '',
            keyEnv: 'NVIDIA_API_KEY',
            trimHistory: 6,
            models: {
                router: 'meta/llama-3.3-70b-instruct',
                main: 'meta/llama-3.3-70b-instruct',
                format: 'meta/llama-3.3-70b-instruct',
                leve: 'meta/llama-3.1-8b-instruct'
            },
            modelChains: {
                router: ['meta/llama-3.1-8b-instruct', 'meta/llama-3.3-70b-instruct'],
                main: ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-8b-instruct'],
                format: ['meta/llama-3.3-70b-instruct', 'meta/llama-3.1-8b-instruct'],
                leve: ['meta/llama-3.1-8b-instruct']
            }
        },
        {
            id: 'cerebras',
            base: 'https://api.cerebras.ai/v1',
            keys: cerebrasKeys,
            key: cerebrasKeys[0] || '',
            keyEnv: 'CEREBRAS_API_KEY',
            trimHistory: 4,
            models: {
                router: process.env.CEREBRAS_MODEL_ROUTER || 'qwen-3.8-27b',
                main: process.env.CEREBRAS_MODEL_MAIN || 'gpt-oss-120b',
                format: process.env.CEREBRAS_MODEL_FORMAT || 'qwen-3.8-27b',
                leve: process.env.CEREBRAS_MODEL_LEVE || 'qwen-3.8-27b'
            },
            modelChains: {
                router: [process.env.CEREBRAS_MODEL_ROUTER || 'qwen-3.8-27b'],
                main: [process.env.CEREBRAS_MODEL_MAIN || 'gpt-oss-120b', 'qwen-3.8-27b'],
                format: [process.env.CEREBRAS_MODEL_FORMAT || 'qwen-3.8-27b'],
                leve: [process.env.CEREBRAS_MODEL_LEVE || 'qwen-3.8-27b']
            }
        }
    ];
}

function ordenarChavesRoundRobin(p) {
    const keys = Array.isArray(p.keys) ? p.keys : (p.key ? [p.key] : []);
    if (keys.length <= 1) return keys;
    const start = (rrCursors.get(p.id) || 0) % keys.length;
    rrCursors.set(p.id, (start + 1) % keys.length);
    return [...keys.slice(start), ...keys.slice(0, start)];
}

export function provedoresDisponiveis(purpose = 'main') {
    const agora = Date.now();
    return provedoresConfig().filter((p) => {
        const keys = Array.isArray(p.keys) ? p.keys : (p.key ? [p.key] : []);
        if (keys.length === 0) {
            if (['groq', 'gemini', 'cerebras'].includes(p.id) && !avisadoSemChave.has(p.id)) {
                console.log(`⚠️ Provedor ${p.id} sem chave — pulando (adicione ${p.keyEnv} no .env para ativar).`);
                avisadoSemChave.add(p.id);
            }
            return false;
        }
        const chain = p.modelChains?.[purpose] || [p.models?.[purpose] || p.models?.main].filter(Boolean);
        return keys.some((k) => chain.some((m) => (slotCooldowns.get(slotKey(p.id, k, m)) || 0) <= agora));
    });
}

/**
 * Resumo seguro (sem exibir valores de chaves) de quantas chaves por provedor estão carregadas.
 */
export function resumoPoolProvedores() {
    return provedoresConfig()
        .filter((p) => (p.keys || []).length > 0)
        .map((p) => ({
            id: p.id,
            chaves: p.keys.length,
            modelos: (p.modelChains?.main || []).length
        }));
}

// Classifica o erro: 'proximo' tenta outro slot/provedor; esperaMs diz quanto punir o slot.
export function classificarErro(status, message = '') {
    const m = String(message || '').toLowerCase();
    if (/resposta truncada \(finish_reason=length/i.test(m)) {
        return { acao: 'proximo', esperaMs: 15 * 1000, motivo: 'resposta truncada (finish_reason=length)', retryBoostMaxTokens: true };
    }
    if (/resposta sem conte[uú]do|tool_use_failed|failed to call a function/i.test(m)) {
        return { acao: 'proximo', esperaMs: 0, motivo: 'resposta vazia/tool_use_failed (sem cooldown)', retryNoTools: /tool_use_failed|failed to call a function|does not support tools|tool choice/i.test(m) };
    }
    if (status === 413 || /request too large|payload too large|rate_limit_exceeded.*requested \d+/i.test(m)) {
        return { acao: 'proximo', esperaMs: 10 * 1000, motivo: 'HTTP 413/limite TPM (reduzindo histórico)', retryTrimHistory: true };
    }
    if (status === 401 || status === 403 || /invalid api key|incorrect api key|unauthorized|authentication|permission_denied|account_deactivated|api key not valid/.test(m)) {
        return { acao: 'proximo', esperaMs: 24 * 60 * 60 * 1000, motivo: 'auth (confere a chave)', punirChaveToda: true };
    }
    if (status === 404 || /model_not_found|model not found|does not exist|not_found.*model|not supported for generatecontent|no longer available to new users/.test(m)) {
        return { acao: 'proximo', esperaMs: 6 * 60 * 60 * 1000, motivo: 'modelo indisponível nesta chave' };
    }
    if (status === 429) {
        if (/(?:per\s*day|free_tier_requests|requestsperday|limit:\s*0|retry\s+in\s+\d+h)/i.test(m)) {
            return { acao: 'proximo', esperaMs: 30 * 60 * 1000, motivo: 'HTTP 429 (cota diária esgotada neste modelo)' };
        }
        return { acao: 'proximo', esperaMs: 25 * 1000, motivo: 'HTTP 429 (rate/quota temporária)' };
    }
    if (status === 402 || /payment required|billing|credit balance|insufficient_quota/.test(m)) {
        return { acao: 'proximo', esperaMs: 6 * 60 * 60 * 1000, motivo: 'cota/pagamento — ver aba billing do provedor', punirChaveToda: true };
    }
    if (status === 400) {
        return {
            acao: 'proximo',
            esperaMs: 2 * 60 * 1000,
            motivo: 'requisição rejeitada (formato/tools?)',
            retryNoTools: /tool|function|schema/i.test(m)
        };
    }
    return { acao: 'proximo', esperaMs: 30 * 1000, motivo: status ? `HTTP ${status}` : 'rede/timeout' };
}

function estimarUso(messages, content) {
    const chars = JSON.stringify(messages || []).length + String(content || '').length;
    const total = Math.round(chars / 4);
    return { in: total, out: Math.round(String(content || '').length / 4) };
}

function carregarUso() {
    try {
        return JSON.parse(fs.readFileSync(usoPath(), 'utf-8'));
    } catch {
        return {};
    }
}

function salvarUso(u) {
    try {
        fs.mkdirSync(path.dirname(usoPath()), { recursive: true });
        fs.writeFileSync(usoPath(), JSON.stringify(u));
    } catch (e) {
        console.error('Erro ao salvar uso de IA:', e.message);
    }
}

export function registrarUso(provider, uso) {
    const u = carregarUso();
    const hoje = hojeSP();
    u[hoje] = u[hoje] || {};
    const p = (u[hoje][provider] = u[hoje][provider] || { req: 0, in: 0, out: 0 });
    p.req += 1;
    p.in += uso?.in || 0;
    p.out += uso?.out || 0;
    salvarUso(u);
}

// Últimos N dias de uso (para o /custos)
export function lerUso(dias = 7) {
    const u = carregarUso();
    const datas = Object.keys(u).sort().slice(-dias);
    const totais = {};
    for (const d of datas) {
        for (const [prov, v] of Object.entries(u[d] || {})) {
            totais[prov] = totais[prov] || { req: 0, in: 0, out: 0 };
            totais[prov].req += v.req || 0;
            totais[prov].in += v.in || 0;
            totais[prov].out += v.out || 0;
        }
    }
    return { dias: datas.map((d) => ({ data: d, provedores: u[d] })), totais };
}

function respostaPareceTruncada(content = '', usageOut = 0, maxTokensReq = 400, finish = '') {
    if (finish !== 'length') return false;
    const txt = String(content || '').trim();
    if (!txt) return true;
    const maxReq = Number(maxTokensReq) || 400;
    // Thinking oculto consumiu quase todo max_tokens e sobrou só um fragmento (ex.: 58 tokens terminando em "Amanhã,")
    if (maxReq >= 400 && usageOut > 0 && usageOut < Math.min(180, Math.floor(maxReq * 0.45))) {
        return true;
    }
    if (txt.length < 700 && /[,:;(\-—]\s*$/.test(txt)) {
        return true;
    }
    if (maxReq >= 400 && txt.length < 180) {
        return true;
    }
    return false;
}

/**
 * Chamada de chat com failover automático em 3 eixos:
 * 1) múltiplas chaves por provedor (round-robin),
 * 2) múltiplos modelos por chave,
 * 3) múltiplos provedores gratuitos.
 */
export async function chatCompletions({ purpose = 'main', messages, tools, tool_choice, temperature = 0.7, max_tokens = 400, reasoning }) {
    const candidatos = provedoresDisponiveis(purpose);
    if (candidatos.length === 0) {
        throw new Error('Nenhum provedor de IA disponível (sem chave ou todos em cooldown).');
    }

    let ultimoErro = null;
    const tentarChamada = async (p, apiKey, model, { usarTools = true, maxTokensOverride = null, forceTrimHistory = false, forceNoReasoning = false } = {}) => {
        let msgs = messages;
        const limitHist = forceTrimHistory ? 1 : p.trimHistory;
        if (limitHist && Array.isArray(msgs) && msgs.length > limitHist + 1) {
            msgs = [msgs[0], ...msgs.slice(-limitHist)];
        }
        let reqMaxTokens = maxTokensOverride || max_tokens;
        if (p.id === 'gemini' && (purpose === 'main' || purpose === 'format')) {
            reqMaxTokens = Math.max(Number(reqMaxTokens) || 400, 2048);
        }
        const body = { model, messages: msgs, temperature, max_tokens: reqMaxTokens };
        if (p.id === 'gemini') {
            // Gemini 2.5 Flash e 3 Flash Preview usam tokens de output no thinking se reasoning_effort não for 'none';
            // já o gemini-3.5-flash-lite rejeita 'none' com HTTP 400, então só aplicamos nos modelos compatíveis.
            if (/gemini-2\.5|gemini-3(?:\.0)?-flash/i.test(model)) {
                body.reasoning_effort = 'none';
            }
        } else if (forceNoReasoning && p.reasoningEffort && /gpt-oss/i.test(model)) {
            body.reasoning_effort = 'low';
        } else if (reasoning && p.reasoningEffort && /gpt-oss/i.test(model)) {
            body.reasoning_effort = reasoning;
        }
        if (usarTools && Array.isArray(tools) && tools.length > 0) {
            body.tools = tools;
            if (tool_choice) body.tool_choice = tool_choice;
        }
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 90000);
        let resp;
        try {
            resp = await fetch(`${p.base}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    ...(p.extraHeaders || {})
                },
                body: JSON.stringify(body),
                signal: ctrl.signal
            });
        } finally {
            clearTimeout(timer);
        }
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw Object.assign(new Error(`${p.id}/${model} HTTP ${resp.status}: ${txt.slice(0, 220)}`), { status: resp.status });
        }
        const data = await resp.json();
        const msg = data.choices?.[0]?.message;
        if (!msg) throw new Error(`${p.id}: resposta sem message`);
        if (typeof msg.content === 'string' && msg.content.includes('<think>')) {
            msg.content = msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        }
        const finish = data.choices?.[0]?.finish_reason || '?';
        const temTexto = typeof msg.content === 'string' && msg.content.trim().length > 0;
        const temTools = Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0;
        if (!temTexto && !temTools) {
            throw new Error(`${p.id}: resposta sem conteúdo (out:${data.usage?.completion_tokens ?? 0}, fim:${finish})`);
        }
        const uso = data.usage
            ? { in: data.usage.prompt_tokens || 0, out: data.usage.completion_tokens || 0 }
            : estimarUso(msgs, msg.content);
        if (!temTools && (purpose === 'main' || purpose === 'format') && respostaPareceTruncada(msg.content, uso.out, reqMaxTokens, finish)) {
            throw new Error(`${p.id}/${model}: resposta truncada (finish_reason=length, out:${uso.out}, chars:${String(msg.content || '').trim().length})`);
        }
        registrarUso(p.id, uso);
        console.log(`🤖 IA via ${p.id}/${model} (${purpose}) — in:${uso.in} out:${uso.out} fim:${finish}`);
        return { message: msg, provider: p.id, model, usage: uso, finish };
    };

    const agora = Date.now();
    for (const p of candidatos) {
        const chavesOrdenadas = ordenarChavesRoundRobin(p);
        const chain = (p.modelChains?.[purpose] || [p.models?.[purpose] || p.models?.main]).filter(Boolean);
        let falhasProvedor = 0;

        for (let kIdx = 0; kIdx < chavesOrdenadas.length; kIdx += 1) {
            const apiKey = chavesOrdenadas[kIdx];
            for (const model of chain) {
                const sKey = slotKey(p.id, apiKey, model);
                if ((slotCooldowns.get(sKey) || 0) > agora) continue;
                try {
                    return await tentarChamada(p, apiKey, model, { usarTools: true });
                } catch (e) {
                    ultimoErro = e;
                    falhasProvedor += 1;
                    const cls = classificarErro(e?.status, e?.message);
                    if (cls.retryTrimHistory && Array.isArray(messages) && messages.length > 2) {
                        try {
                            return await tentarChamada(p, apiKey, model, { usarTools: true, forceTrimHistory: true });
                        } catch (eTrim) {
                            ultimoErro = eTrim;
                        }
                    }
                    if (cls.retryBoostMaxTokens) {
                        try {
                            return await tentarChamada(p, apiKey, model, {
                                usarTools: false,
                                maxTokensOverride: Math.max((Number(max_tokens) || 1200) * 2, 2600),
                                forceNoReasoning: true
                            });
                        } catch (eBoost) {
                            ultimoErro = eBoost;
                        }
                    }
                    if (cls.retryNoTools && Array.isArray(tools) && tools.length > 0) {
                        try {
                            return await tentarChamada(p, apiKey, model, { usarTools: false });
                        } catch (eNoTool) {
                            ultimoErro = eNoTool;
                        }
                    }
                    const clsFinal = classificarErro(ultimoErro?.status, ultimoErro?.message);
                    const ate = Date.now() + clsFinal.esperaMs;
                    if (clsFinal.punirChaveToda) {
                        for (const mItem of chain) {
                            slotCooldowns.set(slotKey(p.id, apiKey, mItem), ate);
                        }
                        break; // chave morta/sem crédito -> pula direto para próxima chave
                    } else if (clsFinal.esperaMs > 0) {
                        slotCooldowns.set(sKey, ate);
                    }
                }
            }
        }

        if (falhasProvedor > 0) {
            const clsUltimo = classificarErro(ultimoErro?.status, ultimoErro?.message);
            console.error(`⚠️ IA ${p.id} falhou (${clsUltimo.motivo}) — tentando próximo provedor...`);
        }
    }
    throw ultimoErro;
}
