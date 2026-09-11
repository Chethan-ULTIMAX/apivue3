export interface GitHubConnection {
  provider: 'github';
  providerUserId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  accessToken: string;
  connectedAt: string;
}

export interface ServerGitHubConnection extends GitHubConnection {
  userId: string;
}

export interface CodeforcesConnection {
  provider: 'codeforces';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
}

const githubConnections = new Map<
  string,
  ServerGitHubConnection
>();

const codeforcesConnections = new Map<
  string,
  CodeforcesConnection
>();

export function saveGitHubConnection(
  sessionId: string,
  connection: ServerGitHubConnection
) {
  githubConnections.set(sessionId, connection);
}

export function getGitHubConnection(
  sessionId: string
): ServerGitHubConnection | null {
  return githubConnections.get(sessionId) ?? null;
}

export function deleteGitHubConnection(
  sessionId: string
) {
  githubConnections.delete(sessionId);
}

export function saveCodeforcesConnection(
  sessionId: string,
  connection: CodeforcesConnection
) {
  codeforcesConnections.set(sessionId, connection);
}

export function getCodeforcesConnection(
  sessionId: string
): CodeforcesConnection | null {
  return codeforcesConnections.get(sessionId) ?? null;
}

export function deleteCodeforcesConnection(
  sessionId: string
) {
  codeforcesConnections.delete(sessionId);
}