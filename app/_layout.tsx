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
      // Ensure queries never return undefined
      placeholderData: (previousData: any) => previousData,
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