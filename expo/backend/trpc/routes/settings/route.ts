import { z } from "zod";
import { publicProcedure } from "../../create-context";
// Error classes
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const settingsUpdateInputSchema = z.object({
  quotas: z.object({
    dailyLimits: z.record(z.string(), z.number()).optional(),
    postingWindow: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23)
    }).optional(),
    dryRun: z.boolean().optional()
  }).optional(),
  guardrails: z.object({
    bannedWords: z.array(z.string()).optional(),
    bannedTags: z.array(z.string()).optional(),
    riskLevel: z.enum(["conservative", "normal", "aggressive"]).optional()
  }).optional(),
  notifications: z.object({
    emails: z.array(z.string().email()).optional(),
    telegramChatId: z.string().optional(),
    notifyOn: z.array(z.enum(["publish_success", "publish_error", "held", "anomaly"])).optional()
  }).optional(),
  branding: z.object({
    logoWordmarkEnabled: z.boolean().optional(),
    theme: z.enum(["black-white", "minimal", "dark"]).optional()
  }).optional()
});

const settingsConnectInputSchema = z.object({
  platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"])
});

const settingsDisconnectInputSchema = z.object({
  platform: z.string()
});

const settingsTestNotificationInputSchema = z.object({
  channel: z.enum(["email", "telegram"])
});

// Mock settings data
let mockSettings = {
  accounts: [
    {
      platform: "x",
      handle: "@flaneur_demo",
      displayName: "Flâneur Demo",
      scopes: ["tweet.read", "tweet.write", "users.read"],
      status: "connected" as const,
      lastRefresh: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      platform: "telegram",
      handle: "@flaneur_channel",
      displayName: "Flâneur Channel",
      scopes: ["channel.post"],
      status: "connected" as const,
      lastRefresh: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    },
    {
      platform: "linkedin",
      handle: "flaneur-company",
      displayName: "Flâneur Company Page",
      scopes: ["r_liteprofile", "w_member_social"],
      status: "expired" as const,
      lastRefresh: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }
  ],
  quotas: {
    dailyLimits: {
      X: 10,
      Instagram: 5,
      LinkedIn: 3,
      TikTok: 3,
      Facebook: 5,
      Telegram: 10
    },
    postingWindow: {
      start: 8,
      end: 22
    },
    dryRun: true
  },
  guardrails: {
    bannedWords: ["revolutionary", "disrupt", "game-changer", "unprecedented"],
    bannedTags: ["#crypto", "#nft", "#investment"],
    riskLevel: "normal" as const
  },
  notifications: {
    emails: ["demo@flaneur.app"],
    telegramChatId: "-1001234567890",
    notifyOn: ["publish_error", "held", "anomaly"] as const
  },
  branding: {
    logoWordmarkEnabled: true,
    theme: "black-white" as const
  }
};

export const settingsGetProcedure = publicProcedure
  .query(async () => {
    console.log("[Settings] Fetching workspace settings");
    
    // Always return settings data to prevent undefined errors
    return {
      success: true,
      ...mockSettings
    };
  });

export const settingsUpdateProcedure = publicProcedure
  .input(settingsUpdateInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Settings] Updating workspace settings:", input);
    
    // Update mock settings
    if (input.quotas) {
      mockSettings.quotas = { ...mockSettings.quotas, ...input.quotas } as any;
    }
    
    if (input.guardrails) {
      mockSettings.guardrails = { ...mockSettings.guardrails, ...input.guardrails } as any;
    }
    
    if (input.notifications) {
      mockSettings.notifications = { ...mockSettings.notifications, ...input.notifications } as any;
    }
    
    if (input.branding) {
      mockSettings.branding = { ...mockSettings.branding, ...input.branding } as any;
    }
    
    return {
      success: true,
      message: "Settings updated successfully",
      settings: mockSettings
    };
  });

export const settingsConnectProcedure = publicProcedure
  .input(settingsConnectInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Settings] Initiating connection for ${input.platform}`);
    
    if (input.platform === "telegram") {
      return {
        requiresBotToken: true,
        message: "Telegram requires a bot token instead of OAuth.",
        instructions: "1. Create a bot via @BotFather on Telegram\n2. Get your bot token\n3. Add the token in the field below\n4. Add your bot to your channel as an admin",
        authUrl: null
      };
    }
    
    // For other platforms, return OAuth URL
    const authUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/${input.platform}/start`;
    
    return {
      requiresBotToken: false,
      authUrl,
      message: `Redirecting to ${input.platform} for authorization`,
      instructions: null
    };
  });

export const settingsDisconnectProcedure = publicProcedure
  .input(settingsDisconnectInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Settings] Disconnecting ${input.platform}`);
    
    // Find and update the account status
    const accountIndex = mockSettings.accounts.findIndex(acc => acc.platform === input.platform);
    if (accountIndex !== -1) {
      mockSettings.accounts[accountIndex].status = "expired";
      mockSettings.accounts[accountIndex].lastRefresh = new Date().toISOString();
    }
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[Settings] DRY_RUN mode - simulating disconnection for ${input.platform}`);
    }
    
    return {
      success: true,
      message: `Successfully disconnected ${input.platform} account${isDryRun ? ' (DRY_RUN mode)' : ''}`,
      platform: input.platform
    };
  });

export const settingsTestNotificationProcedure = publicProcedure
  .input(settingsTestNotificationInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Settings] Sending test notification via ${input.channel}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[Settings] DRY_RUN mode - simulating ${input.channel} notification`);
      
      const messages = {
        email: "Test email sent successfully! Check your inbox for the Flâneur notification.",
        telegram: "Test message sent to your Telegram channel! Check your channel for the notification."
      };
      
      return {
        success: true,
        message: messages[input.channel] + " (DRY_RUN mode)",
        channel: input.channel
      };
    }
    
    // In LIVE mode, this would send actual notifications
    throw new Error("LIVE notifications not implemented - set DRY_RUN=true for demo mode");
  });

export const settingsGetHealthProcedure = publicProcedure
  .query(async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      dryRun: process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1"
    };
  });

export const settingsGetVersionProcedure = publicProcedure
  .query(async () => {
    return {
      version: "1.0.0",
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      features: {
        oauth: true,
        publishing: true,
        analytics: true,
        notifications: true
      }
    };
  });