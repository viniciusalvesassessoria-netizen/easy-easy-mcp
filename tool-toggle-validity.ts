import { getSupabase } from './supabase-client.js';
import type { ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function toggleValidity(args: { show: boolean }, context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const { error } = await getSupabase().from('user_preferences').upsert(
      { user_id: userId, show_validity: args.show, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return ok({ success: true });
  } catch (error) { return toolError('toggle_validity_display', error); }
}
