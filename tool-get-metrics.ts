import { getSupabase } from './supabase-client.js';
import type { MetricRow, ToolContext } from './types.js';
import { formatCurrency, formatOnline, ok, requireUserId, toolError } from './tool-shared.js';

export async function getMetrics(context: ToolContext) {
  try {
    const userId = requireUserId(context.authenticatedUserId);
    const { data, error } = await getSupabase().from('metrics')
      .select('ganhos_hoje,corridas,avaliacao,online_minutes').eq('user_id', userId)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle<MetricRow>();
    if (error) throw error;
    if (!data) throw new Error('Metricas nao encontradas para o usuario');
    return ok({ ganhos_hoje: formatCurrency(data.ganhos_hoje), corridas: data.corridas, avaliacao: data.avaliacao, online: formatOnline(data.online_minutes) });
  } catch (error) { return toolError('get_metrics', error); }
}
