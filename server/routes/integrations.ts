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
  saveLeetCodeConnection,
  getLeetCodeConnection,
  deleteLeetCodeConnection,
  saveCodewarsConnection,
  getCodewarsConnection,
  deleteCodewarsConnection,
  saveStackOverflowConnection,
  getStackOverflowConnection,
  deleteStackOverflowConnection,
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

  const github = await getGitHubConnection(sessionId, user.id);
  const codeforces = await getCodeforcesConnection(sessionId, user.id);
  const leetcode = await getLeetCodeConnection(sessionId, user.id);
  const codewars = await getCodewarsConnection(sessionId, user.id);
  const stackoverflow = await getStackOverflowConnection(sessionId, user.id);

  res.json({
    github: github
      ? {
          connected: true,
          username: github.username,
          displayName: github.displayName,
          avatarUrl: github.avatarUrl,
          profileUrl: github.profileUrl,
          connectedAt: github.connectedAt,
          lastSyncedAt: github.lastSyncedAt,
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

    leetcode: leetcode
      ? {
          connected: true,
          handle: leetcode.handle,
          displayName: leetcode.displayName,
          avatarUrl: leetcode.avatarUrl,
          profileUrl: leetcode.profileUrl,
          connectedAt: leetcode.connectedAt,
        }
      : {
          connected: false,
        },

    codewars: codewars
      ? {
          connected: true,
          handle: codewars.handle,
          displayName: codewars.displayName,
          avatarUrl: codewars.avatarUrl,
          profileUrl: codewars.profileUrl,
          connectedAt: codewars.connectedAt,
        }
      : {
          connected: false,
        },

    stackoverflow: stackoverflow
      ? {
          connected: true,
          handle: stackoverflow.handle,
          displayName: stackoverflow.displayName,
          avatarUrl: stackoverflow.avatarUrl,
          profileUrl: stackoverflow.profileUrl,
          connectedAt: stackoverflow.connectedAt,
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
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
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
      const cfUser =
        await getCodeforcesUser(handle);

      await saveCodeforcesConnection(
        sessionId,
        {
          provider: 'codeforces',
          userId: user.id,
          handle: cfUser.handle,
          displayName:
            [cfUser.firstName, cfUser.lastName]
              .filter(Boolean)
              .join(' ') || null,
          avatarUrl:
            cfUser.avatar ?? null,
          profileUrl:
            `https://codeforces.com/profile/${encodeURIComponent(
              cfUser.handle
            )}`,
          connectedAt:
            new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        account: {
          handle: cfUser.handle,
          displayName:
            [cfUser.firstName, cfUser.lastName]
              .filter(Boolean)
              .join(' ') || null,
          avatarUrl:
            cfUser.avatar ?? null,
          profileUrl:
            `https://codeforces.com/profile/${encodeURIComponent(
              cfUser.handle
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
  async (req, res) => {
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    await deleteCodeforcesConnection(sessionId, user.id);

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
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
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

      await saveLeetCodeConnection(
        sessionId,
        {
          provider: 'leetcode',
          userId: user.id,
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          connectedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        account: {
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
        },
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
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
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

      await saveCodewarsConnection(
        sessionId,
        {
          provider: 'codewars',
          userId: user.id,
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          connectedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        account: {
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
        },
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
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
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

      await saveStackOverflowConnection(
        sessionId,
        {
          provider: 'stackoverflow',
          userId: user.id,
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
          connectedAt: new Date().toISOString(),
        }
      );

      res.json({
        success: true,
        account: {
          handle: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileUrl: profile.profileUrl,
        },
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
  async (req, res) => {
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    await deleteStackOverflowConnection(sessionId, user.id);

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
  async (req, res) => {
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    await deleteCodewarsConnection(sessionId, user.id);

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
  async (req, res) => {
    const user = await requireSupabaseUser(req, res);
    if (!user) return;
    const sessionId = requireSession(req, res);

    if (!sessionId) {
      return;
    }

    await deleteLeetCodeConnection(sessionId, user.id);

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