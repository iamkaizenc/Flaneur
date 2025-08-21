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
  Modal,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
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
  Camera,
  Edit3,
  Trash2,
  Crown,
  Star,
  Zap,
  ExternalLink,
  Mail,
  FileText,
  Globe,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  TrendingUp,
  Activity,
  BarChart3,
  Plus,
  Minus,
} from "lucide-react-native";
import { theme, brandName } from "@/constants/theme";
import { trpc, trpcClient, testBackendConnection } from "@/lib/trpc";
import { usePurchase } from "@/hooks/usePurchase";
import { LanguagePicker } from "../../src/components/LanguagePicker";

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
  status: "connected" | "expired" | "error";
  lastRefresh: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onFix?: () => void;
  isLiveMode?: boolean;
}

interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  description: string;
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

const getPlatformConfig = (platform: string): PlatformConfig => {
  const configs: Record<string, PlatformConfig> = {
    x: {
      name: "X (Twitter)",
      icon: "𝕏",
      color: "#000000",
      description: "Connect your X account for posting tweets"
    },
    instagram: {
      name: "Instagram",
      icon: "📷",
      color: "#E4405F",
      description: "Share photos and stories to Instagram"
    },
    facebook: {
      name: "Facebook",
      icon: "📘",
      color: "#1877F2",
      description: "Post to your Facebook page"
    },
    linkedin: {
      name: "LinkedIn",
      icon: "💼",
      color: "#0A66C2",
      description: "Share professional content on LinkedIn"
    },
    tiktok: {
      name: "TikTok",
      icon: "🎵",
      color: "#000000",
      description: "Upload videos to TikTok"
    },
    telegram: {
      name: "Telegram",
      icon: "✈️",
      color: "#0088CC",
      description: "Send messages via Telegram bot"
    }
  };
  return configs[platform] || {
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    icon: "🔗",
    color: "#6B7280",
    description: `Connect your ${platform} account`
  };
};

const AccountCard: React.FC<AccountCardProps> = ({ 
  platform, 
  handle, 
  status, 
  lastRefresh, 
  onConnect, 
  onDisconnect,
  onFix,
  isLiveMode = false
}) => {
  const config = getPlatformConfig(platform);
  
  return (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.platformIconContainer}>
          <Text style={styles.platformIcon}>{config.icon}</Text>
          {!isLiveMode && (
            <View style={styles.sandboxBadge}>
              <Text style={styles.sandboxText}>Sandbox</Text>
            </View>
          )}
        </View>
        <View style={styles.accountInfo}>
          <View style={styles.platformNameRow}>
            <Text style={styles.accountPlatform}>{config.name}</Text>
            <View style={[
              styles.statusBadge, 
              status === "connected" ? styles.statusConnected : 
              status === "error" ? styles.statusError : styles.statusExpired
            ]}>
              {status === "connected" ? (
                <Wifi size={12} color="#10B981" />
              ) : status === "error" ? (
                <AlertCircle size={12} color="#EF4444" />
              ) : (
                <WifiOff size={12} color="#F59E0B" />
              )}
              <Text style={[
                styles.statusText, 
                status === "connected" ? styles.statusTextConnected : 
                status === "error" ? styles.statusTextError : styles.statusTextExpired
              ]}>
                {status === "connected" ? "Connected" : status === "error" ? "Error" : "Expired"}
              </Text>
            </View>
          </View>
          <Text style={styles.accountHandle}>{handle}</Text>
          <Text style={styles.accountDescription}>{config.description}</Text>
          <Text style={styles.accountRefresh}>
            Last refresh: {new Date(lastRefresh).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
      <View style={styles.accountActions}>
        {status === "expired" || status === "error" ? (
          <>
            {onFix && (
              <TouchableOpacity style={styles.fixButton} onPress={onFix}>
                <RefreshCw size={14} color={theme.colors.white} />
                <Text style={styles.fixButtonText}>Fix</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
              <Link size={14} color={theme.colors.white} />
              <Text style={styles.connectButtonText}>Reconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
            <Unlink size={14} color={theme.colors.gray[600]} />
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const ConnectPlatformCard: React.FC<{ platform: string; onConnect: () => void; isLiveMode: boolean }> = ({ 
  platform, 
  onConnect, 
  isLiveMode 
}) => {
  const config = getPlatformConfig(platform);
  
  return (
    <TouchableOpacity style={styles.connectPlatformCard} onPress={onConnect} activeOpacity={0.7}>
      <View style={styles.connectPlatformHeader}>
        <View style={styles.platformIconContainer}>
          <Text style={styles.platformIcon}>{config.icon}</Text>
          {!isLiveMode && (
            <View style={styles.sandboxBadge}>
              <Text style={styles.sandboxText}>Sandbox</Text>
            </View>
          )}
        </View>
        <View style={styles.connectPlatformInfo}>
          <Text style={styles.connectPlatformName}>{config.name}</Text>
          <Text style={styles.connectPlatformDescription}>{config.description}</Text>
        </View>
        <View style={styles.connectPlatformAction}>
          <View style={styles.connectIconContainer}>
            <Link size={16} color={theme.colors.white} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RiskCenterSection: React.FC = () => {
  const riskStatusQuery = trpc.risk.getStatus.useQuery({ range: "7d" });
  const riskSimulateMutation = trpc.risk.simulateAlert.useMutation();
  const [riskNotificationsEnabled, setRiskNotificationsEnabled] = useState(true);

  const handleSimulateAlert = async () => {
    try {
      const result = await riskSimulateMutation.mutateAsync();
      riskStatusQuery.refetch();
      Alert.alert("Demo Alert", "Risk uyarısı oluşturuldu (demo)");
    } catch (error) {
      Alert.alert("Error", "Demo alert oluşturulamadı");
    }
  };

  if (!riskStatusQuery.data) {
    return (
      <View style={styles.riskCenterLoading}>
        <Text style={styles.riskCenterLoadingText}>Risk durumu yükleniyor...</Text>
      </View>
    );
  }

  const { shadowban, healthScore, quotas, alerts } = riskStatusQuery.data;
  const isHealthy = !shadowban.detected && shadowban.riskLevel === "low";

  return (
    <View style={styles.riskCenterContainer}>
      {/* Health Status */}
      <View style={[styles.riskHealthCard, { backgroundColor: isHealthy ? "#D1FAE5" : "#FEE2E2" }]}>
        <View style={styles.riskHealthHeader}>
          <View style={[styles.riskHealthIcon, { backgroundColor: isHealthy ? "#10B981" : "#EF4444" }]}>
            {isHealthy ? (
              <CheckCircle size={16} color={theme.colors.white} />
            ) : (
              <AlertCircle size={16} color={theme.colors.white} />
            )}
          </View>
          <View style={styles.riskHealthInfo}>
            <Text style={[styles.riskHealthTitle, { color: isHealthy ? "#10B981" : "#EF4444" }]}>
              {isHealthy ? "Sağlıklı Durum" : "Risk Tespit Edildi"}
            </Text>
            <Text style={styles.riskHealthSubtitle}>
              Sağlık Skoru: {healthScore}/100
            </Text>
          </View>
        </View>
        {shadowban.reason && (
          <Text style={styles.riskHealthReason}>{shadowban.reason}</Text>
        )}
      </View>

      {/* Platform Quotas */}
      <View style={styles.riskQuotasSection}>
        <Text style={styles.riskSectionTitle}>Günlük Kotalar</Text>
        {Object.entries(quotas).map(([platform, quota]) => (
          <View key={platform} style={styles.quotaItem}>
            <Text style={styles.quotaPlatform}>{platform.toUpperCase()}</Text>
            <View style={styles.quotaBar}>
              <View style={styles.quotaBarBackground}>
                <View 
                  style={[
                    styles.quotaBarFill, 
                    { width: `${Math.min((quota.daily / quota.daily) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.quotaText}>{quota.daily} günlük</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Alerts */}
      {alerts && alerts.length > 0 && (
        <View style={styles.riskAlertsSection}>
          <Text style={styles.riskSectionTitle}>Son Uyarılar</Text>
          {alerts.slice(0, 3).map((alert, index) => (
            <View key={alert.id || index} style={styles.alertItem}>
              <View style={[styles.alertSeverity, { backgroundColor: 
                alert.severity === "high" ? "#EF4444" : 
                alert.severity === "medium" ? "#F59E0B" : "#10B981"
              }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleDateString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Controls */}
      <View style={styles.riskControlsSection}>
        <View style={styles.switchItem}>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>Risk Bildirimleri</Text>
            <Text style={styles.switchSubtitle}>Otomatik uyarıları etkinleştir</Text>
          </View>
          <Switch
            value={riskNotificationsEnabled}
            onValueChange={setRiskNotificationsEnabled}
            trackColor={{ false: theme.colors.gray[300], true: theme.colors.black }}
            thumbColor={theme.colors.white}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.simulateButton} 
          onPress={handleSimulateAlert}
          disabled={riskSimulateMutation.isPending}
        >
          <Activity size={16} color={theme.colors.white} />
          <Text style={styles.simulateButtonText}>
            {riskSimulateMutation.isPending ? "Oluşturuluyor..." : "Demo Uyarı Oluştur"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const [dryRunEnabled, setDryRunEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [logoEnabled, setLogoEnabled] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [deleteForm, setDeleteForm] = useState({ password: "" });
  
  const settingsQuery = trpc.settings.get.useQuery();
  const settingsUpdateMutation = trpc.settings.update.useMutation();
  const settingsConnectMutation = trpc.settings.connect.useMutation();
  const settingsDisconnectMutation = trpc.settings.disconnect.useMutation();
  const settingsTestNotificationMutation = trpc.settings.testNotification.useMutation();
  
  const oauthStartMutation = trpc.oauth.start.useMutation();
  const oauthFixMutation = trpc.oauth.fix.useMutation();
  const oauthRevokeMutation = trpc.oauth.revoke.useMutation();
  const oauthAccountsQuery = trpc.oauth.listAccounts.useQuery();
  const riskStatusQuery = trpc.risk.getStatus.useQuery({ range: "7d" });
  const riskSimulateMutation = trpc.risk.simulateAlert.useMutation();
  
  const authMeQuery = trpc.auth.me.useQuery();
  const authLogoutMutation = trpc.auth.logout.useMutation();
  const authUpdateProfileMutation = trpc.auth.updateProfile.useMutation();
  const authUpdateEmailMutation = trpc.auth.updateEmail.useMutation();
  const authUpdatePasswordMutation = trpc.auth.updatePassword.useMutation();
  const authDeleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  
  const plansQuery = trpc.plans.getCurrent.useQuery();
  const plansUpgradeMutation = trpc.plans.upgrade.useMutation();
  
  const { purchasePlan, restorePurchases, isLoading: purchaseLoading } = usePurchase();

  const isLiveMode = process.env.EXPO_PUBLIC_LIVE_MODE === "true";
  const availablePlatforms = ["x", "instagram", "facebook", "linkedin", "tiktok", "telegram"];
  
  const handleConnect = async (platform: string) => {
    try {
      const result = await oauthStartMutation.mutateAsync({ 
        platform: platform as "x" | "instagram" | "linkedin" | "tiktok" | "facebook" | "telegram" 
      });
      
      if (result.requiresBotToken) {
        Alert.alert(
          "Telegram Setup",
          result.message + "\n\n" + result.instructions,
          [{ text: "OK" }]
        );
      } else if (result.authUrl) {
        console.log(`[OAuth] Opening auth URL for ${platform}:`, result.authUrl);
        
        if (isLiveMode) {
          if (Platform.OS === 'web') {
            window.open(result.authUrl, '_blank');
          } else {
            await Linking.openURL(result.authUrl);
          }
        } else {
          // In DRY_RUN mode, simulate successful connection
          Alert.alert(
            "Connect Account",
            `Simulating ${getPlatformConfig(platform).name} connection (DRY_RUN mode)`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Connect", 
                onPress: () => {
                  setTimeout(() => {
                    oauthAccountsQuery.refetch();
                    settingsQuery.refetch();
                    Alert.alert("Success", `${getPlatformConfig(platform).name} connected successfully (DRY_RUN mode)`);
                  }, 1000);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('[OAuth] Connection error:', error);
      
      // Better error handling with specific messages
      let errorMessage = "Failed to connect account";
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
      
      Alert.alert("Connection Error", errorMessage);
    }
  };

  const handleDisconnect = async (platform: string) => {
    Alert.alert(
      "Disconnect Account",
      `Are you sure you want to disconnect your ${getPlatformConfig(platform).name} account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await oauthRevokeMutation.mutateAsync({ platform });
              oauthAccountsQuery.refetch();
              settingsQuery.refetch();
              Alert.alert("Success", `${getPlatformConfig(platform).name} disconnected successfully`);
            } catch (error) {
              Alert.alert("Error", "Failed to disconnect account");
            }
          }
        }
      ]
    );
  };
  
  const handleFix = async (platform: string) => {
    try {
      const result = await oauthFixMutation.mutateAsync({ platform });
      
      if (result.requiresBotToken) {
        Alert.alert(
          "Telegram Setup",
          result.message + "\n\n" + "Please update your bot token in the connection settings.",
          [{ text: "OK" }]
        );
      } else if (result.authUrl) {
        console.log(`[OAuth] Opening fix auth URL for ${platform}:`, result.authUrl);
        
        if (isLiveMode) {
          if (Platform.OS === 'web') {
            window.open(result.authUrl, '_blank');
          } else {
            await Linking.openURL(result.authUrl);
          }
        } else {
          Alert.alert(
            "Fix Connection",
            `Simulating ${getPlatformConfig(platform).name} re-authorization (DRY_RUN mode)`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Fix", 
                onPress: () => {
                  setTimeout(() => {
                    oauthAccountsQuery.refetch();
                    settingsQuery.refetch();
                    Alert.alert("Success", `${getPlatformConfig(platform).name} connection fixed (DRY_RUN mode)`);
                  }, 1000);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('[OAuth] Fix connection error:', error);
      
      // Better error handling with specific messages
      let errorMessage = "Failed to fix connection";
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
      
      Alert.alert("Connection Error", errorMessage);
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
      const purchaseResult = await purchasePlan(targetPlan);
      if (purchaseResult.success) {
        const result = await plansUpgradeMutation.mutateAsync({ targetPlan });
        if (result.success) {
          Alert.alert("Success", result.message);
          plansQuery.refetch();
        }
      } else {
        Alert.alert("Purchase Failed", purchaseResult.message || "Failed to complete purchase");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upgrade plan");
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      
      try {
        await authUpdateProfileMutation.mutateAsync({ avatarUrl: base64Image });
        authMeQuery.refetch();
        Alert.alert("Success", "Profile picture updated successfully");
      } catch (error) {
        Alert.alert("Error", "Failed to update profile picture");
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }

    try {
      await authUpdateProfileMutation.mutateAsync({ displayName: profileForm.displayName });
      if (profileForm.email !== authMeQuery.data?.email) {
        await authUpdateEmailMutation.mutateAsync({ 
          newEmail: profileForm.email, 
          password: "current_password" // In real app, ask for password
        });
      }
      authMeQuery.refetch();
      setShowProfileModal(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    try {
      await authUpdatePasswordMutation.mutateAsync({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      Alert.alert("Success", "Password updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update password. Please check your current password.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteForm.password.trim()) {
      Alert.alert("Error", "Please enter your password to confirm account deletion");
      return;
    }

    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await authDeleteAccountMutation.mutateAsync({ password: deleteForm.password });
              setShowDeleteModal(false);
              Alert.alert("Account Deleted", "Your account has been permanently deleted.");
              // Navigate to login screen
            } catch (error) {
              Alert.alert("Error", "Failed to delete account. Please check your password.");
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      const result = await restorePurchases();
      if (result.success) {
        plansQuery.refetch();
        Alert.alert("Success", "Purchases restored successfully");
      } else {
        Alert.alert("No Purchases", "No previous purchases found to restore");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases");
    }
  };

  const handleSimulateRiskAlert = async () => {
    try {
      const result = await riskSimulateMutation.mutateAsync();
      riskStatusQuery.refetch();
      Alert.alert("Demo Alert Created", result.message);
    } catch (error) {
      Alert.alert("Error", "Failed to create demo alert");
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      displayName: authMeQuery.data?.displayName || "",
      email: authMeQuery.data?.email || "",
    });
    setShowProfileModal(true);
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "premium":
        return <Star size={16} color="#F59E0B" />;
      case "platinum":
        return <Crown size={16} color="#8B5CF6" />;
      default:
        return <User size={16} color={theme.colors.gray[400]} />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "premium":
        return "#F59E0B";
      case "platinum":
        return "#8B5CF6";
      default:
        return theme.colors.gray[400];
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
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
              {authMeQuery.data?.avatarUrl ? (
                <Image source={{ uri: authMeQuery.data.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={32} color={theme.colors.gray[400]} />
                </View>
              )}
              <View style={styles.avatarOverlay}>
                <Camera size={16} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileName}>{authMeQuery.data?.displayName || "Loading..."}</Text>
                <View style={[styles.planBadge, { backgroundColor: getPlanColor(plansQuery.data?.plan || "free") + "20" }]}>
                  {getPlanIcon(plansQuery.data?.plan || "free")}
                  <Text style={[styles.planBadgeText, { color: getPlanColor(plansQuery.data?.plan || "free") }]}>
                    {(plansQuery.data?.plan || "free").toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.profileEmail}>{authMeQuery.data?.email || ""}</Text>
              <Text style={styles.profileJoined}>
                Joined {authMeQuery.data?.createdAt ? new Date(authMeQuery.data.createdAt).toLocaleDateString() : ""}
              </Text>
            </View>
          </View>
          <SettingItem
            title="Edit Profile"
            subtitle="Update your display name and email"
            onPress={openProfileModal}
            rightElement={<Edit3 size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setShowPasswordModal(true)}
          />
          <SettingItem
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={() => setShowDeleteModal(true)}
            rightElement={<Trash2 size={16} color="#EF4444" />}
          />
        </View>

        {/* Billing & Subscription Section */}
        <SectionHeader title="Billing & Subscription" icon={<CreditCard size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Manage Billing"
            subtitle="View plans, usage, and billing details"
            onPress={() => {
              // Navigate to billing settings page
              Alert.alert(
                "Billing Management",
                "This would open the full billing management interface with plan details, usage stats, and Stripe integration.",
                [{ text: "OK" }]
              );
            }}
            rightElement={<CreditCard size={16} color={theme.colors.gray[400]} />}
          />
          
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <View style={styles.currentPlanInfo}>
                <Text style={styles.currentPlanTitle}>Current Plan</Text>
                <View style={styles.currentPlanBadge}>
                  {getPlanIcon(plansQuery.data?.plan || "free")}
                  <Text style={styles.currentPlanName}>{(plansQuery.data?.plan || "free").toUpperCase()}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.currentPlanDescription}>
              {plansQuery.data?.featuresEnabled.description || "Basic features only"}
            </Text>
            <View style={styles.planFeatures}>
              <View style={styles.featureRow}>
                <CheckCircle size={14} color={plansQuery.data?.featuresEnabled.analytics ? "#10B981" : theme.colors.gray[300]} />
                <Text style={[styles.featureText, !plansQuery.data?.featuresEnabled.analytics && styles.featureDisabled]}>
                  Growth Analytics
                </Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle size={14} color={plansQuery.data?.featuresEnabled.automation ? "#10B981" : theme.colors.gray[300]} />
                <Text style={[styles.featureText, !plansQuery.data?.featuresEnabled.automation && styles.featureDisabled]}>
                  Automation
                </Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.featureText}>
                  {plansQuery.data?.featuresEnabled.maxAccounts || 1} Connected Accounts
                </Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.featureText}>
                  {plansQuery.data?.featuresEnabled.dailyPosts || 5} Daily Posts
                </Text>
              </View>
            </View>
          </View>
          
          {plansQuery.data && plansQuery.data.plan !== "premium" && plansQuery.data.plan !== "platinum" && (
            <TouchableOpacity 
              style={[styles.upgradeButton, styles.premiumButton]} 
              onPress={() => handleUpgrade("premium")}
              disabled={purchaseLoading}
            >
              <Star size={20} color="#F59E0B" />
              <View style={styles.upgradeButtonContent}>
                <Text style={styles.upgradeButtonTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeButtonSubtitle}>Growth tracking + analytics</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          )}
          
          {plansQuery.data && (plansQuery.data.plan as string) !== "platinum" && (
            <TouchableOpacity 
              style={[styles.upgradeButton, styles.platinumButton]} 
              onPress={() => handleUpgrade("platinum")}
              disabled={purchaseLoading}
            >
              <Crown size={20} color="#8B5CF6" />
              <View style={styles.upgradeButtonContent}>
                <Text style={styles.upgradeButtonTitle}>Upgrade to Platinum</Text>
                <Text style={styles.upgradeButtonSubtitle}>Analytics + automation + unlimited</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          )}
          
          <SettingItem
            title="Restore Purchases"
            subtitle="Restore previous purchases from App Store"
            onPress={handleRestorePurchases}
            disabled={purchaseLoading}
          />
        </View>

        {/* Connections Section */}
        <SectionHeader 
          title="Connections" 
          icon={<Link size={20} color={theme.colors.white} />} 
        />
        <View style={styles.section}>
          {!isLiveMode && (
            <View style={styles.modeIndicator}>
              <Settings size={16} color={"#F59E0B"} />
              <Text style={styles.modeIndicatorText}>Sandbox Mode - Testing Environment</Text>
            </View>
          )}
          
          {/* Connected Accounts */}
          {oauthAccountsQuery.data?.accounts.map((account, index) => (
            <AccountCard
              key={index}
              platform={account.platform}
              handle={account.handle}
              status={account.status}
              lastRefresh={account.lastRefresh || new Date().toISOString()}
              onConnect={() => handleConnect(account.platform)}
              onDisconnect={() => handleDisconnect(account.platform)}
              onFix={() => handleFix(account.platform)}
              isLiveMode={isLiveMode}
            />
          ))}
          
          {/* Available Platforms to Connect */}
          {availablePlatforms
            .filter(platform => !oauthAccountsQuery.data?.accounts.some(acc => acc.platform === platform))
            .map((platform) => (
              <ConnectPlatformCard
                key={platform}
                platform={platform}
                onConnect={() => handleConnect(platform)}
                isLiveMode={isLiveMode}
              />
            ))
          }
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

        {/* Risk Center Section */}
        <SectionHeader title="Risk Merkezi" icon={<Shield size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <RiskCenterSection />
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
        <SectionHeader title="Notifications & Webhooks" icon={<Bell size={20} color={theme.colors.white} />} />
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
          <SettingItem
            title="Test Push Notification"
            subtitle="Test push notification system"
            onPress={async () => {
              try {
                const result = await trpcClient.notifications.test.mutate({
                  userId: "demo_user",
                  channel: "push"
                });
                Alert.alert("Success", result.message);
              } catch (error) {
                Alert.alert("Error", "Failed to send test notification");
              }
            }}
            rightElement={<Bell size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Webhook Management"
            subtitle="Configure webhook endpoints"
            onPress={() => {
              Alert.alert(
                "Webhook Demo",
                "Register a webhook endpoint to receive real-time notifications",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Register Demo Webhook",
                    onPress: async () => {
                      try {
                        const result = await trpcClient.webhooks.register.mutate({
                          userId: "demo_user",
                          url: "https://webhook.site/demo",
                          secret: "demo_secret_key_123",
                          events: ["content.published", "content.held", "content.error"],
                          name: "Demo Webhook"
                        });
                        Alert.alert("Success", result.message);
                      } catch (error) {
                        Alert.alert("Error", "Failed to register webhook");
                      }
                    }
                  }
                ]
              );
            }}
            rightElement={<Globe size={16} color={theme.colors.gray[400]} />}
          />
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
          <View style={styles.languageSection}>
            <LanguagePicker />
          </View>
        </View>

        {/* Scheduler Section */}
        <SectionHeader title="Scheduler & Jobs" icon={<Clock size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Queue Demo Job"
            subtitle="Add a test job to the scheduler"
            onPress={async () => {
              try {
                const runAtDate = new Date(Date.now() + 60000); // 1 minute from now
                const result = await trpcClient.scheduler.queue.mutate({
                  contentId: `demo_content_${Date.now()}`,
                  runAt: runAtDate.toISOString()
                });
                Alert.alert(
                  "Job Queued",
                  `Job ${result.jobId} scheduled for ${runAtDate.toLocaleTimeString()}`
                );
              } catch (error) {
                Alert.alert("Error", "Failed to queue job");
              }
            }}
            rightElement={<Plus size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Worker Tick"
            subtitle="Manually trigger job processing"
            onPress={async () => {
              try {
                const result = await trpcClient.scheduler.workerTick.mutate();
                Alert.alert(
                  "Worker Tick Complete",
                  result.message
                );
              } catch (error) {
                Alert.alert("Error", "Failed to trigger worker");
              }
            }}
            rightElement={<RefreshCw size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Job Statistics"
            subtitle="View scheduler statistics"
            onPress={async () => {
              try {
                const stats = await trpcClient.scheduler.stats.query();
                Alert.alert(
                  "Job Statistics",
                  `Total: ${stats.total}\nPending: ${stats.stats.pending}\nCompleted: ${stats.stats.completed}\nFailed: ${stats.stats.failed}\nSuccess Rate: ${stats.successRate.toFixed(1)}%`
                );
              } catch (error) {
                Alert.alert("Error", "Failed to fetch statistics");
              }
            }}
            rightElement={<BarChart3 size={16} color={theme.colors.gray[400]} />}
          />
        </View>

        {/* Developer Section */}
        <SectionHeader title="Developer" icon={<Code size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Test Backend Connection"
            subtitle="Check if backend server is accessible"
            onPress={async () => {
              try {
                const result = await testBackendConnection();
                Alert.alert(
                  result.success ? "Backend Connected" : "Backend Error",
                  result.message + (result.details ? `\n\nDetails: ${JSON.stringify(result.details, null, 2)}` : ""),
                  [{ text: "OK" }]
                );
              } catch (error) {
                Alert.alert("Test Failed", `Failed to test backend: ${error}`);
              }
            }}
            rightElement={<Activity size={16} color={theme.colors.gray[400]} />}
          />
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
          <SettingItem
            title="Manual Cron Trigger"
            subtitle="Run metrics refresh and daily rollup"
            onPress={() => {
              // Trigger manual cron jobs for testing
              Alert.alert("Cron Jobs", "Manual trigger started (DRY_RUN mode)");
            }}
          />
          <SettingItem
            title="Notification History"
            subtitle="View recent notifications"
            onPress={async () => {
              try {
                const history = await trpcClient.notifications.history.query({ userId: "demo_user", limit: 5 });
                const recentNotifications = history.notifications
                  .map((n: any) => `${n.title} (${new Date(n.sentAt).toLocaleDateString()})`)
                  .join('\n');
                Alert.alert(
                  "Recent Notifications",
                  recentNotifications || "No notifications found"
                );
              } catch (error) {
                Alert.alert("Error", "Failed to fetch notification history");
              }
            }}
            rightElement={<Activity size={16} color={theme.colors.gray[400]} />}
          />
        </View>

        {/* Contact Section */}
        <SectionHeader title="Contact" icon={<Mail size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
          <SettingItem
            title="Website"
            subtitle="flaneurcollective.com"
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('https://flaneurcollective.com', '_blank');
              } else {
                Alert.alert("Website", "Visit flaneurcollective.com in your browser");
              }
            }}
            rightElement={<ExternalLink size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Support"
            subtitle="support@flaneurcollective.com"
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('mailto:support@flaneurcollective.com', '_blank');
              } else {
                Alert.alert("Support", "Email support@flaneurcollective.com");
              }
            }}
            rightElement={<Mail size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Privacy Policy"
            subtitle="flaneurcollective.com/privacy"
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('https://flaneurcollective.com/privacy', '_blank');
              } else {
                Alert.alert("Privacy Policy", "Visit flaneurcollective.com/privacy in your browser");
              }
            }}
            rightElement={<FileText size={16} color={theme.colors.gray[400]} />}
          />
          <SettingItem
            title="Terms of Service"
            subtitle="flaneurcollective.com/terms"
            onPress={() => {
              if (Platform.OS === 'web') {
                window.open('https://flaneurcollective.com/terms', '_blank');
              } else {
                Alert.alert("Terms of Service", "Visit flaneurcollective.com/terms in your browser");
              }
            }}
            rightElement={<FileText size={16} color={theme.colors.gray[400]} />}
          />
        </View>

        {/* Free User Ads */}
        {plansQuery.data?.plan === 'free' && process.env.ADS_ENABLED === 'true' && (
          <View style={styles.adSection}>
            <View style={styles.adCard}>
              <Text style={styles.adLabel}>Ad</Text>
              <Text style={styles.adTitle}>Upgrade to Premium</Text>
              <Text style={styles.adDescription}>Remove ads and unlock advanced features</Text>
              <TouchableOpacity style={styles.adButton} onPress={() => handleUpgrade('premium')}>
                <Text style={styles.adButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={theme.colors.white} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdateProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.displayName}
                onChangeText={(text) => setProfileForm({ ...profileForm, displayName: text })}
                placeholder="Enter your display name"
                placeholderTextColor={theme.colors.gray[400]}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.email}
                onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.gray[400]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleUpdatePassword}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.oldPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, oldPassword: text })}
                placeholder="Enter current password"
                placeholderTextColor={theme.colors.gray[400]}
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                placeholder="Enter new password (min 8 characters)"
                placeholderTextColor={theme.colors.gray[400]}
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.gray[400]}
                secureTextEntry
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: "#EF4444" }]}>Delete Account</Text>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={[styles.modalSave, { color: "#EF4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.warningBox}>
              <AlertCircle size={24} color="#EF4444" />
              <Text style={styles.warningTitle}>This action cannot be undone</Text>
              <Text style={styles.warningText}>
                Deleting your account will permanently remove all your data, including content, analytics, and connected accounts.
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter your password to confirm</Text>
              <TextInput
                style={styles.textInput}
                value={deleteForm.password}
                onChangeText={(text) => setDeleteForm({ ...deleteForm, password: text })}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.gray[400]}
                secureTextEntry
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  statusError: {
    backgroundColor: "#FEE2E2",
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
  statusTextError: {
    color: "#EF4444",
  },
  accountActions: {
    flexDirection: "row",
    gap: 8,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.black,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  connectButtonText: {
    fontSize: 12,
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
  profileCard: {
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  avatarContainer: {
    position: "relative",
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    flex: 1,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 2,
  },
  profileJoined: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  currentPlanCard: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 4,
  },
  currentPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentPlanName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  currentPlanDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 12,
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.black,
  },
  featureDisabled: {
    color: theme.colors.gray[400],
  },
  upgradeButton: {
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    gap: 12,
  },
  premiumButton: {
    backgroundColor: "#FEF3C7",
  },
  platinumButton: {
    backgroundColor: "#F3E8FF",
  },
  upgradeButtonContent: {
    flex: 1,
  },
  upgradeButtonTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  upgradeButtonSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  warningBox: {
    backgroundColor: "#FEF2F2",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
    marginTop: 8,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 20,
  },
  adSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  adCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
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
  adLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: theme.colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  adDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  adButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  adButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  modeIndicatorText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#92400E",
  },
  platformIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    marginRight: 12,
  },
  platformIcon: {
    fontSize: 24,
    textAlign: "center",
  },
  sandboxBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  sandboxText: {
    fontSize: 8,
    fontWeight: "600" as const,
    color: theme.colors.white,
    textTransform: "uppercase",
  },
  platformNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  accountDescription: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 4,
  },
  fixButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    marginRight: 8,
  },
  fixButtonText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: theme.colors.white,
  },
  connectPlatformCard: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    backgroundColor: theme.colors.gray[50],
  },
  connectPlatformHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectPlatformInfo: {
    flex: 1,
  },
  connectPlatformName: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  connectPlatformDescription: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  connectPlatformAction: {
    marginLeft: 12,
  },
  connectIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  riskCenterContainer: {
    gap: 16,
  },
  riskCenterLoading: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  riskCenterLoadingText: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  riskHealthCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  riskHealthHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  riskHealthIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  riskHealthInfo: {
    flex: 1,
  },
  riskHealthTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  riskHealthSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  riskHealthReason: {
    fontSize: 12,
    color: theme.colors.gray[700],
    fontStyle: "italic",
  },
  riskQuotasSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    paddingTop: 12,
  },
  riskSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 8,
  },
  quotaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  quotaPlatform: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: theme.colors.gray[600],
    width: 60,
  },
  quotaBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quotaBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 2,
  },
  quotaBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },
  quotaText: {
    fontSize: 10,
    color: theme.colors.gray[500],
    width: 50,
  },
  riskAlertsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    paddingTop: 12,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  alertSeverity: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 12,
    color: theme.colors.black,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 10,
    color: theme.colors.gray[500],
  },
  riskControlsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    paddingTop: 12,
    gap: 12,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  simulateButtonText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: theme.colors.white,
  },
  languageSection: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
});