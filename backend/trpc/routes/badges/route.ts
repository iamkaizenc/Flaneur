import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { BadgeService } from "../../../services/badge-service";

const badgeInputSchema = z.object({
  userId: z.string(),
});

const streakInputSchema = z.object({
  userId: z.string(),
});

export const badgesProcedure = publicProcedure
  .input(badgeInputSchema)
  .query(async ({ input }) => {
    console.log('Getting badges for user:', input.userId);

    // Mock user data - in real app, fetch from database
    const mockUserMetrics = [
      {
        id: "1",
        userId: input.userId,
        date: new Date(),
        fameScore: 62,
        engagementRate: 4.2,
        postFrequency: 5,
        followerGrowth: 12.5,
        createdAt: new Date(),
      }
    ];

    const mockStreak = {
      id: `streak_${input.userId}`,
      userId: input.userId,
      currentStreak: 5,
      longestStreak: 12,
      lastPostDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      updatedAt: new Date(),
    };

    // Mock totals
    const totalPosts = 23;
    const totalLikes = 156;
    const totalComments = 8;
    const maxReach = 850;

    // Get badge definitions
    const badgeDefinitions = BadgeService.getBadgeDefinitions();

    // Calculate progress for each badge
    const badgeProgress = badgeDefinitions.map((badge, index) => {
      const progress = BadgeService.calculateBadgeProgress(
        badge.type,
        mockUserMetrics,
        mockStreak,
        totalPosts,
        totalLikes,
        totalComments,
        maxReach
      );

      const completed = progress >= 100;
      
      return {
        badgeId: `badge_${index}`,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        progress: Math.round(progress),
        threshold: badge.threshold,
        completed,
        awardedAt: completed ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
      };
    });

    // Mock awarded badges (first 2 completed)
    const awardedBadges = badgeProgress.filter(b => b.completed).slice(0, 2);

    return {
      badges: badgeProgress,
      awardedBadges,
      totalBadges: badgeDefinitions.length,
      completedCount: awardedBadges.length,
    };
  });

export const streakProcedure = publicProcedure
  .input(streakInputSchema)
  .query(async ({ input }) => {
    console.log('Getting streak for user:', input.userId);

    // Mock streak data
    const mockStreak = {
      id: `streak_${input.userId}`,
      userId: input.userId,
      currentStreak: 5,
      longestStreak: 12,
      lastPostDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    const motivationText = BadgeService.getStreakMotivationText(mockStreak.currentStreak);

    return {
      streak: mockStreak,
      motivationText,
      isOnStreak: mockStreak.currentStreak > 0,
      daysUntilNextMilestone: mockStreak.currentStreak < 7 ? 7 - mockStreak.currentStreak : 0,
    };
  });