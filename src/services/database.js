import { supabase } from '../config/supabase.js';
import { atualizarPerfilLocal, limparPerfilLocal, obterIdiomaLocal } from '../middlewares/subscription.js';

export async function salvarCulturaEVariedade(whatsappNumber, cultura, variedade) {
    const updateData = { selected_crop: cultura };
    const varTrim = String(variedade || '').trim();
    const varNorm = varTrim.toLowerCase();
    const VARIEDADE_IGNORAR = new Set(['', 'indefinido', 'indefinida', 'não informada', 'nao informada', 'não informado', 'nao informado', 'n/a', 'nenhuma', 'nenhum']);
    if (varTrim && !VARIEDADE_IGNORAR.has(varNorm)) {
        updateData.crop_variety = varTrim;
    }
    try { atualizarPerfilLocal(whatsappNumber, updateData); } catch {}

    try {
        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('whatsapp_number', whatsappNumber);

        if (error) {
            console.error("Erro ao salvar cultura no banco:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Exceção ao salvar cultura:", err);
        return false;
    }
}

export async function salvarCidade(whatsappNumber, cidade) {
    try { atualizarPerfilLocal(whatsappNumber, { city: cidade }); } catch {}

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ city: cidade })
            .eq('whatsapp_number', whatsappNumber);

        if (error) {
            console.error("Erro ao salvar cidade no banco:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Exceção ao salvar cidade:", err);
        return false;
    }
}

export async function salvarIdioma(whatsappNumber, language) {
    if (!whatsappNumber || !language) return false;
    try { atualizarPerfilLocal(whatsappNumber, { language }); } catch {}

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ language })
            .eq('whatsapp_number', whatsappNumber);

        // Se a coluna 'language' ainda não existir no Supabase, mantém persistência local silenciosamente
        if (error && !['PGRST204', '42703'].includes(error.code)) {
            console.error("Erro ao salvar idioma no banco:", error);
            return false;
        }
        return !error;
    } catch {
        return false;
    }
}

// Memória de longo prazo: anotações acumuladas sobre a lavoura do produtor
export async function salvarNota(whatsappNumber, nota) {
    try { atualizarPerfilLocal(whatsappNumber, { notaAppend: nota }); } catch {}

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('notes')
            .eq('whatsapp_number', whatsappNumber)
            .maybeSingle();

        // Mantém só as 10 anotações mais recentes (economia de tokens no prompt)
        const anteriores = (profile?.notes || '').split('\n').filter(Boolean);
        const atualizadas = [...anteriores, `- ${nota}`].slice(-10).join('\n');

        const { error } = await supabase
            .from('profiles')
            .update({ notes: atualizadas })
            .eq('whatsapp_number', whatsappNumber);

        if (error) {
            console.error("Erro ao salvar nota no banco:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Exceção ao salvar nota:", err);
        return false;
    }
}

export async function setProactiveOptin(whatsappNumber, optin) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ proactive_optin: optin })
            .eq('whatsapp_number', whatsappNumber);

        if (error) {
            console.error("Erro ao salvar opt-in no banco:", error);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Exceção ao salvar opt-in:", err);
        return false;
    }
}

// Apaga o perfil do próprio usuário (autoatendimento de privacidade)
export async function apagarPerfil(whatsappNumber) {
    try { limparPerfilLocal(whatsappNumber); } catch {}

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('whatsapp_number', whatsappNumber);

        if (error) {
            console.error("Erro ao apagar perfil no banco:", error);
            return { ok: false, erro: error.message };
        }
        return { ok: true };
    } catch (err) {
        console.error("Exceção ao apagar perfil:", err);
        return { ok: false, erro: err.message };
    }
}

// Lista de usuários que pediram aviso diário e têm cidade registrada
export async function listarUsuariosProativos() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('whatsapp_number, city, selected_crop')
            .eq('proactive_optin', true)
            .not('city', 'is', null);

        if (error) {
            console.error("Erro ao listar usuários proativos:", error);
            return [];
        }
        return (data || []).map((u) => ({
            ...u,
            language: u.language || obterIdiomaLocal(u.whatsapp_number) || null
        }));
    } catch (err) {
        console.error("Exceção ao listar usuários proativos:", err);
        return [];
    }
}
