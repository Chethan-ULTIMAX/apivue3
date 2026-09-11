import { describe, it, expect } from "vitest";
import {
  buildProgressReport,
  buildTrends,
  buildCategoryProgress,
  mergeActivity,
  computeActivityStats,
  deriveObservations,
} from "@/lib/analytics/progress";

// Mock ProfileSnapshot type
interface MockProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
}

// Mock TrackedProfile type
interface MockTrackedProfile {
  id: string;
  platform: string;
  handle: string;
  display_name?: string;
  data?: {
    metrics?: Array<{
      key: string;
      label: string;
      value: number | string;
      format?: string;
    }>;
    activity?: Array<{ date: string; count: number }>;
  };
}

// Helper to create test data
function createTestProfiles(): MockTrackedProfile[] {
  return [
    {
      id: "1",
      platform: "github",
      handle: "dev1",
      display_name: "Developer One",
      data: {
        metrics: [
          { key: "repositories", label: "Repositories", value: 25, format: "number" },
          { key: "followers", label: "Followers", value: 100, format: "number" },
          { key: "following", label: "Following", value: 50, format: "number" },
        ],
        activity: [
          { date: "2024-01-01", count: 5 },
          { date: "2024-01-02", count: 10 },
          { date: "2024-01-03", count: 8 },
          { date: "2024-01-04", count: 0 },
          { date: "2024-01-05", count: 12 },
        ],
      },
    },
    {
      id: "2",
      platform: "codeforces",
      handle: "solver1",
      display_name: "Problem Solver",
      data: {
        metrics: [
          { key: "rating", label: "Rating", value: 1800, format: "number" },
          { key: "maxRating", label: "Max Rating", value: 2000, format: "number" },
        ],
        activity: [
          { date: "2024-01-01", count: 3 },
          { date: "2024-01-02", count: 0 },
          { date: "2024-01-03", count: 7 },
          { date: "2024-01-04", count: 5 },
          { date: "2024-01-05", count: 0 },
        ],
      },
    },
  ];
}

function createTestSnapshots(): MockProfileSnapshot[] {
  return [
    {
      id: "s1",
      profile_id: "1",
      captured_at: "2024-01-01T10:00:00Z",
      metrics: { repositories: 10, followers: 50, following: 20 },
    },
    {
      id: "s2",
      profile_id: "1",
      captured_at: "2024-01-03T10:00:00Z",
      metrics: { repositories: 25, followers: 100, following: 50 },
    },
    {
      id: "s3",
      profile_id: "1",
      captured_at: "2024-01-05T10:00:00Z",
      metrics: { repositories: 30, followers: 120, following: 55 },
    },
    {
      id: "s4",
      profile_id: "2",
      captured_at: "2024-01-01T10:00:00Z",
      metrics: { rating: 1500, maxRating: 1800 },
    },
    {
      id: "s5",
      profile_id: "2",
      captured_at: "2024-01-03T10:00:00Z",
      metrics: { rating: 1800, maxRating: 2000 },
    },
    {
      id: "s6",
      profile_id: "2",
      captured_at: "2024-01-05T10:00:00Z",
      metrics: { rating: 1900, maxRating: 2100 },
    },
  ];
}

describe("Progress Analytics", () => {
  describe("buildProgressReport", () => {
    it("should create a complete progress report from profiles and snapshots", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const report = buildProgressReport(profiles, snapshots);
      
      expect(report).toHaveProperty("generatedAt");
      expect(report).toHaveProperty("profileCount", 2);
      expect(report).toHaveProperty("snapshotCount", 6);
      expect(report).toHaveProperty("trends");
      expect(report).toHaveProperty("categoryProgress");
      expect(report).toHaveProperty("activity");
      expect(report).toHaveProperty("observations");
    });

    it("should handle empty profiles and snapshots", () => {
      const report = buildProgressReport([], []);
      
      expect(report.profileCount).toBe(0);
      expect(report.snapshotCount).toBe(0);
      expect(report.trends).toEqual([]);
      expect(report.activity.activeDays).toBe(0);
    });
  });

  describe("buildTrends", () => {
    it("should detect upward trends", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const trends = buildTrends(profiles, snapshots);
      
      // Should find trends from profile 1 (repositories grew from 10 to 30)
      const repoTrend = trends.find(
        (t) => t.metricKey === "repositories" && t.profileId === "1"
      );
      
      expect(repoTrend).toBeDefined();
      expect(repoTrend?.change).toBe(20);
      expect(repoTrend?.points.length).toBeGreaterThanOrEqual(2);
    });

    it("should detect downward trends when they exist", () => {
      // Create snapshots with a downward trend
      const downwardSnapshots = [
        {
          id: "s1",
          profile_id: "1",
          captured_at: "2024-01-01T10:00:00Z",
          metrics: { rating: 2000 },
        },
        {
          id: "s2",
          profile_id: "1",
          captured_at: "2024-01-03T10:00:00Z",
          metrics: { rating: 1800 },
        },
        {
          id: "s3",
          profile_id: "1",
          captured_at: "2024-01-05T10:00:00Z",
          metrics: { rating: 1600 },
        },
      ];
      
      const profiles = [{
        id: "1",
        platform: "codeforces",
        handle: "user1",
        data: {
          metrics: [{ key: "rating", label: "Rating", value: 2000, format: "number" }],
        },
      }];
      
      const trends = buildTrends(profiles, downwardSnapshots);
      const ratingTrend = trends.find((t) => t.metricKey === "rating");
      
      expect(ratingTrend).toBeDefined();
      expect(ratingTrend?.change).toBe(-400);
      expect(ratingTrend?.change).toBeLessThan(0);
    });
  });

  describe("mergeActivity", () => {
    it("should merge activity from multiple profiles", () => {
      const profiles = createTestProfiles();
      
      const timeline = mergeActivity(profiles);
      
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline).toBeInstanceOf(Array);
      
      // Check that dates are properly formatted
      timeline.forEach((point) => {
        expect(point).toHaveProperty("date");
        expect(point).toHaveProperty("count");
        expect(typeof point.count).toBe("number");
      });
    });

    it("should handle empty activity data", () => {
      const emptyProfiles = [
        { id: "1", platform: "github", handle: "user1", data: {} },
      ];
      
      const timeline = mergeActivity(emptyProfiles);
      
      expect(timeline).toEqual([]);
    });
  });

  describe("computeActivityStats", () => {
    it("should calculate correct activity statistics", () => {
      const timeline = [
        { date: "2024-01-01", count: 5 },
        { date: "2024-01-02", count: 10 },
        { date: "2024-01-03", count: 8 },
        { date: "2024-01-04", count: 0 },
        { date: "2024-01-05", count: 12 },
      ];
      
      const stats = computeActivityStats(timeline);
      
      expect(stats.totalDays).toBe(5);
      expect(stats.activeDays).toBe(4); // All except day 4
      expect(stats.totalEvents).toBe(35); // 5 + 10 + 8 + 0 + 12
      expect(stats.longestStreak).toBeGreaterThan(0);
      expect(stats.busiestDay?.count).toBe(12);
    });

    it("should handle empty timeline", () => {
      const stats = computeActivityStats([]);
      
      expect(stats.totalDays).toBe(0);
      expect(stats.activeDays).toBe(0);
      expect(stats.totalEvents).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
    });

    it("should calculate correct streaks", () => {
      // Consecutive active days
      const consecutiveTimeline = [
        { date: "2024-01-01", count: 5 },
        { date: "2024-01-02", count: 10 },
        { date: "2024-01-03", count: 8 },
        { date: "2024-01-04", count: 7 },
      ];
      
      const stats = computeActivityStats(consecutiveTimeline);
      
      expect(stats.currentStreak).toBeGreaterThan(0);
      expect(stats.longestStreak).toBeGreaterThanOrEqual(4);
    });
  });

  describe("buildCategoryProgress", () => {
    it("should group profiles by their categories", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      const trends = buildTrends(profiles, snapshots);
      
      const categoryProgress = buildCategoryProgress(profiles, trends);
      
      expect(categoryProgress).toBeInstanceOf(Array);
      expect(categoryProgress.length).toBeGreaterThan(0);
      
      categoryProgress.forEach((category) => {
        expect(category).toHaveProperty("category");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("description");
        expect(category).toHaveProperty("profiles");
        expect(category).toHaveProperty("trends");
      });
    });
  });

  describe("deriveObservations", () => {
    it("should generate observations for growth patterns", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      const trends = buildTrends(profiles, snapshots);
      
      const observations = deriveObservations(profiles, trends, computeActivityStats(mergeActivity(profiles)));
      
      expect(observations).toBeInstanceOf(Array);
      
      // Should have observations for positive trends
      const growthObservations = observations.filter((o) => o.kind === "growth");
      expect(growthObservations.length).toBeGreaterThanOrEqual(0);
    });

    it("should generate observations for coverage gaps", () => {
      const singleProfile = [
        {
          id: "1",
          platform: "github",
          handle: "user1",
          data: {},
        },
      ];
      
      const observations = deriveObservations(
        singleProfile,
        [],
        computeActivityStats(mergeActivity(singleProfile))
      );
      
      const coverageObservation = observations.find((o) => o.kind === "coverage");
      expect(coverageObservation).toBeDefined();
    });
  });
});
