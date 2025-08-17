import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Link,
  Unlink,
  Clock,
  Shield,
  Bell,
  Palette,
  Code,
  User,
  CreditCard,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react-native";
import { theme, brandName } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
}

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

interface AccountCardProps {
  platform: string;
  handle: string;
  status: "connected" | "expired";
  lastRefresh: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIcon}>
      {icon}
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  subtitle, 
  value, 
  onPress, 
  rightElement, 
  disabled = false 
}) => (
  <TouchableOpacity 
    style={[styles.settingItem, disabled && styles.settingItemDisabled]} 
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.settingSubtitle, disabled && styles.settingSubtitleDisabled]}>
          {subtitle}
        </Text>
      )}
      {value && (
        <Text style={[styles.settingValue, disabled && styles.settingValueDisabled]}>
          {value}
        </Text>
      )}
    </View>
    {rightElement || <ChevronRight size={20} color={theme.colors.gray[400]} />}
  </TouchableOpacity>
);

const AccountCard: React.FC<AccountCardProps> = ({ 
  platform, 
  handle, 
  status, 
  lastRefresh, 
  onConnect, 
  onDisconnect 
}) => (
  <View style={styles.accountCard}>
    <View style={styles.accountHeader}>
      <View style={styles.accountInfo}>
        <Text style={styles.accountPlatform}>{platform}</Text>
        <Text style={styles.accountHandle}>{handle}</Text>
        <Text style={styles.accountRefresh}>Last refresh: {new Date(lastRefresh).toLocaleDateString()}</Text>
      </View>
      <View style={[styles.statusBadge, status === "connected" ? styles.statusConnected : styles.statusExpired]}>
        {status === "connected" ? (
          <CheckCircle size={16} color="#10B981" />
        ) : (
          <AlertCircle size={16} color="#F59E0B" />
        )}
        <Text style={[styles.statusText, status === "connected" ? styles.statusTextConnected : styles.statusTextExpired]}>
          {status === "connected" ? "Connected" : "Expired"}
        </Text>
      </View>
    </View>
    <View style={styles.accountActions}>
      {status === "expired" ? (
        <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
          <Link size={16} color={theme.colors.white} />
          <Text style={styles.connectButtonText}>Reconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Unlink size={16} color={theme.colors.gray[600]} />
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function SettingsScreen() {
  const [dryRunEnabled, setDryRunEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [logoEnabled, setLogoEnabled] = useState(true);
  
  const settingsQuery = trpc.settings.get.useQuery();
  const settingsUpdateMutation = trpc.settings.update.useMutation();
  const settingsConnectMutation = trpc.settings.connect.useMutation();
  const settingsDisconnectMutation = trpc.settings.disconnect.useMutation();
  const settingsTestNotificationMutation = trpc.settings.testNotification.useMutation();
  
  const authMeQuery = trpc.auth.me.useQuery();
  const authLogoutMutation = trpc.auth.logout.useMutation();
  
  const plansQuery = trpc.plans.getCurrent.useQuery();
  const plansUpgradeMutation = trpc.plans.upgrade.useMutation();

  const handleConnect = async (platform: string) => {
    try {
      const result = await settingsConnectMutation.mutateAsync({ platform: platform as any });
      if (result.redirectUrl === "DIRECT_SETUP") {
        Alert.alert(
          "Telegram Setup",
          "Please add your bot token in the Telegram settings section.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Connect Account",
          `Redirect to: ${result.redirectUrl}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect account");
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await settingsDisconnectMutation.mutateAsync({ platform });
      Alert.alert("Success", `${platform} disconnected successfully`);
    } catch (error) {
      Alert.alert("Error", "Failed to disconnect account");
    }
  };

  const handleTestNotification = async (channel: "email" | "telegram") => {
    try {
      const result = await settingsTestNotificationMutation.mutateAsync({ channel });
      Alert.alert("Success", result.message);
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await authLogoutMutation.mutateAsync();
              // Navigate to login screen
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = async (targetPlan: "premium" | "platinum") => {
    try {
      const result = await plansUpgradeMutation.mutateAsync({ targetPlan });
      if (result.success) {
        Alert.alert("Success", result.message);
        plansQuery.refetch();
      } else {
        Alert.alert("Payment Required", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upgrade plan");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandName}>{brandName}</Text>
        <Text style={styles.brandTagline}>Settings & Configuration</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <SectionHeader title="Profile" icon={<User size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title={authMeQuery.data?.displayName || "Loading..."}
            subtitle={authMeQuery.data?.email || ""}
            value={`${plansQuery.data?.plan || "free"} plan`}
            onPress={() => Alert.alert("Profile", "Profile editing not implemented yet")}
          />
        </View>

        {/* Subscription Section */}
        <SectionHeader title="Subscription" icon={<CreditCard size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Current Plan"
            subtitle={plansQuery.data?.featuresEnabled.description || ""}
            value={plansQuery.data?.plan || "free"}
          />
          {plansQuery.data && plansQuery.data.plan !== "premium" && plansQuery.data.plan !== "platinum" && (
            <SettingItem
              title="Upgrade to Premium"
              subtitle="Growth tracking + analytics"
              onPress={() => handleUpgrade("premium")}
            />
          )}
          {plansQuery.data && (plansQuery.data.plan as string) !== "platinum" && (
            <SettingItem
              title="Upgrade to Platinum"
              subtitle="Analytics + automation"
              onPress={() => handleUpgrade("platinum")}
            />
          )}
        </View>

        {/* Connections Section */}
        <SectionHeader title="Connections" icon={<Link size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          {settingsQuery.data?.accounts.map((account, index) => (
            <AccountCard
              key={index}
              platform={account.platform}
              handle={account.handle}
              status={account.status}
              lastRefresh={account.lastRefresh}
              onConnect={() => handleConnect(account.platform)}
              onDisconnect={() => handleDisconnect(account.platform)}
            />
          ))}
        </View>

        {/* Posting Rules Section */}
        <SectionHeader title="Posting Rules" icon={<Clock size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Daily Limits"
            subtitle="Per-platform posting quotas"
            value={`X: ${settingsQuery.data?.quotas.dailyLimits.X || 0}, IG: ${settingsQuery.data?.quotas.dailyLimits.Instagram || 0}`}
          />
          <SettingItem
            title="Posting Window"
            subtitle="Active hours for content distribution"
            value={`${settingsQuery.data?.quotas.postingWindow.start || 8}:00 - ${settingsQuery.data?.quotas.postingWindow.end || 22}:00`}
          />
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>DRY RUN Mode</Text>
              <Text style={styles.switchSubtitle}>Test mode - no actual publishing</Text>
            </View>
            <Switch
              value={settingsQuery.data?.quotas.dryRun ?? true}
              onValueChange={(value) => {
                setDryRunEnabled(value);
                if (settingsQuery.data?.quotas) {
                  settingsUpdateMutation.mutate({ 
                    quotas: { 
                      ...settingsQuery.data.quotas,
                      dryRun: value 
                    } 
                  });
                }
              }}
              trackColor={{ false: theme.colors.gray[300], true: theme.colors.black }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Guardrails Section */}
        <SectionHeader title="Guardrails" icon={<Shield size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Banned Words"
            subtitle={`${settingsQuery.data?.guardrails.bannedWords.length || 0} words configured`}
            value={settingsQuery.data?.guardrails.bannedWords.slice(0, 2).join(", ") + "..."}
          />
          <SettingItem
            title="Risk Level"
            subtitle="Content safety threshold"
            value={settingsQuery.data?.guardrails.riskLevel || "normal"}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" icon={<Bell size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Email Notifications"
            subtitle={settingsQuery.data?.notifications.emails.join(", ") || "None"}
          />
          <SettingItem
            title="Test Email"
            subtitle="Send a test notification"
            onPress={() => handleTestNotification("email")}
          />
          {settingsQuery.data?.notifications.telegramChatId && (
            <SettingItem
              title="Test Telegram"
              subtitle="Send a test notification"
              onPress={() => handleTestNotification("telegram")}
              rightElement={<Send size={16} color={theme.colors.gray[400]} />}
            />
          )}
        </View>

        {/* Branding Section */}
        <SectionHeader title="Branding" icon={<Palette size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Text style={styles.switchTitle}>Logo Wordmark</Text>
              <Text style={styles.switchSubtitle}>Show Flâneur branding in content</Text>
            </View>
            <Switch
              value={settingsQuery.data?.branding.logoWordmarkEnabled ?? true}
              onValueChange={(value) => {
                setLogoEnabled(value);
                if (settingsQuery.data?.branding) {
                  settingsUpdateMutation.mutate({ 
                    branding: { 
                      ...settingsQuery.data.branding,
                      logoWordmarkEnabled: value 
                    } 
                  });
                }
              }}
              trackColor={{ false: theme.colors.gray[300], true: theme.colors.black }}
              thumbColor={theme.colors.white}
            />
          </View>
          <SettingItem
            title="Theme"
            subtitle="Visual appearance"
            value={settingsQuery.data?.branding.theme || "black-white"}
          />
        </View>

        {/* Developer Section */}
        <SectionHeader title="Developer" icon={<Code size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="API Health"
            subtitle="/api/health endpoint status"
            value="Checking..."
          />
          <SettingItem
            title="API Version"
            subtitle="/api/version endpoint"
            value="v1.0.0"
          />
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={theme.colors.white} />
            <Text style={styles.logoutButtonText}>Logout</Text>
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: theme.colors.gray[400],
    fontFamily: theme.typography.sansSerif.fontFamily,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[800],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
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
  settingItem: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: theme.colors.gray[400],
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  settingSubtitleDisabled: {
    color: theme.colors.gray[300],
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  settingValueDisabled: {
    color: theme.colors.gray[300],
  },
  switchItem: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  switchContent: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  accountCard: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountPlatform: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  accountHandle: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 4,
  },
  accountRefresh: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusConnected: {
    backgroundColor: "#D1FAE5",
  },
  statusExpired: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  statusTextConnected: {
    color: "#10B981",
  },
  statusTextExpired: {
    color: "#F59E0B",
  },
  accountActions: {
    flexDirection: "row",
    gap: 8,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.black,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: theme.colors.white,
  },
  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: theme.colors.gray[600],
  },
  logoutSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
});