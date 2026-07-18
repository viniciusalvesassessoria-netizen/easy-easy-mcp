import { getSupabase } from './supabase-client.js';
import type { NotificationRow, ToolContext } from './types.js';
import { ok, requireUserId, toolError } from './tool-shared.js';

export async function getNotifications(args: { limit: number }, context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const { data, error } = await getSupabase().from('notifications')
      .select('id,title,message,read,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(args.limit).returns<NotificationRow[]>();
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) { return toolError('get_notifications', error); }
}
