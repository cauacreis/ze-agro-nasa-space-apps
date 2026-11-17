import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { addDaysStr, diffDias, hojeStr, parseQuando, parseISODate } from '../src/services/datas.js';
import { createJsonStore } from '../src/services/opsStore.js';
import { parseNumeroBR, parseRegistroCampo, salvarRegistroCampo, listarRegistros, resumirRegistros, formatarResumo, registrosParaCSV } from '../src/services/field.js';
import { calcularSafra, relacaoTroca, compararCustoAplicacao, criarConta, listarContas, baixarConta, contasParaDigest } from '../src/services/finance.js';
import { criarLembrete, listarLembretes, cancelarLembrete, lembretesParaDigest, aplicarDigestLembretes } from '../src/services/reminders.js';
import { formatarJanela } from '../src/services/janela.js';
import { buildCropMessages } from '../src/services/ai.js';
import { respostaInstantanea, buildDegradedMessages } from '../src/services/ai.js';
import { classificarErro, provedoresConfig, provedoresDisponiveis, registrarUso, lerUso } from '../src/services/provedores.js';
import { registrarUsoRecurso, resumoUso, deveNudge, marcarNudge, deveTransicao, marcarTransicao, contarDegradado, textoNudge, textoTransicao, textoPitch, marcarQueroVip, temQueroVip, limparQueroVip, parecePagamento } from '../src/services/persuasao.js';
import { verificarAbuso } from '../src/services/abuso.js';
import { montarPreferencia, obterLinkPagamento, extrairIdPagamento, precoVip, criarPreferenciaMP } from '../src/services/pagamentos.js';
import { montarPagamentoPix, chaveIdempotencia, validarEmail, extrairEmail, validarCpf } from '../src/services/pagamentos.js';
import { gerarOuReusarPix, intencaoAtiva, verificarCobrancas } from '../src/services/cobranca.js';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeagro-ops-'));
const store = (name) => createJsonStore(path.join(tmpRoot, name));
const AGORA = new Date(2026, 8, 11, 10, 0, 0);

// datas
assert.equal(hojeStr(AGORA), '2026-09-11');
assert.equal(addDaysStr('2026-09-11', 2), '2026-09-13');
assert.equal(diffDias('2026-09-12', '2026-09-11'), 1);
assert.equal(parseISODate('2026-02-30'), null);
assert.deepEqual(parseQuando('me lembra amanhã 6h', AGORA), { data: '2026-09-12', hora: '06:00', iso: '2026-09-12T06:00:00', original: 'me lembra amanhã 6h' });
assert.equal(parseQuando('sexta 9h', AGORA).data, '2026-09-11');
assert.equal(parseQuando('dia 10', AGORA).data, '2026-10-10');
assert.equal(parseQuando('12/09', AGORA).data, '2026-09-12');
assert.equal(parseQuando('em 3 dias', AGORA).data, '2026-09-14');
assert.equal(parseQuando('bla bla bla', AGORA), null);

// field
assert.equal(parseNumeroBR('R$ 1.200,50'), 1200.5);
const r1 = parseRegistroCampo('registra: abasteci 40 litros de diesel no trator', AGORA);
assert.equal(r1.tipo, 'abastecimento');
assert.equal(r1.dados.litros, 40);
const r2 = parseRegistroCampo('troquei o óleo do trator, gastei R$ 180', AGORA);
assert.equal(r2.tipo, 'manutencao');
assert.equal(r2.dados.custo, 180);
const r3 = parseRegistroCampo('apliquei neem no tomate, dose 5ml por litro', AGORA);
assert.equal(r3.tipo, 'aplicacao');
assert.match(r3.dados.dose || '', /5ml/i);
const fstore = store('field.json');
assert.ok(salvarRegistroCampo(fstore, '559900000001', 'abasteci 40 litros de diesel no trator', { hoje: AGORA }).ok);
assert.ok(salvarRegistroCampo(fstore, '559900000001', 'troquei filtro, R$ 50', { hoje: AGORA }).ok);
const lista = listarRegistros(fstore, '559900000001', 7, AGORA);
assert.equal(lista.length, 2);
const resumo = resumirRegistros(lista, 7);
assert.equal(resumo.total, 2);
assert.equal(resumo.litros_totais, 40);
assert.equal(resumo.custos_totais, 50);
assert.match(formatarResumo(resumo), /Caderno/);
assert.match(registrosParaCSV(lista), /^data;tipo;resumo;detalhes/);
// anti formula-injection no CSV (Excel/Sheets não executa célula hostil)
const csvMal = registrosParaCSV([{ data: '2026-09-11', tipo: 'observacao', resumo: '=HYPERLINK("http://x")', dados: {} }]);
assert.match(csvMal, /"'=HYPERLINK/);

// finance
const safra = calcularSafra({ area_ha: 2, produtividade_por_ha: 60, unidade: 'sc', preco_por_unidade: 120, custos: [2000, 1500], frete_total: 300 });
assert.equal(safra.ok, true);
assert.equal(safra.producao_total, 120);
assert.equal(safra.receita_total, 14400);
assert.equal(safra.custo_total, 3800);
assert.equal(safra.margem_total, 10600);
assert.equal(safra.margem_pct, 73.6);
assert.equal(safra.preco_equilibrio, 31.67);
assert.equal(calcularSafra({ area_ha: 2, produtividade_por_ha: 60, preco_por_unidade: 120 }).sem_custo, true);
const troca = relacaoTroca(120, 3600, 'sc', 't');
assert.equal(troca.razao, 30);
const comp = compararCustoAplicacao(10, [
    { nome: 'A', preco_embalagem: 100, tamanho_embalagem: 5, dose_por_ha: 1 },
    { nome: 'B', preco_embalagem: 180, tamanho_embalagem: 20, dose_por_ha: 2 }
]);
assert.equal(comp.opcoes[0].nome, 'B');
assert.equal(comp.opcoes[0].custo_por_ha, 18);
assert.equal(compararCustoAplicacao(10, [{ nome: 'X', preco_embalagem: 10, tamanho_embalagem: 1 }]).ok, false);

const astore = store('accounts.json');
assert.ok(criarConta(astore, { numero: '559900000002', descricao: 'luz', valor: 'R$ 180', vencimento: '2026-09-11', tipo: 'pagar' }).ok);
assert.ok(criarConta(astore, { numero: '559900000002', descricao: 'diesel', valor: 500, vencimento: '2026-09-10', tipo: 'pagar' }).ok);
const contas = listarContas(astore, { numero: '559900000002', hoje: '2026-09-11' });
assert.equal(contas.length, 2);
assert.ok(contas.some((c) => c.situacao === 'vencida'));
assert.ok(baixarConta(astore, '559900000002', contas[0].id, 'paga').ok);
assert.equal(contasParaDigest(astore, '559900000002', '2026-09-11', 7).length, 1);

// reminders
const lstore = store('reminders.json');
const l1 = criarLembrete(lstore, { numero: '559900000003', texto: 'vacinar o gado', quando: 'amanhã 6h', agora: AGORA });
assert.equal(l1.ok, true);
assert.equal(l1.lembrete.proxima_data, '2026-09-12');
const l2 = criarLembrete(lstore, { numero: '559900000003', texto: 'sal mineral', quando: '2026-09-10', recorrencia: 'diaria', agora: AGORA });
assert.equal(listarLembretes(lstore, { numero: '559900000003' }).length, 2);
const vencidos = lembretesParaDigest(lstore, '559900000003', '2026-09-11');
assert.equal(vencidos.length, 1);
assert.equal(aplicarDigestLembretes(lstore, vencidos, '2026-09-11'), 1);
assert.equal(lstore.list((x) => x.id === l2.lembrete.id)[0].proxima_data, '2026-09-11');
assert.ok(cancelarLembrete(lstore, '559900000003', l1.lembrete.id).ok);

// ops store
const gstore = store('generic.json');
const g1 = gstore.add({ numero: '559900000004', x: 1 });
assert.ok(gstore.update(g1.id, { x: 2 }).x === 2);
assert.equal(gstore.removeByUser('559900000004'), 1);

// prompts incluem as novas regras
const msgs = buildCropMessages('GERAL', [], 'low_ticket', 'indefinido', 'indefinido', false, {});
assert.match(msgs[0].content, /DINHEIRO COM RESPONSABILIDADE/);
assert.match(msgs[0].content, /NÍVEL DE CONFIANÇA/);
assert.match(msgs[0].content, /DADOS OPERACIONAIS/);

// PRONAF não carrega lua (~350 tokens economizados por chamada)
const msgsPronaf = buildCropMessages('PRONAF', [], 'low_ticket', 'indefinido', 'indefinido', false, {});
assert.doesNotMatch(msgsPronaf[0].content, /DADOS DAS FASES DA LUA/);
assert.match(msgs[0].content, /DADOS DAS FASES DA LUA/);

// fast-path de saudação (0 tokens): só mensagem inteira, nada com conteúdo junto
assert.ok(typeof respostaInstantanea('oi') === 'string');
assert.ok(typeof respostaInstantanea('Bom dia!') === 'string');
assert.ok(typeof respostaInstantanea('valeu sô') === 'string');
assert.equal(respostaInstantanea('oi, meu milho tá com lagarta'), null);
assert.equal(respostaInstantanea('quanto tá o tomate?'), null);
assert.equal(respostaInstantanea('[DIAGNÓSTICO TÉCNICO DE IMAGEM: algo]'), null);
assert.equal(respostaInstantanea(''), null);

// prompt degradado é dieta de verdade (< 25% do tamanho do cheio)
const cheio = buildCropMessages('TOMATE', [{ role: 'user', content: 'x'.repeat(50) }], 'low_ticket', 'tomate', 'italiano', false, {});
const magro = buildDegradedMessages([{ role: 'user', content: 'x'.repeat(50) }]);
const tamCheio = cheio.map((m) => m.content.length).reduce((a, b) => a + b, 0);
const tamMagro = magro.map((m) => m.content.length).reduce((a, b) => a + b, 0);
assert.ok(tamMagro < tamCheio * 0.25, `dieta fraca: magro=${tamMagro} cheio=${tamCheio}`);
console.log(`✅ Dieta degradado: ${tamCheio} → ${tamMagro} chars (${Math.round((1 - tamMagro / tamCheio) * 100)}% a menos).`);

// classificação de erros de provedor
assert.equal(classificarErro(429, 'rate limit exceeded').acao, 'proximo');
assert.equal(classificarErro(500, 'internal error').acao, 'proximo');
assert.equal(classificarErro(null, 'fetch failed').acao, 'proximo');
assert.equal(classificarErro(401, 'invalid api key').acao, 'proximo');
assert.ok(classificarErro(401, 'x').esperaMs >= classificarErro(429, 'x').esperaMs, 'auth tem que punir mais que rate limit');
assert.equal(classificarErro(404, 'model_not_found').acao, 'proximo');
assert.equal(classificarErro(402, 'Payment required to access this resource').acao, 'proximo');
assert.equal(classificarErro(413, 'Request too large').retryTrimHistory, true);
assert.ok(classificarErro(429, 'Quota exceeded for generate_content_free_tier_requests per day').esperaMs >= 30 * 60 * 1000, 'cota diária deve aplicar cooldown longo');
assert.equal(classificarErro(null, 'gemini/gemini-2.5-flash: resposta truncada (finish_reason=length, out:58, chars:150)').retryBoostMaxTokens, true);

const cfgProvs = provedoresConfig();
const cfgGroq = cfgProvs.find((p) => p.id === 'groq');
const cfgGem = cfgProvs.find((p) => p.id === 'gemini');
assert.ok(cfgGroq?.trimHistory > 0 && cfgGroq.trimHistory <= 6, 'groq precisa limitar histórico contra HTTP 413');
assert.ok(cfgGem?.modelChains?.main?.includes('gemini-3-flash-preview') && cfgGem?.modelChains?.main?.includes('gemini-3.5-flash-lite'), 'gemini precisa de fallback vivo além do 2.5-flash');
assert.ok(!cfgGem?.modelChains?.main?.includes('gemini-2.5-flash-lite'), 'modelo 404 gemini-2.5-flash-lite não deve estar na cadeia');

// provedores disponíveis respeitam chaves ausentes (sem vazar chave!)
const disp = provedoresDisponiveis().map((p) => p.id);
assert.ok(disp.includes('groq'), 'groq deveria estar disponível');
assert.ok(disp.every((id) => ['groq', 'gemini', 'github', 'mistral', 'sambanova', 'openrouter', 'nvidia', 'cerebras'].includes(id)), 'só ids conhecidos, sem vazar chave');
console.log(`✅ Provedores ativos: ${disp.join(', ')} (extras entram com chaves no .env).`);

// ledger de uso (isolado via AI_USO_PATH)
process.env.AI_USO_PATH = path.join(tmpRoot, 'ai_uso.json');
registrarUso('groq', { in: 5000, out: 150 });
registrarUso('local', { in: 0, out: 0 });
const uso = lerUso(7);
assert.ok(uso.totais.groq.req >= 1 && uso.totais.groq.in >= 5000);
assert.ok(uso.totais.local.req >= 1);
delete process.env.AI_USO_PATH;
console.log('✅ Ledger de uso OK (/custos vai ler daqui).');

// persuasão honesta: contadores reais, flags 1x, copies curtas
const pstore = createJsonStore(path.join(tmpRoot, 'persuasao.json'));
registrarUsoRecurso(pstore, '559900000010', 'foto');
registrarUsoRecurso(pstore, '559900000010', 'foto');
registrarUsoRecurso(pstore, '559900000010', 'ceasa');
registrarUsoRecurso(pstore, '559900000010', 'invalido');
const res = resumoUso(pstore, '559900000010');
assert.equal(res.total, 3);
assert.match(res.texto, /2 fotos analisadas/);
assert.match(res.texto, /1 cotação CEASA/);
assert.match(res.texto, / e /);
assert.equal(resumoUso(pstore, '559900000011').texto, null);
assert.equal(deveNudge(pstore, '559900000010', 5), 'n5');
marcarNudge(pstore, '559900000010', 'n5');
assert.equal(deveNudge(pstore, '559900000010', 5), null);
assert.equal(deveNudge(pstore, '559900000010', 2), 'n2');
assert.equal(deveTransicao(pstore, '559900000010'), true);
marcarTransicao(pstore, '559900000010');
assert.equal(deveTransicao(pstore, '559900000010'), false);
assert.equal(contarDegradado(pstore, '559900000010'), 1);
assert.equal(contarDegradado(pstore, '559900000010'), 2);
assert.match(textoNudge('n5', res), /faltam 5/);
assert.match(textoNudge('n2', res), /2 fotos analisadas/);
assert.match(textoTransicao(res), /Mês cheio usado/);
assert.match(textoPitch(3, res), /QUERO VIP/);
for (const c of [0, 3, 6, 9]) assert.match(textoPitch(c, res), /VIP/);
marcarQueroVip(pstore, '559900000010');
assert.equal(temQueroVip(pstore, '559900000010'), true);
limparQueroVip(pstore, '559900000010');
assert.equal(temQueroVip(pstore, '559900000010'), false);
assert.equal(parecePagamento('paguei chefe'), true);
assert.equal(parecePagamento('segue o comprovante'), true);
assert.equal(parecePagamento('quanto tá o tomate?'), false);
console.log('✅ Persuasão OK (recap real, flags 1x, pitches rotativos).');

// anti-abuso: rajada, duplicada, mídia, áudio longo, expiração
const abstore = createJsonStore(path.join(tmpRoot, 'abuso.json'));
const vibe = (n, i, extra = {}) => verificarAbuso(abstore, { numero: '559900000020', texto: `msg ${i}`, msgType: 'conversation', agora: 1000000 + n * 5000, ...extra });
// 6 msgs/min passam
for (let i = 0; i < 6; i++) assert.equal(vibe(i, i).bloqueado, false);
// 7ª = strike 1 (aviso, sem IA)
const s1 = vibe(6, 6);
assert.equal(s1.bloqueado, true);
assert.match(s1.resposta, /calma/);
// +6 de novo rápido = strike 2 (2min)
for (let i = 7; i < 13; i++) vibe(i, 100 + i);
const s2 = vibe(13, 200);
assert.equal(s2.bloqueado, true);
assert.match(s2.resposta, /2 min/);
// após 31min limpo, strikes zeram
assert.equal(verificarAbuso(abstore, { numero: '559900000020', texto: 'oi de novo', msgType: 'conversation', agora: 1000000 + 40 * 60000 }).bloqueado, false);
// duplicada 3x
const dup = (t) => verificarAbuso(abstore, { numero: '559900000021', texto: t, msgType: 'conversation', agora: 2000000 });
dup('mesma coisa'); dup('mesma coisa');
assert.match(dup('mesma coisa').resposta, /3x/);
// mídia: 5 passam, 6ª trava
for (let i = 0; i < 5; i++) {
    const r = verificarAbuso(abstore, { numero: '559900000022', texto: '', msgType: 'imageMessage', agora: 3000000 + i * 60000 });
    assert.equal(r.bloqueado, false);
}
assert.match(verificarAbuso(abstore, { numero: '559900000022', texto: '', msgType: 'imageMessage', agora: 3000000 + 5 * 60000 }).resposta, /leva/);
// áudio >3min recusado
assert.match(verificarAbuso(abstore, { numero: '559900000023', texto: '', msgType: 'audioMessage', audioSeconds: 200, agora: 4000000 }).resposta, /3 min/);
console.log('✅ Anti-abuso OK (rajada, duplicada, mídia, áudio longo).');

// pagamentos fase 2 (offline: sem rede, sem token real)
assert.equal(precoVip() > 0, true);
const pref = montarPreferencia('559900000030');
assert.equal(pref.items[0].currency_id, 'BRL');
assert.equal(pref.external_reference, 'vip_559900000030');
assert.equal(extrairIdPagamento('paguei, id 1234567890'), '1234567890');
assert.equal(extrairIdPagamento('quanto tá o tomate?'), null);
// sem token e sem link: cai pro Pix manual (null), sem quebrar
const _tok = process.env.MP_ACCESS_TOKEN;
const _lnk = process.env.MP_PREFERENCE_LINK;
delete process.env.MP_ACCESS_TOKEN;
delete process.env.MP_PREFERENCE_LINK;
assert.equal(await obterLinkPagamento('559900000030'), null);
assert.equal(await criarPreferenciaMP('559900000030'), null);
if (_tok !== undefined) process.env.MP_ACCESS_TOKEN = _tok;
if (_lnk !== undefined) process.env.MP_PREFERENCE_LINK = _lnk;
// link manual dispensa API
process.env.MP_PREFERENCE_LINK = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=TESTE';
const manual = await obterLinkPagamento('559900000030');
assert.equal(manual.link, process.env.MP_PREFERENCE_LINK);
assert.equal(manual.origem, 'manual');
delete process.env.MP_PREFERENCE_LINK;
if (_lnk !== undefined) process.env.MP_PREFERENCE_LINK = _lnk;
assert.equal(parecePagamento('paguei pelo mercadopago.com, segue'), true);
console.log('✅ Pagamentos OK (preferência rastreável, fallback Pix, link manual).');

// Pix automático: builders, idempotência e poller (tudo offline com fakes)
assert.equal(validarEmail('ze@fazenda.example'), true);
assert.equal(validarEmail('sem-arroba'), false);
assert.equal(extrairEmail('meu email é ze@fazenda.example blz'), 'ze@fazenda.example');
assert.equal(validarCpf('123.456.789-09'), '12345678909');
assert.equal(validarCpf('123'), null);
const bodyPix = montarPagamentoPix({ numero: '559900000040', email: 'ze@fazenda.example', expiraEm: '2026-09-11T12:00:00.000Z' });
assert.equal(bodyPix.transaction_amount, precoVip());
assert.equal(bodyPix.payment_method_id, 'pix');
assert.equal(bodyPix.external_reference, 'vip_559900000040');
assert.equal(bodyPix.payer.email, 'ze@fazenda.example');
assert.equal(chaveIdempotencia('abc123'), chaveIdempotencia('abc123'));
assert.ok(chaveIdempotencia('abc123') !== chaveIdempotencia('abc456'));
// sem token: falha graciosa, sem criar registro
const _mpTok = process.env.MP_ACCESS_TOKEN;
delete process.env.MP_ACCESS_TOKEN;
const cstore = createJsonStore(path.join(tmpRoot, 'cobrancas.json'));
const semToken = await gerarOuReusarPix(cstore, { numero: '559900000040', email: 'ze@fazenda.example' });
assert.ok(semToken.erro && !semToken.qr_code);
assert.equal(cstore.list((r) => r.numero === '559900000040').length, 0);
if (_mpTok !== undefined) process.env.MP_ACCESS_TOKEN = _mpTok;
// reuso: pendente válido com QR volta sem rede
cstore.add({ numero: '559900000041', email: 'a@b.com', intentId: 'x1', paymentId: '999', status: 'pendente', qr_code: 'CODIGO123', expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: new Date().toISOString(), vipAplicado: false, avisado: false });
const reuso = await gerarOuReusarPix(cstore, { numero: '559900000041', email: 'a@b.com' });
assert.equal(reuso.reusado, true);
assert.equal(reuso.qr_code, 'CODIGO123');
// expirado vira 'expirado' e não é reusado
cstore.add({ numero: '559900000042', email: 'a@b.com', intentId: 'x2', paymentId: '998', status: 'pendente', qr_code: 'VELHO', expiraEm: '2020-01-01T00:00:00.000Z', criadoEm: '2020-01-01T00:00:00.000Z', vipAplicado: false, avisado: false });
assert.equal(intencaoAtiva(cstore, '559900000042', Date.now()), null);
assert.equal(cstore.list((r) => r.numero === '559900000042')[0].status, 'expirado');
// poller: aprovado aplica+avisa 1x (segunda passada não repete), rejeitado falha
let aplicados = 0, avisados = 0;
const consultarFake = async (id) => {
    if (id === '111') return { id: '111', status: 'approved', valor: 84.99 };
    if (id === '222') return { id: '222', status: 'rejected' };
    return null;
};
cstore.add({ numero: '559900000043', email: 'a@b.com', intentId: 'x3', paymentId: '111', status: 'pendente', qr_code: 'Q', expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: new Date().toISOString(), vipAplicado: false, avisado: false });
cstore.add({ numero: '559900000044', email: 'a@b.com', intentId: 'x4', paymentId: '222', status: 'pendente', qr_code: 'Q', expiraEm: '2099-01-01T00:00:00.000Z', criadoEm: new Date().toISOString(), vipAplicado: false, avisado: false });
const deps = {
    consultar: consultarFake,
    aplicarVip: async () => { aplicados += 1; },
    avisar: async () => { avisados += 1; }
};
const poll1 = await verificarCobrancas({ store: cstore, ...deps });
assert.equal(poll1.aprovadas, 1);
assert.equal(cstore.list((r) => r.numero === '559900000044')[0].status, 'falhou');
const poll2 = await verificarCobrancas({ store: cstore, ...deps });
assert.equal(aplicados, 1);
assert.equal(avisados, 1);
assert.equal(cstore.list((r) => r.numero === '559900000043')[0].status, 'aprovado');
console.log('✅ Cobrança automática OK (idempotência, expiração, poll sem duplicar).');

// janela formatada sem rede
const jf = formatarJanela({ ok: true, cidade: 'Itaguaru (GO)', operacao: 'pulverizar', melhores: [{ dia: 'amanhã', condicao: 'Predomínio de sol', minima: '18°C', maxima: '31°C', chanceDeChuvaMaxima: '10%', motivos: ['tempo seco'] }], alertas: [] });
assert.match(jf, /Melhor janela para pulverizar/);

console.log('✅ Testes offline OK (datas, caderno, safra, contas, lembretes, prompts).');

if (process.env.LIVE_TEST === '1') {
    const { getWeatherAndRainRisk } = await import('../src/services/weather.js');
    const { consultarPrecoCeasa } = await import('../src/services/market.js');
    const { searchProduto } = await import('../src/services/shopping.js');
    const clima = await getWeatherAndRainRisk('Itaguaru');
    assert.ok((clima.previsaoDias || []).length >= 3, 'clima sem 7 dias');
    const ceasa = await consultarPrecoCeasa('tomate');
    assert.ok(typeof ceasa.encontrado === 'boolean', 'CEASA sem resposta válida');
    const prods = await searchProduto('oleo de neem');
    assert.ok(Array.isArray(prods) && prods.length > 0, 'busca de produto vazia');
    console.log(`✅ Testes live OK (clima ${clima.previsaoDias.length}d, CEASA ${ceasa.encontrado ? 'com' : 'sem'} tomate hoje, ${prods.length} produto(s)).`);
}
