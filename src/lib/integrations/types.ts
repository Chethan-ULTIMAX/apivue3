export type IntegrationId =
  | 'github'
  | 'codeforces'
  | 'leetcode'
  | 'codewars'
  | 'stackoverflow';

export interface ConnectedAccount {
  connected: boolean;
  username?: string;
  handle?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  error?: string;
}

export interface IntegrationStatus {
  github: ConnectedAccount;
  codeforces: ConnectedAccount;
  leetcode: ConnectedAccount;
  codewars: ConnectedAccount;
  stackoverflow: ConnectedAccount;
}