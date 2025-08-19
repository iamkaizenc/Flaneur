import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Mock publisher agent for plan gates and quotas
class MockPublisherAgent {
  private dailyUsage = new Map<string, number>();
  private lastResetDate = new Date().toDateString();
  
  private resetDailyUsageIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyUsage.clear();
      this.lastResetDate = today;
    }
  }
  
  getUsageStats() {
    this.resetDailyUsageIfNeeded();
    return {
      x: { used: this.dailyUsage.get('x') || 2, limit: 10, remaining: 8 },
      instagram: { used: this.dailyUsage.get('instagram') || 1, limit: 5, remaining: 4 },
      linkedin: { used: this.dailyUsage.get('linkedin') || 1, limit: 3, remaining: 2 },
      tiktok: { used: this.dailyUsage.get('tiktok') || 0, limit: 3, remaining: 3 },
      facebook: { used: this.dailyUsage.get('facebook') || 0, limit: 5, remaining: 5 },
      telegram: { used: this.dailyUsage.get('telegram') || 0, limit: 10, remaining: 10 }
    };
  }
  
  async publish(item: any) {
    // Check posting window
    const currentHour = new Date().getHours();
    const startHour = parseInt(process.env.PUBLISH_START_HOUR || '8');
    const endHour = parseInt(process.env.PUBLISH_END_HOUR || '22');
    
    if (currentHour < startHour || currentHour >= endHour) {
      return {
        success: false,
        status: 'held' as const,
        error: `Outside posting window. Current hour: ${currentHour}, allowed: ${startHour}-${endHour}`,
        publishAttempts: 1
      };
    }
    
    // Check daily quota
    const used = this.dailyUsage.get(item.platform) || 0;
    const limits = { x: 10, instagram: 5, linkedin: 3, tiktok: 3, facebook: 5, telegram: 10 };
    const limit = limits[item.platform as keyof typeof limits] || 5;
    
    if (used >= limit) {
      return {
        success: false,
        status: 'held' as const,
        error: `Daily quota exceeded for ${item.platform}: ${used}/${limit}`,
        publishAttempts: 1
      };
    }
    
    // Check guardrails
    const content = `${item.title} ${item.body}`.toLowerCase();
    const bannedWords = ['revolutionary', 'disruptive', 'game-changer', 'viral'];
    
    for (const word of bannedWords) {
      if (content.includes(word.toLowerCase())) {
        return {
          success: false,
          status: 'held' as const,
          error: `Content contains banned word: '${word}'`,
          publishAttempts: 1
        };
      }
    }
    
    // Simulate success
    this.dailyUsage.set(item.platform, used + 1);
    return {
      success: true,
      status: 'published' as const,
      publishedId: `pub_${Date.now()}`,
      publishAttempts: 1
    };
  }
}

const mockPublisher = new MockPublisherAgent();

// Plan feature checking helper
function checkFeatureAccess(feature: string): boolean {
  const mockUserPlan = process.env.MOCK_USER_PLAN || "platinum";
  
  const planFeatures = {
    free: { automation: false, analytics: false },
    premium: { automation: false, analytics: true },
    platinum: { automation: true, analytics: true }
  };
  
  return planFeatures[mockUserPlan as keyof typeof planFeatures]?.[feature as keyof typeof planFeatures.free] || false;
}

const contentListInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "queued", "publishing", "published", "held", "error"]).optional(),
  platform: z.string().optional(),
});

// Enhanced mock content with publisher integration
const mockContent = [
  {
    id: "1",
    title: "The Art of Autonomous Marketing",
    body: "Discover how Flâneur transforms social media strategy through intelligent automation and sophisticated content curation.",
    platform: "linkedin" as const,
    status: "published" as const,
    scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    publishAttempts: 1,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    platformLimitsInfo: {
      textLength: 125,
      maxLength: 3000,
      hasMedia: false
    },
    metrics: {
      impressions: 850,
      likes: 32,
      shares: 8,
      comments: 5
    }
  },
  {
    id: "2",
    title: "Minimalist Content Strategy",
    body: "5 principles of elegant social media presence with Flâneur's autonomous approach to content creation and distribution.",
    platform: "x" as const,
    status: "queued" as const,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    publishAttempts: 0,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000),
    metrics: null
  },
  {
    id: "3",
    title: "Behind the Algorithm",
    body: "An intimate look at Flâneur's sophisticated content creation process and the AI that powers autonomous social media management.",
    platform: "instagram" as const,
    status: "queued" as const,
    scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    publishAttempts: 0,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000),
    mediaUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800",
    metrics: null
  },
  {
    id: "4",
    title: "Weekly Insights",
    body: "This week's curated insights on autonomous social media management, featuring the latest trends and Flâneur's innovative approach.",
    platform: "telegram" as const,
    status: "draft" as const,
    publishAttempts: 0,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    metrics: null
  },
  {
    id: "5",
    title: "Revolutionary Platform Evolution",
    body: "Announcing Flâneur's revolutionary next-generation autonomous features that will disrupt the social media landscape!",
    platform: "linkedin" as const,
    status: "held" as const,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    publishAttempts: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    platformLimitsInfo: {
      guardrailTriggered: true,
      reason: "Content contains banned word: 'revolutionary'",
      friendlyReason: "\"revolutionary\" kelimesi markalar tarafından sevilmiyor 🚫",
      riskLevel: "normal"
    },
    metrics: null
  },
  {
    id: "6",
    title: "Analytics Deep Dive",
    body: "Understanding your social media metrics is crucial for growth. Let's explore the key performance indicators that matter.",
    platform: "x" as const,
    status: "error" as const,
    scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    publishAttempts: 3,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    platformLimitsInfo: {
      publishAttempts: 3,
      lastError: "RateLimitError",
      errorMessage: "Rate limit exceeded for x: 300/hour",
      friendlyReason: "Platform çok yoğun, biraz bekle ⏳"
    },
    metrics: null
  }
];

export const contentListProcedure = publicProcedure
  .input(contentListInputSchema)
  .query(async ({ input }) => {
    console.log("[Content] Fetching content list with filters:", input);

    let filtered = [...mockContent];
    
    if (input.status) {
      filtered = filtered.filter(item => item.status === input.status);
    }
    
    if (input.platform) {
      filtered = filtered.filter(item => item.platform === input.platform);
    }
    
    // Sort by updated date (most recent first)
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    // Apply limit
    const items = filtered.slice(0, input.limit);
    
    // Get queue statistics
    const queueStatus = {
      draft: mockContent.filter(i => i.status === 'draft').length,
      queued: mockContent.filter(i => i.status === 'queued').length,
      published: mockContent.filter(i => i.status === 'published').length,
      held: mockContent.filter(i => i.status === 'held').length,
      error: mockContent.filter(i => i.status === 'error').length
    };
    
    return {
      items: items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        preview: item.body.substring(0, 100) + (item.body.length > 100 ? '...' : ''),
        friendlyStatus: getFriendlyStatus(item.status),
        platformLimitsInfo: item.platformLimitsInfo ? {
          ...item.platformLimitsInfo,
          friendlyReason: item.platformLimitsInfo.friendlyReason || getFriendlyReason(item.platformLimitsInfo.reason || '')
        } : undefined
      })),
      total: filtered.length,
      hasMore: filtered.length > input.limit,
      publisherStats: mockPublisher.getUsageStats(),
      queueStatus,
      publishingWindow: {
        start: parseInt(process.env.PUBLISH_START_HOUR || '8'),
        end: parseInt(process.env.PUBLISH_END_HOUR || '22'),
        currentHour: new Date().getHours(),
        isActive: isWithinPublishingWindow()
      }
    };
  });

export const contentQueueProcedure = publicProcedure
  .input(z.object({ 
    itemId: z.string(),
    scheduledAt: z.string().datetime().optional()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Queuing item ${input.itemId}`);
    
    const item = mockContent.find(c => c.id === input.itemId);
    if (!item) {
      throw new Error(`Content item ${input.itemId} not found`);
    }
    
    if (item.status === 'published') {
      throw new Error('Cannot queue already published content');
    }

    // Plan gates: Free users can only manually queue
    const hasAutomation = checkFeatureAccess('automation');
    if (!hasAutomation && input.scheduledAt) {
      return {
        success: false,
        status: 'held',
        message: 'Otomatik yayınlama Premium planında! Şimdi yayınla veya yükselt.',
        reason: 'plan_gate_automation',
        upgradeRequired: true,
        friendlyReason: 'Otomatik yayınlama Premium planında! 🔒'
      };
    }

    // Generate idempotency key
    const scheduledTime = input.scheduledAt || new Date().toISOString();
    const idempotencyKey = `${item.platform}:${item.id}:${scheduledTime}`;
    console.log(`[Content] Idempotency key: ${idempotencyKey}`);
    
    // Update item status
    (item as any).status = "queued";
    (item as any).scheduledAt = scheduledTime;
    (item as any).idempotencyKey = idempotencyKey;
    item.updatedAt = new Date();
    
    // Use publisher agent for processing
    setTimeout(async () => {
      try {
        const result = await mockPublisher.publish({
          id: item.id,
          title: item.title,
          body: item.body,
          platform: item.platform,
          mediaUrl: item.mediaUrl,
          scheduledAt: scheduledTime
        });
        
        (item as any).status = result.status;
        item.publishAttempts = result.publishAttempts;
        
        if (result.success) {
          (item as any).publishedAt = new Date().toISOString();
          (item as any).publishedId = result.publishedId;
        } else {
          (item as any).platformLimitsInfo = {
            guardrailTriggered: result.status === 'held',
            reason: result.error,
            riskLevel: 'normal',
            friendlyReason: getFriendlyReason(result.error || '')
          };
        }
        
        item.updatedAt = new Date();
        console.log(`[Content] Item ${item.id} processed:`, result.status);
        
      } catch (error) {
        console.error(`[Content] Processing error for ${item.id}:`, error);
        (item as any).status = 'error';
        item.publishAttempts = 1;
        item.updatedAt = new Date();
      }
    }, 1000);
    
    return {
      success: true,
      message: `İçerik sahne sırasına eklendi`,
      status: item.status,
      idempotencyKey
    };
  });

export const contentHoldProcedure = publicProcedure
  .input(z.object({ itemId: z.string(), reason: z.string().optional() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Holding item ${input.itemId}: ${input.reason || 'Manual hold'}`);
    
    const item = mockContent.find(c => c.id === input.itemId);
    if (!item) {
      throw new Error(`Content item ${input.itemId} not found`);
    }
    
    (item as any).status = "held";
    item.updatedAt = new Date();
    
    const friendlyReason = getFriendlyReason(input.reason || 'Manual hold');
    
    if (input.reason) {
      item.platformLimitsInfo = {
        guardrailTriggered: true,
        reason: input.reason,
        friendlyReason,
        riskLevel: 'normal'
      };
    }
    
    return {
      success: true,
      message: `İçerik sahne arkasında bekletiliyor`,
      reason: input.reason,
      friendlyReason,
      status: item.status
    };
  });

export const contentRetryProcedure = publicProcedure
  .input(z.object({ itemId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Retrying item ${input.itemId}`);
    
    const item = mockContent.find(c => c.id === input.itemId);
    if (!item) {
      throw new Error(`Content item ${input.itemId} not found`);
    }
    
    if (item.status !== "error" && item.status !== "held") {
      throw new Error(`Cannot retry content with status: ${item.status}`);
    }

    // Generate new idempotency key for retry
    const retryTime = new Date().toISOString();
    const idempotencyKey = `${item.platform}:${item.id}:${retryTime}:retry${item.publishAttempts + 1}`;
    console.log(`[Content] Retry idempotency key: ${idempotencyKey}`);
    
    (item as any).status = "queued";
    (item as any).idempotencyKey = idempotencyKey;
    item.updatedAt = new Date();
    
    // Clear previous error/hold info
    (item as any).platformLimitsInfo = undefined;
    
    // Use publisher agent for retry
    setTimeout(async () => {
      try {
        const result = await mockPublisher.publish({
          id: item.id,
          title: item.title,
          body: item.body,
          platform: item.platform,
          mediaUrl: item.mediaUrl,
          scheduledAt: retryTime
        });
        
        (item as any).status = result.status;
        item.publishAttempts = result.publishAttempts;
        
        if (result.success) {
          (item as any).publishedAt = new Date().toISOString();
          (item as any).publishedId = result.publishedId;
        } else {
          (item as any).platformLimitsInfo = {
            guardrailTriggered: result.status === 'held',
            reason: result.error,
            friendlyReason: getFriendlyReason(result.error || ''),
            riskLevel: 'normal'
          };
        }
        
        item.updatedAt = new Date();
        console.log(`[Content] Retry for item ${item.id} result:`, result.status);
        
      } catch (error) {
        console.error(`[Content] Retry error for ${item.id}:`, error);
        (item as any).status = 'error';
        item.publishAttempts = item.publishAttempts + 1;
        item.updatedAt = new Date();
      }
    }, 1000);
    
    return {
      success: true,
      message: `İçerik yeniden sahne sırasına eklendi`,
      status: item.status,
      publishAttempts: item.publishAttempts,
      idempotencyKey
    };
  });

// Additional procedures for content management
export const contentCreateProcedure = publicProcedure
  .input(z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"]),
    scheduledAt: z.string().datetime().optional(),
    mediaUrl: z.string().url().optional()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Creating new content item for ${input.platform}`);
    
    const newItem = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: input.title,
      body: input.body,
      platform: input.platform,
      status: "draft" as const,
      scheduledAt: input.scheduledAt,
      mediaUrl: input.mediaUrl,
      publishAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: null
    };
    
    // Add to mock content
    mockContent.push(newItem as any);
    
    return {
      success: true,
      message: "Content item created successfully",
      item: {
        ...newItem,
        createdAt: newItem.createdAt.toISOString(),
        updatedAt: newItem.updatedAt.toISOString()
      }
    };
  });

export const contentLogsProcedure = publicProcedure
  .input(z.object({
    limit: z.number().min(1).max(100).default(20),
    platform: z.string().optional(),
    status: z.enum(["draft", "queued", "published", "held", "error"]).optional()
  }))
  .query(async ({ input }) => {
    console.log("[Content] Fetching content logs with filters:", input);
    
    let filtered = [...mockContent];
    
    if (input.platform) {
      filtered = filtered.filter(item => item.platform === input.platform);
    }
    
    if (input.status) {
      filtered = filtered.filter(item => item.status === input.status);
    }
    
    // Sort by updated date (most recent first)
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    // Apply limit
    const logs = filtered.slice(0, input.limit);
    
    return {
      logs: logs.map(item => ({
        id: item.id,
        platform: item.platform,
        status: item.status,
        title: item.title,
        body: item.body.substring(0, 150) + (item.body.length > 150 ? '...' : ''),
        createdAt: item.createdAt.toISOString(),
        scheduledAt: item.scheduledAt,
        publishedAt: (item as any).publishedAt,
        publishAttempts: item.publishAttempts,
        heldReason: item.platformLimitsInfo?.reason,
        friendlyReason: item.platformLimitsInfo?.friendlyReason,
        friendlyStatus: getFriendlyStatus(item.status),
        // Developer mode trace data
        trace: {
          idempotencyKey: (item as any).idempotencyKey,
          publishedId: (item as any).publishedId,
          platformLimitsInfo: item.platformLimitsInfo,
          updatedAt: item.updatedAt.toISOString()
        }
      })),
      total: filtered.length,
      hasMore: filtered.length > input.limit
    };
  });

export const contentStatsProcedure = publicProcedure
  .query(async () => {
    const queueStatus = {
      draft: mockContent.filter(i => i.status === 'draft').length,
      queued: mockContent.filter(i => i.status === 'queued').length,
      published: mockContent.filter(i => i.status === 'published').length,
      held: mockContent.filter(i => i.status === 'held').length,
      error: mockContent.filter(i => i.status === 'error').length
    };
    
    return {
      dailyUsage: mockPublisher.getUsageStats(),
      queueStatus,
      totalItems: mockContent.length,
      publishingWindow: {
        start: parseInt(process.env.PUBLISH_START_HOUR || '8'),
        end: parseInt(process.env.PUBLISH_END_HOUR || '22'),
        currentHour: new Date().getHours(),
        isActive: isWithinPublishingWindow()
      }
    };
  });

// Helper functions for friendly messaging
function getFriendlyReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    'banned_word': 'Markalar bu ifadeyi sevmez 🚫',
    'quota_window': 'Şu an sahne kapalı (08–22 arası yayına çıkar) ⏰',
    'daily_quota': 'Günlük sahne kotası doldu, yarın devam 📅',
    'plan_gate_automation': 'Otomatik yayınlama Premium planında! 🔒',
    'conservative_mode': 'İçerik çok agresif, yumuşat 💡',
    'rate_limit': 'Platform çok yoğun, biraz bekle ⏳'
  };
  
  // Check for specific patterns
  if (reason.includes('banned word')) {
    const word = reason.match(/banned word: '([^']+)'/)?.[1];
    return word ? `"${word}" kelimesi markalar tarafından sevilmiyor 🚫` : reasonMap.banned_word;
  }
  
  if (reason.includes('posting window') || reason.includes('Outside posting window')) {
    return reasonMap.quota_window;
  }
  
  if (reason.includes('quota exceeded') || reason.includes('Daily quota')) {
    return reasonMap.daily_quota;
  }
  
  if (reason.includes('Conservative mode')) {
    return reasonMap.conservative_mode;
  }
  
  if (reason.includes('Rate limit') || reason.includes('rate limit')) {
    return reasonMap.rate_limit;
  }
  
  // Default friendly message
  return 'İçerik gözden geçiriliyor, düzenle ve tekrar dene 🔍';
}

function getFriendlyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Taslak',
    'queued': 'Sahne Sıranda',
    'publishing': 'Sahnede Yayınlanıyor',
    'published': 'Sahnede',
    'held': 'Sahne Arkasında',
    'error': 'Teknik Sorun'
  };
  
  return statusMap[status] || status;
}

function isWithinPublishingWindow(): boolean {
  const currentHour = new Date().getHours();
  const startHour = parseInt(process.env.PUBLISH_START_HOUR || '8');
  const endHour = parseInt(process.env.PUBLISH_END_HOUR || '22');
  
  return currentHour >= startHour && currentHour < endHour;
}