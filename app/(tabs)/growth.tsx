import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  FlatList,
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
  Award,
  Flame,
  Target,
  Gift,
  Shield,
  CheckCircle,
  Settings,
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

interface BadgeCardProps {
  name: string;
  icon: string;
  progress: number;
  completed: boolean;
  description: string;
}

interface WeeklyChallengeCardProps {
  challenge: {
    progress: {
      posts: { current: number; target: number; percentage: number };
      reels: { current: number; target: number; percentage: number };
      live: { current: number; target: number; percentage: number };
      overall: number;
    };
    isCompleted: boolean;
    canClaimBonus: boolean;
    daysLeft: number;
  };
}

interface RiskMonitorCardProps {
  riskStatus: {
    shadowban: {
      detected: boolean;
      riskLevel: "low" | "medium" | "high";
      reason?: string;
    };
    healthScore: number;
    recommendations: string[];
  };
  onOpenRiskCenter: () => void;
}

interface PersonaGuidanceBannerProps {
  guidance: {
    contentMix: {
      video: number;
      image: number;
      text: number;
    };
    cadence: {
      IG: number;
      X: number;
      TG: number;
    };
    why: string[];
    bannerText: string;
  };
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

const BadgeCard: React.FC<BadgeCardProps> = ({ name, icon, progress, completed, description }) => (
  <View style={[styles.badgeCard, completed && styles.badgeCardCompleted]}>
    <View style={styles.badgeIconContainer}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      {completed && (
        <View style={styles.badgeCompletedIndicator}>
          <Text style={styles.badgeCompletedText}>✓</Text>
        </View>
      )}
    </View>
    <Text style={styles.badgeName} numberOfLines={2}>{name}</Text>
    <View style={styles.badgeProgressContainer}>
      <View style={styles.badgeProgressBackground}>
        <View style={[styles.badgeProgressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.badgeProgressText}>{progress}%</Text>
    </View>
  </View>
);

const RiskMonitorCard: React.FC<RiskMonitorCardProps> = ({ riskStatus, onOpenRiskCenter }) => {
  const isHealthy = !riskStatus.shadowban.detected && riskStatus.shadowban.riskLevel === "low";
  const cardColor = isHealthy ? "#10B981" : "#EF4444";
  const bgColor = isHealthy ? "#D1FAE5" : "#FEE2E2";
  
  return (
    <TouchableOpacity style={[styles.riskCard, { backgroundColor: bgColor }]} onPress={onOpenRiskCenter} activeOpacity={0.7}>
      <View style={styles.riskHeader}>
        <View style={[styles.riskIconContainer, { backgroundColor: cardColor + "20" }]}>
          {isHealthy ? (
            <CheckCircle size={20} color={cardColor} />
          ) : (
            <AlertTriangle size={20} color={cardColor} />
          )}
        </View>
        <View style={styles.riskInfo}>
          <Text style={[styles.riskTitle, { color: cardColor }]}>
            {isHealthy ? "👍 Sağlıklı görünürlük" : "⚠️ Görünürlük düşüyor"}
          </Text>
          <Text style={styles.riskSubtitle}>
            {isHealthy 
              ? "Son 7 günde stabil performans" 
              : riskStatus.shadowban.reason || "Risk tespit edildi"
            }
          </Text>
        </View>
        <View style={styles.riskScore}>
          <Text style={[styles.riskScoreText, { color: cardColor }]}>{riskStatus.healthScore}</Text>
        </View>
      </View>
      
      {!isHealthy && riskStatus.recommendations.length > 0 && (
        <View style={styles.riskRecommendations}>
          <Text style={styles.riskRecommendationsTitle}>Öneriler:</Text>
          {riskStatus.recommendations.slice(0, 3).map((rec, index) => (
            <View key={index} style={styles.riskRecommendationItem}>
              <Text style={styles.riskRecommendationBullet}>•</Text>
              <Text style={styles.riskRecommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.riskAction}>
        <Text style={styles.riskActionText}>Risk Merkezi</Text>
        <ChevronRight size={16} color={theme.colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
};

const WeeklyChallengeCard: React.FC<WeeklyChallengeCardProps> = ({ challenge }) => {
  const claimBonusMutation = trpc.challenges.claimBonus.useMutation();

  const handleClaimBonus = () => {
    claimBonusMutation.mutate({ userId: "user-1" });
  };

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIconContainer}>
          <Target size={20} color="#3B82F6" />
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>Haftalık Challenge</Text>
          <Text style={styles.challengeSubtitle}>{challenge.daysLeft} gün kaldı</Text>
        </View>
        <Text style={styles.challengeProgress}>{challenge.progress.overall}%</Text>
      </View>
      
      <View style={styles.challengeProgressBars}>
        <View style={styles.challengeProgressItem}>
          <Text style={styles.challengeProgressLabel}>Posts: {challenge.progress.posts.current}/{challenge.progress.posts.target}</Text>
          <View style={styles.challengeProgressBarBackground}>
            <View style={[styles.challengeProgressBarFill, { width: `${challenge.progress.posts.percentage}%` }]} />
          </View>
        </View>
        
        {challenge.progress.reels.target > 0 && (
          <View style={styles.challengeProgressItem}>
            <Text style={styles.challengeProgressLabel}>Reels: {challenge.progress.reels.current}/{challenge.progress.reels.target}</Text>
            <View style={styles.challengeProgressBarBackground}>
              <View style={[styles.challengeProgressBarFill, { width: `${challenge.progress.reels.percentage}%` }]} />
            </View>
          </View>
        )}
      </View>

      {challenge.canClaimBonus && (
        <TouchableOpacity 
          style={styles.claimBonusButton} 
          onPress={handleClaimBonus}
          disabled={claimBonusMutation.isPending}
        >
          <Gift size={16} color={theme.colors.white} />
          <Text style={styles.claimBonusText}>Bonus Al (+5 FameScore)</Text>
        </TouchableOpacity>
      )}
      
      {challenge.isCompleted && !challenge.canClaimBonus && (
        <View style={styles.challengeCompletedBadge}>
          <Text style={styles.challengeCompletedText}>🎉 Tamamlandı!</Text>
        </View>
      )}
    </View>
  );
};

const PersonaGuidanceBanner: React.FC<PersonaGuidanceBannerProps> = ({ guidance }) => (
  <View style={styles.guidanceBanner}>
    <View style={styles.guidanceHeader}>
      <View style={styles.guidanceIconContainer}>
        <Target size={20} color="#8B5CF6" />
      </View>
      <View style={styles.guidanceInfo}>
        <Text style={styles.guidanceTitle}>{guidance.bannerText}</Text>
        <Text style={styles.guidanceSubtitle}>Kişiselleştirilmiş strateji</Text>
      </View>
    </View>
    
    <View style={styles.guidanceContent}>
      <View style={styles.guidanceStats}>
        <View style={styles.guidanceStat}>
          <Text style={styles.guidanceStatValue}>{guidance.contentMix.image}%</Text>
          <Text style={styles.guidanceStatLabel}>Fotoğraf</Text>
        </View>
        <View style={styles.guidanceStat}>
          <Text style={styles.guidanceStatValue}>{guidance.contentMix.video}%</Text>
          <Text style={styles.guidanceStatLabel}>Video</Text>
        </View>
        <View style={styles.guidanceStat}>
          <Text style={styles.guidanceStatValue}>{guidance.cadence.IG}/hafta</Text>
          <Text style={styles.guidanceStatLabel}>IG Posts</Text>
        </View>
      </View>
      
      {guidance.why.length > 0 && (
        <View style={styles.guidanceReasons}>
          <Text style={styles.guidanceReasonsTitle}>Neden bu strateji?</Text>
          {guidance.why.slice(0, 2).map((reason, index) => (
            <View key={index} style={styles.guidanceReasonItem}>
              <Text style={styles.guidanceReasonBullet}>•</Text>
              <Text style={styles.guidanceReasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  </View>
);

export default function GrowthScreen() {
  const { metrics } = useAIMarketer();
  const insightsQuery = trpc.insights.list.useQuery({ range: "7d" });
  const fameScoreQuery = trpc.fameScore.get.useQuery({ userId: "user-1" });
  const badgesQuery = trpc.badges.list.useQuery({ userId: "user-1" });
  const streakQuery = trpc.badges.streak.useQuery({ userId: "user-1" });
  const challengeQuery = trpc.challenges.weekly.useQuery({ userId: "user-1" });
  const riskStatusQuery = trpc.risk.getStatus.useQuery({ range: "7d" });
  const onboardingQuery = trpc.onboarding.get.useQuery({ userId: "user-1" });
  
  const handleOpenRiskCenter = () => {
    console.log('[Growth] Opening Risk Center');
    // Navigate to Risk Center in Settings
  };

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

        {/* Persona Guidance Banner */}
        {onboardingQuery.data?.guidance && (
          <PersonaGuidanceBanner guidance={onboardingQuery.data.guidance} />
        )}

        {/* Badges Section */}
        {badgesQuery.data && (
          <View style={styles.badgesSection}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={theme.colors.white} />
              <Text style={styles.sectionTitle}>Başarılar</Text>
              <Text style={styles.badgeCount}>
                {badgesQuery.data.completedCount}/{badgesQuery.data.totalBadges}
              </Text>
            </View>
            <FlatList
              horizontal
              data={badgesQuery.data.badges}
              keyExtractor={(item) => item.badgeId}
              renderItem={({ item }) => (
                <BadgeCard
                  name={item.name}
                  icon={item.icon}
                  progress={item.progress}
                  completed={item.completed}
                  description={item.description}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesList}
            />
          </View>
        )}

        {/* Streak Section */}
        {streakQuery.data && (
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <View style={styles.streakIconContainer}>
                <Flame size={24} color="#F59E0B" />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>Streak</Text>
                <Text style={styles.streakSubtitle}>{streakQuery.data.motivationText}</Text>
              </View>
              <Text style={styles.streakValue}>{streakQuery.data.streak.currentStreak}</Text>
            </View>
          </View>
        )}

        {/* Risk Monitor Card */}
        {riskStatusQuery.data && (
          <RiskMonitorCard 
            riskStatus={riskStatusQuery.data} 
            onOpenRiskCenter={handleOpenRiskCenter}
          />
        )}

        {/* Weekly Challenge */}
        {challengeQuery.data && (
          <WeeklyChallengeCard challenge={challengeQuery.data} />
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
          <Text style={styles.summaryTitle}>Ünlüleşme Özeti</Text>
          <Text style={styles.summaryText}>
            Bu hafta sahne performansın harika! Etkileşim oranın %24 arttı ve takipçi kazanımın istikrarlı şekilde %12 seviyesinde. 
            Flâneur ajanın optimal paylaşım zamanlarını belirledi ve stratejini hassas şekilde ayarladı.
          </Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Detaylı Raporu Gör</Text>
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
  badgesSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  badgeCount: {
    fontSize: 14,
    color: theme.colors.gray[400],
    marginLeft: "auto",
  },
  badgesList: {
    paddingHorizontal: 4,
    gap: 12,
  },
  badgeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    width: 120,
    alignItems: "center",
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
  badgeCardCompleted: {
    borderWidth: 2,
    borderColor: "#10B981",
  },
  badgeIconContainer: {
    position: "relative",
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
    textAlign: "center",
  },
  badgeCompletedIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#10B981",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCompletedText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "bold" as const,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: 8,
    minHeight: 32,
  },
  badgeProgressContainer: {
    width: "100%",
    alignItems: "center",
  },
  badgeProgressBackground: {
    width: "100%",
    height: 4,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 2,
    marginBottom: 4,
  },
  badgeProgressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 10,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  streakSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#F59E0B",
    fontFamily: theme.typography.serif.fontFamily,
  },
  challengeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  challengeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  challengeSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  challengeProgress: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#3B82F6",
  },
  challengeProgressBars: {
    gap: 12,
    marginBottom: 16,
  },
  challengeProgressItem: {
    gap: 4,
  },
  challengeProgressLabel: {
    fontSize: 12,
    color: theme.colors.gray[600],
    fontWeight: "500" as const,
  },
  challengeProgressBarBackground: {
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 3,
  },
  challengeProgressBarFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 3,
  },
  claimBonusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    gap: 8,
  },
  claimBonusText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  challengeCompletedBadge: {
    backgroundColor: "#D1FAE5",
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  challengeCompletedText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#10B981",
  },
  riskCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
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
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  riskSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  riskScore: {
    alignItems: "center",
  },
  riskScoreText: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: theme.typography.serif.fontFamily,
  },
  riskRecommendations: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  riskRecommendationsTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: theme.colors.gray[700],
    marginBottom: 6,
  },
  riskRecommendationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  riskRecommendationBullet: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginRight: 6,
  },
  riskRecommendationText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    flex: 1,
  },
  riskAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  riskActionText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: theme.colors.gray[700],
  },
  guidanceBanner: {
    backgroundColor: "#F3E8FF",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#8B5CF6",
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
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  guidanceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  guidanceInfo: {
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#8B5CF6",
    marginBottom: 2,
  },
  guidanceSubtitle: {
    fontSize: 12,
    color: "#6B46C1",
  },
  guidanceContent: {
    gap: 12,
  },
  guidanceStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  guidanceStat: {
    alignItems: "center",
  },
  guidanceStatValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#8B5CF6",
    marginBottom: 2,
  },
  guidanceStatLabel: {
    fontSize: 10,
    color: "#6B46C1",
    fontWeight: "500" as const,
  },
  guidanceReasons: {
    borderTopWidth: 1,
    borderTopColor: "#DDD6FE",
    paddingTop: 12,
  },
  guidanceReasonsTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B46C1",
    marginBottom: 6,
  },
  guidanceReasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  guidanceReasonBullet: {
    fontSize: 12,
    color: "#8B5CF6",
    marginRight: 6,
    marginTop: 1,
  },
  guidanceReasonText: {
    fontSize: 12,
    color: "#6B46C1",
    flex: 1,
    lineHeight: 16,
  },
});