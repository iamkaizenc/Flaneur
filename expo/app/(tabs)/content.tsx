import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  ChevronRight,
  Twitter,
  Instagram,
  Linkedin,
  Send,
  Sparkles,
  Plus,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme, brandName } from "@/constants/theme";
import { trpc, getFallbackData } from "@/lib/trpc";
import { AIPublishModal } from "@/components/AIPublishModal";

type ContentStatus = "draft" | "queued" | "published" | "held" | "error";

interface ContentCardProps {
  title: string;
  platform: string;
  status: ContentStatus;
  scheduledTime: string;
  preview: string;
  onPress: () => void;
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

const StatusIcon = ({ status }: { status: ContentStatus }) => {
  switch (status) {
    case 'published':
      return <CheckCircle size={16} color="#10B981" />;
    case 'queued':
      return <Clock size={16} color="#3B82F6" />;
    case 'held':
      return <AlertCircle size={16} color="#F59E0B" />;
    case 'draft':
      return <PauseCircle size={16} color="#9CA3AF" />;
    default:
      return null;
  }
};

const ContentCard: React.FC<ContentCardProps> = ({ 
  title, 
  platform, 
  status, 
  scheduledTime, 
  preview,
  onPress 
}) => (
  <TouchableOpacity style={styles.contentCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.cardHeader}>
      <View style={styles.platformBadgeInline}>
        <PlatformIcon platform={platform} size={16} />
        <Text style={styles.platformName}>{platform}</Text>
      </View>
      <View style={[styles.statusBadge, styles[`status_${status}`]]}>
        <StatusIcon status={status} />
        <Text style={[styles.statusText, styles[`statusText_${status}`]]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    </View>
    <Text style={styles.contentTitle} numberOfLines={2}>{title}</Text>
    <Text style={styles.contentPreview} numberOfLines={2}>{preview}</Text>
    <View style={styles.cardFooter}>
      <View style={styles.scheduleInfo}>
        <Clock size={14} color={theme.colors.gray[400]} />
        <Text style={styles.scheduleTime}>{scheduledTime}</Text>
      </View>
      <ChevronRight size={20} color={theme.colors.gray[400]} />
    </View>
  </TouchableOpacity>
);

export default function ContentScreen() {
  const [selectedFilter, setSelectedFilter] = useState<ContentStatus | "all">("all");
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const contentQuery = trpc.content.list.useQuery(
    {
      limit: 50,
      status: selectedFilter === "all" ? undefined : selectedFilter,
    },
    {
      // Handle errors gracefully and don't retry network errors
      retry: (failureCount, error) => {
        if (error?.message?.includes('NETWORK_ERROR') || error?.message?.includes('Failed to fetch')) {
          return false;
        }
        return failureCount < 2;
      },
      // Use stale data if available
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
  
  // Test query to verify tRPC is working
  const testQuery = trpc.example.hi.useQuery(
    { name: "Test" },
    {
      retry: false, // Don't retry test queries
    }
  );
  
  // Debug logging
  console.log('[Content] Query status:', {
    isLoading: contentQuery.isLoading,
    isError: contentQuery.isError,
    error: contentQuery.error?.message,
    data: contentQuery.data ? 'present' : 'undefined',
    itemsCount: contentQuery.data?.items?.length || 0
  });
  
  console.log('[Content] Test query status:', {
    isLoading: testQuery.isLoading,
    isError: testQuery.isError,
    error: testQuery.error?.message,
    data: testQuery.data
  });
  
  // Ensure we always have valid data - use fallback if query failed
  const contentItems = contentQuery.data?.items || (() => {
    if (contentQuery.isError) {
      console.log('[Content] Using fallback data due to query error');
      const fallback = getFallbackData('content.list') as any;
      return fallback?.items || [];
    }
    return [];
  })();

  const filters: Array<{ label: string; value: ContentStatus | "all"; count: number }> = [
    { label: "All", value: "all", count: contentItems.length },
    { label: "Queued", value: "queued", count: contentItems.filter((i: any) => i.status === "queued").length },
    { label: "Published", value: "published", count: contentItems.filter((i: any) => i.status === "published").length },
    { label: "Held", value: "held", count: contentItems.filter((i: any) => i.status === "held").length },
    { label: "Draft", value: "draft", count: contentItems.filter((i: any) => i.status === "draft").length },
  ];

  const filteredContent = contentItems;

  const handleContentPress = (contentId: string) => {
    router.push({
      pathname: "/content-detail" as any,
      params: { id: contentId }
    });
  };

  const handleAISuccess = (items: any[]) => {
    console.log('AI generated items:', items);
    // Refresh content list
    contentQuery.refetch().catch((error) => {
      console.error('[Content] Failed to refetch after AI success:', error);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={styles.brandTagline}>Content Calendar</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => setShowAIModal(true)}
              activeOpacity={0.7}
            >
              <Sparkles size={20} color={theme.colors.black} />
              <Text style={styles.aiButtonText}>AI Üret</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {/* Handle manual add */}}
              activeOpacity={0.7}
            >
              <Plus size={20} color={theme.colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <CalendarIcon size={24} color={theme.colors.black} />
            <Text style={styles.calendarTitle}>This Week</Text>
          </View>
          <View style={styles.weekDays}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const isToday = index === 2;
              const hasContent = [1, 2, 4, 5].includes(index);
              return (
                <View key={day} style={styles.dayColumn}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {day}
                  </Text>
                  <View style={[
                    styles.dayIndicator,
                    isToday && styles.dayIndicatorToday,
                    hasContent && styles.dayIndicatorActive
                  ]}>
                    {hasContent && <Text style={styles.dayCount}>
                      {index === 2 ? '3' : index === 4 ? '2' : '1'}
                    </Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                selectedFilter === filter.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.value && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={[
                  styles.filterCount,
                  selectedFilter === filter.value && styles.filterCountActive
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === filter.value && styles.filterCountTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.contentList}>
          {filteredContent.map((item: any) => (
            <ContentCard
              key={item.id}
              title={item.title}
              platform={item.platform}
              status={item.status}
              scheduledTime={item.scheduledAt || 'Not scheduled'}
              preview={item.preview}
              onPress={() => handleContentPress(item.id)}
            />
          ))}
        </View>
      </ScrollView>
      
      <AIPublishModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={handleAISuccess}
      />
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
    paddingTop: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.black,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray[700],
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
  calendarCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
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
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginLeft: 8,
    fontFamily: theme.typography.serif.fontFamily,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: theme.colors.gray[400],
    marginBottom: 8,
    fontWeight: "500" as const,
  },
  dayLabelToday: {
    color: theme.colors.black,
    fontWeight: "600" as const,
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  dayIndicatorToday: {
    backgroundColor: theme.colors.gray[200],
    borderWidth: 2,
    borderColor: theme.colors.black,
  },
  dayIndicatorActive: {
    backgroundColor: theme.colors.black,
  },
  dayCount: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 0,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.black,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  filterCount: {
    marginLeft: 6,
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterCountText: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontWeight: "600" as const,
  },
  filterCountTextActive: {
    color: theme.colors.white,
  },
  contentList: {
    gap: 12,
  },
  contentCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  platformBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  platformName: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  status_published: {
    backgroundColor: "#D1FAE5",
  },
  status_queued: {
    backgroundColor: "#DBEAFE",
  },
  status_held: {
    backgroundColor: "#FED7AA",
  },
  status_draft: {
    backgroundColor: "#F3F4F6",
  },
  status_error: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  statusText_published: {
    color: "#065F46",
  },
  statusText_queued: {
    color: "#1E40AF",
  },
  statusText_held: {
    color: "#92400E",
  },
  statusText_draft: {
    color: "#6B7280",
  },
  statusText_error: {
    color: "#DC2626",
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 8,
  },
  contentPreview: {
    fontSize: 14,
    color: theme.colors.gray[500],
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleTime: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
});