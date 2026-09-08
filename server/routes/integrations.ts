import {
  Router,
  type Request,
  type Response,
} from 'express';

import {
  createGitHubAuthorizationUrl,
  consumeGitHubState,
  exchangeGitHubCode,
  getGitHubUser,
} from '../integrations/github';

import {
  getCodeforcesUser,
} from '../integrations/codeforces';

import {
  getSessionId,
} from '../middleware/session';

import {
  saveGitHubConnection,
  getGitHubConnection,
  deleteGitHubConnection,
  saveCodeforcesConnection,
  getCodeforcesConnection,
  deleteCodeforcesConnection,
} from '../storage/connections';

import { env } from '../env';

const router = Router();

function requireSession(
  req: Request,
  res: Response
) {
  const sessionId = getSessionId(req);

  if (!sessionId) {
    res.status(401).json({
      error: 'Session not found.',
    });

    return null;
  }

  return sessionId;
};

/**
 * GET /api/integrations
 *
 * Returns the currently connected platforms.
 */
router.get('/', (req, res) => {
  const sessionId = requireSession(req, res);

  if (!sessionId) {
    return;
  }

  const github =
    getGitHubConnection(sessionId);

  const codeforces =
    getCodeforcesConnection(sessionId);

  res.json({
    github: github
      ? {
          connected: true,
          username: github.username,
          displayName: github.displayName,
          avatarUrl: github.avatarUrl,
          profileUrl: github.profileUrl,
          connectedAt: github.connectedAt,
        }
      : {
          connected: false,
        },

    codeforces: codeforces
      ? {
          connected: true,
          handle: codeforces.handle,
          displayName: codeforces.displayName,
          avatarUrl: codeforces.avatarUrl,
          profileUrl: codeforces.profileUrl,
          connectedAt: codeforces.connectedAt,
        }
      : {
          connected: false,
        },
  });
});

/**
 * GET /api/integrations/github/connect
 *
 * Starts GitHub OAuth.
 */
router.get(
  '/github/connect',
  async (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    try {
      const url =
        await createGitHubAuthorizationUrl(
          sessionId
        );

      res.redirect(url);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          'Unable to start GitHub authorization.',
      });
    }
  }
);

/**
 * GET /api/integrations/github/callback
 *
 * GitHub redirects here after authorization.
 */
router.get(
  '/github/callback',
  async (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    const code =
      typeof req.query.code === 'string'
        ? req.query.code
        : null;

    const state =
      typeof req.query.state === 'string'
        ? req.query.state
        : null;

    if (!code || !state) {
      res.redirect(
        `${env.clientUrl}/dashboard/integrations?error=github_authorization_failed`
      );

      return;
    }

    try {
      const pending =
        consumeGitHubState(
          state,
          sessionId
        );

      if (!pending) {
        res.redirect(
          `${env.clientUrl}/dashboard/integrations?error=invalid_oauth_state`
        );

        return;
      }

      const accessToken =
        await exchangeGitHubCode(
          code,
          pending.codeVerifier
        );

      const user =
        await getGitHubUser(accessToken);

      saveGitHubConnection(sessionId, {
        provider: 'github',
        providerUserId: user.id,
        username: user.login,
        displayName: user.name,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
        accessToken,
        connectedAt:
          new Date().toISOString(),
      });

      res.redirect(
        `${env.clientUrl}/dashboard/integrations?connected=github`
      );
    } catch (error) {
      console.error(error);

      res.redirect(
        `${env.clientUrl}/dashboard/integrations?error=github_connection_failed`
      );
    }
  }
);

/**
 * POST /api/integrations/github/disconnect
 */
router.post(
  '/github/disconnect',
  (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    deleteGitHubConnection(sessionId);

    res.json({
      success: true,
    });
  }
);

/**
 * POST /api/integrations/codeforces/connect
 *
 * Codeforces connection currently verifies
 * the supplied public handle.
 */
router.post(
  '/codeforces/connect',
  async (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    const handle =
      typeof req.body?.handle === 'string'
        ? req.body.handle.trim()
        : '';

    if (!handle) {
      res.status(400).json({
        error:
          'Codeforces handle is required.',
      });

      return;
    }

    try {
      const user =
        await getCodeforcesUser(handle);

      saveCodeforcesConnection(
        sessionId,
        {
          provider: 'codeforces',
          handle: user.handle,
          displayName:
            [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || null,
          avatarUrl:
            user.avatar ?? null,
          profileUrl:
            `https://codeforces.com/profile/${encodeURIComponent(
              user.handle
            )}`,
          connectedAt:
            new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        account: {
          handle: user.handle,
          displayName:
            [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || null,
          avatarUrl:
            user.avatar ?? null,
          profileUrl:
            `https://codeforces.com/profile/${encodeURIComponent(
              user.handle
            )}`,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect Codeforces.',
      });
    }
  }
);

/**
 * POST /api/integrations/codeforces/disconnect
 */
router.post(
  '/codeforces/disconnect',
  (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    deleteCodeforcesConnection(sessionId);

    res.json({
      success: true,
    });
  }
);

export default router;