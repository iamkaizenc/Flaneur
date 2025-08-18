import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { OnboardingProfileSchema } from "../../../types/schemas";

const createOnboardingSchema = z.object({
  userId: z.string(),
  persona: z.enum(["Creator", "Fitness", "Tech", "Lifestyle"]),
  goal: z.enum(["Para", "Tanınırlık", "Topluluk"]),
});

const getOnboardingSchema = z.object({
  userId: z.string(),
});

export const createOnboardingProcedure = publicProcedure
  .input(createOnboardingSchema)
  .mutation(async ({ input }) => {
    console.log('Creating onboarding profile:', input);

    // In real app, save to database
    const onboardingProfile = {
      id: `onboarding_${input.userId}`,
      userId: input.userId,
      persona: input.persona,
      goal: input.goal,
      completedAt: new Date(),
    };

    return {
      success: true,
      profile: onboardingProfile,
      message: "Profil oluşturuldu! Sahne artık senin.",
    };
  });

export const getOnboardingProcedure = publicProcedure
  .input(getOnboardingSchema)
  .query(async ({ input }) => {
    console.log('Getting onboarding profile for user:', input.userId);

    // Mock existing profile
    const mockProfile = {
      id: `onboarding_${input.userId}`,
      userId: input.userId,
      persona: "Creator" as const,
      goal: "Tanınırlık" as const,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    };

    // Get persona-based content weights
    const contentWeights = getContentWeights(mockProfile.persona, mockProfile.goal);

    return {
      profile: mockProfile,
      contentWeights,
      hasCompleted: true,
    };
  });

function getContentWeights(persona: string, goal: string) {
  const baseWeights = {
    tone: "professional" as const,
    format: "text" as const,
    cta: "engagement" as const,
  };

  // Adjust based on persona
  switch (persona) {
    case "Creator":
      baseWeights.tone = "casual";
      baseWeights.format = "image";
      break;
    case "Fitness":
      baseWeights.tone = "bold";
      baseWeights.format = "video";
      break;
    case "Tech":
      baseWeights.tone = "informative";
      baseWeights.format = "text";
      break;
    case "Lifestyle":
      baseWeights.tone = "humorous";
      baseWeights.format = "carousel";
      break;
  }

  // Adjust based on goal
  switch (goal) {
    case "Para":
      baseWeights.cta = "conversion";
      break;
    case "Tanınırlık":
      baseWeights.cta = "reach";
      break;
    case "Topluluk":
      baseWeights.cta = "engagement";
      break;
  }

  return baseWeights;
}