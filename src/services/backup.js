import cron from 'node-cron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = './backups';
const KEEP = 7; // guarda os últimos 7 dias

// Backup diário da sessão do WhatsApp (auth_info_baileys) às 03:00.
// Com o backup dá pra migrar de máquina sem rescanear QR.
export function startBackup() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

    cron.schedule('0 3 * * *', () => {
        const hoje = new Date().toISOString().slice(0, 10);
        const dest = path.join(BACKUP_DIR, `auth_${hoje}.tar.gz`);

        exec(`tar -czf "${dest}" auth_info_baileys data`, (err) => {
            if (err) {
                console.error('💾 Backup da sessão falhou:', err.message);
                return;
            }
            console.log(`💾 Backup da sessão salvo: ${dest}`);

            // Rotação: mantém só os KEEP mais recentes
            try {
                const arquivos = fs.readdirSync(BACKUP_DIR)
                    .filter(f => f.startsWith('auth_') && f.endsWith('.tar.gz'))
                    .sort();
                while (arquivos.length > KEEP) {
                    const velho = arquivos.shift();
                    fs.unlinkSync(path.join(BACKUP_DIR, velho));
                    console.log(`🗑️ Backup antigo removido: ${velho}`);
                }
            } catch (e) {
                console.error('Erro na rotação de backups:', e.message);
            }

            // Rotação de logs do PM2 (pm2-logrotate não instala em paths com espaço)
            try {
                const logDir = path.join(process.env.USERPROFILE || '', '.pm2', 'logs');
                const logBot = path.join(logDir, 'personal-agro-out.log');
                if (fs.existsSync(logBot) && fs.statSync(logBot).size > 20 * 1024 * 1024) {
                    exec('pm2 flush', (e2) => {
                        if (e2) console.error('pm2 flush falhou:', e2.message);
                        else console.log('🧹 Logs do PM2 limpos (passaram de 20MB)');
                    });
                }
            } catch (e) {
                console.error('Erro ao checar logs:', e.message);
            }
        });
    }, { timezone: 'America/Sao_Paulo' });

    console.log('💾 Backup diário da sessão agendado para 03:00 (America/Sao_Paulo)');
}
