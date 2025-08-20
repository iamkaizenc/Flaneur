import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const insightsListInputSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("7d"),
  type: z.enum(["anomaly", "opportunity"]).optional(),
});

export const insightsListProcedure = publicProcedure
  .input(insightsListInputSchema)
  .query(async ({ input }) => {
    console.log('[Insights] Fetching insights with filters:', input);
    
    try {
      // Mock insights data
      const mockInsights = [
        {
          id: "1",
          type: "opportunity" as const,
          title: "Optimal Engagement Window",
          description: "Your audience demonstrates peak activity between 11 AM - 1 PM. Flâneur recommends concentrating content distribution during this refined timeframe.",
          suggestedAction: "Optimize Schedule",
          severity: "medium" as const,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          linkedContentItemId: null,
        },
        {
          id: "2",
          type: "anomaly" as const,
          title: "X Platform Performance Shift",
          description: "X engagement metrics declined 40% this week. Evening content underperforming against historical benchmarks.",
          suggestedAction: "Refine Strategy",
          severity: "high" as const,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          linkedContentItemId: "2",
        },
        {
          id: "3",
          type: "opportunity" as const,
          title: "Trending Convergence",
          description: "#AutonomousMarketing aligns with your brand positioning. Flâneur can craft sophisticated content leveraging this momentum.",
          suggestedAction: "Generate Content",
          severity: "low" as const,
          createdAt: new Date().toISOString(),
          linkedContentItemId: null,
        },
        {
          id: "4",
          type: "anomaly" as const,
          title: "Instagram Reach Anomaly",
          description: "Instagram posts showing 60% higher reach than usual. Algorithm change detected.",
          suggestedAction: "Increase Instagram Frequency",
          severity: "medium" as const,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          linkedContentItemId: "3",
        },
      ];

      let filtered = mockInsights;
      
      if (input.type) {
        filtered = filtered.filter(insight => insight.type === input.type);
      }
      
      // Filter by date range
      const now = Date.now();
      const rangeMs = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      }[input.range];
      
      filtered = filtered.filter(insight => {
        const insightDate = new Date(insight.createdAt).getTime();
        return now - insightDate <= rangeMs;
      });
      
      return {
        insights: filtered || [],
        summary: {
          total: filtered.length,
          anomalies: filtered.filter(i => i.type === "anomaly").length,
          opportunities: filtered.filter(i => i.type === "opportunity").length,
          highSeverity: filtered.filter(i => i.severity === "high").length,
        },
      };
    } catch (error) {
      console.error('[Insights] Error fetching insights:', error);
      // Return empty but valid structure on error
      return {
        insights: [],
        summary: {
          total: 0,
          anomalies: 0,
          opportunities: 0,
          highSeverity: 0,
        },
      };
    }
  });