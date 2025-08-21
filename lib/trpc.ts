import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

// Mock data fallbacks for when tRPC server is not available
export const mockFallbacks = {
  'content.list': {
    items: [
      {
        id: '1',
        title: 'AI-Powered Social Media Strategy',
        platform: 'x',
        status: 'queued' as const,
        scheduledAt: 'Today at 2:00 PM',
        preview: 'Discover how AI is revolutionizing social media marketing with autonomous content creation and intelligent scheduling.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'The Future of Digital Marketing',
        platform: 'linkedin',
        status: 'published' as const,
        scheduledAt: 'Today at 10:00 AM',
        preview: 'Exploring the intersection of artificial intelligence and marketing automation in the modern digital landscape.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Autonomous Content Creation',
        platform: 'instagram',
        status: 'draft' as const,
        scheduledAt: 'Tomorrow at 9:00 AM',
        preview: 'How Flâneur creates sophisticated content that resonates with your audience while maintaining your unique brand voice.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    total: 3,
    hasMore: false,
    publisherStats: {
      x: { used: 2, limit: 10, remaining: 8 },
      instagram: { used: 1, limit: 5, remaining: 4 },
      linkedin: { used: 1, limit: 3, remaining: 2 },
      tiktok: { used: 0, limit: 3, remaining: 3 },
      facebook: { used: 0, limit: 5, remaining: 5 },
      telegram: { used: 0, limit: 10, remaining: 10 }
    },
    queueStatus: {
      draft: 1,
      queued: 1,
      published: 1,
      held: 0,
      error: 0
    },
    publishingWindow: {
      start: 8,
      end: 22,
      currentHour: new Date().getHours(),
      isActive: true
    }
  },
  'insights.list': {
    insights: [
      {
        id: '1',
        type: 'opportunity' as const,
        title: 'Peak Engagement Window',
        description: 'Your audience shows highest activity between 2-4 PM. Consider scheduling more content during this time.',
        suggestedAction: 'Optimize Schedule',
        severity: 'medium' as const,
        createdAt: new Date().toISOString(),
        linkedContentItemId: null
      },
      {
        id: '2',
        type: 'anomaly' as const,
        title: 'LinkedIn Performance Drop',
        description: 'LinkedIn engagement decreased by 25% this week compared to last week.',
        suggestedAction: 'Review Content Strategy',
        severity: 'high' as const,
        createdAt: new Date().toISOString(),
        linkedContentItemId: '2'
      }
    ],
    summary: {
      total: 2,
      anomalies: 1,
      opportunities: 1,
      highSeverity: 1
    }
  },
  'fameScore.get': {
    score: 72,
    tier: 'Yükselen Yıldız',
    trend: [
      { date: '2024-01-15', score: 65 },
      { date: '2024-01-16', score: 68 },
      { date: '2024-01-17', score: 70 },
      { date: '2024-01-18', score: 72 }
    ],
    hasData: true,
    breakdown: { reach: 25, engagement: 20, consistency: 18, penalty: -3 },
    insights: [
      'Consistent posting schedule boosting your score',
      'High engagement rate on LinkedIn content',
      'Consider diversifying content types'
    ],
    tooltip: 'Hesap görünürlüğü & etkileşim gücünü ölçer',
    progressText: 'Güçlü performans gösteriyorsun!'
  },
  'content.logs': {
    logs: [
      {
        id: '1',
        contentId: '2',
        action: 'published',
        platform: 'linkedin',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        details: 'Successfully published to LinkedIn',
        success: true
      },
      {
        id: '2',
        contentId: '1',
        action: 'queued',
        platform: 'x',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        details: 'Content queued for publishing at 2:00 PM',
        success: true
      }
    ],
    total: 2,
    hasMore: false
  },
  'challenges.weekly': {
    challenge: {
      id: 'week-2024-01-15',
      userId: 'user-1',
      weekStart: new Date(),
      targetPosts: 5,
      targetReels: 2,
      targetLive: 1,
      currentPosts: 3,
      currentReels: 1,
      currentLive: 0,
      completed: false,
      bonusAwarded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    progress: {
      posts: { current: 3, target: 5, percentage: 60 },
      reels: { current: 1, target: 2, percentage: 50 },
      live: { current: 0, target: 1, percentage: 0 },
      overall: 44
    },
    isCompleted: false,
    canClaimBonus: false,
    daysLeft: 4
  },
  'badges.list': {
    badges: [
      {
        id: 'first-post',
        name: 'İlk Adım',
        description: 'İlk içeriğini paylaştın',
        icon: '🎯',
        earned: true,
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'consistent-week',
        name: 'Tutarlı Hafta',
        description: '7 gün boyunca her gün içerik paylaştın',
        icon: '🔥',
        earned: false,
        earnedAt: null
      },
      {
        id: 'engagement-master',
        name: 'Etkileşim Ustası',
        description: '%5 üzeri etkileşim oranına ulaştın',
        icon: '⚡',
        earned: true,
        earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    awardedBadges: [
      {
        id: 'first-post',
        name: 'İlk Adım',
        description: 'İlk içeriğini paylaştın',
        icon: '🎯',
        earned: true,
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'engagement-master',
        name: 'Etkileşim Ustası',
        description: '%5 üzeri etkileşim oranına ulaştın',
        icon: '⚡',
        earned: true,
        earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    totalBadges: 3,
    completedCount: 2
  },
  'badges.streak': {
    streak: {
      id: 'streak-user-1',
      userId: 'user-1',
      currentStreak: 4,
      longestStreak: 7,
      lastPostDate: new Date(),
      updatedAt: new Date()
    },
    motivationText: '4 günlük serinde! Devam et!',
    isOnStreak: true,
    daysUntilNextMilestone: 3
  },
  'risk.getStatus': {
    shadowban: {
      detected: false,
      riskLevel: 'low' as const,
      reason: undefined
    },
    quotas: {},
    alerts: [],
    healthScore: 90,
    recommendations: ['Mevcut stratejini sürdür']
  },
  'settings.get': {
    success: true,
    accounts: [
      {
        platform: 'x',
        handle: '@flaneur_demo',
        displayName: 'Flâneur Demo',
        scopes: ['tweet.read', 'tweet.write', 'users.read'],
        status: 'connected' as const,
        lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        platform: 'linkedin',
        handle: 'flaneur-demo',
        displayName: 'Flâneur Demo Company',
        scopes: ['r_liteprofile', 'w_member_social'],
        status: 'connected' as const,
        lastRefresh: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ],
    quotas: {
      dailyLimits: {
        X: 10,
        Instagram: 5,
        LinkedIn: 3,
        TikTok: 3,
        Facebook: 5,
        Telegram: 10
      },
      postingWindow: { start: 8, end: 22 },
      dryRun: true
    },
    guardrails: {
      bannedWords: ['spam', 'fake', 'scam'],
      bannedTags: ['#crypto', '#investment'],
      riskLevel: 'normal' as const
    },
    notifications: {
      emails: ['demo@flaneur.app'],
      telegramChatId: '-1001234567890',
      notifyOn: ['publish_error', 'held', 'anomaly']
    },
    branding: {
      logoWordmarkEnabled: true,
      theme: 'black-white' as const
    }
  },
  'auth.me': {
    id: 'user-1',
    email: 'demo@flaneur.app',
    displayName: 'Demo User',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    plan: 'platinum' as const,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  'oauth.listAccounts': {
    accounts: [
      {
        id: 'acc_x_demo',
        platform: 'x',
        handle: '@flaneur_demo',
        displayName: 'Flâneur Demo',
        status: 'connected' as const,
        lastRefresh: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['tweet.read', 'tweet.write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'acc_linkedin_demo',
        platform: 'linkedin',
        handle: 'flaneur-demo',
        displayName: 'Flâneur Demo Company',
        status: 'connected' as const,
        lastRefresh: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ['w_member_social', 'r_liteprofile'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    total: 2
  },
  'plans.getCurrent': {
    success: true,
    plan: 'platinum' as const,
    name: 'Platinum',
    description: 'Analytics + automation + unlimited',
    price: 99,
    features: {
      analytics: true,
      automation: true,
      maxAccounts: 10,
      dailyPosts: 100,
      aiAgent: true,
      prioritySupport: true
    },
    featuresEnabled: {
      analytics: true,
      automation: true,
      maxAccounts: 10,
      dailyPosts: 100,
      aiAgent: true,
      prioritySupport: true,
      description: 'Analytics + automation + unlimited'
    },
    billingCycle: 'monthly' as const,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false
  },
  'onboarding.get': {
    profile: {
      businessType: 'technology',
      targetAudience: 'professionals',
      contentGoals: ['brand_awareness', 'lead_generation'],
      preferredTone: 'professional'
    },
    guidance: {
      nextSteps: [
        'Connect your social media accounts',
        'Set up your posting schedule',
        'Review content suggestions'
      ],
      completedSteps: ['profile_setup', 'goal_setting']
    },
    hasCompleted: true
  },
  'example.hi': {
    message: 'Hello from tRPC! Server is working properly.',
    timestamp: new Date().toISOString()
  },
  'billing.getCurrent': {
    success: true,
    plan: 'free' as const,
    name: 'Free',
    description: 'Basic features for getting started',
    price: 0,
    features: {
      analytics: false,
      automation: false,
      maxAccounts: 1,
      dailyPosts: 5,
      aiAgent: false,
      prioritySupport: false
    },
    billingCycle: 'monthly' as const,
    status: 'active' as const,
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  'billing.list': {
    success: true,
    plans: [
      {
        id: 'free',
        name: 'Free',
        description: 'Basic features for getting started',
        price: 0,
        features: {
          analytics: false,
          automation: false,
          maxAccounts: 1,
          dailyPosts: 5,
          aiAgent: false,
          prioritySupport: false
        },
        popular: false
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Advanced features for growing creators',
        price: 29,
        priceYearly: 290,
        features: {
          analytics: true,
          automation: true,
          maxAccounts: 3,
          dailyPosts: 25,
          aiAgent: true,
          prioritySupport: false
        },
        popular: true
      },
      {
        id: 'platinum',
        name: 'Platinum',
        description: 'Everything you need for professional growth',
        price: 99,
        priceYearly: 990,
        features: {
          analytics: true,
          automation: true,
          maxAccounts: 10,
          dailyPosts: 100,
          aiAgent: true,
          prioritySupport: true
        },
        popular: false
      }
    ]
  },
  'billing.usage': {
    success: true,
    usage: {
      accounts: {
        used: 1,
        limit: 1,
        percentage: 100
      },
      dailyPosts: {
        used: 3,
        limit: 5,
        percentage: 60
      },
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    plan: 'free' as const,
    billingPeriod: 'm' as const
  },
  'billing.checkFeatureAccess': {
    success: true,
    hasAccess: false,
    plan: 'free' as const,
    feature: 'analytics' as const,
    requiresUpgrade: true
  }
};

export const trpc = createTRPCReact<AppRouter>();

function getTrpcUrl() {
  // Expo/Web'de en güvenlisi ortam değişkeni
  const fromEnv =
    process.env.EXPO_PUBLIC_TRPC_URL ||
    process.env.NEXT_PUBLIC_TRPC_URL ||
    process.env.EXPO_PUBLIC_API_URL; // tam /trpc ile bitiyorsa bunu verin

  if (fromEnv) return fromEnv.replace(/\/$/, '') + '/api/trpc';

  // Web'de: aynı origin altında reverse-proxy varsa
  if (typeof window !== 'undefined') return '/api/trpc';

  // Native cihaz/Emülatör: LAN IP'nizi yazın ve /trpc ile bitirin
  return 'http://localhost:8081/api/trpc';
}

// Test function to check backend connectivity
export const testBackendConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const baseUrl = getTrpcUrl().replace('/api/trpc', '');
    const healthUrl = `${baseUrl}/api/health`;
    
    console.log('[tRPC] Testing backend connection to:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[tRPC] Health check response status:', response.status);
    console.log('[tRPC] Health check response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const text = await response.text();
      console.error('[tRPC] Health check failed:', text.substring(0, 200));
      return {
        success: false,
        message: `Backend health check failed: ${response.status} ${response.statusText}`,
        details: { status: response.status, response: text.substring(0, 200) }
      };
    }
    
    const data = await response.json();
    console.log('[tRPC] Health check successful:', data);
    
    return {
      success: true,
      message: 'Backend is accessible and responding',
      details: data
    };
  } catch (error) {
    console.error('[tRPC] Backend connection test failed:', error);
    return {
      success: false,
      message: `Cannot connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};





// Create a fallback link that returns mock data when the server is unavailable
// const createFallbackLink = () => {
//   return {
//     request: (op: any) => {
//       return new Promise((resolve) => {
//         // Extract the procedure path from the operation
//         const path = op.path;
//         console.log('[tRPC] Fallback mode - returning mock data for:', path);
//         
//         // Get mock data for this path
//         const mockData = getFallbackData(path);
//         
//         if (mockData) {
//           resolve({
//             result: {
//               data: mockData
//             }
//           });
//         } else {
//           // Return a generic error for unknown paths
//           resolve({
//             error: {
//               message: `No mock data available for ${path}`,
//               code: 'MOCK_DATA_NOT_FOUND'
//             }
//           });
//         }
//       });
//     }
//   };
// };

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      transformer: superjson,
      // HTML dönerse (örn. 404/SPA) erkenden yakala
      fetch(url, opts) {
        return fetch(url, opts).then(async (res) => {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('text/html')) {
            await res.text(); // consume the response
            throw new TRPCClientError(
              `[HTML_RESPONSE] Beklenen JSON yerine HTML geldi: ${res.status} ${res.statusText}`
            );
          }
          return res;
        });
      },
    }),
  ],
});

// Helper function to get fallback data for a specific query
export const getFallbackData = (queryKey: string) => {
  return mockFallbacks[queryKey as keyof typeof mockFallbacks] || null;
};