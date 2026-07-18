import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

function sameToken(received: string, expected: string): boolean {
  const a = Buffer.from(received); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected) { res.status(503).json({ error: 'Server authentication is not configured' }); return; }
  const authorization = req.header('authorization') ?? '';
  const received = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!received || !sameToken(received, expected)) {
    res.setHeader('WWW-Authenticate', 'Bearer'); res.status(401).json({ error: 'Unauthorized' }); return;
  }
  next();
}
export function getRequestUserId(req: Request): string | undefined {
  return req.header('x-user-id')?.trim() || process.env.DEFAULT_USER_ID?.trim() || undefined;
}
