import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import QRCode from 'qrcode';
import { getCurrentQR, getBotWhatsAppNumber } from './services/whatsapp.js';
import { avaliarRotacaoNasa, formatarRotacaoWhatsApp, listarMunicipiosGoias } from './services/rotation.js';
import { registrarSinalAnonimo } from './services/communitySignals.js';

dns.setDefaultResultOrder('ipv4first');

const TILE_CACHE = new Map();
const MAX_TILE_CACHE_ENTRIES = 300;
const EMPTY_TILE_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIAAAUAAeImBZsAAAAASUVORK5CYII=',
    'base64'
);

/**
 * Monta as URLs candidatas para camadas de mapa base e satélite NASA GIBS.
 */
function buildTileCandidateUrls(layer, z, y, x) {
    if (layer === 'base') {
        return [
            `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`,
            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
        ];
    }
    if (layer === 'ndvi') {
        return [
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/GoogleMapsCompatible_Level9/${z}/${y}/${x}.png`
        ];
    }
    if (layer === 'smap') {
        return [
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/SMAP_L4_Analyzed_Surface_Soil_Moisture/default/GoogleMapsCompatible_Level6/${z}/${y}/${x}.png`
        ];
    }
    return null;
}

/**
 * Registra tile PNG em memória com limite fixo para evitar crescimento ilimitado.
 */
function setCachedTile(key, buffer) {
    if (TILE_CACHE.size >= MAX_TILE_CACHE_ENTRIES) {
        const oldestKey = TILE_CACHE.keys().next().value;
        TILE_CACHE.delete(oldestKey);
    }
    TILE_CACHE.set(key, buffer);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, 'public');

export const app = express();
const PORT = process.env.PORT || 3000;

// Parser de query simples (querystring nativo): remove o `qs` da rota de
// ataque — só precisamos de ?token=xxx, sem parsing de bracket-keys.
app.set('query parser', 'simple');
app.use(express.json({ limit: '64kb' }));
app.use(express.static(PUBLIC_DIR));

// Rate limit em memória só para a rota sensível /qr (anti brute-force no token).
// Sem dependências: janela deslizante de 10 tentativas/min por IP.
const qrHits = new Map();
function qrRateLimit(req, res, next) {
    const agora = Date.now();
    const ip = req.ip || 'desconhecido';
    const lista = (qrHits.get(ip) || []).filter((t) => agora - t < 60000);
    if (lista.length >= 10) {
        res.status(429).send('Calma lá. Tenta de novo em 1 minuto.');
        return;
    }
    lista.push(agora);
    qrHits.set(ip, lista);
    if (qrHits.size > 500) qrHits.clear(); // teto anti-vazamento de memória
    next();
}

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

const PITCH_DEFAULT_PROMPT = 'Oi Zé Agro! Colhi milho em Rio Verde, compensa plantar de novo?';

function buildWhatsAppDemoUrl(modo = 'exemplo', textoCustom = '') {
    const numero = getBotWhatsAppNumber();
    if (modo === 'limpo') return `https://wa.me/${numero}`;
    const texto = textoCustom || PITCH_DEFAULT_PROMPT;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function formatarTelefoneBr(numero) {
    const d = String(numero || '').replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('55')) {
        return `+55 (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
    }
    if (d.length === 13 && d.startsWith('55')) {
        return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
    }
    return `+${d}`;
}

app.get('/rotacao', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'rotacao.html'));
});

app.get('/api/whatsapp/qrcode.png', async (req, res) => {
    try {
        const modo = req.query.modo === 'limpo' ? 'limpo' : 'exemplo';
        const textoCustom = typeof req.query.texto === 'string' ? req.query.texto.trim().slice(0, 300) : '';
        const url = buildWhatsAppDemoUrl(modo, textoCustom);
        const png = await QRCode.toBuffer(url, {
            width: 720,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: { dark: '#123e22', light: '#ffffff' }
        });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(png);
    } catch (err) {
        console.error('Erro ao gerar QR Code do WhatsApp:', err);
        return res.status(500).send('Erro ao gerar QR Code.');
    }
});

app.get('/testar', async (req, res) => {
    const modo = req.query.modo === 'limpo' ? 'limpo' : 'exemplo';
    const textoCustom = typeof req.query.texto === 'string' ? req.query.texto.trim().slice(0, 300) : '';
    const numero = getBotWhatsAppNumber();
    const waUrl = buildWhatsAppDemoUrl(modo, textoCustom);
    const numeroFmt = formatarTelefoneBr(numero);
    const qrSrc = textoCustom
        ? `/api/whatsapp/qrcode.png?modo=${modo}&texto=${encodeURIComponent(textoCustom)}`
        : `/api/whatsapp/qrcode.png?modo=${modo}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PersonalAgro (Zé Agro) · Testar no WhatsApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(145deg, #0d2b18 0%, #15512b 55%, #1f6f3d 100%);
      color: #f8fafc;
      display: grid;
      place-items: center;
      padding: 24px 16px;
    }
    .panel {
      width: 100%;
      max-width: 920px;
      background: rgba(255, 255, 255, 0.98);
      color: #172318;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: center;
    }
    @media (min-width: 780px) {
      .panel { grid-template-columns: 340px 1fr; padding: 36px; }
    }
    .qr-box {
      background: #f4f6f0;
      border: 2px solid #dce4d5;
      border-radius: 20px;
      padding: 20px;
      text-align: center;
    }
    .qr-wrap {
      position: relative;
      width: 100%;
      max-width: 280px;
      aspect-ratio: 1;
      margin: 0 auto 12px;
      background: #fff;
      border-radius: 14px;
      padding: 8px;
    }
    .qr-wrap img.qr-img {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 8px;
    }
    .qr-wrap img.qr-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 21%;
      height: 21%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: #fff;
      padding: 3px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      pointer-events: none;
    }
    .phone-tag {
      display: inline-block;
      font-weight: 800;
      font-size: 0.95rem;
      color: #15512b;
      background: #e7f4eb;
      padding: 6px 12px;
      border-radius: 999px;
    }
    .badge {
      display: inline-block;
      background: #e7f4eb;
      color: #1f6f3d;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 5px 12px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    h1 { font-size: 1.7rem; line-height: 1.2; margin-bottom: 10px; }
    .desc { color: #475569; margin-bottom: 16px; font-size: 0.96rem; }
    .prompts {
      background: #f8faf6;
      border: 1px solid #dce4d5;
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }
    .prompts h2 { font-size: 0.86rem; text-transform: uppercase; color: #1f6f3d; margin-bottom: 8px; }
    .prompts li { margin-left: 18px; font-size: 0.9rem; color: #1e293b; margin-top: 5px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 16px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
    }
    .btn-wa { background: #16a34a; color: #fff; }
    .btn-alt { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <main class="panel">
    <section class="qr-box">
      <div class="qr-wrap">
        <img class="qr-img" src="${qrSrc}" alt="QR Code do Zé Agro no WhatsApp" />
        <img class="qr-logo" src="/images/ze-agro-logo.png" alt="Zé Agro" />
      </div>
      <span class="phone-tag">${numeroFmt}</span>
    </section>
    <section>
      <span class="badge">🌾 PersonalAgro · Pitch Day</span>
      <h1>Aponte a câmera e teste o Zé Agro ao vivo no WhatsApp</h1>
      <p class="desc">Sem baixar aplicativo e sem cadastro: escaneie o QR Code para conversar por <strong>texto ou áudio</strong> com dados da NASA Earth, Embrapa Cerrados e escoamento regional.</p>
      <div class="prompts">
        <h2>Sugestões para testar agora:</h2>
        <ul>
          <li><em>"Colhi milho em Rio Verde, compensa plantar de novo?"</em></li>
          <li><em>"Minha terra tá cansada e seca em Itaguaru, o que aguenta?"</em></li>
          <li><em>"Quero saber o custo para 5 hectares e pra quem vender"</em></li>
        </ul>
      </div>
      <div class="actions">
        <a class="btn btn-wa" href="${waUrl}" target="_blank" rel="noopener">📲 Abrir no WhatsApp</a>
        <a class="btn btn-alt" href="${modo === 'limpo' ? '/testar' : '/testar?modo=limpo'}">${modo === 'limpo' ? '✨ QR com pergunta pronta' : '🎙️ QR para chat livre / áudio'}</a>
        <a class="btn btn-alt" href="/rotacao">🛰️ Abrir Simulador Web</a>
      </div>
    </section>
  </main>
</body>
</html>`);
});

app.get('/api/rotacao/cidades', (req, res) => {
    try {
        res.json({ ok: true, cidades: listarMunicipiosGoias() });
    } catch (err) {
        console.error('Erro ao listar municípios:', err);
        res.status(500).json({ ok: false, erro: 'Erro ao carregar municípios.' });
    }
});

app.get('/api/rotacao/tile/:layer/:z/:y/:x', async (req, res) => {
    const { layer, z, y, x } = req.params;
    const urls = buildTileCandidateUrls(layer, z, y, x);
    if (!urls || !/^\d+$/.test(z) || !/^\d+$/.test(y) || !/^\d+$/.test(x)) {
        return res.status(400).json({ ok: false, erro: 'Parâmetros de tile inválidos.' });
    }

    const zoom = Number(z);
    const tileY = Number(y);
    const tileX = Number(x);
    const maxCoord = 2 ** zoom;
    if (zoom > 19 || tileY >= maxCoord || tileX >= maxCoord) {
        return res.status(400).json({ ok: false, erro: 'Coordenadas de tile fora da faixa válida.' });
    }

    if ((layer === 'smap' && zoom > 6) || (layer === 'ndvi' && zoom > 9)) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(EMPTY_TILE_PNG);
    }

    const cacheKey = `${layer}/${z}/${y}/${x}`;
    const cached = TILE_CACHE.get(cacheKey);
    if (cached) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(cached);
    }

    for (const url of urls) {
        try {
            const upstream = await fetch(url, {
                signal: AbortSignal.timeout(8000),
                headers: { 'User-Agent': 'PersonalAgro-TileRelay/1.0' }
            });
            if (!upstream.ok) continue;
            const contentType = upstream.headers.get('content-type') || '';
            if (!contentType.includes('image')) continue;

            const buf = Buffer.from(await upstream.arrayBuffer());
            if (buf.length === 0) continue;

            setCachedTile(cacheKey, buf);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return res.status(200).send(buf);
        } catch {
            // tenta próximo provedor de tile antes do fallback transparente
        }
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(EMPTY_TILE_PNG);
});

app.get('/api/rotacao/csv', (req, res) => {
    const csvPath = path.resolve(__dirname, 'data', 'nasa_goias_baseline.csv');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="nasa_goias_baseline.csv"');
    res.sendFile(csvPath, (err) => {
        if (err && !res.headersSent) {
            console.error('Erro ao enviar CSV:', err);
            res.status(404).json({ ok: false, erro: 'Arquivo CSV não encontrado.' });
        }
    });
});

app.post('/api/rotacao/simular', async (req, res) => {
    try {
        const payload = req.body || {};
        const resultado = await avaliarRotacaoNasa(payload);
        const pulsoAtualizado = payload.registrar === false
            ? resultado.pulso_regional
            : registrarSinalAnonimo({
                municipioKey: resultado.contexto.municipio_key,
                culturaAnterior: resultado.contexto.cultura_anterior,
                prioridade: resultado.contexto.prioridade,
                planoEscolhido: resultado.ranking?.[0]?.titulo
            });
        res.json({
            ...resultado,
            pulso_regional: pulsoAtualizado,
            whatsapp_texto: formatarRotacaoWhatsApp(resultado)
        });
    } catch (err) {
        console.error('Erro ao simular rotação:', err);
        res.status(500).json({ ok: false, erro: 'Não foi possível calcular o plano agora.' });
    }
});

// Página com o QR Code do WhatsApp em imagem real (auto-atualiza a cada 40s).
// PROTEGIDA POR TOKEN: quem escanear o QR vincula o número do bot a outro
// celular (sequestro de sessão). Só o dono, com o QR_TOKEN do .env, pode ver.
app.get('/qr', qrRateLimit, async (req, res) => {
    const token = req.query.token;
    const esperado = process.env.QR_TOKEN;

    if (!esperado || token !== esperado) {
        res.status(404).send('Nada por aqui.');
        return;
    }

    const qr = getCurrentQR();

    if (!qr) {
        res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Personal Agro</title>
<meta http-equiv="refresh" content="10">
<style>body{background:#111;color:#eee;font-family:Segoe UI,sans-serif;text-align:center;padding-top:60px}</style></head>
<body><h1>🌾 Personal Agro</h1>
<p>✅ WhatsApp conectado — ou aguardando um novo QR Code...</p>
<p style="color:#888">Esta página atualiza automaticamente.</p></body></html>`);
        return;
    }

    const dataUrl = await QRCode.toDataURL(qr, { width: 480, margin: 2 });
    res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Personal Agro - Conectar WhatsApp</title>
<meta http-equiv="refresh" content="40">
<style>body{background:#111;color:#eee;font-family:Segoe UI,sans-serif;text-align:center;padding-top:30px}
img{background:#fff;padding:12px;border-radius:12px}</style></head>
<body><h1>🌾 Personal Agro</h1>
<p>No celular do <b>número do bot</b>: WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
<img src="${dataUrl}" alt="QR Code do WhatsApp">
<p style="color:#888">O código expira rápido — esta página atualiza sozinha a cada 40s.</p></body></html>`);
});

export function startServer() {
    app.listen(PORT, () => {
        console.log(`🌐 Servidor Web Express rodando na porta ${PORT} (Health Check: /ping)`);
        if (process.env.QR_TOKEN) {
            // NUNCA loga o token inteiro: log é lido por gente e fica em arquivo.
            console.log(`🔐 QR protegido por token (/qr?token=***${process.env.QR_TOKEN.slice(-3)})`);
        } else {
            console.log('⚠️ QR_TOKEN não definido no .env — a rota /qr está BLOQUEADA. Defina QR_TOKEN para usar.');
        }
    });
}
