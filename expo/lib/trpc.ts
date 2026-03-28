import React from 'react';
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
  },
  'publish.generate': {
    success: true,
    content: {
      id: 'generated-' + Date.now(),
      title: 'AI-Generated Content',
      body: 'This is a sample AI-generated content for demonstration purposes. In a real scenario, this would be generated by the AI based on your input and preferences.',
      platform: 'x' as const,
      status: 'draft' as const,
      scheduledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Content generated successfully (demo mode)'
  },
  'sponsors.list': {
    sponsors: [
      {
        id: 'sponsor-1',
        name: 'TechCorp',
        description: 'Leading technology company',
        logoUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
        category: 'Technology',
        budget: 5000,
        requirements: ['Tech content', 'Professional audience'],
        status: 'available' as const,
        tier: 'premium' as const
      }
    ],
    total: 1
  }
};

export const trpc = createTRPCReact<AppRouter>();

// REST API Configuration
const getRestApiUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '');
  }
  
  // Fallback to demo mode - no external API calls
  return null;
};

// REST Client for Rork endpoints
class RestClient {
  private baseUrl: string | null;
  
  constructor() {
    this.baseUrl = getRestApiUrl();
    console.log('[REST] Using base URL:', this.baseUrl || 'null (demo mode)');
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // If no base URL is configured, throw an error immediately
    if (!this.baseUrl) {
      throw new Error('No API URL configured - running in demo mode');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    console.log('[REST] Making request to:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('[REST] Request failed:', response.status, text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[REST] Non-JSON response:', text.substring(0, 200));
        throw new Error('Expected JSON response but received: ' + contentType);
      }
      
      return response.json();
    } catch (error) {
      console.error('[REST] Request error:', error);
      throw error;
    }
  }
  
  // OAuth endpoints
  oauth = {
    start: (data: { platform: string }) => 
      this.request('/api/oauth/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    callback: (data: { platform: string; code: string; state: string }) => 
      this.request('/api/oauth/callback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    fix: (data: { platform: string }) => 
      this.request('/api/oauth/fix', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    revoke: (data: { platform: string }) => 
      this.request('/api/oauth/revoke', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    listAccounts: () => 
      this.request('/api/oauth/accounts'),
  };
  
  // Settings endpoints
  settings = {
    get: () => 
      this.request('/api/settings/get'),
    
    update: (data: any) => 
      this.request('/api/settings/update', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    testNotification: (data: { channel: string }) => 
      this.request('/api/settings/testNotification', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  
  // Plans endpoints
  plans = {
    getCurrent: () => 
      this.request('/api/plans/current'),
    
    upgrade: (data: { targetPlan: string }) => 
      this.request('/api/plans/upgrade', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  
  // Risk endpoints
  risk = {
    getStatus: (params?: { range?: string }) => {
      const query = params?.range ? `?range=${params.range}` : '';
      return this.request(`/api/risk/status${query}`);
    },
    
    simulateAlert: () => 
      this.request('/api/risk/simulateAlert', {
        method: 'POST',
      }),
  };
  
  // Notifications endpoints
  notifications = {
    test: (data?: { userId?: string; channel?: string }) => 
      this.request('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    
    history: (params?: { userId?: string; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.userId) query.append('userId', params.userId);
      if (params?.limit) query.append('limit', params.limit.toString());
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return this.request(`/api/notifications/history${queryString}`);
    },
  };
  
  // Scheduler endpoints
  scheduler = {
    queue: (data: { contentId: string; runAt: string }) => 
      this.request('/api/scheduler/queue', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    workerTick: () => 
      this.request('/api/scheduler/workerTick', {
        method: 'POST',
      }),
    
    stats: () => 
      this.request('/api/scheduler/stats'),
  };
  
  // Health endpoints
  health = () => 
    this.request('/api/health');
  
  version = () => 
    this.request('/api/version');
}

// Create REST client instance
export const restClient = new RestClient();

// REST-based hooks that mimic tRPC hooks
export const createRestHooks = () => {
  return {
    oauth: {
      start: {
        mutate: async (data: { platform: string }) => {
          try {
            return await restClient.oauth.start(data);
          } catch (error) {
            console.error('[REST] OAuth start failed:', error);
            // Return fallback data
            return {
              authUrl: `https://auth.demo/${data.platform}`,
              state: 'demo_state',
              requiresBotToken: data.platform === 'telegram'
            };
          }
        }
      },
      callback: {
        mutate: async (data: { platform: string; code: string; state: string }) => {
          try {
            return await restClient.oauth.callback(data);
          } catch (error) {
            console.error('[REST] OAuth callback failed:', error);
            return { success: true };
          }
        }
      },
      fix: {
        mutate: async (data: { platform: string }) => {
          try {
            return await restClient.oauth.fix(data);
          } catch (error) {
            console.error('[REST] OAuth fix failed:', error);
            return {
              authUrl: `https://auth.demo/${data.platform}`,
              state: 'demo_state'
            };
          }
        }
      },
      revoke: {
        mutate: async (data: { platform: string }) => {
          try {
            return await restClient.oauth.revoke(data);
          } catch (error) {
            console.error('[REST] OAuth revoke failed:', error);
            return { success: true };
          }
        }
      },
      listAccounts: {
        useQuery: () => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.oauth.listAccounts()
              .then(setData)
              .catch((err) => {
                console.error('[REST] OAuth listAccounts failed:', err);
                setData(mockFallbacks['oauth.listAccounts']);
              })
              .finally(() => setIsLoading(false));
          }, []);
          
          return { data, isLoading, refetch: () => {} };
        }
      }
    },
    settings: {
      get: {
        useQuery: () => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.settings.get()
              .then(setData)
              .catch((err) => {
                console.error('[REST] Settings get failed:', err);
                setData(mockFallbacks['settings.get']);
              })
              .finally(() => setIsLoading(false));
          }, []);
          
          return { data, isLoading, refetch: () => {} };
        }
      },
      update: {
        mutate: async (data: any) => {
          try {
            return await restClient.settings.update(data);
          } catch (error) {
            console.error('[REST] Settings update failed:', error);
            return { success: true };
          }
        }
      },
      testNotification: {
        mutate: async (data: { channel: string }) => {
          try {
            return await restClient.settings.testNotification(data);
          } catch (error) {
            console.error('[REST] Test notification failed:', error);
            return { message: 'Test notification sent (demo)' };
          }
        }
      }
    },
    plans: {
      getCurrent: {
        useQuery: () => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.plans.getCurrent()
              .then(setData)
              .catch((err) => {
                console.error('[REST] Plans getCurrent failed:', err);
                setData(mockFallbacks['plans.getCurrent']);
              })
              .finally(() => setIsLoading(false));
          }, []);
          
          return { data, isLoading, refetch: () => {} };
        }
      },
      upgrade: {
        mutate: async (data: { targetPlan: string }) => {
          try {
            return await restClient.plans.upgrade(data);
          } catch (error) {
            console.error('[REST] Plans upgrade failed:', error);
            return { success: true, message: `Upgraded to ${data.targetPlan}` };
          }
        }
      }
    },
    risk: {
      getStatus: {
        useQuery: (params?: { range?: string }) => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.risk.getStatus(params)
              .then(setData)
              .catch((err) => {
                console.error('[REST] Risk getStatus failed:', err);
                setData(mockFallbacks['risk.getStatus']);
              })
              .finally(() => setIsLoading(false));
          }, [params]);
          
          return { data, isLoading, refetch: () => {} };
        }
      },
      simulateAlert: {
        mutate: async () => {
          try {
            return await restClient.risk.simulateAlert();
          } catch (error) {
            console.error('[REST] Risk simulateAlert failed:', error);
            return {
              message: 'Demo risk alert created',
              alert: {
                id: Math.floor(Date.now() / 1000),
                severity: 'low',
                message: 'Demo',
                createdAt: new Date().toISOString()
              }
            };
          }
        }
      }
    },
    notifications: {
      test: {
        mutate: async (data?: { userId?: string; channel?: string }) => {
          try {
            return await restClient.notifications.test(data);
          } catch (error) {
            console.error('[REST] Notifications test failed:', error);
            return { message: 'Push sent (demo)' };
          }
        }
      },
      history: {
        useQuery: (params?: { userId?: string; limit?: number }) => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.notifications.history(params)
              .then(setData)
              .catch((err) => {
                console.error('[REST] Notifications history failed:', err);
                setData({ notifications: [] });
              })
              .finally(() => setIsLoading(false));
          }, [params]);
          
          return { data, isLoading, refetch: () => {} };
        }
      }
    },
    scheduler: {
      queue: {
        mutate: async (data: { contentId: string; runAt: string }) => {
          try {
            return await restClient.scheduler.queue(data);
          } catch (error) {
            console.error('[REST] Scheduler queue failed:', error);
            return { jobId: `${data.contentId}:${data.runAt}` };
          }
        }
      },
      workerTick: {
        mutate: async () => {
          try {
            return await restClient.scheduler.workerTick();
          } catch (error) {
            console.error('[REST] Scheduler workerTick failed:', error);
            return { message: 'Worker tick complete (demo)' };
          }
        }
      },
      stats: {
        useQuery: () => {
          const [data, setData] = React.useState<any>(null);
          const [isLoading, setIsLoading] = React.useState<boolean>(true);
          const [, setError] = React.useState<any>(null);
          
          React.useEffect(() => {
            restClient.scheduler.stats()
              .then(setData)
              .catch((err) => {
                console.error('[REST] Scheduler stats failed:', err);
                setData({
                  total: 3,
                  stats: { pending: 1, completed: 2, failed: 0 },
                  successRate: 100
                });
              })
              .finally(() => setIsLoading(false));
          }, []);
          
          return { data, isLoading, refetch: () => {} };
        }
      }
    }
  };
};

// Create REST hooks instance
export const restHooks = createRestHooks();

function getTrpcUrl() {
  // Priority order for tRPC URL resolution:
  // 1. EXPO_PUBLIC_TRPC_URL (explicit tRPC URL)
  // 2. NEXT_PUBLIC_TRPC_URL (Next.js compatibility)
  // 3. EXPO_PUBLIC_API_URL + /api/trpc
  // 4. Platform-specific fallbacks
  
  const explicitTrpcUrl = process.env.EXPO_PUBLIC_TRPC_URL;
  if (explicitTrpcUrl && !explicitTrpcUrl.includes('.exp.direct')) {
    const url = explicitTrpcUrl.replace(/\/$/, '');
    console.log('[TRPC] Using EXPO_PUBLIC_TRPC_URL:', url);
    return url;
  }

  const nextTrpcUrl = process.env.NEXT_PUBLIC_TRPC_URL;
  if (nextTrpcUrl && !nextTrpcUrl.includes('.exp.direct')) {
    const url = nextTrpcUrl.replace(/\/$/, '');
    console.log('[TRPC] Using NEXT_PUBLIC_TRPC_URL:', url);
    return url;
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl && !apiUrl.includes('.exp.direct')) {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const trpcUrl = `${baseUrl}/api/trpc`;
    console.log('[TRPC] Using EXPO_PUBLIC_API_URL + /api/trpc:', trpcUrl);
    return trpcUrl;
  }

  // Platform-specific fallbacks - avoid ngrok/exp.direct URLs
  if (typeof window !== 'undefined') {
    // Web platform - try to proxy through current origin first
    const currentOrigin = window.location.origin;
    if (currentOrigin && !currentOrigin.includes('.exp.direct')) {
      const fallbackUrl = `${currentOrigin}/api/trpc`;
      console.log('[TRPC] Using web fallback (current origin):', fallbackUrl);
      return fallbackUrl;
    }
    // If current origin is exp.direct, use localhost
    const fallbackUrl = 'http://localhost:8787/api/trpc';
    console.log('[TRPC] Using web fallback (localhost):', fallbackUrl);
    return fallbackUrl;
  } else {
    // Native platform - connect directly to backend server
    // Use localhost for simulator, LAN IP for real device
    const isDev = process.env.NODE_ENV === 'development' || __DEV__;
    if (isDev) {
      // For development, try localhost first (simulator)
      const fallbackUrl = 'http://localhost:8787/api/trpc';
      console.log('[TRPC] Using native development fallback:', fallbackUrl);
      return fallbackUrl;
    } else {
      // For production, would use actual server URL
      const fallbackUrl = 'http://localhost:8787/api/trpc';
      console.log('[TRPC] Using native production fallback:', fallbackUrl);
      return fallbackUrl;
    }
  }
}

// Log the tRPC URL for debugging
console.log('[TRPC] Using URL:', getTrpcUrl());

// Test function to check backend connectivity
export const testBackendConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const trpcUrl = getTrpcUrl();
    
    // Skip health check for ngrok/exp.direct URLs as they're unreliable
    if (trpcUrl.includes('.exp.direct')) {
      console.log('[tRPC] Skipping health check for ngrok URL:', trpcUrl);
      return {
        success: false,
        message: '🚨 BACKEND SERVER NOT RUNNING!\n\nTo start the backend server:\n\n📱 OPTION 1 - Quick Start:\n1. Open a new terminal\n2. Run: bun run backend/server.ts\n\n🖥️ OPTION 2 - Using Scripts:\n• macOS/Linux: ./start-backend.sh\n• Windows: start-backend.bat\n\n✅ Wait for "Flâneur API is running" message\n🔄 The app will automatically reconnect\n\n💡 The app continues working with demo data',
        details: { url: trpcUrl, reason: 'ngrok_offline' }
      };
    }
    
    const baseUrl = trpcUrl.replace('/api/trpc', '').replace('/trpc', '');
    const healthUrl = `${baseUrl}/api/health`;
    
    console.log('[tRPC] Testing backend connection to:', healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('[tRPC] Health check response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('[tRPC] Health check failed with status:', response.status);
      
      // Check if we got HTML (likely a 404 or error page from Expo dev server)
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return {
          success: false,
          message: '🚨 BACKEND SERVER NOT RUNNING!\n\nTo start the backend server:\n1. Open a new terminal in your project directory\n2. Run: bun run backend/server.ts\n3. Or use: ./start-backend.sh (macOS/Linux)\n4. Wait for "✅ Flâneur API is running" message\n5. The app will automatically reconnect\n\n💡 The app will continue working with demo data',
          details: { 
            status: response.status, 
            reason: 'backend_not_running',
            url: healthUrl
          }
        };
      }
      
      return {
        success: false,
        message: `Backend server error (${response.status}). Check server logs.`,
        details: { status: response.status }
      };
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[tRPC] Health check returned non-JSON content-type:', contentType);
      
      // Check if we got HTML instead of JSON (Expo dev server response)
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return {
          success: false,
          message: '🚨 BACKEND SERVER NOT RUNNING!\n\nTo start the backend server:\n1. Open a new terminal in your project directory\n2. Run: bun run backend/server.ts\n3. Or use: ./start-backend.sh (macOS/Linux)\n4. Wait for "✅ Flâneur API is running" message\n5. The app will automatically reconnect\n\n💡 The app will continue working with demo data',
          details: { 
            contentType, 
            reason: 'backend_not_running',
            url: healthUrl
          }
        };
      }
      
      return {
        success: false,
        message: `Backend server returning unexpected content type: ${contentType}`,
        details: { contentType }
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
    
    let message = '🚨 BACKEND SERVER CONNECTION FAILED!\n\nTo start the backend server:\n\n📱 OPTION 1 - Quick Start:\n1. Open a new terminal\n2. Run: bun run backend/server.ts\n\n🖥️ OPTION 2 - Using Scripts:\n• macOS/Linux: ./start-backend.sh\n• Windows: start-backend.bat\n\n✅ Wait for "✅ Flâneur API is running" message\n🔄 The app will automatically reconnect\n\n💡 The app continues working with demo data\n\n📖 See FIX_BACKEND_CONNECTION.md for details';
    let reason = 'unknown_error';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        reason = 'timeout';
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        reason = 'connection_refused';
      } else if (error.message.includes('ERR_NGROK')) {
        reason = 'ngrok_offline';
      } else {
        reason = 'network_error';
      }
    }
    
    return {
      success: false,
      message,
      details: { 
        error: error instanceof Error ? error.message : String(error),
        reason,
        url: getTrpcUrl()
      }
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

// Enhanced fallback system with better error handling
// Global backend status tracking
let globalBackendStatus = {
  isAvailable: false,
  lastCheck: 0,
  checkInterval: 30000, // 30 seconds
  hasShownError: false,
  consecutiveFailures: 0,
  maxConsecutiveFailures: 3 // Only show errors after 3 consecutive failures
};

// Quick backend availability test
async function quickBackendTest(): Promise<boolean> {
  const now = Date.now();
  
  // Don't check too frequently
  if (now - globalBackendStatus.lastCheck < globalBackendStatus.checkInterval) {
    return globalBackendStatus.isAvailable;
  }
  
  try {
    const trpcUrl = getTrpcUrl();
    const baseUrl = trpcUrl.replace('/api/trpc', '').replace('/trpc', '');
    const healthUrl = `${baseUrl}/api/health`;
    
    // Skip check for ngrok URLs as they're unreliable
    if (healthUrl.includes('.exp.direct')) {
      globalBackendStatus.isAvailable = false;
      globalBackendStatus.lastCheck = now;
      globalBackendStatus.consecutiveFailures++;
      return false;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const isHealthy = response.ok && (response.headers.get('content-type')?.includes('application/json') || false);
    
    if (isHealthy) {
      // Backend is healthy - reset failure count
      globalBackendStatus.isAvailable = true;
      globalBackendStatus.consecutiveFailures = 0;
      globalBackendStatus.lastCheck = now;
      
      if (globalBackendStatus.hasShownError) {
        console.log('[TRPC] ✅ Backend is back online!');
        globalBackendStatus.hasShownError = false;
      }
      
      return true;
    } else {
      // Backend responded but not healthy
      globalBackendStatus.isAvailable = false;
      globalBackendStatus.consecutiveFailures++;
      globalBackendStatus.lastCheck = now;
      
      // Only show error after consecutive failures
      if (globalBackendStatus.consecutiveFailures >= globalBackendStatus.maxConsecutiveFailures && !globalBackendStatus.hasShownError) {
        console.warn('[TRPC] Backend unhealthy after multiple attempts, using demo data');
        globalBackendStatus.hasShownError = true;
      }
      
      return false;
    }
  } catch {
    globalBackendStatus.isAvailable = false;
    globalBackendStatus.consecutiveFailures++;
    globalBackendStatus.lastCheck = now;
    
    // Only show error after consecutive failures
    if (globalBackendStatus.consecutiveFailures >= globalBackendStatus.maxConsecutiveFailures && !globalBackendStatus.hasShownError) {
      console.warn('[TRPC] Backend unavailable after multiple attempts, using demo data');
      globalBackendStatus.hasShownError = true;
    }
    
    return false;
  }
}

// Create a fallback-aware tRPC client with improved error handling
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      transformer: superjson,
      // Enhanced error handling with graceful fallback
      async fetch(url, opts) {
        // Check backend availability before making request
        const isBackendAvailable = await quickBackendTest();
        
        if (!isBackendAvailable) {
          // Throw a specific error that can be caught and handled with fallback data
          throw new TRPCClientError('[BACKEND_UNAVAILABLE] Backend server not accessible. Using demo data.');
        }
        
        try {
          const response = await fetch(url, opts);
          
          // Check response content type
          const contentType = response.headers.get('content-type') || '';
          
          if (contentType.includes('text/html')) {
            const html = await response.text();
            
            // Log HTML response for debugging (only after consecutive failures)
            if (globalBackendStatus.consecutiveFailures >= globalBackendStatus.maxConsecutiveFailures && !globalBackendStatus.hasShownError) {
              console.error('[tRPC] Health check returned non-JSON content-type:', contentType);
              console.error('[tRPC] Response body:', html.substring(0, 200));
              globalBackendStatus.hasShownError = true;
            }
            
            const urlString = typeof url === 'string' ? url : url.toString();
            let errorMessage = '[HTML_RESPONSE] Expected JSON but received HTML: ' + response.status + '. The server is returning a web page instead of API responses. Check if the backend is running and accessible.';
            errorMessage += ` Check if tRPC server is running at ${urlString}`;
            
            throw new TRPCClientError(errorMessage);
          }
          
          if (!contentType.includes('application/json') && response.status !== 204) {
            const urlString = typeof url === 'string' ? url : url.toString();
            throw new TRPCClientError(`[INVALID_CONTENT_TYPE] Expected JSON but received ${contentType}: ${response.status}. Check if tRPC server is running at ${urlString}`);
          }
          
          // Mark backend as available on successful response
          if (!globalBackendStatus.isAvailable) {
            globalBackendStatus.isAvailable = true;
            console.log('[TRPC] ✅ Backend connection restored!');
          }
          
          return response;
        } catch (error) {
          // Mark backend as unavailable
          globalBackendStatus.isAvailable = false;
          
          if (error instanceof TRPCClientError) {
            throw error;
          }
          
          // Handle network errors
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new TRPCClientError('[NETWORK_ERROR] Cannot connect to backend server.');
          }
          
          throw new TRPCClientError(`[UNKNOWN_ERROR] ${error instanceof Error ? error.message : String(error)}`);
        }
      },
    }),
  ],
});

// Helper function to get fallback data for a specific query
export const getFallbackData = (queryKey: string) => {
  const fallbackData = mockFallbacks[queryKey as keyof typeof mockFallbacks] || null;
  if (fallbackData) {
    console.log(`[TRPC] Using fallback data for: ${queryKey}`);
  }
  return fallbackData;
};

// Helper function to check if backend is currently down
export const isBackendCurrentlyDown = () => !globalBackendStatus.isAvailable;

// Helper function to get how long backend has been down
export const getBackendDowntime = () => {
  if (globalBackendStatus.isAvailable) return 0;
  return Date.now() - globalBackendStatus.lastCheck;
};