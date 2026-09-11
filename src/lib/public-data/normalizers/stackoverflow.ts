import type { PublicDataResult } from '../types';

export function normalizeStackOverflowData(
  data: PublicDataResult
): PublicDataResult {
  return {
    ...data,
    profile: {
      ...data.profile,
      username: data.profile.username.trim(),
      displayName: data.profile.displayName?.trim() ?? null,
      location: data.profile.location?.trim() ?? null,
    },
    metrics: data.metrics.map((metric) => ({
      ...metric,
      label: metric.label.trim(),
    })),
    activity: data.activity.map((item) => ({
      ...item,
      title: item.title.trim(),
      description: item.description?.trim(),
    })),
  };
}
