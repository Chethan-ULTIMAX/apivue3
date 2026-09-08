import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const SESSION_COOKIE = 'apivue_session';

export function getSessionId(
  req: Request
): string | null {
  return req.cookies?.[SESSION_COOKIE] ?? null;
}

export function ensureSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let sessionId = getSessionId(req);

  if (!sessionId) {
    sessionId = crypto.randomBytes(32).toString('hex');

    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }

  next();
}