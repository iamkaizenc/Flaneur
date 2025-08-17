import { z } from "zod";
import { protectedProcedure } from "../../create-context";

// Plan types and features
const planFeatures = {
  free: {
    analytics: false,
    automation: false,
    maxAccounts: 1,
    dailyPosts: 5,
    description: "Basic queue, manual publish only",
  },
  premium: {
    analytics: true,
    automation: false,
    maxAccounts: 3,
    dailyPosts: 20,
    description: "Growth tracking + analytics ON, automation OFF",
  },
  platinum: {
    analytics: true,
    automation: true,
    maxAccounts: 10,
    dailyPosts: 100,
    description: "Analytics + automation ON, unlimited features",
  },
} as const;

type PlanType = keyof typeof planFeatures;

const upgradeSchema = z.object({
  targetPlan: z.enum(["premium", "platinum"]),
});

export const plansGetCurrentProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    // Mock current plan - in real implementation, get from authenticated user
    // For demo purposes, we'll simulate different plan states
    const mockUserId = "demo_user"; // In real implementation, get from ctx.user.id
    
    // Simulate different users having different plans
    let currentPlan: PlanType = "free";
    if (mockUserId.includes("premium")) {
      currentPlan = "premium";
    } else if (mockUserId.includes("platinum")) {
      currentPlan = "platinum";
    }
    
    // For demo, let's default to premium to show features
    currentPlan = "premium";
    
    return {
      plan: currentPlan,
      featuresEnabled: planFeatures[currentPlan],
      allPlans: Object.entries(planFeatures).map(([plan, features]) => ({
        plan: plan as PlanType,
        ...features,
        price: plan === "premium" ? "$9.99/month" : plan === "platinum" ? "$19.99/month" : "Free",
        popular: plan === "premium",
      })),
      subscription: {
        status: "active",
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
      },
    };
  });

export const plansUpgradeProcedure = protectedProcedure
  .input(upgradeSchema)
  .mutation(async ({ input }: { input: z.infer<typeof upgradeSchema> }) => {
    // Mock upgrade - in real implementation, integrate with payment provider
    console.log("Upgrading to plan:", input.targetPlan);
    
    // For DRY_RUN mode, immediately update user plan
    const isDryRun = process.env.DRY_RUN === "true";
    
    if (isDryRun) {
      return {
        success: true,
        message: `Successfully upgraded to ${input.targetPlan} plan (DRY_RUN mode)`,
        newPlan: input.targetPlan,
        featuresEnabled: planFeatures[input.targetPlan],
        upgradedAt: new Date().toISOString(),
      };
    } else {
      // In LIVE mode, this would redirect to payment provider
      return {
        success: false,
        message: "Payment integration not implemented yet",
        paymentUrl: `https://payment-provider.com/checkout?plan=${input.targetPlan}`,
      };
    }
  });

// Server-side feature gate helper
export const checkFeatureAccess = (userPlan: PlanType, feature: keyof typeof planFeatures.platinum) => {
  return planFeatures[userPlan][feature] === true;
};

// Feature gate middleware for tRPC procedures
export const requireFeature = (feature: keyof typeof planFeatures.platinum) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    // Mock user plan - in real implementation, get from authenticated user
    const userPlan: PlanType = "premium";
    
    if (!checkFeatureAccess(userPlan, feature)) {
      throw new Error(`Feature '${feature}' requires ${
        feature === "analytics" ? "Premium" : "Platinum"
      } plan or higher`);
    }
    
    return next({ ctx });
  });
};