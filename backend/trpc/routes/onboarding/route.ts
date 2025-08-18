import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { OnboardingProfileSchema } from "../../../types/schemas";

const createOnboardingSchema = z.object({
  userId: z.string(),
  age: z.number().min(13).max(100),
  role: z.string(),
  niche: z.string(),
  goals: z.enum(["para", "tananirlik", "topluluk"]),
  timeAvailability: z.enum(["az", "orta", "yuksek"]),
});

const getOnboardingSchema = z.object({
  userId: z.string(),
});

export const createOnboardingProcedure = publicProcedure
  .input(createOnboardingSchema)
  .mutation(async ({ input }) => {
    console.log('Creating onboarding profile:', input);

    // Generate guidance based on persona
    const guidance = generatePersonaGuidance(input);

    // In real app, save to database
    const onboardingProfile = {
      id: `onboarding_${input.userId}`,
      userId: input.userId,
      age: input.age,
      role: input.role,
      niche: input.niche,
      goals: input.goals,
      timeAvailability: input.timeAvailability,
      guidance,
      completedAt: new Date(),
    };

    return {
      success: true,
      profile: onboardingProfile,
      guidance,
      message: "Profil oluşturuldu! Sahne artık senin.",
    };
  });

export const getOnboardingProcedure = publicProcedure
  .input(getOnboardingSchema)
  .query(async ({ input }) => {
    console.log('Getting onboarding profile for user:', input.userId);

    // Mock existing profile - demo data for "ev hanımı, yemek, 29 yaş"
    const mockProfile = {
      id: `onboarding_${input.userId}`,
      userId: input.userId,
      age: 29,
      role: "ev hanimi",
      niche: "yemek",
      goals: "tananirlik" as const,
      timeAvailability: "az" as const,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    };

    // Generate guidance based on profile
    const guidance = generatePersonaGuidance(mockProfile);

    return {
      profile: mockProfile,
      guidance,
      hasCompleted: true,
    };
  });

interface PersonaProfile {
  age: number;
  role: string;
  niche: string;
  goals: "para" | "tananirlik" | "topluluk";
  timeAvailability: "az" | "orta" | "yuksek";
}

interface PersonaGuidance {
  contentMix: {
    video: number;
    image: number;
    text: number;
  };
  cadence: {
    IG: number; // posts per week
    X: number;
    TG: number;
  };
  windows: string[];
  postingRules: {
    platformPriority: string[];
    contentTypes: string[];
    optimalTimes: string[];
  };
  why: string[];
  bannerText: string;
}

function generatePersonaGuidance(profile: PersonaProfile): PersonaGuidance {
  const guidance: PersonaGuidance = {
    contentMix: { video: 30, image: 40, text: 30 },
    cadence: { IG: 3, X: 5, TG: 2 },
    windows: ["morning", "afternoon"],
    postingRules: {
      platformPriority: ["instagram", "x", "telegram"],
      contentTypes: ["image", "text", "video"],
      optimalTimes: ["09:00", "13:00", "18:00"]
    },
    why: [],
    bannerText: "Senin Yolun"
  };

  // Niche-specific adjustments
  if (profile.niche === "yemek") {
    if (profile.role.includes("ev hanimi") && profile.age >= 25) {
      guidance.contentMix = { video: 30, image: 40, text: 30 };
      guidance.cadence = { IG: 5, X: 3, TG: 2 };
      guidance.windows = ["morning", "afternoon"];
      guidance.why.push("Yemek içerikleri sabah ve öğle saatlerinde daha çok ilgi görür");
      guidance.why.push("Ev hanımları için pratik tarifler ve fotoğraflar etkili");
    }
  }

  // Time availability adjustments
  if (profile.timeAvailability === "az") {
    guidance.contentMix.video = Math.max(20, guidance.contentMix.video - 10);
    guidance.contentMix.image += 5;
    guidance.contentMix.text += 5;
    guidance.cadence.IG = Math.max(2, guidance.cadence.IG - 2);
    guidance.cadence.X = Math.max(2, guidance.cadence.X - 1);
    guidance.why.push("Zamanın kısıtlı olduğu için daha az video, daha çok fotoğraf öneriyoruz");
    guidance.why.push("Hızlı hazırlanabilir içerikler tercih edildi");
  }

  // Goal-based adjustments
  if (profile.goals === "para") {
    guidance.postingRules.contentTypes.unshift("affiliate", "product");
    guidance.why.push("Para kazanmak için ürün tanıtımları ve affiliate linkler eklendi");
  } else if (profile.goals === "tananirlik") {
    guidance.postingRules.platformPriority = ["x", "instagram", "telegram"];
    guidance.cadence.X += 2;
    guidance.why.push("Tanınırlık için X platformu önceliklendirildi");
  } else if (profile.goals === "topluluk") {
    guidance.cadence.TG += 1;
    guidance.postingRules.contentTypes.push("community", "engagement");
    guidance.why.push("Topluluk oluşturmak için Telegram ve etkileşim odaklı içerikler");
  }

  return guidance;
}