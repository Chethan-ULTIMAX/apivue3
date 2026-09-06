import { Github, Code2, Trophy, Swords, MessageSquareCode, type LucideIcon } from "lucide-react";

export type MetricFormat = "number" | "decimal" | "percent" | "text" | "date";

export interface Metric {
  key: string;
  label: string;
  value: number | string | null;
  format: MetricFormat;
  group?: string;
}

export interface SeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface Breakdown {
  key: string;
  label: string;
  unit?: string;
  items: { name: string; value: number }[];
}

export interface ActivityPoint {
  date: string;
  count: number;
}

export interface NormalizedProfile {
  platform: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  bio: string | null;
  location: string | null;
  joinedAt: string | null;
  metrics: Metric[];
  breakdowns: Breakdown[];
  ratingHistory: SeriesPoint[];
  activity: ActivityPoint[];
  highlights: { title: string; subtitle?: string; value?: string; url?: string }[];
  fetchedAt: string;
}

export interface TrackedProfile {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_url: string | null;
  data: NormalizedProfile;
  pinned: boolean;
  sync_error: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface ProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
}

/** Capabilities a platform exposes, used to decide which panels to render. */
export type Capability = "problems" | "contests" | "repositories" | "languages" | "activity" | "reputation" | "topics";

export interface Integration {
  id: string;
  name: string;
  icon: LucideIcon;
  /** HSL token-free accent used only for chart series and platform dots. */
  accent: string;
  tagline: string;
  handleLabel: string;
  handlePlaceholder: string;
  handleHint: string;
  /** Metric keys shown on compact cards, in order. */
  headlineMetrics: string[];
  /** Primary metric used for comparison ranking. */
  rankMetric: string;
  capabilities: Capability[];
  docsUrl: string;
  apiNote: string;
}

export const integrations: Integration[] = [
  {
    id: "leetcode",
    name: "LeetCode",
    icon: Code2,
    accent: "hsl(38 92% 50%)",
    tagline: "Problem solving, difficulty split and contest rating history.",
    handleLabel: "Username",
    handlePlaceholder: "e.g. neetcode",
    handleHint: "Your public LeetCode username, from leetcode.com/u/<username>.",
    headlineMetrics: ["solved_all", "contest_rating", "ranking"],
    rankMetric: "solved_all",
    capabilities: ["problems", "contests", "languages", "activity", "topics"],
    docsUrl: "https://leetcode.com",
    apiNote: "Public GraphQL profile endpoint. Only public profiles can be read.",
  },
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    accent: "hsl(243 75% 59%)",
    tagline: "Repositories, stars, languages and recent push activity.",
    handleLabel: "Username",
    handlePlaceholder: "e.g. torvalds",
    handleHint: "Your GitHub username, from github.com/<username>.",
    headlineMetrics: ["public_repos", "stars", "followers"],
    rankMetric: "stars",
    capabilities: ["repositories", "languages", "activity"],
    docsUrl: "https://docs.github.com/rest",
    apiNote: "Public REST API v3. Unauthenticated reads are rate limited per hour.",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    icon: Trophy,
    accent: "hsl(199 89% 48%)",
    tagline: "Competitive rating curve, solved tags and submission accuracy.",
    handleLabel: "Handle",
    handlePlaceholder: "e.g. tourist",
    handleHint: "Your Codeforces handle, from codeforces.com/profile/<handle>.",
    headlineMetrics: ["rating", "solved", "contests"],
    rankMetric: "rating",
    capabilities: ["problems", "contests", "languages", "activity", "topics"],
    docsUrl: "https://codeforces.com/apiHelp",
    apiNote: "Official public API. Rating and submission history included.",
  },
  {
    id: "codewars",
    name: "Codewars",
    icon: Swords,
    accent: "hsl(0 72% 51%)",
    tagline: "Honor, kata completions and per-language scores.",
    handleLabel: "Username",
    handlePlaceholder: "e.g. someuser",
    handleHint: "Your Codewars username, from codewars.com/users/<username>.",
    headlineMetrics: ["honor", "solved", "score"],
    rankMetric: "honor",
    capabilities: ["problems", "languages", "reputation"],
    docsUrl: "https://dev.codewars.com/",
    apiNote: "Public v1 API. Profile must not be private.",
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow",
    icon: MessageSquareCode,
    accent: "hsl(25 95% 53%)",
    tagline: "Reputation, badges and the tags you answer best.",
    handleLabel: "User id",
    handlePlaceholder: "e.g. 22656",
    handleHint: "The numeric id in stackoverflow.com/users/<id>/<name>.",
    headlineMetrics: ["reputation", "answers", "gold"],
    rankMetric: "reputation",
    capabilities: ["reputation", "topics"],
    docsUrl: "https://api.stackexchange.com/docs",
    apiNote: "Stack Exchange API 2.3. Uses the numeric user id.",
  },
];

export const integrationMap: Record<string, Integration> = Object.fromEntries(
  integrations.map((i) => [i.id, i]),
);

export function getIntegration(platform: string): Integration {
  return (
    integrationMap[platform] ?? {
      id: platform,
      name: platform,
      icon: Code2,
      accent: "hsl(220 10% 50%)",
      tagline: "Custom integration.",
      handleLabel: "Handle",
      handlePlaceholder: "handle",
      handleHint: "Public handle on this platform.",
      headlineMetrics: [],
      rankMetric: "",
      capabilities: [],
      docsUrl: "#",
      apiNote: "Custom adapter.",
    }
  );
}

export function metricOf(profile: TrackedProfile | undefined, key: string): Metric | undefined {
  return profile?.data?.metrics?.find((m) => m.key === key);
}

export function formatMetric(value: number | string | null | undefined, format: MetricFormat = "number"): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  switch (format) {
    case "percent":
      return `${value}%`;
    case "decimal":
      return value.toFixed(1);
    case "date":
      return new Date(value).toLocaleDateString();
    default:
      return value.toLocaleString();
  }
}
