import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltam credenciais do Supabase no arquivo .env');
}

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Cliente Supabase configurado com sucesso!');

// Checagem real de conectividade na inicialização (o "configurado" acima
// só valida variáveis de ambiente; aqui testamos rede e tabela de verdade)
(async () => {
    try {
        const { error } = await supabase.from('profiles').select('whatsapp_number').limit(1);
        if (error) {
            if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
                console.error('❌ SUPABASE INACESSÍVEL: não consegui resolver/conectar em', supabaseUrl);
                console.error('   → Confira se a URL no .env está certa e se o projeto está ATIVO em supabase.com/dashboard');
            } else {
                console.error('⚠️ Supabase respondeu, mas com erro:', error.message);
            }
        } else {
            console.log('✅ Supabase acessível e tabela profiles OK');
        }
    } catch (e) {
        console.error('❌ Falha ao testar Supabase na inicialização:', e.message);
    }
})();
