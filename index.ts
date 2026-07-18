import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authMiddleware, getRequestUserId } from './auth-middleware.js';
import { createMcpServer } from './mcp-server.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'easy-easy-mcp', version: '1.0.0' });
});

app.use('/mcp', authMiddleware);

app.post('/mcp', async (req: Request, res: Response) => {
  const server = createMcpServer({ authenticatedUserId: getRequestUserId(req) });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[mcp_request]', error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});

function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed in stateless mode' }, id: null });
}
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('[http_error]', error);
  if (!res.headersSent) res.status(400).json({ error: 'Invalid request' });
});

const port = Number(process.env.PORT ?? 3000);
const httpServer = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Easy&EASY MCP Server rodando em http://localhost:${port}`);
  console.log(`📡 Endpoint MCP: http://localhost:${port}/mcp`);
  console.log(`💚 Health: http://localhost:${port}/health`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received; shutting down`);
  httpServer.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
