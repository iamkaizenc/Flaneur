import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { LanguageProvider } from '../src/providers/LanguageProvider';
import { AIMarketerProvider } from "@/providers/AIMarketerProvider";
import { trpc, trpcClient, getFallbackData } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry if it's a tRPC error or network error
        if (error?.message?.includes('tRPC') || 
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('NETWORK_ERROR') ||
            error?.data?.code === 'NETWORK_ERROR') {
          console.warn('[React Query] Network/tRPC error, not retrying:', error?.message);
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      // Provide fallback data to prevent undefined errors
      placeholderData: (previousData: any, query: any) => {
        // Return previous data if available
        if (previousData) return previousData;
        
        // Try to get fallback data based on query key
        if (query?.queryKey) {
          const queryPath = query.queryKey[0];
          if (Array.isArray(queryPath) && queryPath.length >= 2) {
            const fallbackKey = `${queryPath[0]}.${queryPath[1]}`;
            const fallbackData = getFallbackData(fallbackKey);
            if (fallbackData) {
              console.log(`[React Query] Using fallback data for ${fallbackKey}`);
              return fallbackData;
            }
          }
        }
        
        return null; // Let individual components handle null gracefully
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on network errors
        if (error?.message?.includes('Failed to fetch') ||
            error?.data?.code === 'NETWORK_ERROR') {
          return false;
        }
        return failureCount < 1;
      },
      onError: (error: any) => {
        console.error('[React Query] Mutation error:', {
          message: error?.message,
          code: error?.data?.code,
          httpStatus: error?.data?.httpStatus
        });
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

  // Test tRPC connection on app start
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('[App] Testing tRPC connection...');
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          console.log('[App] API health check passed:', data);
        } else {
          console.warn('[App] API health check failed:', response.status);
        }
      } catch (error) {
        console.warn('[App] API connection test failed:', error);
        console.log('[App] App will use fallback data for offline functionality');
      }
    };
    
    testConnection();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <AIMarketerProvider>
                <RootLayoutNav />
              </AIMarketerProvider>
            </GestureHandlerRootView>
          </trpc.Provider>
        </QueryClientProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}