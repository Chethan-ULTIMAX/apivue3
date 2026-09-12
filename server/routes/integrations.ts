import { Router, type Request, type Response } from 'express';

import {
  createGitHubAuthorizationUrl,
  consumeGitHubState,
  exchangeGitHubCode,
  getGitHubUser,
  getGitHubRepositories,
} from '../integrations/github';

import { getCodeforcesUser } from '../integrations/codeforces';
import { getLeetCodeUserProfile } from '../integrations/leetcode';
import { getCodewarsUserProfile } from '../integrations/codewars';
import { getStackOverflowUserProfile } from '../integrations/stackoverflow';

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

/* ==========================================================================
 * Helpers
 * ========================================================================== */

function requireSession(req: Request, res: Response): string | null {
  const sessionId = getSessionId(req);

  if (!sessionId) {
    res.status(401).json({
      ok: false,
      error: 'APIVue session not found.',
    });
    return null;
  }

  return sessionId;
}

function getStringBodyValue(req: Request, key: string): string {
  const value = req.body?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function buildCodeforcesProfileUrl(handle: string): string {
  return `https://codeforces.com/profile/${encodeURIComponent(handle)}`;
}

/**
 * Redirect the user back to the Integrations page with a query
 * parameter that the frontend can surface as a toast.
 */
function redirectToIntegrations(
  res: Response,
  params: Record<string, string>,
): void {
  const search = new URLSearchParams(params).toString();
  const base = `${env.clientUrl}/dashboard/integrations`;
  res.redirect(search ? `${base}?${search}` : base);
}

/* ==========================================================================
 * GET /api/integrations
 *
 * Returns the connected-account status for every supported platform.
 * Shape matches the frontend `IntegrationStatus` type.
 * ========================================================================== */

router.get('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    const [
      github,
      codeforces,
      leetcode,
      codewars,
      stackoverflow,
    ] = await Promise.all([
      getGitHubConnection(sessionId, user.id),
      getCodeforcesConnection(sessionId, user.id),
      getLeetCodeConnection(sessionId, user.id),
      getCodewarsConnection(sessionId, user.id),
      getStackOverflowConnection(sessionId, user.id),
    ]);

    res.status(200).json({
      github: github
        ? {
            connected: true,
            username: github.username,
            displayName: github.displayName,
            avatarUrl: github.avatarUrl,
            profileUrl: github.profileUrl,
            connectedAt: github.connectedAt,
          }
        : { connected: false },

      codeforces: codeforces
        ? {
            connected: true,
            handle: codeforces.handle,
            displayName: codeforces.displayName,
            avatarUrl: codeforces.avatarUrl,
            profileUrl: codeforces.profileUrl,
            connectedAt: codeforces.connectedAt,
          }
        : { connected: false },

      leetcode: leetcode
        ? {
            connected: true,
            handle: leetcode.handle,
            displayName: leetcode.displayName,
            avatarUrl: leetcode.avatarUrl,
            profileUrl: leetcode.profileUrl,
            connectedAt: leetcode.connectedAt,
          }
        : { connected: false },

      codewars: codewars
        ? {
            connected: true,
            handle: codewars.handle,
            displayName: codewars.displayName,
            avatarUrl: codewars.avatarUrl,
            profileUrl: codewars.profileUrl,
            connectedAt: codewars.connectedAt,
          }
        : { connected: false },

      stackoverflow: stackoverflow
        ? {
            connected: true,
            handle: stackoverflow.handle,
            displayName: stackoverflow.displayName,
            avatarUrl: stackoverflow.avatarUrl,
            profileUrl: stackoverflow.profileUrl,
            connectedAt: stackoverflow.connectedAt,
          }
        : { connected: false },
    });
  } catch (error) {
    console.error('[integrations] GET / failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to load integration status.',
    });
  }
});

/* ==========================================================================
 * GET /api/integrations/github/connect
 *
 * Returns the GitHub OAuth authorization URL. The frontend redirects
 * the browser to it.
 * ========================================================================== */

router.get('/github/connect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    const authorizationUrl = await createGitHubAuthorizationUrl(
      sessionId,
      user.id,
    );

    res.status(200).json({
      ok: true,
      url: authorizationUrl,
    });
  } catch (error) {
    console.error('[integrations] GitHub connect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to start GitHub authorization.',
    });
  }
});

/* ==========================================================================
 * GET /api/integrations/github/callback
 *
 * GitHub redirects here after the user authorizes the app.
 *
 * Flow:
 *   1. Verify state matches a pending request from this session.
 *   2. Exchange the authorization code for an access token.
 *   3. Fetch the GitHub user profile.
 *   4. Persist the connection server-side (token NEVER reaches the client).
 *   5. Persist a token-free record in `connected_accounts` for the UI.
 *   6. Redirect back to the frontend with a status marker.
 * ========================================================================== */

router.get('/github/callback', async (req, res) => {
  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  const code =
    typeof req.query.code === 'string' ? req.query.code.trim() : '';
  const state =
    typeof req.query.state === 'string' ? req.query.state.trim() : '';
  const oauthError =
    typeof req.query.error === 'string' ? req.query.error : '';

  if (oauthError) {
    redirectToIntegrations(res, { error: 'github_authorization_denied' });
    return;
  }

  if (!code || !state) {
    redirectToIntegrations(res, { error: 'github_authorization_failed' });
    return;
  }

  try {
    const pending = consumeGitHubState(state, sessionId);

    if (!pending) {
      redirectToIntegrations(res, { error: 'invalid_oauth_state' });
      return;
    }

    const accessToken = await exchangeGitHubCode(code, pending.codeVerifier);
    const githubUser = await getGitHubUser(accessToken);
    const connectedAt = new Date().toISOString();

    /*
     * Save the server-side GitHub connection (including the access
     * token). The token must NEVER be returned to the browser.
     */
    await saveGitHubConnection(sessionId, {
      provider: 'github',
      userId: pending.userId,
      providerUserId: githubUser.id,
      username: githubUser.login,
      displayName: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      profileUrl: githubUser.html_url,
      accessToken,
      connectedAt,
    });

    /*
     * Keep a token-free record in `connected_accounts` so the UI can
     * render the connection without ever touching secrets.
     */
    const { error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .upsert(
        {
          user_id: pending.userId,
          provider: 'github',
          provider_user_id: String(githubUser.id),
          username: githubUser.login,
          display_name: githubUser.name,
          avatar_url: githubUser.avatar_url,
          profile_url: githubUser.html_url,
          metadata: {
            access: 'oauth',
            scope: 'read:user',
          },
          connected_at: connectedAt,
          last_synced_at: connectedAt,
        },
        { onConflict: 'user_id,provider' },
      );

    if (accountError) {
      console.error(
        '[integrations] connected_accounts upsert failed:',
        accountError,
      );
      throw new Error('Could not persist GitHub connection.');
    }

    redirectToIntegrations(res, { connected: 'github' });
  } catch (error) {
    console.error('[integrations] GitHub callback failed:', error);
    redirectToIntegrations(res, { error: 'github_connection_failed' });
  }
});

/* ==========================================================================
 * POST /api/integrations/github/sync
 *
 * Pulls the connected GitHub user's profile AND repositories, builds a
 * normalized payload that matches the public-data layer, and stores a
 * new profile snapshot.
 *
 * The frontend's profile detail and progress views will then render
 * the enriched data alongside public Explore profiles.
 * ========================================================================== */

router.post('/github/sync', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    const connection = await getGitHubConnection(sessionId, user.id);

    if (!connection || connection.userId !== user.id) {
      res.status(409).json({
        ok: false,
        error: 'GitHub must be connected before syncing.',
      });
      return;
    }

    if (!connection.accessToken) {
      res.status(409).json({
        ok: false,
        error:
          'GitHub authorization is unavailable. Please reconnect GitHub.',
      });
      return;
    }

    /* --------------------------------------------------------------
     * Fetch profile + repositories in parallel. Repositories are
     * best-effort: a failure there should not block the whole sync.
     * -------------------------------------------------------------- */

    const [profile, repos] = await Promise.all([
      getGitHubUser(connection.accessToken),
      getGitHubRepositories(connection.accessToken).catch((error) => {
        console.warn(
          '[integrations] GitHub repositories fetch failed:',
          error,
        );
        return [];
      }),
    ]);

    const syncedAt = new Date().toISOString();

    /* --------------------------------------------------------------
     * Derive real aggregates from the fetched repository list.
     * Nothing here is estimated — every value comes from GitHub.
     * -------------------------------------------------------------- */

    const originals = repos.filter(
      (r) => !r.fork && !r.archived && !r.disabled,
    );

    const totalStars = originals.reduce(
      (sum, r) => sum + r.stargazers_count,
      0,
    );
    const totalForks = originals.reduce(
      (sum, r) => sum + r.forks_count,
      0,
    );
    const openIssues = originals.reduce(
      (sum, r) => sum + r.open_issues_count,
      0,
    );

    const languageCounts = new Map<string, number>();
    for (const repo of originals) {
      if (!repo.language) continue;
      languageCounts.set(
        repo.language,
        (languageCounts.get(repo.language) ?? 0) + 1,
      );
    }
    const languageTotal = Array.from(languageCounts.values()).reduce(
      (a, b) => a + b,
      0,
    );

    const languageBreakdown = Array.from(languageCounts.entries())
      .map(([label, value]) => ({
        label,
        value,
        percentage:
          languageTotal > 0
            ? Math.round((value / languageTotal) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const topRepos = originals
      .slice()
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        openIssues: r.open_issues_count,
        isFork: r.fork,
        isArchived: r.archived,
        topics: r.topics ?? [],
        updatedAt: r.pushed_at ?? r.updated_at,
      }));

    /* --------------------------------------------------------------
     * Normalized payload — matches the shape the frontend already
     * uses for public Explore profiles.
     * -------------------------------------------------------------- */

    const normalized = {
      platform: 'github' as const,
      handle: profile.login,
      displayName: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      bio: profile.bio,
      location: profile.location,
      joinedAt: profile.created_at,

      metrics: [
        {
          key: 'public_repos',
          label: 'Public repositories',
          value: profile.public_repos,
          format: 'number',
        },
        {
          key: 'followers',
          label: 'Followers',
          value: profile.followers,
          format: 'number',
        },
        {
          key: 'following',
          label: 'Following',
          value: profile.following,
          format: 'number',
        },
        {
          key: 'public_gists',
          label: 'Public gists',
          value: profile.public_gists,
          format: 'number',
        },
        {
          key: 'total_stars',
          label: 'Total stars',
          value: totalStars,
          format: 'number',
        },
        {
          key: 'total_forks',
          label: 'Total forks',
          value: totalForks,
          format: 'number',
        },
        {
          key: 'open_issues',
          label: 'Open issues',
          value: openIssues,
          format: 'number',
        },
        {
          key: 'original_repos',
          label: 'Original repositories',
          value: originals.length,
          format: 'number',
        },
      ],

      breakdowns: [
        {
          key: 'languages',
          label: 'Languages',
          items: languageBreakdown,
        },
      ],

      repositories: topRepos,
      ratingHistory: [],
      activity: [],
      highlights: [],
      fetchedAt: syncedAt,
    };

    /* --------------------------------------------------------------
     * Persist tracked profile.
     * -------------------------------------------------------------- */

    const { data: trackedProfile, error: trackedError } = await supabaseAdmin
      .from('tracked_profiles')
      .upsert(
        {
          user_id: user.id,
          platform: 'github',
          handle: profile.login,
          display_name: normalized.displayName,
          avatar_url: normalized.avatarUrl,
          profile_url: normalized.profileUrl,
          data: normalized,
          sync_error: null,
          last_synced_at: syncedAt,
        },
        { onConflict: 'user_id,platform,handle' },
      )
      .select('id')
      .single();

    if (trackedError || !trackedProfile) {
      console.error(
        '[integrations] tracked_profiles upsert failed:',
        trackedError,
      );
      throw new Error('Could not save GitHub profile history.');
    }

    /* --------------------------------------------------------------
     * Snapshot: only numeric metrics. This is what powers trends.
     * -------------------------------------------------------------- */

    const snapshotMetrics: Record<string, number> = {};
    for (const metric of normalized.metrics) {
      if (typeof metric.value === 'number') {
        snapshotMetrics[metric.key] = metric.value;
      }
    }

    const { error: snapshotError } = await supabaseAdmin
      .from('profile_snapshots')
      .insert({
        profile_id: trackedProfile.id,
        user_id: user.id,
        captured_at: syncedAt,
        metrics: snapshotMetrics,
      });

    if (snapshotError) {
      console.error(
        '[integrations] profile_snapshots insert failed:',
        snapshotError,
      );
      throw new Error('Could not save GitHub history snapshot.');
    }

    /* --------------------------------------------------------------
     * Refresh non-secret metadata on connected_accounts.
     * -------------------------------------------------------------- */

    const { error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .update({
        username: profile.login,
        display_name: profile.name,
        avatar_url: profile.avatar_url,
        profile_url: profile.html_url,
        last_synced_at: syncedAt,
      })
      .eq('user_id', user.id)
      .eq('provider', 'github');

    if (accountError) {
      console.error(
        '[integrations] connected_accounts update failed:',
        accountError,
      );
      throw new Error('Could not save GitHub sync metadata.');
    }

    res.status(200).json({
      ok: true,
      syncedAt,
      username: profile.login,
    });
  } catch (error) {
    console.error('[integrations] GitHub sync failed:', error);
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'GitHub sync failed.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/github/disconnect
 * ========================================================================== */

router.post('/github/disconnect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    await deleteGitHubConnection(sessionId, user.id);

    const { error } = await supabaseAdmin
      .from('connected_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'github');

    if (error) throw error;

    res.status(200).json({ ok: true, success: true });
  } catch (error) {
    console.error('[integrations] GitHub disconnect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to disconnect GitHub.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/codeforces/connect
 * ========================================================================== */

router.post('/codeforces/connect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  const handle = getStringBodyValue(req, 'handle');

  if (!handle) {
    res.status(400).json({
      ok: false,
      error: 'Codeforces handle is required.',
    });
    return;
  }

  try {
    const cfUser = await getCodeforcesUser(handle);

    const displayName =
      [cfUser.firstName, cfUser.lastName].filter(Boolean).join(' ') || null;

    const profileUrl = buildCodeforcesProfileUrl(cfUser.handle);

    await saveCodeforcesConnection(sessionId, {
      provider: 'codeforces',
      userId: user.id,
      handle: cfUser.handle,
      displayName,
      avatarUrl: cfUser.avatar ?? null,
      profileUrl,
      connectedAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      success: true,
      account: {
        handle: cfUser.handle,
        displayName,
        avatarUrl: cfUser.avatar ?? null,
        profileUrl,
      },
    });
  } catch (error) {
    console.error('[integrations] Codeforces connect failed:', error);
    res.status(400).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to connect Codeforces.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/codeforces/disconnect
 * ========================================================================== */

router.post('/codeforces/disconnect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    await deleteCodeforcesConnection(sessionId, user.id);
    res.status(200).json({ ok: true, success: true });
  } catch (error) {
    console.error('[integrations] Codeforces disconnect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to disconnect Codeforces.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/leetcode/connect
 * ========================================================================== */

router.post('/leetcode/connect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  const handle = getStringBodyValue(req, 'handle');

  if (!handle) {
    res.status(400).json({
      ok: false,
      error: 'LeetCode handle is required.',
    });
    return;
  }

  try {
    const profile = await getLeetCodeUserProfile(handle);

    await saveLeetCodeConnection(sessionId, {
      provider: 'leetcode',
      userId: user.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      connectedAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      success: true,
      account: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
      },
    });
  } catch (error) {
    console.error('[integrations] LeetCode connect failed:', error);
    res.status(400).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to connect LeetCode.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/leetcode/disconnect
 * ========================================================================== */

router.post('/leetcode/disconnect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    await deleteLeetCodeConnection(sessionId, user.id);
    res.status(200).json({ ok: true, success: true });
  } catch (error) {
    console.error('[integrations] LeetCode disconnect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to disconnect LeetCode.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/codewars/connect
 * ========================================================================== */

router.post('/codewars/connect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  const handle = getStringBodyValue(req, 'handle');

  if (!handle) {
    res.status(400).json({
      ok: false,
      error: 'Codewars handle is required.',
    });
    return;
  }

  try {
    const profile = await getCodewarsUserProfile(handle);

    await saveCodewarsConnection(sessionId, {
      provider: 'codewars',
      userId: user.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      connectedAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      success: true,
      account: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
      },
    });
  } catch (error) {
    console.error('[integrations] Codewars connect failed:', error);
    res.status(400).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to connect Codewars.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/codewars/disconnect
 * ========================================================================== */

router.post('/codewars/disconnect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    await deleteCodewarsConnection(sessionId, user.id);
    res.status(200).json({ ok: true, success: true });
  } catch (error) {
    console.error('[integrations] Codewars disconnect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to disconnect Codewars.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/stackoverflow/connect
 * ========================================================================== */

router.post('/stackoverflow/connect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  const handle = getStringBodyValue(req, 'handle');

  if (!handle) {
    res.status(400).json({
      ok: false,
      error: 'Stack Overflow user ID is required.',
    });
    return;
  }

  try {
    const profile = await getStackOverflowUserProfile(handle);

    await saveStackOverflowConnection(sessionId, {
      provider: 'stackoverflow',
      userId: user.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
      connectedAt: new Date().toISOString(),
    });

    res.status(200).json({
      ok: true,
      success: true,
      account: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
      },
    });
  } catch (error) {
    console.error('[integrations] Stack Overflow connect failed:', error);
    res.status(400).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to connect Stack Overflow.',
    });
  }
});

/* ==========================================================================
 * POST /api/integrations/stackoverflow/disconnect
 * ========================================================================== */

router.post('/stackoverflow/disconnect', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  const sessionId = requireSession(req, res);
  if (!sessionId) return;

  try {
    await deleteStackOverflowConnection(sessionId, user.id);
    res.status(200).json({ ok: true, success: true });
  } catch (error) {
    console.error('[integrations] Stack Overflow disconnect failed:', error);
    res.status(500).json({
      ok: false,
      error: 'Unable to disconnect Stack Overflow.',
    });
  }
});

export default router;