import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { blockChat } from './tool-block-chat.js';
import { getLicenseInfo } from './tool-get-license.js';
import { getMetrics } from './tool-get-metrics.js';
import { getNotifications } from './tool-get-notifications.js';
import { getUserInfo } from './tool-get-user-info.js';
import { setEnabled } from './tool-set-enabled.js';
import { setMode } from './tool-set-mode.js';
import { toggleValidity } from './tool-toggle-validity.js';
import type { ToolContext } from './types.js';

export function createMcpServer(context: ToolContext): McpServer {
  const server = new McpServer({ name: 'Easy&EASY MCP Server', version: '1.0.0' });

  server.registerTool('block_chat', {
    description: 'Bloqueia ou desbloqueia o chat do Lovable para o usuario atual.',
    inputSchema: {
      blocked: z.boolean().describe('true para bloquear; false para desbloquear'),
      user_id: z.string().min(1).optional().describe('Usuario alvo; por padrao usa o usuario autenticado'),
    },
  }, (args) => blockChat(args, context));

  server.registerTool('get_metrics', {
    description: 'Obtem ganhos, corridas, avaliacao e tempo online atuais.',
  }, () => getMetrics(context));

  server.registerTool('get_user_info', {
    description: 'Retorna informacoes do usuario autenticado e de seu plano.',
  }, () => getUserInfo(context));

  server.registerTool('set_mode', {
    description: 'Altera o modo de operacao da extensao.',
    inputSchema: { mode: z.enum(['1', '2']).describe('1 = padrao; 2 = avancado') },
  }, (args) => setMode(args, context));

  server.registerTool('set_enabled', {
    description: 'Ativa ou desativa a extensao para o usuario.',
    inputSchema: { enabled: z.boolean() },
  }, (args) => setEnabled(args, context));

  server.registerTool('toggle_validity_display', {
    description: 'Mostra ou oculta o countdown de validade na interface.',
    inputSchema: { show: z.boolean() },
  }, (args) => toggleValidity(args, context));

  server.registerTool('get_license_info', {
    description: 'Retorna plano, validade e uso de dispositivos da licenca.',
  }, () => getLicenseInfo(context));

  server.registerTool('get_notifications', {
    description: 'Lista as notificacoes mais recentes do usuario.',
    inputSchema: { limit: z.number().int().min(1).max(100).default(5).describe('Quantidade de notificacoes') },
  }, (args) => getNotifications(args, context));

  return server;
}
