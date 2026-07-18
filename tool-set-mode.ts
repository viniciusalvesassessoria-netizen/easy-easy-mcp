import { getSupabase } from './supabase-client.js';
import type { ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function setMode(args: { mode: '1' | '2' }, context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const { error } = await getSupabase().from('user_preferences').upsert(
      { user_id: userId, mode: args.mode, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return ok({ success: true, current_mode: args.mode });
  } catch (error) { return toolError('set_mode', error); }
}
