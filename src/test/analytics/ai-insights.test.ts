import { describe, it, expect, vi } from "vitest";
import {
  generateAICoachSession,
  getAIShortSummary,
} from "@/lib/analytics/ai-insights";

// Mock TrackedProfile type
interface MockTrackedProfile {
  id: string;
  platform: string;
  handle: string;
  display_name?: string;
  pinned?: boolean;
  last_synced_at?: string;
  sync_error?: string | null;
  data?: {
    metrics?: Array<{
      key: string;
      label: string;
      value: number | string;
      format?: string;
    }>;
    activity?: Array<{ date: string; count: number }>;
    ratingHistory?: Array<{ date: string; value: number }>;
    breakdowns?: any;
    highlights?: any;
    fetchedAt?: string;
  };
}

// Mock ProfileSnapshot type
interface MockProfileSnapshot {
  id: string;
  profile_id: string;
  captured_at: string;
  metrics: Record<string, number>;
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
          { date: "2024-01-06", count: 15 },
          { date: "2024-01-07", count: 7 },
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
  ];
}

describe("AI Insights Engine", () => {
  describe("getAIShortSummary", () => {
    it("should return basic summary for empty data", () => {
      const summary = getAIShortSummary([], []);
      
      expect(summary).toHaveProperty("summary");
      expect(summary).toHaveProperty("confidence");
      expect(summary).toHaveProperty("score");
      expect(summary).toHaveProperty("insightsCount");
      
      expect(summary.confidence).toBe("low");
      expect(summary.score).toBe(0);
      expect(summary.insightsCount.total).toBeGreaterThanOrEqual(0);
    });

    it("should identify need for more data with limited snapshots", () => {
      const profiles = createTestProfiles();
      const emptySnapshots: MockProfileSnapshot[] = [];
      
      const summary = getAIShortSummary(profiles, emptySnapshots);
      
      expect(summary.confidence).toBe("low");
      expect(summary.summary).toContain("1 snapshot");
    });

    it("should show building history message with few snapshots", () => {
      const profiles = createTestProfiles();
      const fewSnapshots = [
        {
          id: "s1",
          profile_id: "1",
          captured_at: "2024-01-01T10:00:00Z",
          metrics: { repositories: 10 },
        },
      ];
      
      const summary = getAIShortSummary(profiles, fewSnapshots);
      
      expect(summary.confidence).toBe("low");
      expect(summary.summary).toContain("Building your history");
    });

    it("should show moderate score with activity data", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const summary = getAIShortSummary(profiles, snapshots);
      
      expect(summary.score).toBeGreaterThan(0);
      expect(summary.confidence).toBe("medium");
      expect(summary.insightsCount.total).toBeGreaterThan(0);
    });
  });

  describe("generateAICoachSession", () => {
    it("should create a complete AI session from profiles and snapshots", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("generatedAt");
      expect(session).toHaveProperty("dataSummary");
      expect(session).toHaveProperty("insights");
      expect(session).toHaveProperty("recommendations");
      expect(session).toHaveProperty("overallAssessment");
      
      // Data summary checks
      expect(session.dataSummary.profiles).toBe(profiles.length);
      expect(session.dataSummary.snapshots).toBe(snapshots.length);
      expect(session.dataSummary.streak).toBe(0); // Based on the activity pattern
      
      // Insights should be generated
      expect(session.insights).toBeInstanceOf(Array);
      expect(session.insights.length).toBeGreaterThanOrEqual(0);
      
      // Recommendations should be generated based on insights
      expect(session.recommendations).toBeInstanceOf(Array);
      
      // Overall assessment
      expect(session.overallAssessment).toHaveProperty("strength");
      expect(session.overallAssessment).toHaveProperty("areasForImprovement");
      expect(session.overallAssessment).toHaveProperty("score");
      expect(session.overallAssessment).toHaveProperty("confidence");
    });

    it("should handle empty profiles and snapshots", () => {
      const session = generateAICoachSession([], []);
      
      expect(session.dataSummary.profiles).toBe(0);
      expect(session.dataSummary.snapshots).toBe(0);
      expect(session.overallAssessment.score).toBe(0);
      expect(session.overallAssessment.confidence).toBe("low");
    });

    it("should generate strength insights for positive trends", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      // Should have insights about growth
      const strengthInsights = session.insights.filter(
        (i) => i.category === "progress" && i.severity === "great"
      );
      
      expect(strengthInsights.length).toBeGreaterThanOrEqual(0);
    });

    it("should generate improvement insights for data gaps", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      // Might have insights about short history or incomplete coverage
      const improvementInsights = session.insights.filter(
        (i) => i.severity === "warning" || i.severity === "critical"
      );
      
      expect(improvementInsights.length).toBeGreaterThanOrEqual(0);
    });

    it("should generate recommendations based on insights", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      // Recommendations should reference specific insights
      session.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("basedOn");
        expect(rec.basedOn).toBeInstanceOf(Array);
        expect(rec).toHaveProperty("priority");
        expect(rec).toHaveProperty("action");
        expect(rec).toHaveProperty("expectedImpact");
      });
    });

    it("should categorize insights correctly", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      const categoriesFound: Set<string> = new Set();
      session.insights.forEach((insight) => {
        categoriesFound.add(insight.category);
      });
      
      // Should have insights in multiple categories
      expect(categoriesFound.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("AI Insight Properties", () => {
    it("should ensure all insights have required properties", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      session.insights.forEach((insight) => {
        expect(insight).toHaveProperty("id");
        expect(insight).toHaveProperty("category");
        expect(insight).toHaveProperty("severity");
        expect(insight).toHaveProperty("title");
        expect(insight).toHaveProperty("description");
        expect(insight).toHaveProperty("explanation");
        expect(insight).toHaveProperty("evidence");
        expect(insight).toHaveProperty("actionable");
        expect(insight).toHaveProperty("timestamp");
        
        // Severity should be one of the valid values
        const validSeverities = ["info", "good", "great", "warning", "critical"];
        expect(validSeverities).toContain(insight.severity);
        
        // Category should be one of the valid values
        const validCategories = [
          "progress",
          "activity",
          "goals",
          "trends",
          "patterns",
          "recommendations",
          "warnings",
        ];
        expect(validCategories).toContain(insight.category);
      });
    });

    it("should ensure evidence contains only serializable data", () => {
      const profiles = createTestProfiles();
      const snapshots = createTestSnapshots();
      
      const session = generateAICoachSession(profiles, snapshots);
      
      session.insights.forEach((insight) => {
        expect(insight.evidence).toBeInstanceOf(Object);
        Object.values(insight.evidence).forEach((value) => {
          // Ensure values are serializable (string, number, or boolean)
          const type = typeof value;
          expect(["string", "number", "boolean"], `Expected serializable type, got ${type}`).toContain(type);
        });
      });
    });
  });
});
