import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { LanguageProvider } from '../src/providers/LanguageProvider';
import { AIMarketerProvider } from "@/providers/AIMarketerProvider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry if it's a tRPC error
        if (error?.message?.includes('tRPC')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      // Ensure queries never return undefined by providing fallback data
      placeholderData: (previousData: any, query: any) => {
        if (previousData) return previousData;
        
        // Provide default fallback data based on query key patterns
        const queryKey = query?.queryKey?.[0];
        if (Array.isArray(queryKey)) {
          const [route, method] = queryKey;
          
          // Content list fallback
          if (route === 'content' && method === 'list') {
            return { items: [], total: 0, hasMore: false, publisherStats: {}, queueStatus: {}, publishingWindow: {} };
          }
          
          // Insights list fallback
          if (route === 'insights' && method === 'list') {
            return { insights: [], summary: { total: 0, anomalies: 0, opportunities: 0, highSeverity: 0 } };
          }
          
          // Fame score fallback
          if (route === 'fameScore' && method === 'get') {
            return { score: 0, tier: 'Yeni Başlangıç', trend: [], hasData: false, breakdown: {}, insights: [], tooltip: '', progressText: '' };
          }
          
          // Content logs fallback
          if (route === 'content' && method === 'logs') {
            return { logs: [], total: 0, hasMore: false };
          }
          
          // Challenges fallback
          if (route === 'challenges' && method === 'weekly') {
            return { challenge: {}, progress: {}, isCompleted: false, canClaimBonus: false, daysLeft: 7 };
          }
          
          // Badges fallback
          if (route === 'badges') {
            return { badges: [], awardedBadges: [], totalBadges: 0, completedCount: 0 };
          }
          
          // Risk status fallback
          if (route === 'risk' && method === 'getStatus') {
            return { shadowban: {}, quotas: {}, alerts: [], healthScore: 0, recommendations: [] };
          }
          
          // Settings fallback
          if (route === 'settings' && method === 'get') {
            return { success: true, accounts: [], quotas: {}, guardrails: {}, notifications: {}, branding: {} };
          }
          
          // Auth fallback
          if (route === 'auth' && method === 'me') {
            return { id: '', email: '', displayName: '', avatarUrl: '', plan: 'free', createdAt: '', updatedAt: '' };
          }
          
          // OAuth fallback
          if (route === 'oauth' && method === 'listAccounts') {
            return { accounts: [], total: 0 };
          }
          
          // Plans fallback
          if (route === 'plans' && method === 'getCurrent') {
            return { success: true, plan: 'free', name: 'Free', description: '', price: 0, features: {}, featuresEnabled: {}, billingCycle: 'monthly', nextBillingDate: '', cancelAtPeriodEnd: false };
          }
          
          // Onboarding fallback
          if (route === 'onboarding' && method === 'get') {
            return { profile: null, guidance: null, hasCompleted: false };
          }
        }
        
        // Generic fallback for unknown queries
        return {};
      },
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="platform-connect" options={{ 
        title: "Connect Platforms",
        presentation: "modal" 
      }} />
      <Stack.Screen name="content-detail" options={{ 
        title: "Content Details",
        presentation: "modal" 
      }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <AIMarketerProvider>
                <RootLayoutNav />
              </AIMarketerProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </trpc.Provider>
      </LanguageProvider>
    </I18nextProvider>
  );
}