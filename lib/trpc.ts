import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

// Mock data fallbacks for when tRPC server is not available
const mockFallbacks = {
  'content.list': {
    items: [],
    total: 0,
    hasMore: false,
    publisherStats: {
      x: { used: 0, limit: 10, remaining: 10 },
      instagram: { used: 0, limit: 5, remaining: 5 },
      linkedin: { used: 0, limit: 3, remaining: 3 },
      tiktok: { used: 0, limit: 3, remaining: 3 },
      facebook: { used: 0, limit: 5, remaining: 5 },
      telegram: { used: 0, limit: 10, remaining: 10 }
    },
    queueStatus: {
      draft: 0,
      queued: 0,
      published: 0,
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
    insights: [],
    summary: {
      total: 0,
      anomalies: 0,
      opportunities: 0,
      highSeverity: 0
    }
  },
  'fameScore.get': {
    score: 0,
    tier: 'Yeni Başlangıç',
    trend: [],
    hasData: false,
    breakdown: { reach: 0, engagement: 0, consistency: 0, penalty: 0 },
    insights: [],
    tooltip: 'Hesap görünürlüğü & etkileşim gücünü ölçer',
    progressText: 'Henüz veri yok'
  },
  'content.logs': {
    logs: [],
    total: 0,
    hasMore: false
  },
  'challenges.weekly': {
    challenge: {
      id: 'default',
      userId: 'user-1',
      weekStart: new Date(),
      targetPosts: 3,
      targetReels: 1,
      targetLive: 0,
      currentPosts: 0,
      currentReels: 0,
      currentLive: 0,
      completed: false,
      bonusAwarded: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    progress: {
      posts: { current: 0, target: 3, percentage: 0 },
      reels: { current: 0, target: 1, percentage: 0 },
      live: { current: 0, target: 0, percentage: 100 },
      overall: 0
    },
    isCompleted: false,
    canClaimBonus: false,
    daysLeft: 7
  },
  'badges.list': {
    badges: [],
    awardedBadges: [],
    totalBadges: 0,
    completedCount: 0
  },
  'badges.streak': {
    streak: {
      id: 'default',
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastPostDate: new Date(),
      updatedAt: new Date()
    },
    motivationText: 'Başlamak için ilk içeriğini paylaş!',
    isOnStreak: false,
    daysUntilNextMilestone: 7
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
    accounts: [],
    quotas: {
      dailyLimits: {},
      postingWindow: { start: 8, end: 22 },
      dryRun: true
    },
    guardrails: {
      bannedWords: [],
      bannedTags: [],
      riskLevel: 'normal' as const
    },
    notifications: {
      emails: [],
      telegramChatId: '',
      notifyOn: []
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
    avatarUrl: '',
    plan: 'free' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'oauth.listAccounts': {
    accounts: [],
    total: 0
  },
  'plans.getCurrent': {
    success: true,
    plan: 'free' as const,
    name: 'Free',
    description: 'Basic features only',
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
      description: 'Basic features only'
    },
    billingCycle: 'monthly' as const,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false
  },
  'onboarding.get': {
    profile: null,
    guidance: null,
    hasCompleted: false
  }
};

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For web, use relative URLs to avoid CORS issues
  if (typeof window !== 'undefined') {
    console.log('[tRPC] Using relative URL for web');
    return '';
  }
  
  // For mobile, use the configured API URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[tRPC] Using configured API URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Development fallback
  console.log('[tRPC] Using fallback API URL: http://localhost:8081');
  return 'http://localhost:8081';
};



export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('[tRPC] Making request to:', url);
          
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options?.headers,
            },
          });
          
          console.log('[tRPC] Response status:', response.status);
          
          // For non-ok responses, try to parse as JSON first
          if (!response.ok) {
            const responseText = await response.text();
            console.error('[tRPC] HTTP error:', response.status, responseText.substring(0, 200));
            
            // If it's HTML, it means we're hitting the wrong endpoint
            if (responseText.includes('<!DOCTYPE html>')) {
              console.error('[tRPC] Got HTML response instead of JSON. This usually means:');
              console.error('[tRPC] 1. The tRPC server is not running');
              console.error('[tRPC] 2. The API endpoint path is incorrect');
              console.error('[tRPC] 3. CORS issues or wrong port');
              throw new Error(`tRPC server not available. Expected JSON but got HTML response.`);
            }
            
            // Try to parse as JSON error
            try {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            } catch {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error:', error);
          
          // For development, provide helpful error messages
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.error('[tRPC] Network error - make sure the development server is running');
            console.warn('[tRPC] Falling back to mock data for development');
            throw new Error('Network error: Cannot connect to API server. Using mock data.');
          }
          
          throw error;
        }
      },
    }),
  ],
});