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
  mediaPrompt: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaError: z.string().optional(),
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

// Badge schema
export const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  threshold: z.number(),
  type: z.enum(["likes", "reach", "comments", "streak", "posts", "engagement"]),
  createdAt: z.date(),
});

export type Badge = z.infer<typeof BadgeSchema>;

// User badge schema
export const UserBadgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  badgeId: z.string(),
  awardedAt: z.date(),
  progress: z.number().optional(),
});

export type UserBadge = z.infer<typeof UserBadgeSchema>;

// Streak schema
export const StreakSchema = z.object({
  id: z.string(),
  userId: z.string(),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastPostDate: z.date().optional(),
  updatedAt: z.date(),
});

export type Streak = z.infer<typeof StreakSchema>;

// Onboarding profile schema
export const OnboardingProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  persona: z.enum(["Creator", "Fitness", "Tech", "Lifestyle"]),
  goal: z.enum(["Para", "Tanınırlık", "Topluluk"]),
  completedAt: z.date(),
});

export type OnboardingProfile = z.infer<typeof OnboardingProfileSchema>;

// Weekly challenge schema
export const WeeklyChallengeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  weekStart: z.date(),
  targetPosts: z.number().default(3),
  targetReels: z.number().default(1),
  targetLive: z.number().default(0),
  currentPosts: z.number().default(0),
  currentReels: z.number().default(0),
  currentLive: z.number().default(0),
  completed: z.boolean().default(false),
  bonusAwarded: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WeeklyChallenge = z.infer<typeof WeeklyChallengeSchema>;

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
  constructor(message: string, public platform?: Platform, public quotaType?: string) {
    super(message);
    this.name = "QuotaError";
  }
}

// Media asset schema
export const MediaAssetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string(),
  hash: z.string(),
  platform: PlatformSchema.optional(),
  prompt: z.string().optional(),
  mimeType: z.string(),
  size: z.number().optional(),
  createdAt: z.date(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;

// Idempotency key schema
export const IdempotencyKeySchema = z.object({
  key: z.string(),
  userId: z.string(),
  result: z.record(z.string(), z.any()).optional(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type IdempotencyKey = z.infer<typeof IdempotencyKeySchema>;

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

// Job schema for scheduler/worker system
export const JobSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  userId: z.string(),
  runAt: z.date(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(5),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).default("pending"),
  lastError: z.string().optional(),
  idempotencyKey: z.string(),
  priority: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  nextRetryAt: z.date().optional(),
});

export type Job = z.infer<typeof JobSchema>;

// Publish log schema (enhanced with job tracking)
export const PublishLogSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  jobId: z.string().optional(),
  platform: PlatformSchema,
  action: z.enum(["queue", "publish", "hold", "retry"]),
  status: ContentStatusSchema,
  reason: z.string().optional(),
  attempt: z.number().default(1),
  latency: z.number().optional(), // in milliseconds
  createdAt: z.date(),
});

export type PublishLog = z.infer<typeof PublishLogSchema>;

// Notification event schema
export const NotificationEventSchema = z.object({
  type: z.enum([
    "content.queued",
    "content.published", 
    "content.held",
    "content.error",
    "insight.created",
    "fameScore.weeklyDelta"
  ]),
  userId: z.string(),
  data: z.record(z.string(), z.any()),
  timestamp: z.date(),
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

// Webhook schema
export const WebhookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string().url(),
  secret: z.string(),
  events: z.array(z.string()),
  active: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// Email template schema
export const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  locale: z.string().default("en"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// Notification history schema
export const NotificationHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  channel: z.enum(["email", "push", "telegram", "webhook"]),
  recipient: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  status: z.enum(["pending", "sent", "failed", "delivered"]),
  error: z.string().optional(),
  createdAt: z.date(),
  sentAt: z.date().optional(),
});

export type NotificationHistory = z.infer<typeof NotificationHistorySchema>;