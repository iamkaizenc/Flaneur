import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Star,
} from "lucide-react-native";
import { useAIMarketer } from "@/providers/AIMarketerProvider";
import { theme, brandName } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

interface InsightCardProps {
  type: "anomaly" | "opportunity";
  title: string;
  description: string;
  action?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <View style={styles.metricIcon}>
        {icon}
      </View>
      <View style={[styles.changeIndicator, change >= 0 ? styles.changePositive : styles.changeNegative]}>
        {change >= 0 ? <ArrowUp size={12} color="#10B981" /> : <ArrowDown size={12} color="#EF4444" />}
        <Text style={[styles.changeText, change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
          {Math.abs(change)}%
        </Text>
      </View>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

const InsightCard: React.FC<InsightCardProps> = ({ type, title, description, action }) => (
  <TouchableOpacity style={styles.insightCard} activeOpacity={0.7}>
    <View style={styles.insightHeader}>
      <View style={[styles.insightIcon, type === "anomaly" ? styles.insightIconAnomaly : styles.insightIconOpportunity]}>
        {type === "anomaly" ? (
          <AlertTriangle size={20} color="#F59E0B" />
        ) : (
          <Lightbulb size={20} color="#10B981" />
        )}
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
        {action && (
          <View style={styles.insightAction}>
            <Text style={styles.insightActionText}>{action}</Text>
            <ChevronRight size={16} color={theme.colors.gray[400]} />
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const SimpleChart = ({ data }: { data: number[] }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chart}>
        {data.map((value, index) => {
          const height = range > 0 ? ((value - minValue) / range) * 60 + 10 : 35;
          return (
            <View key={index} style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { height }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <Text key={index} style={styles.chartLabel}>{day}</Text>
        ))}
      </View>
    </View>
  );
};

const FameScoreBar = ({ score, tier }: { score: number; tier: string }) => {
  const getBarColor = (score: number) => {
    if (score >= 86) return '#10B981'; // Yıldız - Green
    if (score >= 61) return '#F59E0B'; // Parlıyor - Amber
    if (score >= 31) return '#3B82F6'; // Yükselişte - Blue
    return '#6B7280'; // Yeni Başlangıç - Gray
  };

  return (
    <View style={styles.fameScoreContainer}>
      <View style={styles.fameScoreHeader}>
        <View style={styles.fameScoreIconContainer}>
          <Star size={20} color={getBarColor(score)} />
        </View>
        <View style={styles.fameScoreInfo}>
          <Text style={styles.fameScoreTitle}>Ünlüleşme Skoru</Text>
          <Text style={styles.fameScoreTier}>{tier}</Text>
        </View>
        <Text style={styles.fameScoreValue}>{score}</Text>
      </View>
      <View style={styles.fameScoreBarContainer}>
        <View style={styles.fameScoreBarBackground}>
          <View 
            style={[
              styles.fameScoreBarFill, 
              { 
                width: `${score}%`, 
                backgroundColor: getBarColor(score) 
              }
            ]} 
          />
        </View>
        <View style={styles.fameScoreLabels}>
          <Text style={styles.fameScoreLabel}>0</Text>
          <Text style={styles.fameScoreLabel}>30</Text>
          <Text style={styles.fameScoreLabel}>60</Text>
          <Text style={styles.fameScoreLabel}>85</Text>
          <Text style={styles.fameScoreLabel}>100</Text>
        </View>
      </View>
    </View>
  );
};

const FameScoreTrend = ({ trend }: { trend: Array<{ date: string; score: number }> }) => {
  if (!trend || trend.length === 0) return null;

  const maxScore = Math.max(...trend.map(t => t.score));
  const minScore = Math.min(...trend.map(t => t.score));
  const range = maxScore - minScore;

  return (
    <View style={styles.fameScoreTrendContainer}>
      <Text style={styles.fameScoreTrendTitle}>Son 7 Gün Trendi</Text>
      <View style={styles.fameScoreTrendChart}>
        {trend.map((item, index) => {
          const height = range > 0 ? ((item.score - minScore) / range) * 40 + 5 : 22;
          return (
            <View key={index} style={styles.fameScoreTrendBarContainer}>
              <View style={[styles.fameScoreTrendBar, { height }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default function GrowthScreen() {
  const { metrics } = useAIMarketer();
  const insightsQuery = trpc.insights.list.useQuery({ range: "7d" });
  const fameScoreQuery = trpc.fameScore.get.useQuery({ userId: "user-1" });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandName}>{brandName}</Text>
        <Text style={styles.brandTagline}>Growth Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Followers"
            value={metrics.followers}
            change={metrics.followersChange}
            icon={<Users size={20} color={theme.colors.gray[600]} />}
          />
          <MetricCard
            title="Impressions"
            value={metrics.impressions}
            change={metrics.impressionsChange}
            icon={<Eye size={20} color={theme.colors.gray[600]} />}
          />
          <MetricCard
            title="Engagement"
            value={metrics.engagement}
            change={metrics.engagementChange}
            icon={<Heart size={20} color={theme.colors.gray[600]} />}
          />
          <MetricCard
            title="Comments"
            value={metrics.comments}
            change={metrics.commentsChange}
            icon={<MessageCircle size={20} color={theme.colors.gray[600]} />}
          />
        </View>

        {fameScoreQuery.data?.hasData && (
          <View style={styles.fameScoreCard}>
            <FameScoreBar 
              score={fameScoreQuery.data.score} 
              tier={fameScoreQuery.data.tier} 
            />
            <FameScoreTrend trend={fameScoreQuery.data.trend} />
          </View>
        )}

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <TrendingUp size={24} color={theme.colors.black} />
            <Text style={styles.chartTitle}>Weekly Growth</Text>
          </View>
          <SimpleChart data={metrics.growthData} />
        </View>

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>This Week's Insights</Text>
          <View style={styles.insightsList}>
            {insightsQuery.data?.insights.map((insight) => (
              <InsightCard
                key={insight.id}
                type={insight.type}
                title={insight.title}
                description={insight.description}
                action={insight.suggestedAction}
              />
            )) || []}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Performance Summary</Text>
          <Text style={styles.summaryText}>
            Your Flâneur autonomous agent has demonstrated sophisticated performance this week. 
            Engagement metrics elevated by 24% while maintaining steady follower acquisition at 12%. 
            The system has refined optimal distribution windows and adapted strategy with precision.
          </Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>View Detailed Report</Text>
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
    paddingTop: theme.spacing.md,
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: (width - theme.spacing.md * 2 - 12) / 2,
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
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  changePositive: {
    backgroundColor: "#D1FAE5",
  },
  changeNegative: {
    backgroundColor: "#FEE2E2",
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  changeTextPositive: {
    color: "#10B981",
  },
  changeTextNegative: {
    color: "#EF4444",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: theme.colors.black,
    marginBottom: 4,
    fontFamily: theme.typography.serif.fontFamily,
  },
  metricTitle: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginLeft: 8,
    fontFamily: theme.typography.serif.fontFamily,
  },
  chartContainer: {
    height: 100,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 70,
    gap: 4,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBar: {
    backgroundColor: theme.colors.black,
    borderRadius: 2,
    width: "80%",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: theme.colors.gray[400],
    textAlign: "center",
    flex: 1,
  },
  insightsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 16,
    fontFamily: theme.typography.serif.fontFamily,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
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
  insightHeader: {
    flexDirection: "row",
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  insightIconAnomaly: {
    backgroundColor: "#FEF3C7",
  },
  insightIconOpportunity: {
    backgroundColor: "#D1FAE5",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: 8,
  },
  insightAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  insightActionText: {
    fontSize: 14,
    color: theme.colors.black,
    fontWeight: "500" as const,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 12,
    fontFamily: theme.typography.serif.fontFamily,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  fameScoreCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  fameScoreContainer: {
    marginBottom: 20,
  },
  fameScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fameScoreIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fameScoreInfo: {
    flex: 1,
  },
  fameScoreTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  fameScoreTier: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  fameScoreValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: theme.colors.black,
    fontFamily: theme.typography.serif.fontFamily,
  },
  fameScoreBarContainer: {
    marginBottom: 12,
  },
  fameScoreBarBackground: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  fameScoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  fameScoreLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  fameScoreLabel: {
    fontSize: 10,
    color: theme.colors.gray[400],
    fontWeight: "500" as const,
  },
  fameScoreTrendContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: 16,
  },
  fameScoreTrendTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: theme.colors.gray[600],
    marginBottom: 12,
  },
  fameScoreTrendChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 50,
    gap: 3,
  },
  fameScoreTrendBarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  fameScoreTrendBar: {
    backgroundColor: theme.colors.gray[400],
    borderRadius: 1,
    width: "70%",
  },
});