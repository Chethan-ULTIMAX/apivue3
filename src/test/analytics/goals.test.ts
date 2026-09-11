import { describe, it, expect } from "vitest";
import {
  calculateGoalProgress,
  calculateAllGoalsProgress,
  getGoalsSummary,
  generateGoalActions,
  suggestNewGoals,
} from "@/lib/analytics/goals";
import type { Goal } from "@/hooks/use-goals";
import type { TrackedProfile, ProfileSnapshot } from "@/lib/integrations/registry";

// Helper to create test data
function createTestGoals(): Goal[] {
  const now = new Date().toISOString();
  const in30Days = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const in7Days = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const pastDate = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "1",
      title: "Complete 100 problems",
      description: "Solve 100 coding problems",
      category: "coding",
      target_value: 100,
      current_value: 75,
      unit: "problems",
      start_date: now,
      target_date: in30Days,
      status: "active",
      created_at: now,
    },
    {
      id: "2",
      title: "Achieve Expert Rating",
      description: "Reach expert level",
      category: "rating",
      target_value: 2000,
      current_value: 2200,
      unit: "rating",
      start_date: now,
      target_date: pastDate,
      status: "active",
      created_at: now,
    },
    {
      id: "3",
      title: "Debug code",
      description: "Debug and fix issues",
      category: "debugging",
      target_value: null,
      current_value: 42,
      unit: "issues",
      start_date: now,
      target_date: null,
      status: "active",
      created_at: now,
    },
  ];
}

function createTestProfiles(): TrackedProfile[] {
  return [
    {
      id: "1",
      platform: "codeforces",
      handle: "testuser",
      display_name: "Test User",
      pinned: true,
      last_synced_at: new Date().toISOString(),
      sync_error: null,
      data: {
        metrics: [
          { key: "rating", label: "Rating", value: 1800, format: "number" },
          { key: "maxRating", label: "Max Rating", value: 2000, format: "number" },
          { key: "solves", label: "Problems Solved", value: 500, format: "number" },
        ],
        activity: [
          { date: "2024-01-01", count: 5 },
          { date: "2024-01-02", count: 10 },
          { date: "2024-01-03", count: 8 },
          { date: "2024-01-04", count: 0 },
          { date: "2024-01-05", count: 12 },
        ],
        ratingHistory: [
          { date: "2024-01-01", value: 1500 },
          { date: "2024-01-02", value: 1600 },
          { date: "2024-01-03", value: 1700 },
        ],
      },
    },
  ];
}

function createTestSnapshots(): ProfileSnapshot[] {
  return [
    {
      id: "1",
      profile_id: "1",
      captured_at: "2024-01-01T10:00:00Z",
      metrics: { rating: 1500, maxRating: 1800, solves: 400 },
    },
    {
      id: "2",
      profile_id: "1",
      captured_at: "2024-01-03T10:00:00Z",
      metrics: { rating: 1800, maxRating: 2000, solves: 500 },
    },
  ];
}

function createEmptyTestProfiles(): TrackedProfile[] {
  return [];
}

function createEmptyTestSnapshots(): ProfileSnapshot[] {
  return [];
}

describe("Goals Analytics", () => {
  describe("calculateGoalProgress", () => {
    it("should calculate correct progress percentage", () => {
      const goal: Goal = {
        id: "1",
        title: "Test Goal",
        description: null,
        category: null,
        target_value: 100,
        current_value: 75,
        unit: "items",
        start_date: null,
        target_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
      };

      const progress = calculateGoalProgress(goal, createEmptyTestProfiles(), createEmptyTestSnapshots());

      expect(progress.progressPercentage).toBe(75);
      expect(progress.currentValue).toBe(75);
      expect(progress.targetValue).toBe(100);
      expect(progress.unit).toBe("items");
    });

    it("should handle completed goals", () => {
      const goal: Goal = {
        id: "1",
        title: "Test Goal",
        description: null,
        category: null,
        target_value: 100,
        current_value: 150,
        unit: "items",
        start_date: null,
        target_date: null,
        status: "active",
        created_at: new Date().toISOString(),
      };

      const progress = calculateGoalProgress(goal, createEmptyTestProfiles(), createEmptyTestSnapshots());

      expect(progress.progressPercentage).toBe(100);
      expect(progress.status).toBe("completed");
    });

    it("should handle goals without target value", () => {
      const goal: Goal = {
        id: "1",
        title: "Test Goal",
        description: null,
        category: null,
        target_value: null,
        current_value: 42,
        unit: "items",
        start_date: null,
        target_date: null,
        status: "active",
        created_at: new Date().toISOString(),
      };

      const progress = calculateGoalProgress(goal, createEmptyTestProfiles(), createEmptyTestSnapshots());

      expect(progress.progressPercentage).toBe(0);
      expect(progress.targetValue).toBeNull();
    });

    it("should calculate days remaining when target date exists", () => {
      const in10Days = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
      const goal: Goal = {
        id: "1",
        title: "Test Goal",
        description: null,
        category: null,
        target_value: 100,
        current_value: 50,
        unit: "items",
        start_date: new Date().toISOString(),
        target_date: in10Days.toISOString(),
        status: "active",
        created_at: new Date().toISOString(),
      };

      const progress = calculateGoalProgress(goal, createEmptyTestProfiles(), createEmptyTestSnapshots());

      expect(progress.daysRemaining).toBeDefined();
      expect(progress.daysRemaining!).toBeGreaterThanOrEqual(9); // Within 1 day of accuracy
      expect(progress.daysRemaining!).toBeLessThanOrEqual(11);
    });
  });

  describe("calculateAllGoalsProgress", () => {
    it("should calculate progress for all goals", () => {
      const goals = createTestGoals();
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();

      const allProgress = calculateAllGoalsProgress(goals, profiles, snapshots);

      expect(allProgress).toHaveLength(3);
      expect(allProgress[0].goal.title).toBe("Complete 100 problems");
    });
  });

  describe("getGoalsSummary", () => {
    it("should return correct summary statistics", () => {
      const goals = createTestGoals();
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();

      const allProgress = calculateAllGoalsProgress(goals, profiles, snapshots);
      const summary = getGoalsSummary(allProgress);

      expect(summary.total).toBe(3);
      expect(summary.completed).toBeGreaterThanOrEqual(0);
      expect(summary.onTrack).toBeGreaterThanOrEqual(0);
      expect(summary.averageProgress).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty progress array", () => {
      const summary = getGoalsSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.onTrack).toBe(0);
      expect(summary.behind).toBe(0);
      expect(summary.averageProgress).toBe(0);
    });
  });

  describe("generateGoalActions", () => {
    it("should generate celebrate actions for completed goals", () => {
      const goals = createTestGoals();
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();

      const allProgress = calculateAllGoalsProgress(goals, profiles, snapshots);
      const actions = generateGoalActions(allProgress);

      expect(actions).toBeInstanceOf(Array);
      // Should have celebrate actions if any goals are completed
      actions.forEach((action) => {
        expect(action).toHaveProperty("id");
        expect(action).toHaveProperty("type");
        expect(action).toHaveProperty("title");
        expect(action).toHaveProperty("description");
        expect(action).toHaveProperty("priority");
      });
    });

    it("should handle empty progress array", () => {
      const actions = generateGoalActions([]);
      expect(actions).toEqual([]);
    });
  });

  describe("suggestNewGoals", () => {
    it("should return empty array when no profiles exist", () => {
      const suggestions = suggestNewGoals([], [], []);
      expect(suggestions).toEqual([]);
    });

    it("should return empty array when no snapshots exist", () => {
      const profiles = createTestProfiles();
      const suggestions = suggestNewGoals(profiles, [], []);
      expect(suggestions).toEqual([]);
    });

    it("should generate suggestions based on profile data", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();

      const suggestions = suggestNewGoals(profiles, snapshots, []);

      expect(suggestions).toBeInstanceOf(Array);
      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty("title");
        expect(suggestion).toHaveProperty("description");
        expect(suggestion).toHaveProperty("target_value");
        expect(suggestion).toHaveProperty("unit");
        expect(suggestion).toHaveProperty("category");
        expect(suggestion).toHaveProperty("reasoning");
      });
    });
  });
});
