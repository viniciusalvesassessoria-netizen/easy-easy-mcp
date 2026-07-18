import { getSupabase } from './supabase-client.js';
import type { ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function blockChat(args: { blocked: boolean; user_id?: string }, context: ToolContext) {
  try {
    const userId = requireUserId(args.user_id?.trim() || context.authenticatedUserId);
    const { error } = await getSupabase().from('user_preferences').upsert(
      { user_id: userId, chat_blocked: args.blocked, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
    return ok({ success: true, message: args.blocked ? 'Chat bloqueado com sucesso.' : 'Chat desbloqueado com sucesso.' });
  } catch (error) { return toolError('block_chat', error); }
}
