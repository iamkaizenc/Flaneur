import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { LanguageProvider } from '../src/providers/LanguageProvider';
import { AIMarketerProvider } from "@/providers/AIMarketerProvider";
import { trpc, trpcClient, getFallbackData, testBackendConnection } from "@/lib/trpc";
import { BackendStatusProvider } from "@/lib/trpc-fallback";
import { theme } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[Error Boundary] Caught error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorBoundaryStyles.container}>
          <View style={errorBoundaryStyles.content}>
            <Text style={errorBoundaryStyles.title}>Something went wrong</Text>
            <Text style={errorBoundaryStyles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity 
              style={errorBoundaryStyles.button}
              onPress={() => this.setState({ hasError: false, error: undefined })}
            >
              <Text style={errorBoundaryStyles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorBoundaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry if it's a tRPC error or network error
        if (error?.message?.includes('tRPC') || 
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('NETWORK_ERROR') ||
            error?.message?.includes('HTML_RESPONSE') ||
            error?.message?.includes('BACKEND_UNAVAILABLE') ||
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
            error?.message?.includes('HTML_RESPONSE') ||
            error?.message?.includes('BACKEND_UNAVAILABLE') ||
            error?.data?.code === 'NETWORK_ERROR') {
          return false;
        }
        return failureCount < 1;
      },
      onError: (error: any) => {
        // Better error serialization for debugging
        const errorInfo = {
          message: error?.message || 'Unknown error',
          name: error?.name,
          code: error?.data?.code,
          httpStatus: error?.data?.httpStatus,
          cause: error?.cause,
          stack: error?.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
        };
        
        console.error('[React Query] Mutation error:', errorInfo);
        
        // Also log the full error object for debugging
        if (error && typeof error === 'object') {
          try {
            console.error('[React Query] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          } catch {
            console.error('[React Query] Error object (non-serializable):', error);
          }
        }
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
      <Stack.Screen name="oauth-callback" options={{ 
        headerShown: false,
        presentation: "modal" 
      }} />
      <Stack.Screen name="sponsor-hub" options={{ 
        headerShown: false,
        presentation: "modal" 
      }} />
      <Stack.Screen name="e2e-test" options={{ 
        title: "E2E Test",
        presentation: "modal" 
      }} />
      <Stack.Screen name="oauth-test" options={{ 
        title: "OAuth Test",
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
        console.log('[App] Testing backend connection...');
        const result = await testBackendConnection();
        if (result.success) {
          console.log('[App] ✅ Backend connection successful');
        } else {
          console.warn('[App] ⚠️ Backend connection failed, using demo data');
          console.warn('[App] Details:', result.message);
        }
      } catch (error) {
        console.warn('[App] Backend connection test failed:', error);
        console.log('[App] App will use fallback data for offline functionality');
      }
    };
    
    testConnection();
  }, []);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <trpc.Provider client={trpcClient} queryClient={queryClient}>
              <BackendStatusProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <AIMarketerProvider>
                    <RootLayoutNav />
                  </AIMarketerProvider>
                </GestureHandlerRootView>
              </BackendStatusProvider>
            </trpc.Provider>
          </QueryClientProvider>
        </LanguageProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}