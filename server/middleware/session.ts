import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getAuthenticatedUser } from '../supabase';

const SESSION_COOKIE = 'apivue_session';
const sessionIds = new WeakMap<Request, string>();

export function getSessionId(
  req: Request
): string | null {
  return sessionIds.get(req) ?? req.cookies?.[SESSION_COOKIE] ?? null;
}

export async function requireSupabaseUser(req: Request, res: Response) {
  const header = req.headers.authorization ?? '';
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: 'Supabase authentication required.' });
    return null;
  }
  const user = await getAuthenticatedUser(token);
  if (!user) {
    res.status(401).json({ error: 'Supabase session is invalid or expired.' });
    return null;
  }
  return user;
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

  sessionIds.set(req, sessionId);

  next();
}