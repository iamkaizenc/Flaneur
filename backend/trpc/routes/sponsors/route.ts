import { z } from "zod";
import { publicProcedure } from "../../create-context";

const sponsorHubInputSchema = z.object({
  userId: z.string(),
});

export const sponsorHubProcedure = publicProcedure
  .input(sponsorHubInputSchema)
  .query(async ({ input }) => {
    console.log('Getting sponsor hub data for user:', input.userId);

    // Mock sponsor opportunities
    const mockSponsors = [
      {
        id: "sponsor_1",
        brandName: "TechFlow",
        logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop&crop=center",
        category: "Technology",
        budget: "₺2,500 - ₺5,000",
        requirements: {
          minFollowers: 1000,
          minEngagement: 3.5,
          minFameScore: 60,
        },
        description: "Teknoloji ürünleri için authentic içerik arıyoruz",
        status: "interested",
        matchScore: 85,
      },
      {
        id: "sponsor_2",
        brandName: "StyleHub",
        logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center",
        category: "Fashion",
        budget: "₺1,500 - ₺3,000",
        requirements: {
          minFollowers: 500,
          minEngagement: 4.0,
          minFameScore: 50,
        },
        description: "Lifestyle ve moda içerikleri için işbirliği",
        status: "reviewing",
        matchScore: 72,
      },
      {
        id: "sponsor_3",
        brandName: "FitLife",
        logo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center",
        category: "Fitness",
        budget: "₺3,000 - ₺7,500",
        requirements: {
          minFollowers: 2000,
          minEngagement: 5.0,
          minFameScore: 70,
        },
        description: "Fitness ve sağlık odaklı içerik üreticileri",
        status: "pending",
        matchScore: 68,
      },
    ];

    // Mock user stats for eligibility
    const userStats = {
      followers: 850,
      engagementRate: 4.2,
      fameScore: 62,
    };

    // Filter sponsors based on eligibility
    const eligibleSponsors = mockSponsors.filter(sponsor => 
      userStats.followers >= sponsor.requirements.minFollowers &&
      userStats.engagementRate >= sponsor.requirements.minEngagement &&
      userStats.fameScore >= sponsor.requirements.minFameScore
    );

    const lockedSponsors = mockSponsors.filter(sponsor => 
      userStats.followers < sponsor.requirements.minFollowers ||
      userStats.engagementRate < sponsor.requirements.minEngagement ||
      userStats.fameScore < sponsor.requirements.minFameScore
    );

    // Tips to improve FameScore
    const improvementTips = [
      {
        id: "tip_1",
        title: "Tutarlı Paylaşım",
        description: "Haftada en az 3 post paylaş",
        impact: "+5 FameScore",
        icon: "📅",
      },
      {
        id: "tip_2", 
        title: "Etkileşim Artır",
        description: "Yorumlara hızlı cevap ver",
        impact: "+3 FameScore",
        icon: "💬",
      },
      {
        id: "tip_3",
        title: "Trend Hashtag Kullan",
        description: "Güncel hashtag'leri takip et",
        impact: "+4 FameScore",
        icon: "#️⃣",
      },
      {
        id: "tip_4",
        title: "Story Paylaş",
        description: "Günlük story ile görünürlük artır",
        impact: "+2 FameScore",
        icon: "📱",
      },
    ];

    return {
      eligibleSponsors,
      lockedSponsors,
      userStats,
      totalOpportunities: mockSponsors.length,
      eligibleCount: eligibleSponsors.length,
      improvementTips,
      nextMilestone: {
        target: 70,
        current: userStats.fameScore,
        remaining: Math.max(0, 70 - userStats.fameScore),
      },
    };
  });