import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Send,
  Check,
  ChevronRight,
  AlertCircle,
  Zap
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ 
  name, 
  icon, 
  color, 
  connected,
  loading,
  onConnect 
}) => (
  <TouchableOpacity 
    style={[styles.platformCard, connected && styles.platformCardConnected]}
    onPress={onConnect}
    activeOpacity={0.7}
  >
    <View style={[styles.platformIcon, { backgroundColor: `${color}20` }]}>
      {icon}
    </View>
    <View style={styles.platformInfo}>
      <Text style={styles.platformName}>{name}</Text>
      <Text style={styles.platformStatus}>
        {connected ? "Connected" : "Tap to connect"}
      </Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color} />
    ) : connected ? (
      <Check size={24} color="#10B981" />
    ) : (
      <ChevronRight size={24} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function PlatformConnectScreen() {
  const { connectedPlatforms, connectPlatform } = useAIMarketer();
  const [loadingPlatforms, setLoadingPlatforms] = useState<Set<string>>(new Set());
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  
  // Check if we're in LIVE mode
  useEffect(() => {
    setIsLiveMode(process.env.EXPO_PUBLIC_LIVE_MODE === "true");
  }, []);

  const platforms = [
    { name: "X (Twitter)", key: "x", icon: <Twitter size={24} color="#1DA1F2" />, color: "#1DA1F2" },
    { name: "Instagram", key: "instagram", icon: <Instagram size={24} color="#E4405F" />, color: "#E4405F" },
    { name: "LinkedIn", key: "linkedin", icon: <Linkedin size={24} color="#0077B5" />, color: "#0077B5" },
    { name: "Telegram", key: "telegram", icon: <Send size={24} color="#0088CC" />, color: "#0088CC" },
  ];

  const oauthStartMutation = trpc.oauth.start.useMutation();
  const oauthCallbackMutation = trpc.oauth.callback.useMutation();

  const handleConnect = async (platformName: string, platformKey: string) => {
    setLoadingPlatforms(prev => new Set(prev).add(platformName));
    
    try {
      console.log(`[Platform Connect] Starting OAuth for ${platformKey}`);
      
      const startResult = await oauthStartMutation.mutateAsync({ 
        platform: platformKey as any 
      });
      
      if (startResult.requiresBotToken) {
        // Handle Telegram bot token flow
        Alert.alert(
          "Telegram Setup",
          startResult.instructions || "Please set up your Telegram bot token in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to Settings", onPress: () => router.push("/(tabs)/settings") }
          ]
        );
      } else if (startResult.authUrl) {
        console.log(`[Platform Connect] OAuth URL for ${platformKey}:`, startResult.authUrl);
        
        if (isLiveMode) {
          if (Platform.OS === 'web') {
            window.open(startResult.authUrl, '_blank');
          } else {
            await Linking.openURL(startResult.authUrl);
          }
          
          // In LIVE mode, we don't simulate the callback - it will come from the actual OAuth flow
          setLoadingPlatforms(prev => {
            const newSet = new Set(prev);
            newSet.delete(platformName);
            return newSet;
          });
        } else {
          // DEMO mode: simulate successful OAuth
          setTimeout(async () => {
            try {
              const callbackResult = await oauthCallbackMutation.mutateAsync({
                platform: platformKey as any,
                code: "demo_auth_code",
                state: startResult.state
              });
              
              if (callbackResult.success) {
                connectPlatform(platformName);
                Alert.alert(
                  "Success",
                  `${platformName} connected successfully! (Demo Mode)`,
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              console.error(`[Platform Connect] Callback error:`, error);
              Alert.alert(
                "Connection Failed",
                `Failed to connect ${platformName}. Please try again.`,
                [{ text: "OK" }]
              );
            } finally {
              setLoadingPlatforms(prev => {
                const newSet = new Set(prev);
                newSet.delete(platformName);
                return newSet;
              });
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error(`[Platform Connect] Start error:`, error);
      
      // Better error handling with specific messages
      let errorMessage = `Failed to start ${platformName} connection. Please try again.`;
      if (error instanceof Error) {
        if (error.name === 'NetworkError') {
          errorMessage = "Cannot connect to server. Please check your internet connection and try again.";
        } else if (error.message.includes('Backend server may not be running')) {
          errorMessage = "Backend server is not available. Please try again later.";
        } else if (error.message.includes('Unexpected token')) {
          errorMessage = "Backend server is not responding correctly. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle tRPC error objects
        const trpcError = error as any;
        if (trpcError.message) {
          errorMessage = trpcError.message;
        } else if (trpcError.data?.message) {
          errorMessage = trpcError.data.message;
        } else {
          errorMessage = "An unexpected error occurred. Please try again.";
        }
      }
      
      Alert.alert("Connection Failed", errorMessage, [{ text: "OK" }]);
      setLoadingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete(platformName);
        return newSet;
      });
    }
  };

  const handleContinue = () => {
    if (connectedPlatforms.length === 0) {
      Alert.alert(
        "No Platforms Connected",
        "Please connect at least one platform to continue",
        [{ text: "OK" }]
      );
      return;
    }
    router.replace("/(tabs)" as any);
  };

  const handleSkip = () => {
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Connect Your Platforms</Text>
            <View style={[styles.modeBadge, isLiveMode ? styles.liveBadge : styles.dryRunBadge]}>
              {isLiveMode ? (
                <Zap size={12} color="#10B981" />
              ) : (
                <AlertCircle size={12} color="#F59E0B" />
              )}
              <Text style={[styles.modeText, isLiveMode ? styles.liveText : styles.dryRunText]}>
                {isLiveMode ? 'LIVE' : 'DEMO'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Link your social media accounts to start automating your marketing with Flâneur
            {!isLiveMode && " (Demo mode - no real connections)"}
          </Text>
        </View>

        <View style={styles.platformsList}>
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.name}
              name={platform.name}
              icon={platform.icon}
              color={platform.color}
              connected={connectedPlatforms.includes(platform.name)}
              loading={loadingPlatforms.has(platform.name)}
              onConnect={() => handleConnect(platform.name, platform.key)}
            />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Secure Connection</Text>
          <Text style={styles.infoText}>
            We use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.
            {!isLiveMode && "\n\n⚠️ Demo Mode: Connections are simulated for testing purposes."}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              connectedPlatforms.length === 0 && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue ({connectedPlatforms.length} connected)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: theme.colors.white,
    marginBottom: 8,
    fontFamily: theme.typography.serif.fontFamily,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray[400],
    lineHeight: 24,
  },
  platformsList: {
    gap: 12,
    marginBottom: 32,
  },
  platformCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  platformCardConnected: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 4,
  },
  platformStatus: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  infoCard: {
    backgroundColor: theme.colors.gray[900],
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.gray[800],
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.gray[300],
    lineHeight: 20,
  },
  footer: {
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    color: theme.colors.gray[400],
  },
  continueButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.gray[600],
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveBadge: {
    backgroundColor: "#10B98120",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  dryRunBadge: {
    backgroundColor: "#F59E0B20",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  modeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  liveText: {
    color: "#10B981",
  },
  dryRunText: {
    color: "#F59E0B",
  },
});