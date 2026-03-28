import { Badge, UserBadge, Streak, UserMetrics } from '../types/schemas';

export interface BadgeProgress {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  threshold: number;
  completed: boolean;
  awardedAt?: Date;
}

export class BadgeService {
  private static readonly BADGES: Omit<Badge, 'id' | 'createdAt'>[] = [
    {
      name: "İlk 100 Beğeni",
      description: "İlk 100 beğenini topladın! Sahne ışıkları sana dönmeye başlıyor.",
      icon: "❤️",
      threshold: 100,
      type: "likes"
    },
    {
      name: "1K Erişim",
      description: "1000 kişiye ulaştın! Sesin daha geniş kitlelere ulaşıyor.",
      icon: "👁️",
      threshold: 1000,
      type: "reach"
    },
    {
      name: "İlk 10 Yorum",
      description: "10 yorum aldın! İnsanlar seninle konuşmaya başladı.",
      icon: "💬",
      threshold: 10,
      type: "comments"
    },
    {
      name: "7 Gün Streak",
      description: "7 gün üst üste paylaşım yaptın! Tutarlılık anahtarı.",
      icon: "🔥",
      threshold: 7,
      type: "streak"
    },
    {
      name: "İlk 50 Post",
      description: "50 içerik paylaştın! Yaratıcılığın akıyor.",
      icon: "📝",
      threshold: 50,
      type: "posts"
    },
    {
      name: "Etkileşim Ustası",
      description: "%5 etkileşim oranına ulaştın! İçeriğin gerçekten etkili.",
      icon: "⚡",
      threshold: 5,
      type: "engagement"
    }
  ];

  static getBadgeDefinitions(): Omit<Badge, 'id' | 'createdAt'>[] {
    return this.BADGES;
  }

  static checkBadgeEligibility(
    userMetrics: UserMetrics[],
    streak: Streak,
    totalPosts: number,
    totalLikes: number,
    totalComments: number,
    maxReach: number
  ): string[] {
    const eligibleBadges: string[] = [];

    // Check likes badge
    if (totalLikes >= 100) {
      eligibleBadges.push("first_100_likes");
    }

    // Check reach badge
    if (maxReach >= 1000) {
      eligibleBadges.push("first_1k_reach");
    }

    // Check comments badge
    if (totalComments >= 10) {
      eligibleBadges.push("first_10_comments");
    }

    // Check streak badge
    if (streak.currentStreak >= 7) {
      eligibleBadges.push("7d_streak");
    }

    // Check posts badge
    if (totalPosts >= 50) {
      eligibleBadges.push("first_50_posts");
    }

    // Check engagement badge
    const latestMetrics = userMetrics[0];
    if (latestMetrics && latestMetrics.engagementRate >= 5) {
      eligibleBadges.push("engagement_master");
    }

    return eligibleBadges;
  }

  static calculateBadgeProgress(
    badgeType: string,
    userMetrics: UserMetrics[],
    streak: Streak,
    totalPosts: number,
    totalLikes: number,
    totalComments: number,
    maxReach: number
  ): number {
    const badge = this.BADGES.find(b => b.type === badgeType);
    if (!badge) return 0;

    switch (badgeType) {
      case "likes":
        return Math.min(100, (totalLikes / badge.threshold) * 100);
      case "reach":
        return Math.min(100, (maxReach / badge.threshold) * 100);
      case "comments":
        return Math.min(100, (totalComments / badge.threshold) * 100);
      case "streak":
        return Math.min(100, (streak.currentStreak / badge.threshold) * 100);
      case "posts":
        return Math.min(100, (totalPosts / badge.threshold) * 100);
      case "engagement":
        const latestMetrics = userMetrics[0];
        if (!latestMetrics) return 0;
        return Math.min(100, (latestMetrics.engagementRate / badge.threshold) * 100);
      default:
        return 0;
    }
  }

  static updateStreak(userId: string, lastPostDate: Date, newPostDate: Date): Streak {
    const daysDiff = Math.floor((newPostDate.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If posted within 1-2 days, continue streak
    if (daysDiff <= 2) {
      return {
        id: `streak_${userId}`,
        userId,
        currentStreak: 1, // This would be incremented from existing
        longestStreak: 1, // This would be max of current and existing
        lastPostDate: newPostDate,
        updatedAt: new Date()
      };
    } else {
      // Reset streak
      return {
        id: `streak_${userId}`,
        userId,
        currentStreak: 1,
        longestStreak: 1, // Keep existing longest
        lastPostDate: newPostDate,
        updatedAt: new Date()
      };
    }
  }

  static shouldSendBadgeNotification(badgeId: string): boolean {
    // Always send notification for new badges
    return true;
  }

  static getBadgeNotificationText(badgeName: string): string {
    return `✨ Yeni rozet: ${badgeName}`;
  }

  static getStreakMotivationText(currentStreak: number): string {
    if (currentStreak === 0) {
      return "Bugün bir sahne daha açalım mı?";
    } else if (currentStreak < 3) {
      return `${currentStreak} gün streak! Devam et, sahne senin.`;
    } else if (currentStreak < 7) {
      return `${currentStreak} gün streak! Işıklar sana dönüyor! 🔥`;
    } else {
      return `${currentStreak} gün streak! Sen bir yıldızsın! ⭐`;
    }
  }
}