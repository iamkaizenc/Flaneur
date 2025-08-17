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
    platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"]),
  }))
  .mutation(async ({ input }) => {
    if (input.platform === 'telegram') {
      return {
        requiresBotToken: true,
        message: 'Telegram uses bot token authentication. Please configure TELEGRAM_BOT_TOKEN in your environment.',
        instructions: 'Create a bot via @BotFather and add the token to your .env file'
      };
    }
    
    // Generate OAuth URL directly
    const state = Math.random().toString(36).substring(2, 15);
    const redirectUri = 'http://localhost:3000/oauth/' + input.platform + '/callback';
    
    const oauthUrls: Record<string, string> = {
      x: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read&state=${state}`,
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${state}`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=w_member_social&state=${state}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement&response_type=code&state=${state}`
    };
    
    const authUrl = oauthUrls[input.platform];
    if (!authUrl) {
      throw new Error(`OAuth not supported for platform: ${input.platform}`);
    }
    
    return {
      success: true,
      authUrl,
      state,
      platform: input.platform
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