import { getSupabase } from './supabase-client.js';
import type { LicenseRow, ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function getUserInfo(context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const { data, error } = await getSupabase().from('licenses')
      .select('id,user_id,license_key,name,email,plan,expires_at,enabled,max_devices')
      .eq('user_id', userId).order('expires_at', { ascending: false }).limit(1).maybeSingle<LicenseRow>();
    if (error) throw error;
    if (!data) throw new Error('Licenca nao encontrada para o usuario');
    return ok({ id: data.user_id, name: data.name, email: data.email, plan: data.plan, validade: data.expires_at, enabled: data.enabled });
  } catch (error) { return toolError('get_user_info', error); }
}
