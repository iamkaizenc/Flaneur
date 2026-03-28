import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { theme } from "@/constants/theme";
import { normalizeError } from "@/lib/errors";

export default function OAuthCallback() {
  const { code, state, platform } = useLocalSearchParams<{
    code?: string;
    state?: string;
    platform?: string;
  }>();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processing OAuth callback...');
  
  const oauthCallbackMutation = trpc.oauth.callback.useMutation({
    onSuccess: (result) => {
      console.log('[OAuth Callback] Success:', result);
      setStatus('success');
      setMessage('Authentication successful! Redirecting...');
      
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    },
    onError: (error) => {
      const errorMessage = normalizeError(error);
      console.error('[OAuth Callback] Error:', errorMessage);
      setStatus('error');
      setMessage(`Authentication failed: ${errorMessage}`);
      
      setTimeout(() => {
        router.replace("/platform-connect");
      }, 3000);
    }
  });

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[OAuth Callback] Processing callback with:', { code, state, platform });
      
      if (!code || !state || !platform) {
        console.error('[OAuth Callback] Missing required parameters');
        setStatus('error');
        setMessage('Invalid callback parameters. Missing code, state, or platform.');
        
        setTimeout(() => {
          router.replace("/platform-connect");
        }, 3000);
        return;
      }

      try {
        await oauthCallbackMutation.mutateAsync({
          platform: platform as any,
          code: String(code),
          state: String(state),
        });
      } catch (error) {
        // Error handling is done in onError callback
        console.error('[OAuth Callback] Mutation failed:', normalizeError(error));
      }
    };

    handleCallback();
  }, [code, state, platform]);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.white;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'processing' && (
          <ActivityIndicator size="large" color={theme.colors.white} />
        )}
        
        {getStatusIcon() && (
          <Text style={styles.icon}>{getStatusIcon()}</Text>
        )}
        
        <Text style={[styles.title, { color: getStatusColor() }]}>
          {status === 'processing' && 'Completing OAuth...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Connection Failed'}
        </Text>
        
        <Text style={styles.subtitle}>{message}</Text>
        
        {platform && (
          <Text style={styles.platform}>
            Platform: {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray[400],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  platform: {
    fontSize: 12,
    color: theme.colors.gray[500],
    textAlign: "center",
    fontWeight: "500" as const,
  },
});