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
} from "lucide-react-native";
import { theme, brandName } from "@/constants/theme";
import { trpc } from "@/lib/trpc";
import { usePurchase } from "@/hooks/usePurchase";

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
  
  const authMeQuery = trpc.auth.me.useQuery();
  const authLogoutMutation = trpc.auth.logout.useMutation();
  const authUpdateProfileMutation = trpc.auth.updateProfile.useMutation();
  const authUpdateEmailMutation = trpc.auth.updateEmail.useMutation();
  const authUpdatePasswordMutation = trpc.auth.updatePassword.useMutation();
  const authDeleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  
  const plansQuery = trpc.plans.getCurrent.useQuery();
  const plansUpgradeMutation = trpc.plans.upgrade.useMutation();
  
  const { purchasePlan, restorePurchases, isLoading: purchaseLoading } = usePurchase();

  const handleConnect = async (platform: string) => {
    try {
      const result = await settingsConnectMutation.mutateAsync({ platform: platform.toLowerCase() as any });
      
      if (result.requiresBotToken) {
        Alert.alert(
          "Telegram Setup",
          result.message + "\n\n" + result.instructions,
          [{ text: "OK" }]
        );
      } else if (result.authUrl) {
        console.log(`[OAuth] Opening auth URL for ${platform}:`, result.authUrl);
        Alert.alert(
          "Connect Account",
          `Opening OAuth flow for ${platform}. In a real app, this would open the browser.`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Connect", 
              onPress: () => {
                // In DRY_RUN mode, simulate successful connection
                setTimeout(() => {
                  settingsQuery.refetch();
                  Alert.alert("Success", `${platform} connected successfully (DRY_RUN mode)`);
                }, 1000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('[OAuth] Connection error:', error);
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

        {/* Subscription Section */}
        <SectionHeader title="Subscription" icon={<CreditCard size={20} color={theme.colors.white} />} />
        <View style={styles.section}>
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
});