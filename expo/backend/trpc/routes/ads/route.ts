import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Mock ad placements for DRY_RUN mode
const mockAds = [
  {
    id: "ad_1",
    type: "banner",
    title: "Boost Your Social Media",
    description: "Get 10x more engagement with AI-powered content",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200",
    ctaText: "Learn More",
    targetUrl: "https://flaneurcollective.com/premium",
    placement: "settings_footer"
  },
  {
    id: "ad_2", 
    type: "card",
    title: "Upgrade to Premium",
    description: "Unlock advanced analytics and automation features",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200",
    ctaText: "Upgrade Now",
    targetUrl: "https://flaneurcollective.com/pricing",
    placement: "growth_under_chart"
  },
  {
    id: "ad_3",
    type: "native",
    title: "Content Creation Tips",
    description: "5 secrets to viral social media posts",
    imageUrl: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=200", 
    ctaText: "Read Article",
    targetUrl: "https://flaneurcollective.com/blog/viral-posts",
    placement: "content_list_item"
  },
  {
    id: "ad_4",
    type: "interstitial",
    title: "Flâneur Pro",
    description: "The complete social media automation suite",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300",
    ctaText: "Start Free Trial",
    targetUrl: "https://flaneurcollective.com/trial",
    placement: "modal"
  }
];

// Get ads for specific placement
export const getAdsProcedure = publicProcedure
  .input(z.object({
    placement: z.enum(['settings_footer', 'growth_under_chart', 'content_list_item', 'modal']),
    userPlan: z.enum(['free', 'premium', 'platinum']).default('free'),
    limit: z.number().min(1).max(10).default(1)
  }))
  .query(async ({ input }) => {
    // Only show ads to free users when ADS_ENABLED=true
    const adsEnabled = process.env.ADS_ENABLED === 'true';
    const shouldShowAds = adsEnabled && input.userPlan === 'free';
    
    if (!shouldShowAds) {
      return {
        ads: [],
        placement: input.placement,
        userPlan: input.userPlan,
        adsEnabled,
        reason: input.userPlan !== 'free' ? 'Premium/Platinum users see no ads' : 'Ads disabled'
      };
    }
    
    // Filter ads by placement
    const placementAds = mockAds.filter(ad => ad.placement === input.placement);
    
    // Randomize and limit
    const shuffled = placementAds.sort(() => Math.random() - 0.5);
    const selectedAds = shuffled.slice(0, input.limit);
    
    // Add DRY_RUN indicators
    const adsWithDryRun = selectedAds.map(ad => ({
      ...ad,
      isDryRun: true,
      impressionId: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }));
    
    console.log(`[Ads] Serving ${adsWithDryRun.length} ads for ${input.placement} to ${input.userPlan} user`);
    
    return {
      ads: adsWithDryRun,
      placement: input.placement,
      userPlan: input.userPlan,
      adsEnabled,
      totalAvailable: placementAds.length
    };
  });

// Track ad impression (DRY_RUN mode)
export const trackAdImpressionProcedure = publicProcedure
  .input(z.object({
    adId: z.string(),
    impressionId: z.string(),
    placement: z.string(),
    userPlan: z.string()
  }))
  .mutation(async ({ input }) => {
    // In DRY_RUN mode, just log the impression
    console.log(`[Ads] DRY_RUN impression tracked: ${input.adId} at ${input.placement} for ${input.userPlan} user`);
    
    return {
      success: true,
      message: "Ad impression tracked (DRY_RUN mode)",
      adId: input.adId,
      impressionId: input.impressionId,
      timestamp: new Date().toISOString(),
      isDryRun: true
    };
  });

// Track ad click (DRY_RUN mode)
export const trackAdClickProcedure = publicProcedure
  .input(z.object({
    adId: z.string(),
    impressionId: z.string(),
    placement: z.string(),
    targetUrl: z.string(),
    userPlan: z.string()
  }))
  .mutation(async ({ input }) => {
    // In DRY_RUN mode, just log the click
    console.log(`[Ads] DRY_RUN click tracked: ${input.adId} -> ${input.targetUrl} from ${input.placement}`);
    
    return {
      success: true,
      message: "Ad click tracked (DRY_RUN mode)",
      adId: input.adId,
      impressionId: input.impressionId,
      targetUrl: input.targetUrl,
      timestamp: new Date().toISOString(),
      isDryRun: true,
      // In real implementation, would return redirect URL or handle navigation
      shouldRedirect: false
    };
  });

// Get ad performance stats (admin/debug)
export const getAdStatsProcedure = publicProcedure
  .query(async () => {
    // Mock performance data
    const stats = {
      totalAds: mockAds.length,
      adsByPlacement: {
        settings_footer: mockAds.filter(ad => ad.placement === 'settings_footer').length,
        growth_under_chart: mockAds.filter(ad => ad.placement === 'growth_under_chart').length,
        content_list_item: mockAds.filter(ad => ad.placement === 'content_list_item').length,
        modal: mockAds.filter(ad => ad.placement === 'modal').length
      },
      performance: {
        impressions: Math.floor(Math.random() * 10000) + 5000,
        clicks: Math.floor(Math.random() * 500) + 100,
        ctr: (Math.random() * 0.05 + 0.01).toFixed(3), // 1-6% CTR
        revenue: (Math.random() * 100 + 50).toFixed(2)
      },
      settings: {
        adsEnabled: process.env.ADS_ENABLED === 'true',
        dryRunMode: process.env.DRY_RUN === 'true',
        targetPlans: ['free']
      }
    };
    
    return stats;
  });

// Configure ad settings (admin)
export const updateAdSettingsProcedure = publicProcedure
  .input(z.object({
    adsEnabled: z.boolean(),
    targetPlans: z.array(z.enum(['free', 'premium', 'platinum'])).default(['free']),
    placements: z.array(z.string()).optional()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Ads] Settings updated: enabled=${input.adsEnabled}, targets=${input.targetPlans.join(',')}`);
    
    // In production, would update environment variables or database settings
    return {
      success: true,
      message: "Ad settings updated successfully",
      settings: {
        adsEnabled: input.adsEnabled,
        targetPlans: input.targetPlans,
        placements: input.placements || ['settings_footer', 'growth_under_chart', 'content_list_item'],
        updatedAt: new Date().toISOString()
      }
    };
  });

// Get paywall content for free users
export const getPaywallContentProcedure = publicProcedure
  .input(z.object({
    feature: z.enum(['automation', 'analytics', 'advanced_insights', 'unlimited_accounts']),
    userPlan: z.enum(['free', 'premium', 'platinum'])
  }))
  .query(async ({ input }) => {
    const paywallContent = {
      automation: {
        title: "Automation Locked",
        description: "Upgrade to Premium or Platinum to enable automated posting and scheduling.",
        features: ["Auto-posting", "Smart scheduling", "Queue management"],
        requiredPlan: "premium",
        ctaText: "Upgrade to Premium"
      },
      analytics: {
        title: "Analytics Locked", 
        description: "Get detailed insights and performance tracking with Premium or Platinum.",
        features: ["Growth analytics", "Engagement insights", "Performance reports"],
        requiredPlan: "premium",
        ctaText: "Upgrade to Premium"
      },
      advanced_insights: {
        title: "Advanced Insights Locked",
        description: "Unlock AI-powered insights and anomaly detection with Platinum.",
        features: ["AI insights", "Anomaly detection", "Predictive analytics"],
        requiredPlan: "platinum", 
        ctaText: "Upgrade to Platinum"
      },
      unlimited_accounts: {
        title: "Account Limit Reached",
        description: "Connect unlimited social accounts with Platinum plan.",
        features: ["Unlimited accounts", "Cross-platform posting", "Unified analytics"],
        requiredPlan: "platinum",
        ctaText: "Upgrade to Platinum"
      }
    };
    
    const content = paywallContent[input.feature];
    const hasAccess = input.userPlan !== 'free' && 
      (content.requiredPlan === 'premium' || 
       (content.requiredPlan === 'platinum' && input.userPlan === 'platinum'));
    
    return {
      feature: input.feature,
      userPlan: input.userPlan,
      hasAccess,
      paywall: hasAccess ? null : {
        ...content,
        upgradeUrl: `https://flaneurcollective.com/upgrade?plan=${content.requiredPlan}&feature=${input.feature}`
      }
    };
  });