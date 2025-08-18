import { z } from "zod";

// Platform types
export const PlatformSchema = z.enum([
  "x",
  "instagram", 
  "linkedin",
  "tiktok",
  "facebook",
  "telegram"
]);

export type Platform = z.infer<typeof PlatformSchema>;

// Content status types
export const ContentStatusSchema = z.enum([
  "draft",
  "queued", 
  "publishing",
  "published",
  "held",
  "error"
]);

// Platform limits info schema
export const PlatformLimitsInfoSchema = z.union([
  z.object({
    textLength: z.number(),
    maxLength: z.number(),
    hasMedia: z.boolean()
  }),
  z.object({
    guardrailTriggered: z.boolean(),
    reason: z.string(),
    riskLevel: z.string()
  }),
  z.object({
    publishAttempts: z.number(),
    lastError: z.string(),
    errorMessage: z.string()
  })
]);

export type PlatformLimitsInfo = z.infer<typeof PlatformLimitsInfoSchema>;

export type ContentStatus = z.infer<typeof ContentStatusSchema>;

// Social account schema
export const SocialAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: PlatformSchema,
  handle: z.string(),
  displayName: z.string().optional(),
  accessToken: z.string(), // encrypted
  refreshToken: z.string().optional(), // encrypted
  tokenExpiresAt: z.date().optional(),
  scopes: z.array(z.string()),
  status: z.enum(["connected", "expired", "error"]),
  lastRefresh: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SocialAccount = z.infer<typeof SocialAccountSchema>;

// Content item schema
export const ContentItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  campaignId: z.string().optional(),
  platform: PlatformSchema,
  type: z.enum(["text", "image", "video", "carousel", "reel"]),
  status: ContentStatusSchema,
  title: z.string(),
  body: z.string(),
  mediaUrls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.date().optional(),
  publishedAt: z.date().optional(),
  publishAttempts: z.number().optional().default(0),
  platformPostId: z.string().optional(),
  error: z.string().optional(),
  platformLimitsInfo: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;

// Campaign schema
export const CampaignSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  goalKpi: z.string(),
  targetAudience: z.string(),
  tone: z.enum(["professional", "casual", "humorous", "informative", "bold"]),
  focus: z.string(),
  riskLevel: z.enum(["conservative", "normal", "aggressive"]),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

// Course prompt schema
export const CoursePromptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  text: z.string(),
  weight: z.number().default(1),
  createdAt: z.date(),
});

export type CoursePrompt = z.infer<typeof CoursePromptSchema>;

// Metrics schema
export const MetricsDailySchema = z.object({
  id: z.string(),
  accountId: z.string(),
  date: z.date(),
  followers: z.number(),
  impressions: z.number(),
  engagements: z.number(),
  clicks: z.number().optional(),
  ctr: z.number().optional(),
  posts: z.number(),
  createdAt: z.date(),
});

export type MetricsDaily = z.infer<typeof MetricsDailySchema>;

// User metrics schema (includes FameScore)
export const UserMetricsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  fameScore: z.number().min(0).max(100),
  engagementRate: z.number().min(0).max(100),
  postFrequency: z.number().min(0),
  followerGrowth: z.number(),
  createdAt: z.date(),
});

export type UserMetrics = z.infer<typeof UserMetricsSchema>;

// Insights schema
export const InsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  findingType: z.enum(["anomaly", "opportunity", "warning"]),
  severity: z.enum(["low", "medium", "high"]),
  title: z.string(),
  description: z.string(),
  suggestedAction: z.string().optional(),
  linkedContentItemId: z.string().optional(),
  createdAt: z.date(),
});

export type Insight = z.infer<typeof InsightSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  plan: z.enum(["free", "premium", "platinum"]).default("free"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// API Error types
export class AuthError extends Error {
  constructor(message: string, public platform?: Platform) {
    super(message);
    this.name = "AuthError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public platform?: Platform, public retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class QuotaError extends Error {
  constructor(message: string, public platform?: Platform) {
    super(message);
    this.name = "QuotaError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "NetworkError";
  }
}