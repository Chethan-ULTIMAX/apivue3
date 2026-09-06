// Platform integration adapters for APIVue.
// Each platform is a self-contained adapter that fetches PUBLIC data and
// normalizes it into a shared shape. Add a new website by appending one adapter
// here and one registry entry in src/lib/integrations/registry.ts.

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

export interface PlatformAdapter {
  id: string;
  label: string;
  fetchProfile: (handle: string) => Promise<NormalizedProfile>;
}

const UA = { "User-Agent": "APIVue/1.0 (+https://apivue.app)" };

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...UA, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${new URL(url).hostname} responded ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

function base(platform: string, handle: string): NormalizedProfile {
  return {
    platform,
    handle,
    displayName: null,
    avatarUrl: null,
    profileUrl: null,
    bio: null,
    location: null,
    joinedAt: null,
    metrics: [],
    breakdowns: [],
    ratingHistory: [],
    activity: [],
    highlights: [],
    fetchedAt: new Date().toISOString(),
  };
}

/* ------------------------------- GitHub -------------------------------- */

const github: PlatformAdapter = {
  id: "github",
  label: "GitHub",
  fetchProfile: async (handle) => {
    const user = await getJson(`https://api.github.com/users/${encodeURIComponent(handle)}`);
    const repos: any[] = await getJson(
      `https://api.github.com/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=updated`,
    ).catch(() => []);

    const stars = repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
    const forks = repos.reduce((s, r) => s + (r.forks_count ?? 0), 0);
    const langCount: Record<string, number> = {};
    for (const r of repos) if (r.language) langCount[r.language] = (langCount[r.language] ?? 0) + 1;

    const pushActivity: Record<string, number> = {};
    for (const r of repos) {
      if (!r.pushed_at) continue;
      const day = String(r.pushed_at).slice(0, 10);
      pushActivity[day] = (pushActivity[day] ?? 0) + 1;
    }

    const p = base("github", handle);
    p.displayName = user.name ?? user.login;
    p.avatarUrl = user.avatar_url ?? null;
    p.profileUrl = user.html_url ?? null;
    p.bio = user.bio ?? null;
    p.location = user.location ?? null;
    p.joinedAt = user.created_at ?? null;
    p.metrics = [
      { key: "public_repos", label: "Public repos", value: user.public_repos ?? 0, format: "number" },
      { key: "stars", label: "Stars earned", value: stars, format: "number" },
      { key: "forks", label: "Forks", value: forks, format: "number" },
      { key: "followers", label: "Followers", value: user.followers ?? 0, format: "number" },
      { key: "following", label: "Following", value: user.following ?? 0, format: "number" },
      { key: "gists", label: "Public gists", value: user.public_gists ?? 0, format: "number" },
      { key: "languages", label: "Languages used", value: Object.keys(langCount).length, format: "number" },
    ];
    p.breakdowns = [
      {
        key: "languages",
        label: "Languages by repository",
        unit: "repos",
        items: Object.entries(langCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      },
      {
        key: "top_repos",
        label: "Top repositories by stars",
        unit: "stars",
        items: repos
          .map((r) => ({ name: r.name as string, value: (r.stargazers_count ?? 0) as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
      },
    ];
    p.activity = Object.entries(pushActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-120);
    p.highlights = repos
      .slice()
      .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
      .slice(0, 5)
      .map((r) => ({
        title: r.name,
        subtitle: r.description ?? r.language ?? undefined,
        value: `★ ${r.stargazers_count ?? 0}`,
        url: r.html_url,
      }));
    return p;
  },
};

/* ------------------------------ LeetCode ------------------------------- */

const LEETCODE_QUERY = `
query apivue($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking aboutMe countryName reputation }
    submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts { advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } }
    submissionCalendar
    badges { displayName }
  }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage }
  userContestRankingHistory(username: $username) { attended rating ranking contest { title startTime } }
  allQuestionsCount { difficulty count }
}`;

const leetcode: PlatformAdapter = {
  id: "leetcode",
  label: "LeetCode",
  fetchProfile: async (handle) => {
    const payload = await getJson("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username: handle } }),
    });
    const m = payload?.data?.matchedUser;
    if (!m) throw new Error(`LeetCode user "${handle}" not found`);

    const solved: Record<string, number> = {};
    for (const s of m.submitStatsGlobal?.acSubmissionNum ?? []) solved[s.difficulty] = s.count;
    const total: Record<string, number> = {};
    for (const s of payload?.data?.allQuestionsCount ?? []) total[s.difficulty] = s.count;
    const contest = payload?.data?.userContestRanking;
    const history: any[] = payload?.data?.userContestRankingHistory ?? [];

    const p = base("leetcode", handle);
    p.displayName = m.profile?.realName || m.username;
    p.avatarUrl = m.profile?.userAvatar ?? null;
    p.profileUrl = `https://leetcode.com/u/${m.username}/`;
    p.bio = m.profile?.aboutMe ?? null;
    p.location = m.profile?.countryName ?? null;
    p.metrics = [
      { key: "solved_all", label: "Problems solved", value: solved.All ?? 0, format: "number" },
      { key: "solved_easy", label: "Easy solved", value: solved.Easy ?? 0, format: "number" },
      { key: "solved_medium", label: "Medium solved", value: solved.Medium ?? 0, format: "number" },
      { key: "solved_hard", label: "Hard solved", value: solved.Hard ?? 0, format: "number" },
      {
        key: "completion",
        label: "Catalogue solved",
        value: total.All ? Math.round(((solved.All ?? 0) / total.All) * 1000) / 10 : null,
        format: "percent",
      },
      { key: "ranking", label: "Global ranking", value: m.profile?.ranking ?? null, format: "number" },
      { key: "reputation", label: "Reputation", value: m.profile?.reputation ?? 0, format: "number" },
      { key: "contest_rating", label: "Contest rating", value: contest?.rating ? Math.round(contest.rating) : null, format: "number" },
      { key: "contests", label: "Contests attended", value: contest?.attendedContestsCount ?? 0, format: "number" },
      { key: "contest_top", label: "Contest top %", value: contest?.topPercentage ?? null, format: "percent" },
    ];
    const tags = m.tagProblemCounts ?? {};
    const tagItems = [...(tags.fundamental ?? []), ...(tags.intermediate ?? []), ...(tags.advanced ?? [])]
      .map((t: any) => ({ name: t.tagName, value: t.problemsSolved }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    p.breakdowns = [
      {
        key: "difficulty",
        label: "Solved by difficulty",
        unit: "problems",
        items: ["Easy", "Medium", "Hard"].map((d) => ({ name: d, value: solved[d] ?? 0 })),
      },
      {
        key: "languages",
        label: "Solved by language",
        unit: "problems",
        items: (m.languageProblemCount ?? [])
          .map((l: any) => ({ name: l.languageName, value: l.problemsSolved }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 10),
      },
      { key: "topics", label: "Strongest topics", unit: "problems", items: tagItems },
    ];
    p.ratingHistory = history
      .filter((h) => h.attended)
      .map((h) => ({
        date: new Date(Number(h.contest?.startTime ?? 0) * 1000).toISOString().slice(0, 10),
        value: Math.round(h.rating ?? 0),
        label: h.contest?.title,
      }));
    let calendar: Record<string, number> = {};
    try {
      calendar = JSON.parse(m.submissionCalendar ?? "{}");
    } catch {
      calendar = {};
    }
    p.activity = Object.entries(calendar)
      .map(([ts, count]) => ({ date: new Date(Number(ts) * 1000).toISOString().slice(0, 10), count: Number(count) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);
    p.highlights = (m.badges ?? []).slice(0, 6).map((b: any) => ({ title: b.displayName }));
    return p;
  },
};

/* ----------------------------- Codeforces ------------------------------ */

const codeforces: PlatformAdapter = {
  id: "codeforces",
  label: "Codeforces",
  fetchProfile: async (handle) => {
    const info = await getJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`);
    const user = info?.result?.[0];
    if (!user) throw new Error(`Codeforces user "${handle}" not found`);
    const ratingRes = await getJson(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`).catch(
      () => ({ result: [] }),
    );
    const statusRes = await getJson(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=2000`,
    ).catch(() => ({ result: [] }));

    const submissions: any[] = statusRes?.result ?? [];
    const solvedSet = new Set<string>();
    const tagCount: Record<string, number> = {};
    const langCount: Record<string, number> = {};
    const activity: Record<string, number> = {};
    let accepted = 0;
    for (const s of submissions) {
      const day = new Date((s.creationTimeSeconds ?? 0) * 1000).toISOString().slice(0, 10);
      activity[day] = (activity[day] ?? 0) + 1;
      if (s.programmingLanguage) langCount[s.programmingLanguage] = (langCount[s.programmingLanguage] ?? 0) + 1;
      if (s.verdict === "OK") {
        accepted++;
        const key = `${s.problem?.contestId ?? "x"}-${s.problem?.index ?? "x"}`;
        if (!solvedSet.has(key)) {
          solvedSet.add(key);
          for (const t of s.problem?.tags ?? []) tagCount[t] = (tagCount[t] ?? 0) + 1;
        }
      }
    }
    const contests: any[] = ratingRes?.result ?? [];

    const p = base("codeforces", handle);
    p.displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.handle;
    p.avatarUrl = user.titlePhoto ?? user.avatar ?? null;
    p.profileUrl = `https://codeforces.com/profile/${user.handle}`;
    p.location = [user.city, user.country].filter(Boolean).join(", ") || null;
    p.joinedAt = user.registrationTimeSeconds ? new Date(user.registrationTimeSeconds * 1000).toISOString() : null;
    p.metrics = [
      { key: "rating", label: "Current rating", value: user.rating ?? null, format: "number" },
      { key: "max_rating", label: "Max rating", value: user.maxRating ?? null, format: "number" },
      { key: "rank", label: "Rank", value: user.rank ?? null, format: "text" },
      { key: "max_rank", label: "Max rank", value: user.maxRank ?? null, format: "text" },
      { key: "solved", label: "Problems solved", value: solvedSet.size, format: "number" },
      { key: "submissions", label: "Submissions (recent)", value: submissions.length, format: "number" },
      {
        key: "accuracy",
        label: "Acceptance rate",
        value: submissions.length ? Math.round((accepted / submissions.length) * 1000) / 10 : null,
        format: "percent",
      },
      { key: "contests", label: "Contests", value: contests.length, format: "number" },
      { key: "contribution", label: "Contribution", value: user.contribution ?? 0, format: "number" },
    ];
    p.breakdowns = [
      {
        key: "topics",
        label: "Solved by tag",
        unit: "problems",
        items: Object.entries(tagCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      },
      {
        key: "languages",
        label: "Submissions by language",
        unit: "submissions",
        items: Object.entries(langCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8),
      },
    ];
    p.ratingHistory = contests.map((c) => ({
      date: new Date((c.ratingUpdateTimeSeconds ?? 0) * 1000).toISOString().slice(0, 10),
      value: c.newRating,
      label: c.contestName,
    }));
    p.activity = Object.entries(activity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);
    p.highlights = contests
      .slice()
      .reverse()
      .slice(0, 5)
      .map((c) => ({
        title: c.contestName,
        subtitle: `Rank ${c.rank}`,
        value: `${c.newRating - c.oldRating >= 0 ? "+" : ""}${c.newRating - c.oldRating}`,
        url: `https://codeforces.com/contest/${c.contestId}`,
      }));
    return p;
  },
};

/* ------------------------------ Codewars ------------------------------- */

const codewars: PlatformAdapter = {
  id: "codewars",
  label: "Codewars",
  fetchProfile: async (handle) => {
    const user = await getJson(`https://www.codewars.com/api/v1/users/${encodeURIComponent(handle)}`);
    if (!user?.username) throw new Error(`Codewars user "${handle}" not found`);
    const langs = user.ranks?.languages ?? {};
    const p = base("codewars", handle);
    p.displayName = user.name || user.username;
    p.profileUrl = `https://www.codewars.com/users/${user.username}`;
    p.location = user.country ?? null;
    p.metrics = [
      { key: "honor", label: "Honor", value: user.honor ?? 0, format: "number" },
      { key: "rank", label: "Overall rank", value: user.ranks?.overall?.name ?? null, format: "text" },
      { key: "score", label: "Overall score", value: user.ranks?.overall?.score ?? 0, format: "number" },
      { key: "solved", label: "Katas completed", value: user.codeChallenges?.totalCompleted ?? 0, format: "number" },
      { key: "authored", label: "Katas authored", value: user.codeChallenges?.totalAuthored ?? 0, format: "number" },
      { key: "leaderboard", label: "Leaderboard position", value: user.leaderboardPosition ?? null, format: "number" },
      { key: "clan", label: "Clan", value: user.clan ?? null, format: "text" },
    ];
    p.breakdowns = [
      {
        key: "languages",
        label: "Score by language",
        unit: "score",
        items: Object.entries(langs)
          .map(([name, v]: [string, any]) => ({ name, value: v?.score ?? 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      },
    ];
    return p;
  },
};

/* ---------------------------- Stack Overflow --------------------------- */

const stackoverflow: PlatformAdapter = {
  id: "stackoverflow",
  label: "Stack Overflow",
  fetchProfile: async (handle) => {
    const id = handle.replace(/[^0-9]/g, "");
    if (!id) throw new Error("Stack Overflow needs a numeric user id, e.g. 22656");
    const res = await getJson(
      `https://api.stackexchange.com/2.3/users/${id}?site=stackoverflow&filter=default`,
    );
    const user = res?.items?.[0];
    if (!user) throw new Error(`Stack Overflow user "${handle}" not found`);
    const tagsRes = await getJson(
      `https://api.stackexchange.com/2.3/users/${id}/top-answer-tags?site=stackoverflow&pagesize=10`,
    ).catch(() => ({ items: [] }));

    const p = base("stackoverflow", handle);
    p.displayName = user.display_name;
    p.avatarUrl = user.profile_image ?? null;
    p.profileUrl = user.link ?? null;
    p.location = user.location ?? null;
    p.joinedAt = user.creation_date ? new Date(user.creation_date * 1000).toISOString() : null;
    p.metrics = [
      { key: "reputation", label: "Reputation", value: user.reputation ?? 0, format: "number" },
      { key: "gold", label: "Gold badges", value: user.badge_counts?.gold ?? 0, format: "number" },
      { key: "silver", label: "Silver badges", value: user.badge_counts?.silver ?? 0, format: "number" },
      { key: "bronze", label: "Bronze badges", value: user.badge_counts?.bronze ?? 0, format: "number" },
      { key: "answers", label: "Answers", value: user.answer_count ?? 0, format: "number" },
      { key: "questions", label: "Questions", value: user.question_count ?? 0, format: "number" },
      { key: "views", label: "Profile views", value: user.view_count ?? 0, format: "number" },
    ];
    p.breakdowns = [
      {
        key: "topics",
        label: "Top answer tags",
        unit: "score",
        items: (tagsRes?.items ?? []).map((t: any) => ({ name: t.tag_name, value: t.answer_score ?? 0 })),
      },
    ];
    return p;
  },
};

export const adapters: Record<string, PlatformAdapter> = {
  github,
  leetcode,
  codeforces,
  codewars,
  stackoverflow,
};

export const supportedPlatforms = Object.keys(adapters);
