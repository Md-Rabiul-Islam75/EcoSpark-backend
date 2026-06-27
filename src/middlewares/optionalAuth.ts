import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, role: payload.role as any, email: '' };
  } catch {
    // Ignore invalid optional auth tokens.
  }

  next();
};
