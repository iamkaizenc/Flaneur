import { z } from "zod";
import { publicProcedure } from "../../create-context";

const challengeInputSchema = z.object({
  userId: z.string(),
});

const updateChallengeSchema = z.object({
  userId: z.string(),
  type: z.enum(["posts", "reels", "live"]),
  increment: z.number().default(1),
});

export const weeklyChallengesProcedure = publicProcedure
  .input(challengeInputSchema)
  .query(async ({ input }) => {
    console.log('Getting weekly challenge for user:', input.userId);

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Mock current challenge
    const mockChallenge = {
      id: `challenge_${input.userId}_${weekStart.getTime()}`,
      userId: input.userId,
      weekStart,
      targetPosts: 3,
      targetReels: 1,
      targetLive: 0,
      currentPosts: 2,
      currentReels: 0,
      currentLive: 0,
      completed: false,
      bonusAwarded: false,
      createdAt: weekStart,
      updatedAt: new Date(),
    };

    const totalProgress = mockChallenge.currentPosts + mockChallenge.currentReels + mockChallenge.currentLive;
    const totalTarget = mockChallenge.targetPosts + mockChallenge.targetReels + mockChallenge.targetLive;
    const progressPercentage = Math.round((totalProgress / totalTarget) * 100);

    const isCompleted = mockChallenge.currentPosts >= mockChallenge.targetPosts &&
                      mockChallenge.currentReels >= mockChallenge.targetReels &&
                      mockChallenge.currentLive >= mockChallenge.targetLive;

    return {
      challenge: {
        ...mockChallenge,
        completed: isCompleted,
      },
      progress: {
        posts: {
          current: mockChallenge.currentPosts,
          target: mockChallenge.targetPosts,
          percentage: Math.round((mockChallenge.currentPosts / mockChallenge.targetPosts) * 100),
        },
        reels: {
          current: mockChallenge.currentReels,
          target: mockChallenge.targetReels,
          percentage: mockChallenge.targetReels > 0 ? Math.round((mockChallenge.currentReels / mockChallenge.targetReels) * 100) : 100,
        },
        live: {
          current: mockChallenge.currentLive,
          target: mockChallenge.targetLive,
          percentage: mockChallenge.targetLive > 0 ? Math.round((mockChallenge.currentLive / mockChallenge.targetLive) * 100) : 100,
        },
        overall: progressPercentage,
      },
      isCompleted,
      canClaimBonus: isCompleted && !mockChallenge.bonusAwarded,
      daysLeft: 7 - Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)),
    };
  });

export const updateChallengeProcedure = publicProcedure
  .input(updateChallengeSchema)
  .mutation(async ({ input }) => {
    console.log('Updating challenge progress:', input);

    // In real app, update database
    // For now, return success
    return {
      success: true,
      message: `${input.type} progress updated by ${input.increment}`,
    };
  });

export const claimBonusProcedure = publicProcedure
  .input(challengeInputSchema)
  .mutation(async ({ input }) => {
    console.log('Claiming weekly challenge bonus for user:', input.userId);

    // In real app, award +5 FameScore bonus and mark as claimed
    return {
      success: true,
      bonusAwarded: 5,
      message: "🎉 Haftalık challenge tamamlandı! +5 FameScore kazandın!",
    };
  });