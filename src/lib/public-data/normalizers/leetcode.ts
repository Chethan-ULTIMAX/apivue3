/**
 * LeetCode normalizer.
 */

import type {
  PublicActivity,
  PublicBreakdown,
  PublicDataResult,
  PublicMetric,
  PublicProfile,
} from '../types';
import type { RawLeetCodeData } from '../fetchers/leetcode';

/* ============================================================
 * Helpers
 * ============================================================ */

function toPublicProfile(raw: RawLeetCodeData): PublicProfile {
  const user = raw.matchedUser!;
  return {
    platform: 'leetcode',
    username: user.username,
    displayName: user.profile?.realName?.trim() || user.username,
    avatarUrl: user.profile?.userAvatar ?? null,
    profileUrl: `https://leetcode.com/u/${user.username}/`,
    bio: user.profile?.aboutMe?.trim() || null,
    location: user.profile?.countryName?.trim() || null,
    joinedAt: null,
  };
}

function parseCalendar(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function buildDifficultyBreakdown(raw: RawLeetCodeData): PublicBreakdown {
  const solved = raw.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];
  const items = solved
    .filter((s) => s.difficulty !== 'All')
    .map((s) => ({ label: s.difficulty, value: s.count }));
  return { label: 'Solved by difficulty', items };
}

function buildLanguageBreakdown(raw: RawLeetCodeData): PublicBreakdown {
  const langs = raw.matchedUser?.languageProblemCount ?? [];
  const total = langs.reduce((s, l) => s + l.problemsSolved, 0);
  const items = langs
    .map((l) => ({
      label: l.languageName,
      value: l.problemsSolved,
      percentage:
        total > 0
          ? Math.round((l.problemsSolved / total) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  return { label: 'Languages', items };
}

/* ============================================================
 * Public API
 * ============================================================ */

export function normalizeLeetCodeData(
  raw: RawLeetCodeData,
): PublicDataResult {
  const user = raw.matchedUser!;

  const solvedByDifficulty: Record<string, number> = {};
  for (const s of user.submitStatsGlobal?.acSubmissionNum ?? []) {
    solvedByDifficulty[s.difficulty] = s.count;
  }
  const totalByDifficulty: Record<string, number> = {};
  for (const s of raw.allQuestionsCount ?? []) {
    totalByDifficulty[s.difficulty] = s.count;
  }

  const contest = raw.userContestRanking;
  const calendar = parseCalendar(user.submissionCalendar);

  const activity: PublicActivity[] = Object.entries(calendar)
    .map(([ts, count]) => ({
      id: ts,
      title: `${count} submission${count === 1 ? '' : 's'}`,
      description: new Date(Number(ts) * 1000).toLocaleDateString(),
      timestamp: new Date(Number(ts) * 1000).toISOString(),
      url: `https://leetcode.com/u/${user.username}/`,
      type: 'submission',
    }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-50);

  const totalAll = totalByDifficulty['All'] ?? 0;
  const solvedAll = solvedByDifficulty['All'] ?? 0;
  const completion =
    totalAll > 0 ? Math.round((solvedAll / totalAll) * 1000) / 10 : 0;

  const metrics: PublicMetric[] = [
    { label: 'Problems solved', value: solvedAll },
    { label: 'Easy solved', value: solvedByDifficulty['Easy'] ?? 0 },
    { label: 'Medium solved', value: solvedByDifficulty['Medium'] ?? 0 },
    { label: 'Hard solved', value: solvedByDifficulty['Hard'] ?? 0 },
    { label: 'Global ranking', value: user.profile?.ranking ?? 'Unranked' },
    { label: 'Reputation', value: user.profile?.reputation ?? 0 },
    {
      label: 'Contest rating',
      value: contest?.rating ? Math.round(contest.rating) : 'Unrated',
    },
    { label: 'Contests attended', value: contest?.attendedContestsCount ?? 0 },
    { label: 'Catalogue completion', value: `${completion}%` },
  ];

  return {
    platform: 'leetcode',
    profile: toPublicProfile(raw),
    metrics,
    activity,
    breakdowns: [
      buildDifficultyBreakdown(raw),
      buildLanguageBreakdown(raw),
    ],
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}