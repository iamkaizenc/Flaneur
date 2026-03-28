import { UserMetrics } from '../types/schemas';

export interface FameScoreInputs {
  engagementRate: number; // 0-100%
  postFrequency: number; // posts per week
  followerGrowth: number; // % change in followers
}

export interface FameScoreHistory {
  date: string;
  score: number;
  reach: number;
  engagement: number;
  consistency: number;
}

export interface FameScoreResult {
  score: number; // 0-100
  tier: string;
  normalizedInputs: {
    engagement: number;
    frequency: number;
    growth: number;
  };
  breakdown?: {
    reach: number;
    engagement: number;
    consistency: number;
    penalty: number;
  };
  insights?: string[];
}

export class FameScoreService {
  private static readonly WEIGHTS = {
    reach: 0.4,
    engagement: 0.35,
    consistency: 0.25
  };

  private static readonly TIERS = [
    { min: 0, max: 30, label: "Yeni Başlangıç" },
    { min: 31, max: 60, label: "Yükselişte" },
    { min: 61, max: 85, label: "Parlıyor" },
    { min: 86, max: 100, label: "Yıldız" }
  ];

  static calculateFameScore(inputs: FameScoreInputs): FameScoreResult {
    console.log('Calculating FameScore with inputs:', inputs);

    // Normalize reach (impressions/followers ratio, 0-10 -> 0-100)
    const reachRatio = inputs.engagementRate * 0.1; // Simplified reach calculation
    const normalizedReach = Math.min(100, Math.max(0, reachRatio * 10));

    // Normalize engagement rate (already 0-100)
    const normalizedEngagement = Math.min(100, Math.max(0, inputs.engagementRate));

    // Normalize consistency (post frequency with penalty for gaps)
    const optimalFrequency = 7; // 1 post per day
    const frequencyScore = Math.min(100, (inputs.postFrequency / optimalFrequency) * 100);
    const consistencyBonus = inputs.postFrequency >= 3 ? 10 : 0; // Bonus for regular posting
    const normalizedConsistency = Math.min(100, frequencyScore + consistencyBonus);

    // Apply penalties
    let penalty = 0;
    if (inputs.followerGrowth < -10) penalty += 15; // Significant follower loss
    if (inputs.postFrequency < 1) penalty += 20; // Very low posting frequency

    const normalizedInputs = {
      reach: normalizedReach,
      engagement: normalizedEngagement,
      consistency: normalizedConsistency
    };

    // Calculate weighted score with penalty
    const rawScore = 
      normalizedReach * this.WEIGHTS.reach +
      normalizedEngagement * this.WEIGHTS.engagement +
      normalizedConsistency * this.WEIGHTS.consistency;
    
    const score = Math.round(Math.max(0, Math.min(100, rawScore - penalty)));
    const tier = this.getTier(score);

    console.log('FameScore calculated:', { score, tier, normalizedInputs, penalty });

    return {
      score,
      tier,
      normalizedInputs: {
        engagement: normalizedEngagement,
        frequency: normalizedConsistency,
        growth: normalizedReach
      }
    };
  }

  static getTier(score: number): string {
    const tier = this.TIERS.find(t => score >= t.min && score <= t.max);
    return tier?.label || "Bilinmeyen";
  }

  static calculateFromMetrics(metrics: UserMetrics[]): FameScoreResult | null {
    if (metrics.length === 0) {
      console.log('No metrics available for FameScore calculation');
      return null;
    }

    // Use latest metrics
    const latest = metrics[0];
    
    // Calculate post frequency from recent data
    const postFrequency = metrics.length >= 7 
      ? metrics.slice(0, 7).reduce((sum, m) => sum + (m.postFrequency || 0), 0) / 7
      : latest.postFrequency || 0;

    return this.calculateFameScore({
      engagementRate: latest.engagementRate,
      postFrequency,
      followerGrowth: latest.followerGrowth
    });
  }

  static shouldSendProgressNotification(currentScore: number, previousScore: number): boolean {
    const improvement = currentScore - previousScore;
    return improvement >= 10;
  }

  static getProgressNotificationText(score: number): string {
    if (score >= 86) return `🌟 Yıldız seviyesine ulaştın! Skorun: ${score}`;
    if (score >= 61) return `✨ Parlıyorsun! FameScore: ${score}`;
    if (score >= 31) return `📈 Yükselişte! Skorun: ${score}`;
    return `🚀 Başlangıç yolculuğun devam ediyor! Skorun: ${score}`;
  }

  static getInsightBadges(currentScore: number, previousScore: number, metrics: any): string[] {
    const badges: string[] = [];
    
    const weeklyChange = currentScore - previousScore;
    if (weeklyChange > 5) badges.push("🔼 Takipçi artışın hızlandı");
    if (weeklyChange < -5) badges.push("🔽 Son 7 gün etkileşim düştü");
    if (metrics.postFrequency < 3) badges.push("⏸️ Az paylaşım yaptın, tutarlılık düşük");
    if (metrics.engagementRate > 5) badges.push("💫 Etkileşim oranın harika!");
    if (currentScore >= 86) badges.push("👑 Yıldız performansı!");
    
    return badges;
  }

  static getBreakdownPercentages(normalizedInputs: any): { reach: number; engagement: number; consistency: number; penalty: number } {
    const total = normalizedInputs.engagement + normalizedInputs.frequency + normalizedInputs.growth;
    if (total === 0) return { reach: 0, engagement: 0, consistency: 0, penalty: 0 };
    
    return {
      reach: Math.round((normalizedInputs.growth / total) * 100),
      engagement: Math.round((normalizedInputs.engagement / total) * 100),
      consistency: Math.round((normalizedInputs.frequency / total) * 100),
      penalty: 0 // Calculate penalty percentage if needed
    };
  }
}