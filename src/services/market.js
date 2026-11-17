// Cotação ao vivo:
// 1. CEASA-PR (hortifrúti/grãos atacado)
// 2. Notícias Agrícolas (físico por praça/UF + indicadores: soja, milho, sorgo, feijão, boi gordo, café, trigo, arroz)
// 3. AwesomeAPI (dólar comercial USD/BRL)
import dns from 'dns';
import fs from 'fs';
import path from 'path';

dns.setDefaultResultOrder('ipv4first');

const marketCache = new Map();
const agroCache = new Map();
const TTL_MS = 12 * 60 * 60 * 1000;
const AGRO_TTL_MS = 4 * 60 * 60 * 1000;
const URL_CEASA = 'https://celepar7.pr.gov.br/ceasa/hoje.asp';
const HISTORICO_PATH = path.resolve('./data/precos_anteriores.json');

const NA_SLUGS = {
    soja: { slug: 'soja', nome: 'Soja', unidade: 'R$/sc 60 kg' },
    milho: { slug: 'milho', nome: 'Milho', unidade: 'R$/sc 60 kg' },
    sorgo: { slug: 'sorgo', nome: 'Sorgo', unidade: 'R$/sc 60 kg' },
    feijao: { slug: 'feijao', nome: 'Feijão', unidade: 'R$/sc 60 kg' },
    boi: { slug: 'boi-gordo', nome: 'Boi Gordo', unidade: 'R$/@' },
    cafe: { slug: 'cafe', nome: 'Café', unidade: 'R$/sc 60 kg' },
    trigo: { slug: 'trigo', nome: 'Trigo', unidade: 'R$/t ou sc' },
    arroz: { slug: 'arroz', nome: 'Arroz', unidade: 'R$/sc 50 kg' }
};

function carregarHistorico() {
    try {
        return JSON.parse(fs.readFileSync(HISTORICO_PATH, 'utf8'));
    } catch {
        return null;
    }
}

function salvarHistorico(historico) {
    try {
        fs.mkdirSync(path.dirname(HISTORICO_PATH), { recursive: true });
        fs.writeFileSync(HISTORICO_PATH, JSON.stringify(historico, null, 1));
    } catch (e) {
        console.error('Erro ao salvar histórico de preços:', e.message);
    }
}

function calcularTendencia(nomeProduto, precoHoje, historico) {
    if (!historico || !precoHoje) return null;
    const anterior = historico.precos?.[nomeProduto];
    const hoje = parseFloat(precoHoje.replace(',', '.'));
    if (anterior === undefined || !hoje || anterior <= 0) return null;
    const variacao = Math.round(((hoje - anterior) / anterior) * 100);
    if (variacao === 0) return 'estável';
    return variacao > 0 ? `↑${variacao}%` : `↓${Math.abs(variacao)}%`;
}

function removerAcentos(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function buscarTabelaCeasa() {
    const resp = await fetch(URL_CEASA, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error(`CEASA indisponível: ${resp.status}`);

    // A página usa encoding latin1
    const html = new TextDecoder('latin1').decode(await resp.arrayBuffer());

    // Data da cotação
    const dataMatch = html.match(/Cota[çc][ãa]o dos Produtos[\s\S]{0,400}?(\d{2}\/\d{2}\/\d{4})/i);
    const data = dataMatch ? dataMatch[1] : new Date().toLocaleDateString('pt-BR');

    // Converte células de tabela em texto com separador |
    const texto = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/t[dh]>/gi, '|')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ');

    // Linhas de produto: NOME MAIÚSCULO + embalagem (cx/kg/sc...) | 5 preços
    const linhas = texto.split('|').map(s => s.replace(/\s+/g, ' ').trim());
    const produtos = [];
    const regexPreco = /^[\d\.,]+$|^-$/;
    const PACK = /\b(cx|sc|kg|dz|un|unid|maço|maco|bd|fd|penca|milheiro|bandeja|caixa|saca|dúzia|duzia|ramo|lat|pote|buquê|buque|mil)\b/i;
    const ehProduto = (celula) => {
        if (!celula || !PACK.test(celula) || celula.length > 80) return false;
        const semEmbalagem = celula.replace(PACK, '');
        // Nome do produto em CAIXA ALTA (pelo menos 3 maiúsculas seguidas) e não é cabeçalho
        return /[A-ZÀ-Ü]{3,}/.test(semEmbalagem) && !/^(preço|produto)/i.test(semEmbalagem.trim());
    };

    for (let i = 0; i < linhas.length; i++) {
        const celula = linhas[i];
        if (ehProduto(celula)) {
            const p1 = linhas[i + 1], p2 = linhas[i + 2], p3 = linhas[i + 3], p4 = linhas[i + 4], p5 = linhas[i + 5];
            if ([p1, p2, p3, p4, p5].every(p => p !== undefined && regexPreco.test(p))) {
                produtos.push({
                    nome: celula,
                    curitiba: p1, maringa: p2, londrina: p3, foz: p4, cascavel: p5
                });
                i += 5;
            }
        }
    }

    if (produtos.length === 0) throw new Error('Não consegui ler a tabela de cotações');
    return { data, mercado: 'CEASA-PR', produtos };
}

function precoValido(p) {
    return p && p !== '-' && parseFloat(p.replace(',', '.')) > 0;
}

function resolverSlugNA(cultura = '') {
    const c = removerAcentos(String(cultura || '').toLowerCase());
    if (c.includes('soja')) return NA_SLUGS.soja;
    if (c.includes('milho') || c.includes('safrinha')) return NA_SLUGS.milho;
    if (c.includes('sorgo')) return NA_SLUGS.sorgo;
    if (c.includes('feij')) return NA_SLUGS.feijao;
    if (/\b(boi|vaca|gado|bezerro|arroba|pecuar)\w*/.test(c)) return NA_SLUGS.boi;
    if (c.includes('cafe')) return NA_SLUGS.cafe;
    if (c.includes('trigo')) return NA_SLUGS.trigo;
    if (c.includes('arroz')) return NA_SLUGS.arroz;
    return null;
}

function parsePrecoBR(raw = '') {
    const limpo = String(raw || '').replace(/[^\d.,]/g, '').trim();
    if (!limpo) return null;
    const norm = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
    const num = Number.parseFloat(norm);
    return Number.isFinite(num) && num > 0 ? num : null;
}

export async function consultarDolarHoje({ timeoutMs = 4000 } = {}) {
    const hit = agroCache.get('usd_brl');
    if (hit && Date.now() - hit.ts < 2 * 60 * 60 * 1000) return hit.dados;
    try {
        const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { signal: AbortSignal.timeout(timeoutMs) });
        if (!r.ok) return null;
        const j = await r.json();
        const bid = Number.parseFloat(j?.USDBRL?.bid);
        if (!Number.isFinite(bid)) return null;
        const dados = { bid: Math.round(bid * 100) / 100, pctChange: j?.USDBRL?.pctChange || '0', atualizado: j?.USDBRL?.create_date || '' };
        agroCache.set('usd_brl', { ts: Date.now(), dados });
        return dados;
    } catch {
        return null;
    }
}

export async function consultarCotacaoAgro(cultura, cidadeOuUf = '', { timeoutMs = 5000 } = {}) {
    const spec = resolverSlugNA(cultura);
    if (!spec) return null;

    const cached = agroCache.get(spec.slug);
    let parsed = cached && Date.now() - cached.ts < AGRO_TTL_MS ? cached.dados : null;

    if (!parsed) {
        try {
            const resp = await fetch(`https://www.noticiasagricolas.com.br/cotacoes/${spec.slug}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PersonalAgro/1.0)' },
                signal: AbortSignal.timeout(timeoutMs)
            });
            if (!resp.ok) throw new Error(`NA HTTP ${resp.status}`);
            const html = await resp.text();
            const tables = [...html.matchAll(/<table[^>]*class="[^"]*cot-fisicas[^"]*"[^>]*>([\s\S]*?)<\/table>/g)];

            let indicadorPrincipal = null;
            const pracas = [];
            let atualizadoEm = '';

            for (const t of tables) {
                const rows = [...t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
                    [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
                );
                if (rows.length < 2) continue;
                const header = rows[0].map((h) => removerAcentos(h.toLowerCase()));
                const isPracaTable = header[0]?.includes('praca') || header[0]?.includes('regiao') || header[0]?.includes('estado');
                const isDataValor = header[0] === 'data' && /valor|vista|preco/.test(header[1] || '');

                for (const row of rows.slice(1)) {
                    if (/atualizado em:/i.test(row[0] || '')) {
                        atualizadoEm = atualizadoEm || row[0].replace(/atualizado em:/i, '').trim();
                        continue;
                    }
                    if (isDataValor && !indicadorPrincipal && row.length >= 2) {
                        const num = parsePrecoBR(row[1]);
                        if (num) {
                            indicadorPrincipal = {
                                data: row[0],
                                valor: num,
                                valor_formatado: `R$ ${row[1]}`,
                                variacao: row[2] || '0%',
                                cabecalho: rows[0][1] || spec.unidade
                            };
                        }
                    } else if (isPracaTable && row.length >= 2) {
                        const num = parsePrecoBR(row[1]);
                        if (num && num < 50000) {
                            pracas.push({
                                praca: row[0],
                                preco: num,
                                preco_formatado: `R$ ${row[1]}`,
                                variacao: row[2] || '0%'
                            });
                        }
                    }
                }
            }

            if (!indicadorPrincipal && pracas.length === 0) return null;
            parsed = {
                encontrado: true,
                fonte: 'Notícias Agrícolas (físico/indicadores)',
                cultura: spec.nome,
                unidade: spec.unidade,
                data: indicadorPrincipal?.data || atualizadoEm || new Date().toLocaleDateString('pt-BR'),
                indicador_nacional: indicadorPrincipal,
                pracas
            };
            agroCache.set(spec.slug, { ts: Date.now(), dados: parsed });
        } catch (err) {
            console.error(`Erro cotação agro (${spec.slug}):`, err.message);
            return null;
        }
    }

    const buscaLocal = removerAcentos(String(cidadeOuUf || '').toLowerCase());
    const ufMatch = String(cidadeOuUf || '').match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i)?.[1]?.toUpperCase() || '';
    let pracaEscolhida = null;
    if (parsed.pracas.length) {
        if (buscaLocal && buscaLocal.length >= 3) {
            const cidadeBase = buscaLocal.replace(/\s*[-/]\s*[a-z]{2}$/i, '').trim();
            pracaEscolhida = parsed.pracas.find((p) => removerAcentos(p.praca.toLowerCase()).includes(cidadeBase));
        }
        if (!pracaEscolhida && ufMatch) {
            pracaEscolhida = parsed.pracas.find((p) => new RegExp(`/${ufMatch}\\b|\\b${ufMatch}\\b`, 'i').test(p.praca));
        }
    }

    const precoReferencia = pracaEscolhida?.preco || parsed.indicador_nacional?.valor || parsed.pracas[0]?.preco || null;
    return {
        ...parsed,
        praca_referencia: pracaEscolhida || null,
        preco_referencia: precoReferencia,
        amostra_pracas: parsed.pracas.slice(0, 6)
    };
}

export async function consultarPrecoCeasa(produto, cidadeOuUf = '') {
    try {
        const agro = resolverSlugNA(produto);
        if (agro && !/^(milho\s+verde|feijao\s+vagem|vagem)$/i.test(removerAcentos(produto))) {
            const cotAgro = await consultarCotacaoAgro(produto, cidadeOuUf);
            if (cotAgro?.encontrado) {
                return {
                    ...cotAgro,
                    mercado: cotAgro.fonte
                };
            }
        }

        const chave = 'tabela_diaria';
        let tabela = marketCache.get(chave);
        if (!tabela || (Date.now() - tabela.ts) > TTL_MS) {
            tabela = { ts: Date.now(), dados: await buscarTabelaCeasa() };
            marketCache.set(chave, tabela);
        }

        const busca = removerAcentos(produto.trim().toUpperCase());
        const termos = busca.split(/\s+/).filter(t => t.length > 2);

        // Histórico do fechamento anterior pra tendência
        const historico = carregarHistorico();
        const historicoValido = historico && historico.data !== tabela.dados.data ? historico : null;

        // Salva o fechamento de HOJE (vira o "dia anterior" de amanhã)
        const precosHoje = {};
        for (const p of tabela.dados.produtos) {
            if (precoValido(p.curitiba)) {
                precosHoje[removerAcentos(p.nome)] = parseFloat(p.curitiba.replace(',', '.'));
            }
        }
        salvarHistorico({ data: tabela.dados.data, precos: precosHoje });

        // Score: quantos termos do produto batem
        const resultados = tabela.dados.produtos
            .map(p => {
                const nome = removerAcentos(p.nome);
                const score = termos.filter(t => nome.includes(t)).length;
                return { ...p, score };
            })
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (resultados.length === 0) {
            return {
                encontrado: false,
                data: tabela.dados.data,
                mercado: tabela.dados.mercado,
                observacao: 'Referência atacadista da CEASA-PR; compare sempre o frete e a praça da sua região.',
                mensagem: `Não encontrei '${produto}' na cotação da CEASA-PR de hoje (${tabela.dados.data}). Tenta outro nome (ex: tomate, alface, batata, cebola, banana).`
            };
        }

        return {
            encontrado: true,
            data: tabela.dados.data,
            mercado: tabela.dados.mercado,
            observacao: 'Cotação atacadista de referência da CEASA-PR; em outro estado, use como balizador e considere o frete local.',
            produtos: resultados.map(p => ({
                nome: p.nome,
                tendencia: calcularTendencia(removerAcentos(p.nome), p.curitiba, historicoValido),
                precos: {
                    curitiba: precoValido(p.curitiba) ? `R$ ${p.curitiba}` : null,
                    maringa: precoValido(p.maringa) ? `R$ ${p.maringa}` : null,
                    londrina: precoValido(p.londrina) ? `R$ ${p.londrina}` : null,
                    foz: precoValido(p.foz) ? `R$ ${p.foz}` : null,
                    cascavel: precoValido(p.cascavel) ? `R$ ${p.cascavel}` : null
                }
            }))
        };
    } catch (error) {
        console.error('Erro na cotação CEASA:', error.message);
        return {
            encontrado: false,
            mensagem: 'Não consegui consultar a cotação agora. Tenta de novo em alguns minutos.'
        };
    }
}
