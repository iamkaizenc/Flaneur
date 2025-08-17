import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const contentListInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "queued", "published", "held", "error"]).optional(),
  platform: z.string().optional(),
});

// Enhanced mock content with publisher integration
const mockContent = [
  {
    id: "1",
    title: "The Art of Autonomous Marketing",
    body: "Discover how Flâneur transforms social media strategy through intelligent automation and sophisticated content curation.",
    platform: "linkedin",
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
    platform: "x",
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
    platform: "instagram",
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
    platform: "telegram",
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
    platform: "linkedin",
    status: "held" as const,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    publishAttempts: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    platformLimitsInfo: {
      guardrailTriggered: true,
      reason: "Content contains banned word: 'revolutionary'",
      riskLevel: "normal"
    },
    metrics: null
  },
  {
    id: "6",
    title: "Analytics Deep Dive",
    body: "Understanding your social media metrics is crucial for growth. Let's explore the key performance indicators that matter.",
    platform: "x",
    status: "error" as const,
    scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    publishAttempts: 3,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    platformLimitsInfo: {
      publishAttempts: 3,
      lastError: "RateLimitError",
      errorMessage: "Rate limit exceeded for x: 300/hour"
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
    
    const publisherStats = {
      x: { used: 2, limit: 10, remaining: 8 },
      instagram: { used: 1, limit: 5, remaining: 4 },
      linkedin: { used: 1, limit: 3, remaining: 2 },
      tiktok: { used: 0, limit: 3, remaining: 3 },
      facebook: { used: 0, limit: 5, remaining: 5 },
      telegram: { used: 0, limit: 10, remaining: 10 }
    };
    
    return {
      items: items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        preview: item.body.substring(0, 100) + (item.body.length > 100 ? '...' : '')
      })),
      total: filtered.length,
      hasMore: filtered.length > input.limit,
      publisherStats,
      queueStatus
    };
  });

export const contentQueueProcedure = publicProcedure
  .input(z.object({ itemId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Queuing item ${input.itemId}`);
    
    const item = mockContent.find(c => c.id === input.itemId);
    if (!item) {
      throw new Error(`Content item ${input.itemId} not found`);
    }
    
    if (item.status === 'published') {
      throw new Error('Cannot queue already published content');
    }
    
    // Update item status
    (item as any).status = "queued";
    item.updatedAt = new Date();
    
    // Simulate publisher processing
    setTimeout(() => {
      // Simulate publishing success/failure
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        (item as any).status = 'published';
        item.publishAttempts = 1;
        console.log(`[Content] Item ${item.id} published successfully`);
      } else {
        (item as any).status = 'error';
        item.publishAttempts = 1;
        (item as any).platformLimitsInfo = {
          publishAttempts: 1,
          lastError: 'PublishError',
          errorMessage: 'Simulated publish error'
        };
        console.log(`[Content] Item ${item.id} failed to publish`);
      }
      
      item.updatedAt = new Date();
    }, 2000);
    
    return {
      success: true,
      message: `Content item ${input.itemId} queued for publishing`,
      status: item.status
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
    
    if (input.reason) {
      item.platformLimitsInfo = {
        guardrailTriggered: true,
        reason: input.reason,
        riskLevel: 'normal'
      };
    }
    
    return {
      success: true,
      message: `Content item ${input.itemId} held`,
      reason: input.reason,
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
    
    (item as any).status = "queued";
    item.updatedAt = new Date();
    
    // Clear previous error/hold info
    (item as any).platformLimitsInfo = undefined;
    
    // Simulate retry processing
    setTimeout(() => {
      // Higher success rate for retries
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        (item as any).status = 'published';
        item.publishAttempts = item.publishAttempts + 1;
        console.log(`[Content] Retry for item ${item.id} succeeded`);
      } else {
        (item as any).status = 'error';
        item.publishAttempts = item.publishAttempts + 1;
        (item as any).platformLimitsInfo = {
          publishAttempts: item.publishAttempts + 1,
          lastError: 'RetryError',
          errorMessage: 'Retry failed - rate limit exceeded'
        };
        console.log(`[Content] Retry for item ${item.id} failed`);
      }
      
      item.updatedAt = new Date();
    }, 1500);
    
    return {
      success: true,
      message: `Content item ${input.itemId} queued for retry`,
      status: item.status,
      publishAttempts: item.publishAttempts
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

export const contentStatsProcedure = publicProcedure
  .query(async () => {
    const dailyUsage = {
      x: { used: 2, limit: 10, remaining: 8 },
      instagram: { used: 1, limit: 5, remaining: 4 },
      linkedin: { used: 1, limit: 3, remaining: 2 },
      tiktok: { used: 0, limit: 3, remaining: 3 },
      facebook: { used: 0, limit: 5, remaining: 5 },
      telegram: { used: 0, limit: 10, remaining: 10 }
    };
    
    const queueStatus = {
      draft: mockContent.filter(i => i.status === 'draft').length,
      queued: mockContent.filter(i => i.status === 'queued').length,
      published: mockContent.filter(i => i.status === 'published').length,
      held: mockContent.filter(i => i.status === 'held').length,
      error: mockContent.filter(i => i.status === 'error').length
    };
    
    return {
      dailyUsage,
      queueStatus,
      totalItems: mockContent.length,
      publishingWindow: {
        start: parseInt(process.env.PUBLISH_START_HOUR || '8'),
        end: parseInt(process.env.PUBLISH_END_HOUR || '22'),
        currentHour: new Date().getHours()
      }
    };
  });