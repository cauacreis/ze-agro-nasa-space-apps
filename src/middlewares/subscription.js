import { supabase } from '../config/supabase.js';
import { createJsonStore } from '../services/opsStore.js';
import path from 'path';

const FREE_MONTHLY_QUOTA = 20;
const CYCLE_DAYS = 30;

// Quota local de emergência (data/quota_fallback.json, fora do git).
// Usada SOMENTE quando o Supabase está inacessível (rede/DNS/pausado).
// Mesma regra: 20/mês + 30 simples, nunca VIP.
const quotaLocal = createJsonStore(path.resolve('./data/quota_fallback.json'));

function isNetworkError(error) {
    const msg = String(error?.message || error || '').toLowerCase();
    return /fetch failed|enotfound|eai_again|econnreset|etimedout|network|socket|timeout|521|502|503|504|cloudflare|web server is down|<!doctype html/.test(msg);
}

/**
 * Atualiza campos de perfil no armazenamento local de contingência (usado quando o Supabase está inacessível).
 */
export function atualizarPerfilLocal(whatsappNumber, patch = {}) {
    if (!whatsappNumber || !patch || typeof patch !== 'object') return null;
    const agora = new Date();
    let reg = quotaLocal.list((r) => r.numero === whatsappNumber)[0];
    if (!reg) {
        reg = quotaLocal.add({
            numero: whatsappNumber,
            messages_used: 0,
            quota_reset_at: new Date(agora.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    const { notaAppend, ...rest } = patch;
    const finalPatch = { ...rest };
    if (notaAppend) {
        const anteriores = String(reg.notes || '').split('\n').filter(Boolean);
        finalPatch.notes = [...anteriores, `- ${notaAppend}`].slice(-10).join('\n');
    }
    return quotaLocal.update(reg.id, finalPatch);
}

export function obterIdiomaLocal(whatsappNumber) {
    if (!whatsappNumber) return null;
    const reg = quotaLocal.list((r) => r.numero === whatsappNumber)[0];
    return reg?.language || null;
}

/**
 * Remove os dados locais de perfil e cota do usuário (LGPD).
 */
export function limparPerfilLocal(whatsappNumber) {
    if (!whatsappNumber) return 0;
    return quotaLocal.removeByUser(whatsappNumber);
}

function checkLocalQuota(whatsappNumber, isNewLead = false) {
    const agora = new Date();
    let reg = quotaLocal.list((r) => r.numero === whatsappNumber)[0];
    if (!reg) {
        reg = quotaLocal.add({
            numero: whatsappNumber,
            messages_used: 0,
            quota_reset_at: new Date(agora.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString()
        });
        isNewLead = true;
    }
    if (reg.quota_reset_at && new Date(reg.quota_reset_at) <= agora) {
        const nextReset = new Date(agora.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString();
        quotaLocal.update(reg.id, { messages_used: 0, quota_reset_at: nextReset });
        reg = { ...reg, messages_used: 0, quota_reset_at: nextReset };
    }
    const used = reg.messages_used || 0;
    const base = {
        selectedCrop: reg.selected_crop || 'indefinido',
        userVariety: reg.crop_variety || 'indefinido',
        city: reg.city || null,
        notes: reg.notes || null,
        language: reg.language || null,
        isNew: isNewLead,
        offline: true
    };
    quotaLocal.update(reg.id, { messages_used: used + 1 });
    return { allowed: true, planType: 'free', degraded: false, remaining: Infinity, ...base };
}

export async function checkMessageLimit(whatsappNumber) {
  try {
    // A) Buscar o usuário na tabela profiles
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar perfil:', error.message);

      // Fallback de testes: Se a tabela não existir, libera acesso sem limite
      if (error.code === 'PGRST205') {
        console.log("⚠️ AVISO CRÍTICO: Tabela 'profiles' não encontrada no Supabase. MODO DE TESTE ATIVADO (acesso livre).");
        return { allowed: true, planType: 'free', selectedCrop: 'indefinido', userVariety: 'indefinido', degraded: false, remaining: Infinity };
      }

      // Supabase fora do ar (rede/DNS/projeto pausado): quota local, mesma regra, nunca VIP
      if (isNetworkError(error)) {
        console.log('⚠️ Supabase inacessível — usando quota local de emergência (low_ticket, sem VIP).');
        return checkLocalQuota(whatsappNumber);
      }

      return { allowed: false, reply: "🌾 Opa! Tivemos um problema no sistema. Tente novamente mais tarde." };
    }

    const regLocal = quotaLocal.list((r) => r.numero === whatsappNumber)[0] || null;
    const cropValido = (v) => v && !['indefinido', 'indefinida', 'não informada', 'nao informada', 'não informado', 'nao informado'].includes(String(v).trim().toLowerCase());

    // Se não existir, insere com o ciclo mensal começando agora (mesclando contingência local se houver)
    if (!profile) {
      const insertPayload = {
        whatsapp_number: whatsappNumber,
        quota_reset_at: regLocal?.quota_reset_at || new Date(Date.now() + CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString()
      };
      if (regLocal) {
        if (cropValido(regLocal.selected_crop)) insertPayload.selected_crop = regLocal.selected_crop;
        if (cropValido(regLocal.crop_variety)) insertPayload.crop_variety = regLocal.crop_variety;
        if (regLocal.city) insertPayload.city = regLocal.city;
        if (regLocal.notes) insertPayload.notes = regLocal.notes;
        if (Number(regLocal.messages_used) > 0) insertPayload.messages_used = Number(regLocal.messages_used);
      }
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([insertPayload])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar perfil:', insertError);
        return checkLocalQuota(whatsappNumber, true);
      }
      profile = newProfile;
      // Lead novo: dispara a sequência de boas-vindas no whatsapp.js
      var isNewLead = true;
    }

    // Sincroniza campos que tenham sido salvos no contingenciamento local enquanto o Supabase estava offline
    if (regLocal && profile) {
      const syncPatch = {};
      if (!cropValido(profile.selected_crop) && cropValido(regLocal.selected_crop)) {
        syncPatch.selected_crop = regLocal.selected_crop;
      }
      if (!cropValido(profile.crop_variety) && cropValido(regLocal.crop_variety)) {
        syncPatch.crop_variety = regLocal.crop_variety;
      }
      if (!profile.city && regLocal.city) {
        syncPatch.city = regLocal.city;
      }
      if (!profile.notes && regLocal.notes) {
        syncPatch.notes = regLocal.notes;
      }
      if (!profile.language && regLocal.language) {
        syncPatch.language = regLocal.language;
      }
      if (Object.keys(syncPatch).length > 0) {
        let { error: syncError } = await supabase
          .from('profiles')
          .update(syncPatch)
          .eq('whatsapp_number', whatsappNumber);
        if (syncError && syncPatch.language && ['PGRST204', '42703'].includes(syncError.code)) {
          const { language: _ignoredLang, ...semIdioma } = syncPatch;
          if (Object.keys(semIdioma).length > 0) {
            ({ error: syncError } = await supabase
              .from('profiles')
              .update(semIdioma)
              .eq('whatsapp_number', whatsappNumber));
          } else {
            syncError = null;
          }
        }
        if (!syncError) {
          profile = { ...profile, ...syncPatch };
        }
      }
    }

    // Mantém uma cópia espelho local atualizada para contingência
    if (profile) {
      const mirrorPatch = {};
      if (cropValido(profile.selected_crop)) mirrorPatch.selected_crop = profile.selected_crop;
      if (cropValido(profile.crop_variety)) mirrorPatch.crop_variety = profile.crop_variety;
      if (profile.city) mirrorPatch.city = profile.city;
      if (profile.notes) mirrorPatch.notes = profile.notes;
      if (profile.language && !regLocal?.language) mirrorPatch.language = profile.language;
      if (Object.keys(mirrorPatch).length > 0) {
        atualizarPerfilLocal(whatsappNumber, mirrorPatch);
      }
    }

    // B) Renovação do ciclo mensal: passou a data, zera a cota e abre novo ciclo
    if (profile.quota_reset_at && new Date(profile.quota_reset_at) <= new Date()) {
      const nextReset = new Date(Date.now() + CYCLE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { error: resetError } = await supabase
        .from('profiles')
        .update({ messages_used: 0, quota_reset_at: nextReset })
        .eq('whatsapp_number', whatsappNumber);

      if (!resetError) {
        console.log(`🔄 Ciclo mensal renovado para ${whatsappNumber} (próxima renovação: ${nextReset})`);
        profile.messages_used = 0;
        profile.quota_reset_at = nextReset;
      } else {
        console.error('Erro ao renovar ciclo:', resetError);
      }
    }

    const baseInfo = {
      selectedCrop: profile.selected_crop || 'indefinido',
      userVariety: profile.crop_variety || 'indefinido',
      city: profile.city || null,
      notes: profile.notes || null,
      language: regLocal?.language || profile.language || null,
      isNew: isNewLead === true
    };

    // C) Acesso liberado (sistema de cota mensal e VIP desativado)
    const used = profile.messages_used || 0;
    await supabase
      .from('profiles')
      .update({ messages_used: used + 1 })
      .eq('whatsapp_number', whatsappNumber);

    return {
      allowed: true,
      planType: profile.plan_type || 'free',
      degraded: false,
      remaining: Infinity,
      ...baseInfo
    };
  } catch (err) {
    console.error('Erro no middleware subscription:', err);
    if (isNetworkError(err)) {
      console.log('⚠️ Supabase inacessível (exceção) — usando quota local de emergência.');
      return checkLocalQuota(whatsappNumber);
    }
    return { allowed: false, reply: "🌾 Opa! Nosso sistema está passando por instabilidades. Retorne em breve." };
  }
}
