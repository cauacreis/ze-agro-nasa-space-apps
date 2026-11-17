// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Cauã Felype Caetano Reis

import 'dotenv/config';
import { startServer } from './src/server.js';
import { connectToWhatsApp } from './src/services/whatsapp.js';
import { startBroadcast } from './src/services/broadcast.js';
import { startBackup } from './src/services/backup.js';
import { resumoPoolProvedores } from './src/services/provedores.js';

// Em produção com PM2, sair com código 1 garante reinício limpo do processo
process.on('uncaughtException', (err) => {
    console.error('Erro Crítico:', err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    console.error('Rejeição não tratada:', err);
    process.exit(1);
});

console.log('Iniciando o Personal Agro...');
const poolResumo = resumoPoolProvedores().map((p) => `${p.id}(${p.chaves}x${p.modelos})`).join(', ');
console.log(`🧠 Pool de IAs: ${poolResumo || 'nenhum provedor configurado'}`);
startServer();
connectToWhatsApp();
startBroadcast();
startBackup();
