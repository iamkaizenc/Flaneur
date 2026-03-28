import { createAdapter, ContentItem, PublishResult } from "../adapters";
import { QuotaError, ValidationError } from "../trpc/create-context";

interface GuardrailConfig {
  bannedWords: string[];
  bannedTags: string[];
  riskLevel: "conservative" | "normal" | "aggressive";
}

interface PublishingQuotas {
  dailyLimits: Record<string, number>;
  postingWindow: {
    start: number; // 0-23 hour
    end: number;   // 0-23 hour
  };
}

export class PublisherAgent {
  private guardrails: GuardrailConfig;
  private quotas: PublishingQuotas;
  private dailyUsage: Map<string, number> = new Map();
  private lastResetDate: string = new Date().toDateString();

  constructor() {
    // Load from environment or defaults
    this.guardrails = {
      bannedWords: (process.env.BANNED_WORDS || "revolutionary,disruptive,game-changer,viral").split(","),
      bannedTags: (process.env.BANNED_TAGS || "#crypto,#investment,#trading").split(","),
      riskLevel: (process.env.RISK_LEVEL as any) || "normal",
    };

    this.quotas = {
      dailyLimits: {
        X: parseInt(process.env.DAILY_POST_LIMIT_X || "10"),
        Instagram: parseInt(process.env.DAILY_POST_LIMIT_INSTAGRAM || "5"),
        LinkedIn: parseInt(process.env.DAILY_POST_LIMIT_LINKEDIN || "3"),
        TikTok: parseInt(process.env.DAILY_POST_LIMIT_TIKTOK || "3"),
        Facebook: parseInt(process.env.DAILY_POST_LIMIT_FACEBOOK || "5"),
        Telegram: parseInt(process.env.DAILY_POST_LIMIT_TELEGRAM || "10"),
      },
      postingWindow: {
        start: parseInt(process.env.PUBLISH_START_HOUR || "8"),
        end: parseInt(process.env.PUBLISH_END_HOUR || "22"),
      },
    };

    this.resetDailyUsageIfNeeded();
  }

  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyUsage.clear();
      this.lastResetDate = today;
      console.log("[Publisher] Daily usage counters reset");
    }
  }

  private checkPostingWindow(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < this.quotas.postingWindow.start || currentHour >= this.quotas.postingWindow.end) {
      return false;
    }
    
    return true;
  }

  private checkDailyQuota(platform: string): boolean {
    this.resetDailyUsageIfNeeded();
    
    const used = this.dailyUsage.get(platform) || 0;
    const limit = this.quotas.dailyLimits[platform] || 0;
    
    return used < limit;
  }

  private incrementUsage(platform: string): void {
    const current = this.dailyUsage.get(platform) || 0;
    this.dailyUsage.set(platform, current + 1);
  }

  private checkGuardrails(contentItem: ContentItem): { passed: boolean; reason?: string } {
    const content = `${contentItem.title} ${contentItem.body}`.toLowerCase();
    
    // Check banned words
    for (const word of this.guardrails.bannedWords) {
      if (content.includes(word.toLowerCase())) {
        return {
          passed: false,
          reason: `Content contains banned word: '${word}'`,
        };
      }
    }

    // Check banned tags
    for (const tag of this.guardrails.bannedTags) {
      if (content.includes(tag.toLowerCase())) {
        return {
          passed: false,
          reason: `Content contains banned tag: '${tag}'`,
        };
      }
    }

    // Risk level specific checks
    if (this.guardrails.riskLevel === "conservative") {
      const riskyPatterns = ["urgent", "limited time", "act now", "exclusive"];
      for (const pattern of riskyPatterns) {
        if (content.includes(pattern)) {
          return {
            passed: false,
            reason: `Conservative mode: flagged pattern '${pattern}'`,
          };
        }
      }
    }

    return { passed: true };
  }

  async publish(contentItem: ContentItem): Promise<{
    success: boolean;
    status: "published" | "held" | "error";
    publishedId?: string;
    error?: string;
    publishAttempts: number;
  }> {
    console.log(`[Publisher] Processing content item: ${contentItem.id} for ${contentItem.platform}`);

    try {
      // Check posting window
      if (!this.checkPostingWindow()) {
        const currentHour = new Date().getHours();
        throw new QuotaError(
          `Outside posting window. Current hour: ${currentHour}, allowed: ${this.quotas.postingWindow.start}-${this.quotas.postingWindow.end}`
        );
      }

      // Check daily quota
      if (!this.checkDailyQuota(contentItem.platform)) {
        const used = this.dailyUsage.get(contentItem.platform) || 0;
        const limit = this.quotas.dailyLimits[contentItem.platform] || 0;
        throw new QuotaError(
          `Daily quota exceeded for ${contentItem.platform}: ${used}/${limit}`
        );
      }

      // Check guardrails
      const guardrailCheck = this.checkGuardrails(contentItem);
      if (!guardrailCheck.passed) {
        console.log(`[Publisher] Content held due to guardrail: ${guardrailCheck.reason}`);
        return {
          success: false,
          status: "held",
          error: guardrailCheck.reason,
          publishAttempts: 1,
        };
      }

      // Create platform adapter and publish
      const adapter = createAdapter(contentItem.platform);
      const result = await adapter.publish(contentItem);

      if (result.success) {
        this.incrementUsage(contentItem.platform);
        console.log(`[Publisher] Successfully published ${contentItem.id} to ${contentItem.platform}`);
        
        return {
          success: true,
          status: "published",
          publishedId: result.publishedId,
          publishAttempts: 1,
        };
      } else {
        console.error(`[Publisher] Publish failed for ${contentItem.id}:`, result.error);
        return {
          success: false,
          status: "error",
          error: result.error,
          publishAttempts: 1,
        };
      }

    } catch (error) {
      console.error(`[Publisher] Error publishing ${contentItem.id}:`, error);
      
      if (error instanceof QuotaError) {
        return {
          success: false,
          status: "held",
          error: error.message,
          publishAttempts: 1,
        };
      }

      return {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        publishAttempts: 1,
      };
    }
  }

  async processQueue(queuedItems: ContentItem[]): Promise<void> {
    console.log(`[Publisher] Processing queue with ${queuedItems.length} items`);

    for (const item of queuedItems) {
      try {
        const result = await this.publish(item);
        
        // In a real implementation, you would update the database here
        console.log(`[Publisher] Item ${item.id} result:`, {
          status: result.status,
          publishedId: result.publishedId,
          error: result.error,
        });

        // Add delay between posts to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`[Publisher] Failed to process item ${item.id}:`, error);
      }
    }
  }

  getUsageStats(): Record<string, { used: number; limit: number; remaining: number }> {
    this.resetDailyUsageIfNeeded();
    
    const stats: Record<string, { used: number; limit: number; remaining: number }> = {};
    
    for (const [platform, limit] of Object.entries(this.quotas.dailyLimits)) {
      const used = this.dailyUsage.get(platform) || 0;
      stats[platform] = {
        used,
        limit,
        remaining: Math.max(0, limit - used),
      };
    }
    
    return stats;
  }

  updateGuardrails(newGuardrails: Partial<GuardrailConfig>): void {
    this.guardrails = { ...this.guardrails, ...newGuardrails };
    console.log("[Publisher] Guardrails updated:", this.guardrails);
  }

  updateQuotas(newQuotas: Partial<PublishingQuotas>): void {
    this.quotas = { ...this.quotas, ...newQuotas };
    console.log("[Publisher] Quotas updated:", this.quotas);
  }
}

// Singleton instance
export const publisherAgent = new PublisherAgent();