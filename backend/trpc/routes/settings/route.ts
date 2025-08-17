import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Settings schemas
const workspaceSettingsSchema = z.object({
  accounts: z.array(z.object({
    platform: z.string(),
    handle: z.string(),
    scopes: z.array(z.string()),
    status: z.enum(["connected", "expired"]),
    lastRefresh: z.string(),
  })),
  quotas: z.object({
    dailyLimits: z.record(z.string(), z.number()),
    postingWindow: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    }),
    dryRun: z.boolean(),
  }),
  guardrails: z.object({
    bannedWords: z.array(z.string()),
    bannedTags: z.array(z.string()),
    riskLevel: z.enum(["conservative", "normal", "aggressive"]),
  }),
  notifications: z.object({
    telegramChatId: z.string().optional(),
    emails: z.array(z.string()),
    notifyOn: z.object({
      publishSuccess: z.boolean(),
      publishError: z.boolean(),
      held: z.boolean(),
      anomaly: z.boolean(),
    }),
  }),
  branding: z.object({
    logoWordmarkEnabled: z.boolean(),
    theme: z.literal("black-white"),
  }),
});

const settingsUpdateSchema = workspaceSettingsSchema.partial();

export const settingsGetProcedure = publicProcedure
  .query(async () => {
    // Mock settings data
    return {
      accounts: [
        {
          platform: "X",
          handle: "@flaneur_ai",
          scopes: ["tweet.read", "tweet.write", "users.read"],
          status: "connected" as const,
          lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        {
          platform: "Telegram",
          handle: "@flaneur_channel",
          scopes: ["channel.post"],
          status: "connected" as const,
          lastRefresh: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        },
        {
          platform: "LinkedIn",
          handle: "Flâneur Company",
          scopes: ["w_member_social"],
          status: "expired" as const,
          lastRefresh: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        },
      ],
      quotas: {
        dailyLimits: {
          X: 10,
          Instagram: 5,
          LinkedIn: 3,
          TikTok: 3,
          Facebook: 5,
          Telegram: 10,
        },
        postingWindow: {
          start: 8,
          end: 22,
        },
        dryRun: true,
      },
      guardrails: {
        bannedWords: ["revolutionary", "disruptive", "game-changer", "viral"],
        bannedTags: ["#crypto", "#investment", "#trading"],
        riskLevel: "normal" as const,
      },
      notifications: {
        telegramChatId: undefined,
        emails: ["admin@flaneur.ai"],
        notifyOn: {
          publishSuccess: false,
          publishError: true,
          held: true,
          anomaly: true,
        },
      },
      branding: {
        logoWordmarkEnabled: true,
        theme: "black-white" as const,
      },
    };
  });

export const settingsUpdateProcedure = publicProcedure
  .input(settingsUpdateSchema)
  .mutation(async ({ input }: { input: z.infer<typeof settingsUpdateSchema> }) => {
    // Mock update - in real implementation, this would update the database
    console.log("Settings update:", input);
    
    return {
      success: true,
      message: "Settings updated successfully",
      updatedAt: new Date().toISOString(),
    };
  });

export const settingsConnectProcedure = publicProcedure
  .input(z.object({
    platform: z.enum(["X", "Instagram", "LinkedIn", "TikTok", "Facebook", "Telegram"]),
  }))
  .mutation(async ({ input }: { input: { platform: "X" | "Instagram" | "LinkedIn" | "TikTok" | "Facebook" | "Telegram" } }) => {
    // Mock OAuth start URL generation
    const mockUrls = {
      X: "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=mock&redirect_uri=http://localhost:3000/api/oauth/x/callback&scope=tweet.read%20tweet.write%20users.read",
      Instagram: "https://api.instagram.com/oauth/authorize?client_id=mock&redirect_uri=http://localhost:3000/api/oauth/instagram/callback&scope=user_profile,user_media&response_type=code",
      LinkedIn: "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=mock&redirect_uri=http://localhost:3000/api/oauth/linkedin/callback&scope=w_member_social",
      TikTok: "https://www.tiktok.com/auth/authorize/?client_key=mock&response_type=code&scope=user.info.basic,video.list&redirect_uri=http://localhost:3000/api/oauth/tiktok/callback",
      Facebook: "https://www.facebook.com/v18.0/dialog/oauth?client_id=mock&redirect_uri=http://localhost:3000/api/oauth/facebook/callback&scope=pages_manage_posts,pages_read_engagement&response_type=code",
      Telegram: "DIRECT_SETUP", // Special case for Telegram
    };
    
    return {
      redirectUrl: mockUrls[input.platform as keyof typeof mockUrls],
      platform: input.platform,
    };
  });

export const settingsDisconnectProcedure = publicProcedure
  .input(z.object({
    platform: z.string(),
  }))
  .mutation(async ({ input }: { input: { platform: string } }) => {
    // Mock disconnect
    console.log("Disconnecting platform:", input.platform);
    
    return {
      success: true,
      message: `${input.platform} disconnected successfully`,
    };
  });

export const settingsTestNotificationProcedure = publicProcedure
  .input(z.object({
    channel: z.enum(["email", "telegram"]),
  }))
  .mutation(async ({ input }: { input: { channel: "email" | "telegram" } }) => {
    // Mock test notification
    console.log("Sending test notification via:", input.channel);
    
    return {
      success: true,
      message: `Test notification sent via ${input.channel}`,
      sentAt: new Date().toISOString(),
    };
  });