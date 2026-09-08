export type IntegrationId = 'github' | 'codeforces';

export type CategoryId =
  | 'development'
  | 'competitive-programming'
  | 'learning'
  | 'activity'
  | 'goals';

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

  // Kept for existing UI code
  category: string;

  // Used by progress analytics
  categories: CategoryId[];

  available: boolean;

  authType:
    | 'oauth'
    | 'username'
    | 'coming-soon';

  metrics?: MetricDefinition[];
}

export interface Metric {
  key: string;
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
}

export interface ProfileData {
  metrics?: Metric[];
  activity?: {
    date: string;
    count: number;
  }[];
}

export interface TrackedProfile {
  id: string;
  platform: IntegrationId | string;
  username?: string;
  handle: string;
  displayName?: string;
  data?: ProfileData;
}

export interface ProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
}

export const categories: CategoryDefinition[] = [
  {
    id: 'development',
    label: 'Development',
    description: 'Software development and coding activity.',
  },
  {
    id: 'competitive-programming',
    label: 'Competitive Programming',
    description: 'Problem solving, contests, ratings and submissions.',
  },
  {
    id: 'learning',
    label: 'Learning',
    description: 'Learning and educational activity.',
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'General activity and consistency over time.',
  },
  {
    id: 'goals',
    label: 'Goals',
    description: 'Personal goals and progress toward them.',
  },
];

export const integrations: IntegrationDefinition[] = [
  {
    id: 'github',
    name: 'GitHub',
    description:
      'Repositories, contributions, activity, profile and development history.',
    category: 'Development',
    categories: ['development', 'activity'],
    available: true,
    authType: 'oauth',
    metrics: [
      {
        key: 'repositories',
        label: 'Repositories',
      },
      {
        key: 'followers',
        label: 'Followers',
      },
      {
        key: 'following',
        label: 'Following',
      },
    ],
  },

  {
    id: 'codeforces',
    name: 'Codeforces',
    description:
      'Ratings, contests, submissions and competitive programming activity.',
    category: 'Competitive Programming',
    categories: ['competitive-programming', 'activity'],
    available: true,
    authType: 'username',
    metrics: [
      {
        key: 'rating',
        label: 'Rating',
      },
      {
        key: 'maxRating',
        label: 'Max Rating',
      },
      {
        key: 'rank',
        label: 'Rank',
      },
    ],
  },
];

export function getIntegration(
  id: IntegrationId | string,
): IntegrationDefinition {
  return (
    integrations.find((integration) => integration.id === id) ??
    {
      id: id as IntegrationId,
      name: id,
      description: '',
      category: 'Other',
      categories: [],
      available: false,
      authType: 'coming-soon',
    }
  );
}

export function formatMetric(metric: Metric): string {
  if (typeof metric.value === 'number') {
    return `${metric.value}${metric.unit ?? ''}`;
  }

  return metric.value;
}

export function metricOf(
  metrics: Metric[] | undefined,
  label: string,
): Metric | undefined {
  return metrics?.find((metric) => metric.label === label);
}