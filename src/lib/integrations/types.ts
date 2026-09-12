/**
 * Integration layer — shared types.
 *
 * This file is the single source of truth for all integration-related
 * types. It must be pure types (no runtime values, no imports of data),
 * so that `registry.ts` can import from it without creating cycles.
 *
 * The LucideIcon import is type-only — it does not add a runtime
 * dependency on lucide-react from this file.
 */

import type { LucideIcon } from 'lucide-react';

/* ============================================================
 * Platform identifiers
 * ============================================================ */

export type IntegrationId =
  | 'github'
  | 'codeforces'
  | 'leetcode'
  | 'codewars'
  | 'stackoverflow';

export type CategoryId =
  | 'development'
  | 'competitive-programming'
  | 'learning'
  | 'activity'
  | 'goals';

/* ============================================================
 * Connected account status (from the backend /api/integrations)
 * ============================================================ */

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

/**
 * Shape returned by GET /api/integrations.
 * Each platform key is always present; `connected` indicates whether
 * the user has linked the account.
 */
export type IntegrationStatus = Record<IntegrationId, ConnectedAccount>;

/* ============================================================
 * Registry definitions (data-driven UI configuration)
 * ============================================================ */

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  description: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  unit?: string;
}

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
  /** Human-readable primary category label (e.g. "Development"). */
  category: string;
  /** Structured category ids this integration contributes to. */
  categories: CategoryId[];
  available: boolean;
  authType: 'oauth' | 'username' | 'coming-soon';

  icon: LucideIcon;
  accent: string;

  handleLabel: string;
  handlePlaceholder: string;
  handleHint: string;

  headlineMetrics: string[];
  metrics?: MetricDefinition[];
}

/* ============================================================
 * Normalized profile data (from /api/.../sync and /api/.../connect)
 * ============================================================ */

export interface Metric {
  key: string;
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  format?: string;
}

export interface RatingHistoryPoint {
  date: string;
  value: number;
}

export interface ProfileHighlight {
  title: string;
  url?: string;
  subtitle?: string;
}

export interface ProfileBreakdown {
  key: string;
  label: string;
  unit?: string;
  items: Array<{ label: string; value: number }>;
}

export interface ProfileData {
  bio?: string;
  location?: string;
  joinedAt?: string;

  metrics?: Metric[];

  activity?: Array<{ date: string; count: number }>;

  ratingHistory?: RatingHistoryPoint[];
  highlights?: ProfileHighlight[];
  breakdowns?: ProfileBreakdown[];
}

/**
 * A profile being tracked by APIVue.
 *
 * The API may return either camelCase or snake_case keys depending on
 * the layer (client-side normalized vs. raw Supabase row). Both are
 * accepted here so consumers can read the value that is present.
 * Prefer the camelCase variants when writing new code.
 */
export interface TrackedProfile {
  id: string;

  platform: IntegrationId | string;

  username?: string;
  handle: string;

  displayName?: string;
  display_name?: string;

  avatarUrl?: string | null;
  avatar_url?: string | null;

  profileUrl?: string;
  profile_url?: string;

  pinned?: boolean;

  lastSyncedAt?: string;
  last_synced_at?: string;

  syncError?: string;
  sync_error?: string;

  data?: ProfileData;
}

/** Alias for clarity when consuming normalized data. */
export type NormalizedProfile = TrackedProfile;

export interface ProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
}