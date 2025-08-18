import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Zap,
  Twitter,
  Instagram,
  Linkedin,
  Send,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme, brandName } from "@/constants/theme";
import { BrandLogo } from "@/components/Logo";

type ContentStatus = "draft" | "queued" | "published" | "held";

interface StatusCardProps {
  title: string;
  status: string;
  icon: React.ReactNode;
  time?: string;
  platform?: string;
}

const PlatformIcon = ({ platform, size = 20 }: { platform: string; size?: number }) => {
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <Twitter size={size} color="#1DA1F2" />;
    case 'instagram':
      return <Instagram size={size} color="#E4405F" />;
    case 'linkedin':
      return <Linkedin size={size} color="#0077B5" />;
    case 'telegram':
      return <Send size={size} color="#0088CC" />;
    default:
      return null;
  }
};

const StatusCard: React.FC<StatusCardProps> = ({ title, status, icon, time, platform }) => (
  <TouchableOpacity style={styles.statusCard} activeOpacity={0.7}>
    <View style={styles.statusCardHeader}>
      <View style={styles.statusIconContainer}>
        {icon}
      </View>
      <View style={styles.statusTextContainer}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusSubtitle}>{status}</Text>
      </View>
      {time && <Text style={styles.statusTime}>{time}</Text>}
    </View>
    {platform && (
      <View style={styles.platformBadge}>
        <Text style={styles.platformText}>{platform}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function FlowScreen() {
  const { currentStatus, upcomingTasks, todayPublished } = useAIMarketer();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <BrandLogo size="sm" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.brandTagline}>Otonom Sosyal Medya Ajansı</Text>
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.colors.white, theme.colors.gray[100]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.currentStatusCard}
        >
          <View style={styles.currentStatusHeader}>
            <Zap size={24} color={theme.colors.black} />
            <Text style={styles.currentStatusLabel}>LIVE STATUS</Text>
          </View>
          <Text style={styles.currentStatusText}>{currentStatus}</Text>
          <View style={styles.currentStatusMeta}>
            <View style={styles.statusDot} />
            <Text style={styles.currentStatusTime}>Active now</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          <View style={styles.tasksList}>
            {upcomingTasks.map((task, index) => (
              <StatusCard
                key={index}
                title={task.title}
                status={task.status}
                icon={<PlatformIcon platform={task.platform} />}
                time={task.time}
                platform={task.platform}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Published Today</Text>
            <View style={styles.publishedBadge}>
              <Text style={styles.publishedCount}>{todayPublished.length}</Text>
            </View>
          </View>
          <View style={styles.publishedList}>
            {todayPublished.map((item, index) => (
              <View key={index} style={styles.publishedItem}>
                <View style={styles.publishedIcon}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <View style={styles.publishedContent}>
                  <Text style={styles.publishedTitle}>{item.title}</Text>
                  <View style={styles.publishedMeta}>
                    <PlatformIcon platform={item.platform} size={16} />
                    <Text style={styles.publishedTime}>{item.time}</Text>
                    <Text style={styles.publishedStats}>
                      {item.impressions} impressions • {item.engagement}% engagement
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Queued</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>89%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>2.4k</Text>
            <Text style={styles.statLabel}>Today's Reach</Text>
          </View>
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
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 8,
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
    marginBottom: 4,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 14,
    color: theme.colors.gray[400],
    fontFamily: theme.typography.sansSerif.fontFamily,
  },
  currentStatusCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  currentStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentStatusLabel: {
    color: theme.colors.black,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginLeft: 8,
  },
  currentStatusText: {
    color: theme.colors.black,
    fontSize: 24,
    fontWeight: "600" as const,
    marginBottom: 16,
    fontFamily: theme.typography.serif.fontFamily,
  },
  currentStatusMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  currentStatusTime: {
    color: theme.colors.gray[600],
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 16,
    fontFamily: theme.typography.serif.fontFamily,
  },
  publishedBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publishedCount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  tasksList: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
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
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  statusTime: {
    fontSize: 14,
    color: theme.colors.gray[400],
  },
  platformBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  platformText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  publishedList: {
    gap: 12,
  },
  publishedItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
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
  publishedIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  publishedContent: {
    flex: 1,
  },
  publishedTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: theme.colors.black,
    marginBottom: 8,
  },
  publishedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publishedTime: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  publishedStats: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  quickStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
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
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: theme.colors.black,
    marginBottom: 4,
    fontFamily: theme.typography.serif.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
});