import type { NextFunction, Request, Response } from 'express';
import type { AuthService, AuthUser } from './services/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function attachAuth(auth: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    req.user = (await auth.verifyIdToken(token)) ?? undefined;
    next();
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    const traceId = (req.headers['x-trace-id'] as string | undefined) ?? 'n/a';
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required', traceId } });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    if (!roles.some(r => req.user!.roles.includes(r))) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}
