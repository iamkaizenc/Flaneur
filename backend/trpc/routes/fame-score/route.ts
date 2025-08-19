import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { FameScoreService } from "../../../services/fame-score";

// Mock fame score history storage (for future use)
// const fameScoreHistory: {
//   userId: string;
//   date: string;
//   score: number;
//   reach: number;
//   engagement: number;
//   consistency: number;
// }[] = [];

const fameScoreInputSchema = z.object({
  userId: z.string(),
});

const fameScoreHistoryInputSchema = z.object({
  userId: z.string(),
  days: z.number().min(1).max(30).default(7),
});

export const fameScoreProcedure = publicProcedure
  .input(fameScoreInputSchema)
  .query(async ({ input }) => {
    console.log('Getting FameScore for user:', input.userId);

    // Mock user metrics data with more realistic values
    const mockMetrics = [
      {
        id: "1",
        userId: input.userId,
        date: new Date(),
        fameScore: 0, // Will be calculated
        engagementRate: 4.8,
        postFrequency: 6,
        followerGrowth: 8.3,
        createdAt: new Date(),
      },
    ];

    const result = FameScoreService.calculateFromMetrics(mockMetrics);
    
    if (!result) {
      return {
        score: 0,
        tier: "Yeni Başlangıç",
        trend: [],
        hasData: false,
        breakdown: { reach: 0, engagement: 0, consistency: 0, penalty: 0 },
        insights: [],
      };
    }

    // Generate more realistic 30-day trend data
    const trendData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseScore = result.score;
      const variation = Math.sin(i * 0.2) * 8 + Math.random() * 6 - 3;
      const score = Math.max(0, Math.min(100, baseScore + variation));
      
      return {
        date: date.toISOString().split('T')[0],
        score: Math.round(score),
      };
    }).reverse();

    // Calculate breakdown percentages
    const breakdown = FameScoreService.getBreakdownPercentages(result.normalizedInputs);
    
    // Get insight badges
    const previousScore = trendData[trendData.length - 8]?.score || result.score;
    const insights = FameScoreService.getInsightBadges(result.score, previousScore, mockMetrics[0]);

    return {
      score: result.score,
      tier: result.tier,
      trend: trendData,
      hasData: true,
      breakdown,
      insights,
      tooltip: "Hesap görünürlüğü & etkileşim gücünü ölçer",
      progressText: FameScoreService.getProgressNotificationText(result.score),
    };
  });

export const fameScoreHistoryProcedure = publicProcedure
  .input(fameScoreHistoryInputSchema)
  .query(async ({ input }) => {
    console.log('Getting FameScore history for user:', input.userId, 'days:', input.days);

    // Mock historical data with daily snapshots
    const history = Array.from({ length: input.days }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseScore = 52 + Math.sin(i * 0.15) * 12 + Math.random() * 8;
      const engagementRate = 4.2 + Math.sin(i * 0.1) * 1.5 + Math.random() * 0.8;
      const postFrequency = 5 + Math.sin(i * 0.08) * 2 + Math.random() * 1;
      const followerGrowth = 8 + Math.sin(i * 0.12) * 6 + Math.random() * 4;
      
      return {
        date: date.toISOString().split('T')[0],
        score: Math.round(Math.max(0, Math.min(100, baseScore))),
        reach: Math.round(Math.max(0, Math.min(100, engagementRate * 8))),
        engagement: Math.round(Math.max(0, Math.min(100, engagementRate))),
        consistency: Math.round(Math.max(0, Math.min(100, (postFrequency / 7) * 100))),
        engagementRate,
        postFrequency,
        followerGrowth,
      };
    }).reverse();

    const currentScore = history[history.length - 1]?.score || 0;
    const previousScore = history[Math.max(0, history.length - 8)]?.score || 0;
    const weeklyChange = currentScore - previousScore;

    // Calculate average metrics for the period
    const avgEngagement = history.reduce((sum, h) => sum + h.engagementRate, 0) / history.length;
    const avgFrequency = history.reduce((sum, h) => sum + h.postFrequency, 0) / history.length;
    const avgGrowth = history.reduce((sum, h) => sum + h.followerGrowth, 0) / history.length;

    return {
      history,
      summary: {
        currentScore,
        weeklyChange,
        shouldNotify: FameScoreService.shouldSendProgressNotification(currentScore, previousScore),
        notificationText: FameScoreService.getProgressNotificationText(currentScore),
        averageMetrics: {
          engagement: Math.round(avgEngagement * 10) / 10,
          frequency: Math.round(avgFrequency * 10) / 10,
          growth: Math.round(avgGrowth * 10) / 10,
        },
      },
    };
  });