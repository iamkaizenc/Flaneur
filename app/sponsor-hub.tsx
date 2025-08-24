import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  ArrowLeft,
  Star,
  Lock,
  Users,
  Heart,
  Lightbulb,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { trpc } from "@/lib/trpc";

interface SponsorCardProps {
  sponsor: {
    id: string;
    brandName: string;
    logo: string;
    category: string;
    budget: string;
    requirements: {
      minFollowers: number;
      minEngagement: number;
      minFameScore: number;
    };
    description: string;
    status: string;
    matchScore: number;
  };
  isLocked?: boolean;
  userStats: {
    followers: number;
    engagementRate: number;
    fameScore: number;
  };
}

interface TipCardProps {
  tip: {
    id: string;
    title: string;
    description: string;
    impact: string;
    icon: string;
  };
}

const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor, isLocked, userStats }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "interested": return "#10B981";
      case "reviewing": return "#F59E0B";
      case "pending": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "interested": return "İlgileniyor";
      case "reviewing": return "İnceliyor";
      case "pending": return "Beklemede";
      default: return "Bilinmiyor";
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.sponsorCard, isLocked && styles.sponsorCardLocked]} 
      activeOpacity={0.7}
      disabled={isLocked}
    >
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Lock size={24} color={theme.colors.gray[400]} />
        </View>
      )}
      
      <View style={styles.sponsorHeader}>
        <Image source={{ uri: sponsor.logo }} style={styles.sponsorLogo} />
        <View style={styles.sponsorInfo}>
          <Text style={styles.sponsorName}>{sponsor.brandName}</Text>
          <Text style={styles.sponsorCategory}>{sponsor.category}</Text>
        </View>
        <View style={styles.matchScoreContainer}>
          <Text style={styles.matchScore}>{sponsor.matchScore}%</Text>
          <Text style={styles.matchLabel}>Uyum</Text>
        </View>
      </View>

      <Text style={styles.sponsorDescription}>{sponsor.description}</Text>
      
      <View style={styles.sponsorBudget}>
        <Text style={styles.budgetLabel}>Bütçe:</Text>
        <Text style={styles.budgetAmount}>{sponsor.budget}</Text>
      </View>

      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Gereksinimler:</Text>
        <View style={styles.requirementsList}>
          <View style={styles.requirementItem}>
            <Users size={14} color={theme.colors.gray[500]} />
            <Text style={[
              styles.requirementText,
              userStats.followers >= sponsor.requirements.minFollowers ? styles.requirementMet : styles.requirementNotMet
            ]}>
              {sponsor.requirements.minFollowers.toLocaleString()} takipçi
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Heart size={14} color={theme.colors.gray[500]} />
            <Text style={[
              styles.requirementText,
              userStats.engagementRate >= sponsor.requirements.minEngagement ? styles.requirementMet : styles.requirementNotMet
            ]}>
              %{sponsor.requirements.minEngagement} etkileşim
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Star size={14} color={theme.colors.gray[500]} />
            <Text style={[
              styles.requirementText,
              userStats.fameScore >= sponsor.requirements.minFameScore ? styles.requirementMet : styles.requirementNotMet
            ]}>
              {sponsor.requirements.minFameScore} FameScore
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sponsorFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sponsor.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(sponsor.status) }]}>
            {getStatusText(sponsor.status)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TipCard: React.FC<TipCardProps> = ({ tip }) => (
  <View style={styles.tipCard}>
    <View style={styles.tipHeader}>
      <Text style={styles.tipIcon}>{tip.icon}</Text>
      <View style={styles.tipInfo}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>
      </View>
      <Text style={styles.tipImpact}>{tip.impact}</Text>
    </View>
  </View>
);

export default function SponsorHubScreen() {
  const router = useRouter();
  const sponsorQuery = trpc.sponsors.hub.useQuery({ userId: "user-1" });
  const plansQuery = trpc.plans.getCurrent.useQuery();

  // Dynamic plan checking from backend
  const userPlan = plansQuery.data?.plan || "free";
  const hasAccess = userPlan === "premium" || userPlan === "platinum";
  
  console.log('[Sponsor Hub] User plan:', userPlan, 'Has access:', hasAccess);

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sponsor Hub</Text>
        </View>

        <View style={styles.upsellContainer}>
          <View style={styles.upsellCard}>
            <Text style={styles.upsellTitle}>🌟 Sponsor Hub&apos;a Erişim</Text>
            <Text style={styles.upsellDescription}>
              Markalar profiline bakıyor! Premium&apos;a yükselt ve sponsor fırsatlarını keşfet.
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Premium&apos;a Yükselt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsor Hub</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sponsorQuery.data && (
          <>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Profilin Durumu</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Users size={20} color={"#3B82F6"} />
                  <Text style={styles.statValue}>{sponsorQuery.data.userStats.followers.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Takipçi</Text>
                </View>
                <View style={styles.statItem}>
                  <Heart size={20} color={"#EF4444"} />
                  <Text style={styles.statValue}>%{sponsorQuery.data.userStats.engagementRate}</Text>
                  <Text style={styles.statLabel}>Etkileşim</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={20} color={"#F59E0B"} />
                  <Text style={styles.statValue}>{sponsorQuery.data.userStats.fameScore}</Text>
                  <Text style={styles.statLabel}>FameScore</Text>
                </View>
              </View>
            </View>

            {sponsorQuery.data.eligibleSponsors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Uygun Sponsorlar ({sponsorQuery.data.eligibleCount})</Text>
                {sponsorQuery.data.eligibleSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    userStats={sponsorQuery.data.userStats}
                  />
                ))}
              </View>
            )}

            {sponsorQuery.data.lockedSponsors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kilitli Sponsorlar</Text>
                <Text style={styles.sectionSubtitle}>
                  Bu sponsorlara erişmek için profilini güçlendir
                </Text>
                {sponsorQuery.data.lockedSponsors.map((sponsor) => (
                  <SponsorCard
                    key={sponsor.id}
                    sponsor={sponsor}
                    userStats={sponsorQuery.data.userStats}
                    isLocked
                  />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.tipsHeader}>
                <Lightbulb size={20} color={theme.colors.white} />
                <Text style={styles.sectionTitle}>Profilini Güçlendir</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                FameScore {sponsorQuery.data.nextMilestone.target}+ için ipuçları
              </Text>
              <View style={styles.milestoneProgress}>
                <View style={styles.milestoneBar}>
                  <View 
                    style={[
                      styles.milestoneBarFill, 
                      { width: `${(sponsorQuery.data.nextMilestone.current / sponsorQuery.data.nextMilestone.target) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.milestoneText}>
                  {sponsorQuery.data.nextMilestone.current}/{sponsorQuery.data.nextMilestone.target} 
                  ({sponsorQuery.data.nextMilestone.remaining} kaldı)
                </Text>
              </View>
              
              <FlatList
                data={sponsorQuery.data.improvementTips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TipCard tip={item} />}
                scrollEnabled={false}
              />
            </View>
          </>
        )}
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[800],
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.white,
    fontFamily: theme.typography.serif.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  upsellContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  upsellCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  upsellTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: theme.typography.serif.fontFamily,
  },
  upsellDescription: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: "#10B981",
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.white,
  },
  statsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
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
  statsTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 16,
    fontFamily: theme.typography.serif.fontFamily,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: theme.colors.black,
    fontFamily: theme.typography.serif.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontWeight: "500" as const,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: theme.colors.white,
    marginBottom: 8,
    fontFamily: theme.typography.serif.fontFamily,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[400],
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  milestoneProgress: {
    marginBottom: 16,
  },
  milestoneBar: {
    height: 8,
    backgroundColor: theme.colors.gray[800],
    borderRadius: 4,
    marginBottom: 8,
  },
  milestoneBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: theme.colors.gray[400],
    textAlign: "center",
  },
  sponsorCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    position: "relative",
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
  sponsorCardLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  sponsorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sponsorLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  sponsorCategory: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  matchScoreContainer: {
    alignItems: "center",
  },
  matchScore: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#10B981",
    fontFamily: theme.typography.serif.fontFamily,
  },
  matchLabel: {
    fontSize: 10,
    color: theme.colors.gray[500],
  },
  sponsorDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  sponsorBudget: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginRight: 8,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#10B981",
  },
  requirementsContainer: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: theme.colors.gray[700],
    marginBottom: 8,
  },
  requirementsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
  },
  requirementMet: {
    color: "#10B981",
    fontWeight: "500" as const,
  },
  requirementNotMet: {
    color: "#EF4444",
    fontWeight: "500" as const,
  },
  sponsorFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  tipCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.black,
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  tipImpact: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#10B981",
  },
});