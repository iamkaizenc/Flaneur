import React, { useEffect } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { theme } from "@/constants/theme";

export default function OAuthCallback() {
  const { code, state, platform } = useLocalSearchParams<{
    code?: string;
    state?: string;
    platform?: string;
  }>();
  
  const oauthCallbackMutation = trpc.oauth.callback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[OAuth Callback] Processing callback with:', { code, state, platform });
        
        if (!code || !state) {
          console.error('[OAuth Callback] Missing required parameters');
          router.replace("/platform-connect");
          return;
        }

        const result = await oauthCallbackMutation.mutateAsync({
          platform: (platform as any) ?? "x",
          code: String(code),
          state: String(state),
        });

        if (result.success) {
          console.log('[OAuth Callback] Success, redirecting to tabs');
          router.replace("/(tabs)");
        } else {
          console.error('[OAuth Callback] Failed:', result);
          router.replace("/platform-connect");
        }
      } catch (error) {
        console.error('[OAuth Callback] Error:', error);
        router.replace("/platform-connect");
      }
    };

    handleCallback();
  }, [code, state, platform, oauthCallbackMutation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.white} />
        <Text style={styles.title}>Completing OAuth...</Text>
        <Text style={styles.subtitle}>
          Finalizing your account connection
        </Text>
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
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray[400],
    textAlign: "center",
  },
});