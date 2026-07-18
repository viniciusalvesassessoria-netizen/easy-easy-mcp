import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export function requireUserId(userId?: string): string {
  if (!userId) throw new Error('Usuario nao identificado. Envie X-User-Id ou configure DEFAULT_USER_ID.');
  return userId;
}
export function ok(data: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> };
}
export function toolError(toolName: string, error: unknown): CallToolResult {
  console.error(`[${toolName}]`, error);
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Erro inesperado';
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ success: false, message }) }] };
}
export function formatCurrency(value: number | string): string {
  if (typeof value === 'string' && value.trim().startsWith('R$')) return value;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
}
export function formatOnline(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}h ${String(safe % 60).padStart(2, '0')}m`;
}
