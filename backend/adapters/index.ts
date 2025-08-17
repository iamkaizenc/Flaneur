import { RateLimitError, NetworkError, QuotaError } from "../trpc/create-context";

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  platform: string;
  mediaUrl?: string;
  scheduledAt?: string;
}

export interface PublishResult {
  success: boolean;
  publishedId?: string;
  error?: string;
  platformLimitsInfo?: Record<string, any>;
}

export interface MetricsResult {
  postId: string;
  impressions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  reach?: number;
  fetchedAt: string;
}

export abstract class BasePlatformAdapter {
  protected platform: string;
  protected isDryRun: boolean;
  protected rateLimit: number;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected resetTime: number = Date.now() + 3600000; // 1 hour

  constructor(platform: string, rateLimit: number = 100) {
    this.platform = platform;
    this.isDryRun = process.env.DRY_RUN === "true";
    this.rateLimit = rateLimit;
  }

  protected async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if hour has passed
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 3600000;
    }

    if (this.requestCount >= this.rateLimit) {
      throw new RateLimitError(`Rate limit exceeded for ${this.platform}: ${this.rateLimit}/hour`);
    }

    // Enforce minimum time between requests (1 second)
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) break;
        
        // Don't retry certain errors
        if (error instanceof QuotaError || error instanceof RateLimitError) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`[${this.platform}] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  protected logTrace(contentItem: ContentItem, action: string, result: any): void {
    console.log(`[${this.platform}] ${action}:`, {
      itemId: contentItem.id,
      title: contentItem.title,
      isDryRun: this.isDryRun,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  abstract publish(contentItem: ContentItem): Promise<PublishResult>;
  abstract fetchMetrics(since: Date): Promise<MetricsResult[]>;
}

// Platform-specific adapters
export class XAdapter extends BasePlatformAdapter {
  constructor() {
    super("X", parseInt(process.env.RATE_LIMIT_X || "300"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_x_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 280),
          maxLength: 280,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real X API call would go here
      const result = {
        success: true,
        publishedId: `x_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 280),
          maxLength: 280,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_x_1",
          impressions: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 50) + 5,
          shares: Math.floor(Math.random() * 20) + 1,
          comments: Math.floor(Math.random() * 10) + 1,
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Real X API metrics call would go here
      return [];
    });
  }
}

export class InstagramAdapter extends BasePlatformAdapter {
  constructor() {
    super("Instagram", parseInt(process.env.RATE_LIMIT_INSTAGRAM || "200"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_ig_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 2200),
          maxLength: 2200,
          requiresMedia: !contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real Instagram Graph API call would go here
      const result = {
        success: true,
        publishedId: `ig_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 2200),
          maxLength: 2200,
          requiresMedia: !contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_ig_1",
          impressions: Math.floor(Math.random() * 2000) + 200,
          likes: Math.floor(Math.random() * 100) + 10,
          comments: Math.floor(Math.random() * 20) + 2,
          reach: Math.floor(Math.random() * 1500) + 150,
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Real Instagram Insights API call would go here
      return [];
    });
  }
}

export class LinkedInAdapter extends BasePlatformAdapter {
  constructor() {
    super("LinkedIn", parseInt(process.env.RATE_LIMIT_LINKEDIN || "100"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_li_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 3000),
          maxLength: 3000,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real LinkedIn API call would go here
      const result = {
        success: true,
        publishedId: `li_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 3000),
          maxLength: 3000,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_li_1",
          impressions: Math.floor(Math.random() * 500) + 50,
          likes: Math.floor(Math.random() * 30) + 3,
          shares: Math.floor(Math.random() * 15) + 1,
          comments: Math.floor(Math.random() * 8) + 1,
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Real LinkedIn API metrics call would go here
      return [];
    });
  }
}

export class TikTokAdapter extends BasePlatformAdapter {
  constructor() {
    super("TikTok", parseInt(process.env.RATE_LIMIT_TIKTOK || "100"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_tt_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 150),
          maxLength: 150,
          requiresVideo: !contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real TikTok API call would go here
      const result = {
        success: true,
        publishedId: `tt_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 150),
          maxLength: 150,
          requiresVideo: !contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_tt_1",
          impressions: Math.floor(Math.random() * 5000) + 500,
          likes: Math.floor(Math.random() * 200) + 20,
          shares: Math.floor(Math.random() * 50) + 5,
          comments: Math.floor(Math.random() * 30) + 3,
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Real TikTok API metrics call would go here
      return [];
    });
  }
}

export class FacebookAdapter extends BasePlatformAdapter {
  constructor() {
    super("Facebook", parseInt(process.env.RATE_LIMIT_FACEBOOK || "200"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_fb_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 63206),
          maxLength: 63206,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real Facebook Graph API call would go here
      const result = {
        success: true,
        publishedId: `fb_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 63206),
          maxLength: 63206,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_fb_1",
          impressions: Math.floor(Math.random() * 1000) + 100,
          likes: Math.floor(Math.random() * 50) + 5,
          shares: Math.floor(Math.random() * 20) + 2,
          comments: Math.floor(Math.random() * 15) + 1,
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Real Facebook Insights API call would go here
      return [];
    });
  }
}

export class TelegramAdapter extends BasePlatformAdapter {
  constructor() {
    super("Telegram", parseInt(process.env.RATE_LIMIT_TELEGRAM || "30"));
  }

  async publish(contentItem: ContentItem): Promise<PublishResult> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      this.logTrace(contentItem, "DRY_RUN_PUBLISH", { success: true });
      return {
        success: true,
        publishedId: `dry_run_tg_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 4096),
          maxLength: 4096,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
    }

    return this.retryWithBackoff(async () => {
      // Real Telegram Bot API call would go here
      const result = {
        success: true,
        publishedId: `tg_${Date.now()}`,
        platformLimitsInfo: {
          textLength: Math.min(contentItem.body.length, 4096),
          maxLength: 4096,
          hasMedia: !!contentItem.mediaUrl,
        },
      };
      
      this.logTrace(contentItem, "LIVE_PUBLISH", result);
      return result;
    });
  }

  async fetchMetrics(since: Date): Promise<MetricsResult[]> {
    await this.enforceRateLimit();

    if (this.isDryRun) {
      return [
        {
          postId: "dry_run_tg_1",
          impressions: Math.floor(Math.random() * 300) + 30,
          likes: 0, // Telegram doesn't have likes
          shares: Math.floor(Math.random() * 10) + 1,
          comments: 0, // Basic metrics only
          fetchedAt: new Date().toISOString(),
        },
      ];
    }

    return this.retryWithBackoff(async () => {
      // Telegram Bot API has limited analytics
      return [];
    });
  }
}

// Adapter factory
export const createAdapter = (platform: string): BasePlatformAdapter => {
  switch (platform.toLowerCase()) {
    case "x":
    case "twitter":
      return new XAdapter();
    case "instagram":
      return new InstagramAdapter();
    case "linkedin":
      return new LinkedInAdapter();
    case "tiktok":
      return new TikTokAdapter();
    case "facebook":
      return new FacebookAdapter();
    case "telegram":
      return new TelegramAdapter();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};