import type { LucideIcon } from "lucide-react";
import { Github, Code2, MessageSquareCode, Swords } from "lucide-react";

export type IntegrationId = "github" | "leetcode" | "codeforces" | "codewars" | "stackoverflow";

export type CategoryId =
  | "development"
  | "competitive-programming"
  | "learning"
  | "activity"
  | "goals";

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
  category: string;
  categories: CategoryId[];
  available: boolean;
  authType: "oauth" | "username" | "coming-soon";

  icon: LucideIcon;
  accent: string;

  handleLabel: string;
  handlePlaceholder: string;
  handleHint: string;

  headlineMetrics: string[];
  metrics?: MetricDefinition[];
}

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
  items: {
    label: string;
    value: number;
  }[];
}

export interface ProfileData {
  bio?: string;
  location?: string;
  joinedAt?: string;

  metrics?: Metric[];

  activity?: {
    date: string;
    count: number;
  }[];

  ratingHistory?: RatingHistoryPoint[];
  highlights?: ProfileHighlight[];
  breakdowns?: ProfileBreakdown[];
}

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

export type NormalizedProfile = TrackedProfile;

export interface ProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
}

export const categories: CategoryDefinition[] = [
  {
    id: "development",
    label: "Development",
    description: "Software development and coding activity.",
  },
  {
    id: "competitive-programming",
    label: "Competitive Programming",
    description: "Problem solving, contests, ratings and submissions.",
  },
  {
    id: "learning",
    label: "Learning",
    description: "Learning and educational activity.",
  },
  {
    id: "activity",
    label: "Activity",
    description: "General activity and consistency over time.",
  },
  {
    id: "goals",
    label: "Goals",
    description: "Personal goals and progress toward them.",
  },
];

export const integrations: IntegrationDefinition[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Repositories, contributions, activity, profile and development history.",
    category: "Development",
    categories: ["development", "activity"],
    available: true,
    authType: "oauth",

    icon: Github,
    accent: "#8b5cf6",

    handleLabel: "GitHub username",
    handlePlaceholder: "octocat",
    handleHint: "Enter a public GitHub username.",

    headlineMetrics: ["repositories", "followers"],

    metrics: [
      { key: "repositories", label: "Repositories" },
      { key: "followers", label: "Followers" },
      { key: "following", label: "Following" },
    ],
  },

  {
    id: "codeforces",
    name: "Codeforces",
    description:
      "Ratings, contests, submissions and competitive programming activity.",
    category: "Competitive Programming",
    categories: ["competitive-programming", "activity"],
    available: true,
    authType: "username",

    icon: Code2,
    accent: "#f59e0b",

    handleLabel: "Codeforces handle",
    handlePlaceholder: "tourist",
    handleHint: "Enter a public Codeforces handle.",

    headlineMetrics: ["rating", "maxRating"],

    metrics: [
      { key: "rating", label: "Rating" },
      { key: "maxRating", label: "Max Rating" },
      { key: "rank", label: "Rank" },
    ],
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description: "Solved problems, difficulty distribution, contests and activity.",
    category: "Competitive Programming",
    categories: ["competitive-programming", "learning", "activity"],
    available: true,
    authType: "username",
    icon: Code2,
    accent: "#f59e0b",
    handleLabel: "LeetCode username",
    handlePlaceholder: "neetcode",
    handleHint: "Enter a public LeetCode username.",
    headlineMetrics: ["solved_all", "contest_rating"],
  },
  {
    id: "codewars",
    name: "Codewars",
    description: "Honor, kata completions and language scores.",
    category: "Learning",
    categories: ["competitive-programming", "learning"],
    available: true,
    authType: "username",
    icon: Swords,
    accent: "#ef4444",
    handleLabel: "Codewars username",
    handlePlaceholder: "someuser",
    handleHint: "Enter a public Codewars username.",
    headlineMetrics: ["honor", "total_completed"],
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow",
    description: "Reputation, answers and community activity.",
    category: "Community",
    categories: ["development", "activity"],
    available: true,
    authType: "username",
    icon: MessageSquareCode,
    accent: "#f97316",
    handleLabel: "Stack Overflow user ID",
    handlePlaceholder: "22656",
    handleHint: "Enter the numeric Stack Exchange user ID.",
    headlineMetrics: ["reputation", "answers", "gold"],
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
      description: "",
      category: "Other",
      categories: [],
      available: false,
      authType: "coming-soon",

      icon: Code2,
      accent: "hsl(var(--primary))",

      handleLabel: "Username",
      handlePlaceholder: "username",
      handleHint: "",

      headlineMetrics: [],
    }
  );
}

export function formatMetric(
  metric: Metric | string | number,
  format?: string,
): string {
  if (typeof metric === "object") {
    if (format === "number" || metric.format === "number") {
      return Number(metric.value).toLocaleString();
    }

    if (typeof metric.value === "number") {
      return `${metric.value}${metric.unit ?? ""}`;
    }

    return metric.value;
  }

  if (format === "number" && typeof metric === "number") {
    return metric.toLocaleString();
  }

  return String(metric);
}

export function metricOf(
  profileOrMetrics: Metric[] | TrackedProfile | undefined,
  key: string,
): Metric | undefined {
  const metrics = Array.isArray(profileOrMetrics)
    ? profileOrMetrics
    : profileOrMetrics?.data?.metrics;

  return metrics?.find(
    (metric) => metric.key === key || metric.label === key,
  );
}
