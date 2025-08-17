import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { 
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Edit3,
  Trash2
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams();

  // Mock data for demonstration
  const content = {
    id,
    title: "Introducing our new AI-powered analytics dashboard",
    body: "We're excited to announce the launch of our revolutionary analytics dashboard that uses AI to provide real-time insights into your marketing performance. Track metrics, identify trends, and optimize your strategy with unprecedented accuracy.",
    platform: "LinkedIn",
    status: "published",
    scheduledTime: "Today at 2:00 PM",
    publishedTime: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    metrics: {
      impressions: "2,456",
      engagement: "8.4%",
      likes: "206",
      comments: "34",
      shares: "12"
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Edit3 size={20} color={theme.colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Trash2 size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content.imageUrl && (
          <Image source={{ uri: content.imageUrl }} style={styles.contentImage} />
        )}

        <View style={styles.contentBody}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{content.platform}</Text>
          </View>

          <Text style={styles.contentTitle}>{content.title}</Text>
          <Text style={styles.contentText}>{content.body}</Text>

          <View style={styles.timeInfo}>
            <Clock size={16} color={theme.colors.gray[400]} />
            <Text style={styles.timeText}>Published {content.publishedTime}</Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Eye size={20} color={theme.colors.gray[500]} />
              <Text style={styles.metricValue}>{content.metrics.impressions}</Text>
              <Text style={styles.metricLabel}>Impressions</Text>
            </View>
            <View style={styles.metricItem}>
              <Heart size={20} color={theme.colors.error} />
              <Text style={styles.metricValue}>{content.metrics.likes}</Text>
              <Text style={styles.metricLabel}>Likes</Text>
            </View>
            <View style={styles.metricItem}>
              <MessageCircle size={20} color={theme.colors.info} />
              <Text style={styles.metricValue}>{content.metrics.comments}</Text>
              <Text style={styles.metricLabel}>Comments</Text>
            </View>
            <View style={styles.metricItem}>
              <Share2 size={20} color={theme.colors.success} />
              <Text style={styles.metricValue}>{content.metrics.shares}</Text>
              <Text style={styles.metricLabel}>Shares</Text>
            </View>
          </View>
          <View style={styles.engagementRate}>
            <Text style={styles.engagementLabel}>Engagement Rate</Text>
            <Text style={styles.engagementValue}>{content.metrics.engagement}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View on {content.platform}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonSecondaryText}>Boost Post</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.black,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginLeft: 12,
    fontFamily: theme.typography.serif.fontFamily,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerAction: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  contentImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  contentBody: {
    padding: 20,
    backgroundColor: theme.colors.white,
  },
  platformBadge: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  platformText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 12,
    fontFamily: theme.typography.serif.fontFamily,
  },
  contentText: {
    fontSize: 16,
    color: theme.colors.gray[600],
    lineHeight: 24,
    marginBottom: 16,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.gray[400],
  },
  metricsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
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
  metricsTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 20,
    fontFamily: theme.typography.serif.fontFamily,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: theme.typography.serif.fontFamily,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  engagementRate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  engagementLabel: {
    fontSize: 16,
    color: theme.colors.gray[500],
  },
  engagementValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: theme.colors.success,
    fontFamily: theme.typography.serif.fontFamily,
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: theme.colors.black,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  actionButtonSecondaryText: {
    color: theme.colors.gray[500],
    fontSize: 16,
    fontWeight: "600" as const,
  },
});