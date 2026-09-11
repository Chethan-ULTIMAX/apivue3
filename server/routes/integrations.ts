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
  getLeetCodeUserProfile,
} from '../integrations/leetcode';

import {
  getCodewarsUserProfile,
} from '../integrations/codewars';

import {
  getStackOverflowUserProfile,
} from '../integrations/stackoverflow';

import {
  getSessionId,
  requireSupabaseUser,
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
import { supabaseAdmin } from '../supabase';

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
router.get('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;
  const sessionId = requireSession(req, res);

  if (!sessionId) {
    return;
  }

  const { data: persistedGithub } = await supabaseAdmin
    .from('connected_accounts')
    .select('username, display_name, avatar_url, profile_url, connected_at, last_synced_at')
    .eq('user_id', user.id)
    .eq('provider', 'github')
    .maybeSingle();

  const github = getGitHubConnection(sessionId);

  const codeforces =
    getCodeforcesConnection(sessionId);

  res.json({
    github: persistedGithub || github
      ? {
          connected: true,
          username: persistedGithub?.username ?? github?.username,
          displayName: persistedGithub?.display_name ?? github?.displayName,
          avatarUrl: persistedGithub?.avatar_url ?? github?.avatarUrl,
          profileUrl: persistedGithub?.profile_url ?? github?.profileUrl,
          connectedAt: persistedGithub?.connected_at ?? github?.connectedAt,
          lastSyncedAt: persistedGithub?.last_synced_at,
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
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    try {
      const url =
        await createGitHubAuthorizationUrl(
          sessionId,
          user.id,
        );

      res.json({ url });
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
        userId: pending.userId,
        providerUserId: user.id,
        username: user.login,
        displayName: user.name,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
        accessToken,
        connectedAt:
          new Date().toISOString(),
      });

      const { error: accountError } = await supabaseAdmin
        .from('connected_accounts')
        .upsert({
          user_id: pending.userId,
          provider: 'github',
          provider_user_id: String(user.id),
          username: user.login,
          display_name: user.name,
          avatar_url: user.avatar_url,
          profile_url: user.html_url,
          metadata: { access: 'oauth', scope: 'read:user' },
          connected_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' });
      if (accountError) throw new Error('Could not persist GitHub connection.');

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
  async (req, res) => {
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    deleteGitHubConnection(sessionId);
    await supabaseAdmin.from('connected_accounts').delete().eq('user_id', user.id).eq('provider', 'github');

    res.json({
      success: true,
    });
  }
);

router.post('/github/sync', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;
  const sessionId = requireSession(req, res);
  if (!sessionId) return;
  const connection = getGitHubConnection(sessionId);
  if (!connection || connection.userId !== user.id) {
    res.status(409).json({ error: 'GitHub must be connected again before syncing.' });
    return;
  }
  try {
    const profile = await getGitHubUser(connection.accessToken);
    const syncedAt = new Date().toISOString();
    const normalized = {
      platform: 'github',
      handle: profile.login,
      displayName: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      bio: profile.bio,
      location: null,
      joinedAt: null,
      metrics: [
        { key: 'public_repos', label: 'Public repositories', value: profile.public_repos, format: 'number' },
        { key: 'followers', label: 'Followers', value: profile.followers, format: 'number' },
        { key: 'following', label: 'Following', value: profile.following, format: 'number' },
      ],
      breakdowns: [],
      ratingHistory: [],
      activity: [],
      highlights: [],
      fetchedAt: syncedAt,
    };
    const { data: tracked, error: trackedError } = await supabaseAdmin.from('tracked_profiles').upsert({
      user_id: user.id,
      platform: 'github',
      handle: profile.login,
      display_name: normalized.displayName,
      avatar_url: normalized.avatarUrl,
      profile_url: normalized.profileUrl,
      data: normalized,
      sync_error: null,
      last_synced_at: syncedAt,
    }, { onConflict: 'user_id,platform,handle' }).select('id').single();
    if (trackedError || !tracked) throw new Error('Could not save GitHub profile history.');
    const { error: snapshotError } = await supabaseAdmin.from('profile_snapshots').insert({
      profile_id: tracked.id,
      user_id: user.id,
      captured_at: syncedAt,
      metrics: Object.fromEntries(normalized.metrics.map((metric) => [metric.key, metric.value])),
    });
    if (snapshotError) throw new Error('Could not save GitHub history snapshot.');
    const { error } = await supabaseAdmin.from('connected_accounts').update({
      username: profile.login,
      display_name: profile.name,
      avatar_url: profile.avatar_url,
      profile_url: profile.html_url,
      last_synced_at: syncedAt,
    }).eq('user_id', user.id).eq('provider', 'github');
    if (error) throw new Error('Could not save GitHub sync metadata.');
    res.json({ syncedAt, username: profile.login });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'GitHub sync failed.' });
  }
});

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

/**
 * POST /api/integrations/leetcode/connect
 * LeetCode connection verifies the supplied public handle.
 */
router.post(
  '/leetcode/connect',
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
          'LeetCode handle is required.',
      });

      return;
    }

    try {
      const profile = await getLeetCodeUserProfile(handle);

      res.json({
        success: true,
        profile,
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect LeetCode.',
      });
    }
  }
);

/**
 * POST /api/integrations/codewars/connect
 * Codewars connection verifies the supplied public handle.
 */
router.post(
  '/codewars/connect',
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
          'Codewars handle is required.',
      });

      return;
    }

    try {
      const profile = await getCodewarsUserProfile(handle);

      res.json({
        success: true,
        profile,
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect Codewars.',
      });
    }
  }
);

/**
 * POST /api/integrations/stackoverflow/connect
 * StackOverflow connection verifies the supplied numeric user ID.
 */
router.post(
  '/stackoverflow/connect',
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
          'Stack Overflow user ID is required.',
      });

      return;
    }

    try {
      const profile = await getStackOverflowUserProfile(handle);

      res.json({
        success: true,
        profile,
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect Stack Overflow.',
      });
    }
  }
);

/**
 * POST /api/integrations/stackoverflow/disconnect
 */
router.post(
  '/stackoverflow/disconnect',
  (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    res.json({
      success: true,
    });
  }
);

/**
 * POST /api/integrations/codewars/disconnect
 */
router.post(
  '/codewars/disconnect',
  (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    res.json({
      success: true,
    });
  }
);

/**
 * POST /api/integrations/leetcode/disconnect
 */
router.post(
  '/leetcode/disconnect',
  (req, res) => {
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    res.json({
      success: true,
    });
  }
);

/**
 * GET /api/integrations/status
 * Returns connection status for all platforms
 */
router.get('/status', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const { data: connectedAccounts } = await supabaseAdmin
    .from('connected_accounts')
    .select('provider, username, display_name, avatar_url, profile_url, connected_at, last_synced_at')
    .eq('user_id', user.id);

  const status = {
    github: connectedAccounts?.filter((acc: any) => acc.provider === 'github')[0] ?? null,
    codeforces: connectedAccounts?.filter((acc: any) => acc.provider === 'codeforces')[0] ?? null,
    leetcode: connectedAccounts?.filter((acc: any) => acc.provider === 'leetcode')[0] ?? null,
    codewars: connectedAccounts?.filter((acc: any) => acc.provider === 'codewars')[0] ?? null,
    stackoverflow: connectedAccounts?.filter((acc: any) => acc.provider === 'stackoverflow')[0] ?? null,
  };

  res.json({
    connected: Object.fromEntries(
      Object.entries(status).map(([key, value]) => [
        key,
        value !== null,
      ])
    ),
    accounts: status,
  });
});

export default router;