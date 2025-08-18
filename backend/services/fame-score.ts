import { UserMetrics } from '../types/schemas';

export interface FameScoreInputs {
  engagementRate: number; // 0-100%
  postFrequency: number; // posts per week
  followerGrowth: number; // % change in followers
}

export interface FameScoreResult {
  score: number; // 0-100
  tier: string;
  normalizedInputs: {
    engagement: number;
    frequency: number;
    growth: number;
  };
}

export class FameScoreService {
  private static readonly WEIGHTS = {
    engagement: 0.5,
    frequency: 0.3,
    growth: 0.2
  };

  private static readonly TIERS = [
    { min: 0, max: 30, label: "Yeni Başlangıç" },
    { min: 31, max: 60, label: "Yükselişte" },
    { min: 61, max: 85, label: "Parlıyor" },
    { min: 86, max: 100, label: "Yıldız" }
  ];

  static calculateFameScore(inputs: FameScoreInputs): FameScoreResult {
    console.log('Calculating FameScore with inputs:', inputs);

    // Normalize engagement rate (already 0-100)
    const normalizedEngagement = Math.min(100, Math.max(0, inputs.engagementRate));

    // Normalize post frequency (0-21 posts/week -> 0-100)
    const normalizedFrequency = Math.min(100, (inputs.postFrequency / 21) * 100);

    // Normalize follower growth (-100% to +500% -> 0-100)
    const normalizedGrowth = Math.min(100, Math.max(0, ((inputs.followerGrowth + 100) / 600) * 100));

    const normalizedInputs = {
      engagement: normalizedEngagement,
      frequency: normalizedFrequency,
      growth: normalizedGrowth
    };

    // Calculate weighted score
    const score = Math.round(
      normalizedEngagement * this.WEIGHTS.engagement +
      normalizedFrequency * this.WEIGHTS.frequency +
      normalizedGrowth * this.WEIGHTS.growth
    );

    const tier = this.getTier(score);

    console.log('FameScore calculated:', { score, tier, normalizedInputs });

    return {
      score,
      tier,
      normalizedInputs
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
    return `🔥 Ünlüleşme Skorun ${score} oldu! Sahne ışıkları sana dönüyor.`;
  }
}