import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { FameScoreService } from "../../../services/fame-score";

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

    // Mock user metrics data
    const mockMetrics = [
      {
        id: "1",
        userId: input.userId,
        date: new Date(),
        fameScore: 0, // Will be calculated
        engagementRate: 4.2,
        postFrequency: 5,
        followerGrowth: 12.5,
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
      };
    }

    // Mock 7-day trend data
    const trendData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: Math.max(0, result.score - Math.random() * 10 + Math.random() * 5),
    })).reverse();

    return {
      score: result.score,
      tier: result.tier,
      trend: trendData,
      hasData: true,
      breakdown: {
        engagement: result.normalizedInputs.engagement,
        frequency: result.normalizedInputs.frequency,
        growth: result.normalizedInputs.growth,
      },
    };
  });

export const fameScoreHistoryProcedure = publicProcedure
  .input(fameScoreHistoryInputSchema)
  .query(async ({ input }) => {
    console.log('Getting FameScore history for user:', input.userId, 'days:', input.days);

    // Mock historical data
    const history = Array.from({ length: input.days }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseScore = 45 + Math.sin(i * 0.2) * 15 + Math.random() * 10;
      
      return {
        date: date.toISOString().split('T')[0],
        score: Math.round(Math.max(0, Math.min(100, baseScore))),
        engagementRate: 3 + Math.random() * 4,
        postFrequency: 3 + Math.random() * 4,
        followerGrowth: -5 + Math.random() * 20,
      };
    }).reverse();

    const currentScore = history[history.length - 1]?.score || 0;
    const previousScore = history[history.length - 8]?.score || 0;
    const weeklyChange = currentScore - previousScore;

    return {
      history,
      summary: {
        currentScore,
        weeklyChange,
        shouldNotify: FameScoreService.shouldSendProgressNotification(currentScore, previousScore),
        notificationText: FameScoreService.getProgressNotificationText(currentScore),
      },
    };
  });