import { getSupabase } from './supabase-client.js';
import type { LicenseRow, ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function getLicenseInfo(context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const supabase = getSupabase();
    const { data, error } = await supabase.from('licenses')
      .select('id,user_id,license_key,name,email,plan,expires_at,enabled,max_devices')
      .eq('user_id', userId).order('expires_at', { ascending: false }).limit(1).maybeSingle<LicenseRow>();
    if (error) throw error;
    if (!data) throw new Error('Licenca nao encontrada para o usuario');
    const { count, error: countError } = await supabase.from('activations')
      .select('id', { count: 'exact', head: true }).eq('license_id', data.id);
    if (countError) throw countError;
    return ok({ license_key: data.license_key, plan: data.plan, expires_at: data.expires_at, max_devices: data.max_devices, activated_devices: count ?? 0 });
  } catch (error) { return toolError('get_license_info', error); }
}
