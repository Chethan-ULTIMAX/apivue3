import type { PublicDataResult } from '../types';

export function normalizeGitHubData(
  data: PublicDataResult
): PublicDataResult {
  return {
    ...data,
    profile: {
      ...data.profile,
      username: data.profile.username.trim(),
    },
    metrics: data.metrics.map((metric) => ({
      ...metric,
      label: metric.label.trim(),
    })),
    activity: data.activity.map((item) => ({
      ...item,
      title: item.title.trim(),
    })),
  };
}