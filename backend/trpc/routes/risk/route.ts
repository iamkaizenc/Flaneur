import { z } from "zod";
import { publicProcedure } from "../../create-context";
import banwordsConfig from "../../../config/banwords.json";

// Risk detection service
class RiskService {
  private banwords: string[];
  private friendlyMessages: Record<string, string>;

  constructor() {
    this.banwords = banwordsConfig.banwords;
    this.friendlyMessages = banwordsConfig.friendlyMessages;
  }

  // Check content for banned words
  checkContent(content: string): {
    isRisky: boolean;
    detectedWords: string[];
    friendlyReason?: string;
    suggestions: string[];
  } {
    const lowerContent = content.toLowerCase();
    const detectedWords: string[] = [];

    for (const word of this.banwords) {
      if (lowerContent.includes(word.toLowerCase())) {
        detectedWords.push(word);
      }
    }

    if (detectedWords.length === 0) {
      return {
        isRisky: false,
        detectedWords: [],
        suggestions: []
      };
    }

    const firstDetected = detectedWords[0];
    const friendlyReason = this.friendlyMessages[firstDetected] || this.friendlyMessages.default;

    return {
      isRisky: true,
      detectedWords,
      friendlyReason,
      suggestions: [
        "Düzenle & Yeniden Sırala",
        "Planla",
        "İpuçları Al"
      ]
    };
  }

  // Check shadowban risk based on engagement metrics
  checkShadowbanRisk(metrics: {
    last7DaysEngagement: number[];
    averageEngagement: number;
    standardDeviation: number;
  }): {
    isShadowbanned: boolean;
    riskLevel: "low" | "medium" | "high";
    reason?: string;
  } {
    const { last7DaysEngagement, averageEngagement, standardDeviation } = metrics;
    
    if (last7DaysEngagement.length === 0) {
      return { isShadowbanned: false, riskLevel: "low" };
    }

    const recentAverage = last7DaysEngagement.reduce((a, b) => a + b, 0) / last7DaysEngagement.length;
    const threshold = averageEngagement - (2 * standardDeviation); // μ-2σ

    if (recentAverage < threshold) {
      return {
        isShadowbanned: true,
        riskLevel: "high",
        reason: "Son 7 günde etkileşim ortalamanın çok altında"
      };
    }

    if (recentAverage < averageEngagement * 0.7) {
      return {
        isShadowbanned: false,
        riskLevel: "medium",
        reason: "Etkileşim düşüş eğiliminde"
      };
    }

    return { isShadowbanned: false, riskLevel: "low" };
  }

  // Get platform-specific quotas
  getPlatformQuotas(): Record<string, { daily: number; warmupDaily: number }> {
    return {
      x: { 
        daily: parseInt(process.env.DAILY_LIMIT_X || "5"), 
        warmupDaily: Math.floor(parseInt(process.env.DAILY_LIMIT_X || "5") / 2) 
      },
      instagram: { 
        daily: parseInt(process.env.DAILY_LIMIT_INSTAGRAM || "2"), 
        warmupDaily: Math.floor(parseInt(process.env.DAILY_LIMIT_INSTAGRAM || "2") / 2) 
      },
      linkedin: { 
        daily: parseInt(process.env.DAILY_LIMIT_LINKEDIN || "1"), 
        warmupDaily: Math.floor(parseInt(process.env.DAILY_LIMIT_LINKEDIN || "1") / 2) 
      },
      facebook: { 
        daily: parseInt(process.env.DAILY_LIMIT_FACEBOOK || "2"), 
        warmupDaily: Math.floor(parseInt(process.env.DAILY_LIMIT_FACEBOOK || "2") / 2) 
      },
      tiktok: { 
        daily: parseInt(process.env.DAILY_LIMIT_TIKTOK || "3"), 
        warmupDaily: Math.floor(parseInt(process.env.DAILY_LIMIT_TIKTOK || "3") / 2) 
      },
      telegram: { 
        daily: parseInt(process.env.DAILY_LIMIT_TELEGRAM || "999"), 
        warmupDaily: parseInt(process.env.DAILY_LIMIT_TELEGRAM || "999") 
      }
    };
  }

  // Check if account is in warmup period (first 14 days)
  isInWarmupPeriod(accountCreatedAt: string): boolean {
    const createdDate = new Date(accountCreatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 14;
  }
}

const riskService = new RiskService();

// Mock risk alerts storage
const riskAlerts: {
  id: string;
  userId: string;
  platform: string;
  type: "shadowban" | "quota_exceeded" | "banword_detected" | "warmup_violation";
  message: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolved: boolean;
}[] = [];

// Mock engagement metrics
const mockEngagementMetrics = {
  last7DaysEngagement: [2.1, 1.8, 2.3, 1.9, 2.0, 1.7, 1.6], // Declining trend
  averageEngagement: 2.5,
  standardDeviation: 0.4
};

export const riskGetStatusProcedure = publicProcedure
  .input(z.object({
    range: z.enum(["7d", "30d"]).default("7d"),
    platform: z.string().optional()
  }))
  .query(async ({ input }) => {
    console.log(`[Risk] Getting risk status for range: ${input.range}`);

    const shadowbanCheck = riskService.checkShadowbanRisk(mockEngagementMetrics);
    const quotas = riskService.getPlatformQuotas();

    // Get recent alerts
    const recentAlerts = riskAlerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      shadowban: {
        detected: shadowbanCheck.isShadowbanned,
        riskLevel: shadowbanCheck.riskLevel,
        reason: shadowbanCheck.reason
      },
      quotas,
      alerts: recentAlerts,
      healthScore: shadowbanCheck.isShadowbanned ? 25 : shadowbanCheck.riskLevel === "medium" ? 65 : 90,
      recommendations: shadowbanCheck.isShadowbanned ? [
        "Frekansı azalt",
        "Saatleri değiştir", 
        "Formatı çeşitlendir"
      ] : [
        "Mevcut stratejini sürdür",
        "Etkileşimi artırmaya odaklan"
      ]
    };
  });

export const riskCheckContentProcedure = publicProcedure
  .input(z.object({
    content: z.string(),
    platform: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Risk] Checking content for platform: ${input.platform}`);

    const riskCheck = riskService.checkContent(input.content);

    if (riskCheck.isRisky) {
      // Create risk alert
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: "demo_user_id",
        platform: input.platform,
        type: "banword_detected" as const,
        message: riskCheck.friendlyReason || "Riskli içerik tespit edildi",
        severity: "medium" as const,
        createdAt: new Date().toISOString(),
        resolved: false
      };

      riskAlerts.push(alert);
    }

    return {
      isRisky: riskCheck.isRisky,
      reason: riskCheck.friendlyReason,
      detectedWords: riskCheck.detectedWords,
      suggestions: riskCheck.suggestions,
      action: riskCheck.isRisky ? "HOLD" : "APPROVE"
    };
  });

export const riskCreateAlertProcedure = publicProcedure
  .input(z.object({
    platform: z.string(),
    type: z.enum(["shadowban", "quota_exceeded", "banword_detected", "warmup_violation"]),
    message: z.string(),
    severity: z.enum(["low", "medium", "high"])
  }))
  .mutation(async ({ input }) => {
    console.log(`[Risk] Creating alert: ${input.type} for ${input.platform}`);

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: "demo_user_id",
      platform: input.platform,
      type: input.type,
      message: input.message,
      severity: input.severity,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    riskAlerts.push(alert);

    return {
      success: true,
      alert
    };
  });

export const riskResolveAlertProcedure = publicProcedure
  .input(z.object({
    alertId: z.string()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Risk] Resolving alert: ${input.alertId}`);

    const alertIndex = riskAlerts.findIndex(alert => alert.id === input.alertId);
    if (alertIndex >= 0) {
      riskAlerts[alertIndex].resolved = true;
    }

    return {
      success: true,
      message: "Alert resolved"
    };
  });

export const riskSimulateAlertProcedure = publicProcedure
  .mutation(async () => {
    console.log("[Risk] Simulating demo risk alert");

    const demoAlert = {
      id: `demo_alert_${Date.now()}`,
      userId: "demo_user_id",
      platform: "instagram",
      type: "shadowban" as const,
      message: "⚠️ Görünürlük düşüyor - Son 7 günde etkileşim %40 azaldı",
      severity: "high" as const,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    riskAlerts.push(demoAlert);

    return {
      success: true,
      alert: demoAlert,
      message: "Demo risk alert created"
    };
  });