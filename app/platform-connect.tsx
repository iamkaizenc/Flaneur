import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Send,
  Check,
  ChevronRight
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme } from "@/constants/theme";

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  onConnect: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ 
  name, 
  icon, 
  color, 
  connected, 
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
    {connected ? (
      <Check size={24} color="#10B981" />
    ) : (
      <ChevronRight size={24} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function PlatformConnectScreen() {
  const { connectedPlatforms, connectPlatform } = useAIMarketer();

  const platforms = [
    { name: "X (Twitter)", icon: <Twitter size={24} color="#1DA1F2" />, color: "#1DA1F2" },
    { name: "Instagram", icon: <Instagram size={24} color="#E4405F" />, color: "#E4405F" },
    { name: "LinkedIn", icon: <Linkedin size={24} color="#0077B5" />, color: "#0077B5" },
    { name: "Telegram", icon: <Send size={24} color="#0088CC" />, color: "#0088CC" },
  ];

  const handleConnect = async (platformName: string) => {
    // Simulate OAuth flow
    setTimeout(() => {
      connectPlatform(platformName);
      Alert.alert(
        "Success",
        `${platformName} connected successfully!`,
        [{ text: "OK" }]
      );
    }, 1500);
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
          <Text style={styles.title}>Connect Your Platforms</Text>
          <Text style={styles.subtitle}>
            Link your social media accounts to start automating your marketing with Flâneur
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
              onConnect={() => handleConnect(platform.name)}
            />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Secure Connection</Text>
          <Text style={styles.infoText}>
            We use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.
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
});