/* Registry and normalized integration types. */

import { Code2, Github, MessageSquareCode, Swords } from 'lucide-react';
import type { CategoryDefinition, CategoryId, IntegrationDefinition, IntegrationId, Metric, TrackedProfile } from './types';

export type {
  CategoryDefinition, CategoryId, ConnectedAccount, IntegrationDefinition,
  IntegrationId, IntegrationStatus, Metric, MetricDefinition, NormalizedProfile,
  ProfileBreakdown, ProfileData, ProfileHighlight, ProfileSnapshot,
  RatingHistoryPoint, TrackedProfile,
} from './types';

export const categories: CategoryDefinition[] = [
  { id: 'development', label: 'Development', description: 'Software development and coding activity.' },
  { id: 'competitive-programming', label: 'Competitive Programming', description: 'Problem solving, contests, ratings and submissions.' },
  { id: 'learning', label: 'Learning', description: 'Learning and educational activity.' },
  { id: 'activity', label: 'Activity', description: 'General activity and consistency over time.' },
  { id: 'goals', label: 'Goals', description: 'Personal goals and progress toward them.' },
];

export const integrations: IntegrationDefinition[] = [
  {
    id: 'github', name: 'GitHub',
    description: 'Public profile plus OAuth-authorized repositories, contributions, activity and development history.',
    category: 'Development', categories: ['development', 'activity'], available: true, authType: 'oauth',
    icon: Github, accent: '#8b5cf6', handleLabel: 'GitHub account', handlePlaceholder: '',
    handleHint: 'Authorize APIVue with GitHub to access the repositories and data your GitHub permissions allow.',
    headlineMetrics: ['public_repos', 'followers'],
    metrics: [{ key: 'public_repos', label: 'Repositories' }, { key: 'followers', label: 'Followers' }, { key: 'following', label: 'Following' }],
  },
  {
    id: 'codeforces', name: 'Codeforces',
    description: 'Ratings, contests, submissions and competitive programming activity via Codeforces OpenID Connect.',
    category: 'Competitive Programming', categories: ['competitive-programming', 'activity'], available: true, authType: 'oauth',
    icon: Code2, accent: '#f59e0b', handleLabel: 'Codeforces account', handlePlaceholder: '', handleHint: 'Sign in with Codeforces. APIVue will receive your authorized profile identity and load public statistics.',
    headlineMetrics: ['rating', 'max_rating'], metrics: [{ key: 'rating', label: 'Rating' }, { key: 'max_rating', label: 'Max Rating' }, { key: 'rank', label: 'Rank' }],
  },
  {
    id: 'leetcode', name: 'LeetCode',
    description: 'Solved problems, difficulty distribution, contests and activity from a public profile.',
    category: 'Competitive Programming', categories: ['competitive-programming', 'learning', 'activity'], available: true, authType: 'username',
    icon: Code2, accent: '#f59e0b', handleLabel: 'LeetCode username', handlePlaceholder: 'neetcode', handleHint: 'LeetCode does not currently expose an official third-party OAuth/OIDC flow for APIVue. Track a public profile by username instead.',
    headlineMetrics: ['solved_all', 'contest_rating'],
  },
  {
    id: 'codewars', name: 'Codewars', description: 'Honor, kata completions and language scores.',
    category: 'Learning', categories: ['competitive-programming', 'learning'], available: true, authType: 'username',
    icon: Swords, accent: '#ef4444', handleLabel: 'Codewars username', handlePlaceholder: 'someuser', handleHint: 'Enter a public Codewars username.',
    headlineMetrics: ['honor', 'total_completed'],
  },
  {
    id: 'stackoverflow', name: 'Stack Overflow',
    description: 'Verified Stack Overflow account with reputation, answers, questions, badges and community activity.',
    category: 'Community', categories: ['development', 'activity'], available: true, authType: 'oauth',
    icon: MessageSquareCode, accent: '#f97316', handleLabel: 'Stack Overflow account', handlePlaceholder: '',
    handleHint: 'Sign in with Stack Overflow. APIVue verifies the account through OAuth and loads its public profile data.',
    headlineMetrics: ['reputation', 'answers', 'gold'],
  },
];

export function getIntegration(id: IntegrationId | string): IntegrationDefinition {
  const found = integrations.find((integration) => integration.id === id);
  if (found) return found;
  return { id: id as IntegrationId, name: id, description: '', category: 'Other', categories: [], available: false, authType: 'coming-soon', icon: Code2, accent: 'hsl(var(--primary))', handleLabel: 'Username', handlePlaceholder: 'username', handleHint: '', headlineMetrics: [] };
}

export function formatMetric(metric: Metric | string | number, format?: string): string {
  if (typeof metric === 'object' && metric !== null) {
    const wantNumber = format === 'number' || metric.format === 'number';
    if (wantNumber) { const n = Number(metric.value); return Number.isFinite(n) ? n.toLocaleString() : String(metric.value); }
    if (typeof metric.value === 'number') return `${metric.value}${metric.unit ?? ''}`;
    return String(metric.value);
  }
  return format === 'number' && typeof metric === 'number' ? metric.toLocaleString() : String(metric);
}

export function metricOf(profileOrMetrics: Metric[] | TrackedProfile | undefined, key: string): Metric | undefined {
  const metrics = Array.isArray(profileOrMetrics) ? profileOrMetrics : profileOrMetrics?.data?.metrics;
  if (!metrics) return undefined;
  const normalizedKey = key.toLowerCase();
  return metrics.find((metric) => metric.key.toLowerCase() === normalizedKey || metric.label.toLowerCase() === normalizedKey);
}
