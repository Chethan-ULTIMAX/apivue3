import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../supabase';

/* ============================================================
 * APIVue application session
 *
 * PURPOSE
 * -------
 * This cookie is NOT an authentication mechanism. Supabase JWT
 * (Authorization: Bearer <token>) is the authentication mechanism.
 *
 * The session ID serves two narrow purposes:
 *
 *   1. OAuth CSRF state binding — the state issued at /connect is
 *      tied to this session, so a state cannot be replayed from a
 *      different browser.
 *
 *   2. Temporary per-browser identification during the OAuth dance
 *      (before Supabase auth is established in the callback).
 *
 * It MUST NOT be used to scope user data. Connections, profiles,
 * snapshots, and activity are ALWAYS keyed by `user_id` alone.
 * ============================================================ */

const SESSION_COOKIE = 'apivue_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

/** Per-request cache so downstream handlers read the same ID. */
const sessionIds = new WeakMap<Request, string>();

function isSecureRequest(req: Request): boolean {
  // `req.secure` is populated by Express when `trust proxy` is set
  // and an X-Forwarded-Proto header is present. The explicit header
  // check is defence in depth for environments that strip it.
  return (
    req.secure ||
    (req.headers['x-forwarded-proto'] ?? '').toString().split(',')[0].trim() ===
      'https'
  );
}

export function getSessionId(req: Request): string | null {
  return sessionIds.get(req) ?? req.cookies?.[SESSION_COOKIE] ?? null;
}

/**
 * Ensures every request has a session ID.
 *
 * Issues a new one via `Set-Cookie` if the request has none. Does NOT
 * authenticate the user — that is `requireSupabaseUser`'s job.
 */
export function ensureSession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let sessionId = getSessionId(req);

  if (!sessionId) {
    sessionId = crypto.randomBytes(32).toString('hex');

    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureRequest(req),
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });
  }

  sessionIds.set(req, sessionId);
  next();
}

/**
 * Clears the APIVue application session cookie.
 *
 * NOTE: This does not sign the user out of Supabase. The frontend is
 * responsible for calling `supabase.auth.signOut()` separately.
 */
export function clearSession(req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  sessionIds.delete(req);
}

/* ============================================================
 * Supabase user verification
 * ============================================================ */

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

/**
 * Verifies the Supabase access token on the request and returns the
 * authenticated user.
 *
 * On failure: sends a 401 response and returns `null`. Callers MUST
 * check for `null` and return early.
 */
export async function requireSupabaseUser(req: Request, res: Response) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      ok: false,
      error: 'Supabase authentication required.',
    });
    return null;
  }

  const match = authorization.match(BEARER_PATTERN);
  const token = match?.[1]?.trim();

  if (!token) {
    res.status(401).json({
      ok: false,
      error: 'Invalid Authorization header.',
    });
    return null;
  }

  const user = await getAuthenticatedUser(token);

  if (!user) {
    res.status(401).json({
      ok: false,
      error: 'Supabase session is invalid or expired.',
    });
    return null;
  }

  return user;
}