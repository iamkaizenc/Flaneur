import { z } from "zod";
import { publicProcedure } from "../../create-context";
// Error classes
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const plansUpgradeInputSchema = z.object({
  targetPlan: z.enum(["premium", "platinum"])
});

// Plan definitions with feature flags
const planDefinitions = {
  free: {
    name: "Free",
    description: "Basic features only",
    price: 0,
    features: {
      analytics: false,
      automation: false,
      maxAccounts: 1,
      dailyPosts: 5,
      aiAgent: false,
      prioritySupport: false
    }
  },
  premium: {
    name: "Premium",
    description: "Growth tracking + analytics",
    price: 29,
    features: {
      analytics: true,
      automation: false,
      maxAccounts: 3,
      dailyPosts: 20,
      aiAgent: true, // Limited to idea and brief only
      prioritySupport: false
    }
  },
  platinum: {
    name: "Platinum",
    description: "Analytics + automation + unlimited",
    price: 99,
    features: {
      analytics: true,
      automation: true,
      maxAccounts: 10,
      dailyPosts: 100,
      aiAgent: true, // Full access including apply
      prioritySupport: true
    }
  }
};

// Mock current user plan (this would come from auth context in real app)
let mockUserPlan = "platinum" as keyof typeof planDefinitions;

export const plansGetCurrentProcedure = publicProcedure
  .query(async () => {
    console.log("[Plans] Fetching current plan and features");
    
    try {
      const currentPlan = planDefinitions[mockUserPlan];
      
      return {
        success: true,
        plan: mockUserPlan,
        ...currentPlan,
        featuresEnabled: {
          ...currentPlan.features,
          description: currentPlan.description
        },
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      };
    } catch (error) {
      console.error('[Plans] Error fetching current plan:', error);
      // Return default plan on error
      return {
        success: true,
        plan: "free" as const,
        name: "Free",
        description: "Basic features only",
        price: 0,
        features: {
          analytics: false,
          automation: false,
          maxAccounts: 1,
          dailyPosts: 5,
          aiAgent: false,
          prioritySupport: false
        },
        featuresEnabled: {
          analytics: false,
          automation: false,
          maxAccounts: 1,
          dailyPosts: 5,
          aiAgent: false,
          prioritySupport: false,
          description: "Basic features only"
        },
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      };
    }
  });

export const plansListProcedure = publicProcedure
  .query(async () => {
    console.log("[Plans] Fetching all available plans");
    
    return {
      success: true,
      plans: Object.entries(planDefinitions).map(([key, plan]) => ({
        id: key,
        ...plan,
        current: key === mockUserPlan
      }))
    };
  });

export const plansUpgradeProcedure = publicProcedure
  .input(plansUpgradeInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Plans] Upgrading to ${input.targetPlan}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[Plans] DRY_RUN mode - simulating upgrade to ${input.targetPlan}`);
      
      // Validate upgrade path
      const currentPlanOrder = { free: 0, premium: 1, platinum: 2 };
      const targetPlanOrder = currentPlanOrder[input.targetPlan];
      const currentOrder = currentPlanOrder[mockUserPlan];
      
      if (targetPlanOrder <= currentOrder) {
        throw new ValidationError(`Cannot downgrade from ${mockUserPlan} to ${input.targetPlan}`);
      }
      
      // Simulate successful upgrade
      mockUserPlan = input.targetPlan;
      
      const newPlan = planDefinitions[input.targetPlan];
      
      return {
        success: true,
        message: `Successfully upgraded to ${newPlan.name} (DRY_RUN mode)`,
        plan: input.targetPlan,
        features: newPlan.features,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    
    // In LIVE mode, this would:
    // 1. Validate purchase receipt from IAP
    // 2. Update user plan in database
    // 3. Enable/disable features based on plan
    // 4. Set up billing cycle
    
    throw new Error("LIVE plan upgrade not implemented - set DRY_RUN=true for demo mode");
  });

export const plansDowngradeProcedure = publicProcedure
  .input(z.object({ targetPlan: z.enum(["free", "premium"]) }))
  .mutation(async ({ input }) => {
    console.log(`[Plans] Downgrading to ${input.targetPlan}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[Plans] DRY_RUN mode - simulating downgrade to ${input.targetPlan}`);
      
      // Validate downgrade path
      const currentPlanOrder = { free: 0, premium: 1, platinum: 2 };
      const targetPlanOrder = currentPlanOrder[input.targetPlan];
      const currentOrder = currentPlanOrder[mockUserPlan];
      
      if (targetPlanOrder >= currentOrder) {
        throw new ValidationError(`Cannot upgrade from ${mockUserPlan} to ${input.targetPlan} using downgrade`);
      }
      
      // Simulate successful downgrade
      mockUserPlan = input.targetPlan;
      
      const newPlan = planDefinitions[input.targetPlan];
      
      return {
        success: true,
        message: `Successfully downgraded to ${newPlan.name} (DRY_RUN mode)`,
        plan: input.targetPlan,
        features: newPlan.features,
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // End of current billing cycle
      };
    }
    
    throw new Error("LIVE plan downgrade not implemented - set DRY_RUN=true for demo mode");
  });

export const plansGetUsageProcedure = publicProcedure
  .query(async () => {
    console.log("[Plans] Fetching current usage statistics");
    
    const currentPlan = planDefinitions[mockUserPlan];
    
    // Mock usage data
    const usage = {
      accounts: {
        used: 2,
        limit: currentPlan.features.maxAccounts,
        remaining: currentPlan.features.maxAccounts - 2
      },
      dailyPosts: {
        used: 8,
        limit: currentPlan.features.dailyPosts,
        remaining: currentPlan.features.dailyPosts - 8,
        resetTime: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString() // 16 hours from now (midnight)
      },
      analytics: {
        enabled: currentPlan.features.analytics,
        dataRetention: currentPlan.features.analytics ? "90 days" : "7 days"
      },
      automation: {
        enabled: currentPlan.features.automation,
        activeRules: currentPlan.features.automation ? 3 : 0
      }
    };
    
    return {
      success: true,
      plan: mockUserPlan,
      usage,
      billingPeriod: {
        start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  });

// Server-side feature gating helper
export const checkFeatureAccess = (feature: keyof typeof planDefinitions.free.features): boolean => {
  const currentPlan = planDefinitions[mockUserPlan];
  return Boolean(currentPlan.features[feature]);
};

// Middleware for feature gating (would be used in other procedures)
export const requireFeature = (feature: keyof typeof planDefinitions.free.features) => {
  return (req: any, res: any, next: any) => {
    if (!checkFeatureAccess(feature)) {
      throw new ValidationError(`Feature '${feature}' requires ${feature === 'analytics' ? 'Premium' : 'Platinum'} plan`);
    }
    next();
  };
};