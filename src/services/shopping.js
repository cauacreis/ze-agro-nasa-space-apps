/**
 * Busca de produtos — 3 camadas + IMAGEM:
 * 1. Catálogo curado (offline, instantâneo) — com imagem representativa
 * 2. Brave Search API (free tier) — extrai thumbnail real
 * 3. URLs construídas (honesto) — último recurso
 *
 * Cada resultado tem campo `imagem` (URL) pra enviar no WhatsApp.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let CATALOGO = {};
try {
    const raw = readFileSync(join(__dirname, '..', 'config', 'product_catalog.json'), 'utf-8');
    CATALOGO = JSON.parse(raw);
} catch (e) {
    console.error('⚠️ Catálogo de produtos não encontrado:', e.message);
}

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || '';
const BRAVE_URL = 'https://api.search.brave.com/res/v1/web/search';

function normalizeQuery(raw) {
    return raw
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(nem|neem)\b/g, 'neem')
        .replace(/\b(pulver)\b/g, 'pulverizador costal')
        .replace(/\b(adubo|fertil)\b/g, 'adubo npk')
        .replace(/\b(matar|matO|capina)\b/g, 'herbicida')
        .replace(/\b(drip|gotej)\b/g, 'gotejamento')
        .replace(/\b(bomba\b.*(?:agua|irrigac))/g, 'bomba de irrigacao')
        .replace(/\b(ra\b.*(?:boi|vaca|gado|bovina))/g, 'ra ox')
        .replace(/\b(sal mineral|suplemento mineral)/g, 'sal mineral')
        .replace(/\b(carrapato|carrapaticida)/g, 'carrapaticida')
        .replace(/\b(glyphosate|glifosato)/g, 'herbicida glyphosate')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function detectarMarketplace(url) {
    if (url.includes('mercadolivre')) return 'Mercado Livre';
    if (url.includes('agrofy')) return 'Agrofy';
    if (url.includes('amazon')) return 'Amazon';
    if (url.includes('magalu') || url.includes('magazineluiza')) return 'Magazine Luiza';
    if (url.includes('shopee')) return 'Shopee';
    try { return new URL(url).hostname.replace('www.', '').split('.')[0]; }
    catch { return 'Loja'; }
}

/**
 * Busca imagem de produto ML via og:image (funciona com User-Agent de bot).
 */
async function fetchMLImage(url) {
    try {
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            redirect: 'follow'
        });
        if (!resp.ok) return null;
        const html = await resp.text();
        const match = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/);
        return match ? match[1] : null;
    } catch { return null; }
}

// --- CAMADA 1: CATÁLOGO CURADO ---

function buscarNoCatalogo(query) {
    const normalizada = normalizeQuery(query);

    // Busca exata
    if (CATALOGO[normalizada]) return CATALOGO[normalizada];

    // Busca parcial
    for (const [chave, item] of Object.entries(CATALOGO)) {
        if (chave.includes(normalizada) || normalizada.includes(chave)) return item;
    }

    // Busca por categoria
    for (const [chave, item] of Object.entries(CATALOGO)) {
        if (item.categoria && normalizada.includes(item.categoria)) return item;
    }

    return null;
}

// --- CAMADA 2: BRAVE SEARCH API ---

async function buscarNoBrave(query) {
    if (!BRAVE_API_KEY) return null;

    try {
        const resp = await fetch(`${BRAVE_URL}?q=${encodeURIComponent('comprar ' + query)}&count=5&search_lang=pt-br&country=br`, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': BRAVE_API_KEY
            }
        });

        if (!resp.ok) return null;

        const data = await resp.json();
        const results = data.web?.results || [];
        if (results.length === 0) return null;

        return results
            .filter(r => r.url && !r.url.includes('youtube.com'))
            .slice(0, 3)
            .map(r => ({
                nome: r.title?.replace(/<[^>]*>/g, '').trim() || '',
                link: r.url,
                marketplace: detectarMarketplace(r.url),
                imagem: r.thumbnail?.src || null,
                snippet: r.description?.replace(/<[^>]*>/g, '').trim() || ''
            }));

    } catch (err) {
        console.error('Erro Brave API:', err.message);
        return null;
    }
}

// --- CAMADA 3: URLS CONSTRUÍDAS ---

function construirURLs(query) {
    const q = encodeURIComponent(query);
    return [
        { nome: `Buscar "${query}" no Mercado Livre`, link: `https://lista.mercadolivre.com.br/${q.replace(/%20/g, '-')}`, marketplace: 'Mercado Livre', imagem: null },
        { nome: `Buscar "${query}" no Agrofy`, link: `https://www.agrofy.com.br/busca?q=${q}`, marketplace: 'Agrofy', imagem: null }
    ];
}

// --- FUNÇÃO PRINCIPAL ---

export async function searchProduto(rawQuery, limit = 3) {
    if (!rawQuery || rawQuery.length < 2) return [];

    // Camada 1 (real ao vivo): Brave Search API quando configurada, antes de fallback curado
    const brave = await buscarNoBrave(rawQuery);
    if (brave && brave.length > 0) {
        console.log(`🔍 Brave ao vivo: ${brave.length} resultado(s) com imagem`);
        return brave.slice(0, limit).map((item) => ({ ...item, tipo_resultado: 'busca_ao_vivo' }));
    }

    // Camada 2: Catálogo técnico curado (links diretos de pesquisa filtrada nas lojas)
    const catalogo = buscarNoCatalogo(rawQuery);
    if (catalogo) {
        console.log(`📦 Catálogo técnico (busca direta nas lojas): "${catalogo.nome}"`);
        const links = catalogo.links.slice(0, limit);

        let imagem = catalogo.imagem || null;
        if (!imagem && links[0]?.url?.includes('mercadolivre')) {
            imagem = await fetchMLImage(links[0].url);
        }

        return links.map((l, i) => ({
            nome: catalogo.nome,
            link: l.url,
            marketplace: l.loja,
            imagem: i === 0 ? imagem : null,
            dica: `${catalogo.dica} (Link de pesquisa direta para comparar preços reais na loja.)`,
            tipo_resultado: 'link_pesquisa_curada'
        }));
    }

    // Camada 3: URLs construídas para busca direta
    console.log(`🔗 URLs de pesquisa direta pra "${rawQuery}"`);
    return construirURLs(rawQuery).slice(0, limit).map((item) => ({ ...item, tipo_resultado: 'link_pesquisa_direta' }));
}

// --- FORMATAÇÃO ---

/**
 * Formata resultados pro WhatsApp (texto).
 */
export function formatarProdutos(produtos) {
    if (!produtos || produtos.length === 0) return null;

    return produtos.map((p, i) => {
        let texto = `*${i + 1}. ${p.nome}*\n🏪 ${p.marketplace}\n🔗 ${p.link}`;
        if (p.dica) texto += `\n💡 *Dica:* ${p.dica}`;
        return texto;
    }).join('\n\n');
}

/**
 * Retorna a melhor imagem disponível (primeiro resultado que tenha).
 */
export function getMelhorImagem(produtos) {
    if (!produtos) return null;
    for (const p of produtos) {
        if (p.imagem && p.imagem.startsWith('http')) return p.imagem;
    }
    return null;
}
