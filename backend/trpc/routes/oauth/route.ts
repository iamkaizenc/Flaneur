import { z } from "zod";
import { publicProcedure } from "../../create-context";
// Error classes
class AuthError extends Error {
  constructor(message: string, public platform?: string) {
    super(message);
    this.name = "AuthError";
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const oauthStartInputSchema = z.object({
  platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"])
});

const oauthCallbackInputSchema = z.object({
  platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"]),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional()
});

// Mock OAuth URLs for DRY_RUN mode
const getOAuthUrl = (platform: string): string => {
  const baseUrls: Record<string, string> = {
    x: "https://twitter.com/i/oauth2/authorize",
    instagram: "https://api.instagram.com/oauth/authorize",
    linkedin: "https://www.linkedin.com/oauth/v2/authorization",
    tiktok: "https://www.tiktok.com/auth/authorize",
    facebook: "https://www.facebook.com/v18.0/dialog/oauth",
    telegram: "" // Telegram uses bot token, not OAuth
  };
  
  const clientIds: Record<string, string> = {
    x: process.env.X_CLIENT_ID || "demo_client_id",
    instagram: process.env.INSTAGRAM_CLIENT_ID || "demo_client_id",
    linkedin: process.env.LINKEDIN_CLIENT_ID || "demo_client_id",
    tiktok: process.env.TIKTOK_CLIENT_ID || "demo_client_id",
    facebook: process.env.FACEBOOK_CLIENT_ID || "demo_client_id",
    telegram: ""
  };
  
  const redirectUri = `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/${platform}/callback`;
  const state = Math.random().toString(36).substring(2, 15);
  
  if (platform === "telegram") {
    return "";
  }
  
  const scopes: Record<string, string> = {
    x: "tweet.read,tweet.write,users.read",
    instagram: "user_profile,user_media",
    linkedin: "r_liteprofile,w_member_social",
    tiktok: "user.info.basic,video.publish",
    facebook: "pages_manage_posts,pages_read_engagement"
  };
  
  return `${baseUrls[platform]}?client_id=${clientIds[platform]}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}`;
};

export const oauthStartProcedure = publicProcedure
  .input(oauthStartInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Starting OAuth flow for ${input.platform}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (input.platform === "telegram") {
      return {
        requiresBotToken: true,
        message: "Telegram requires a bot token instead of OAuth.",
        instructions: "1. Create a bot via @BotFather\n2. Get your bot token\n3. Add the token in Settings > Connections",
        authUrl: null
      };
    }
    
    const authUrl = getOAuthUrl(input.platform);
    
    if (isDryRun) {
      console.log(`[OAuth] DRY_RUN mode - would redirect to: ${authUrl}`);
    }
    
    return {
      requiresBotToken: false,
      authUrl,
      message: `Redirecting to ${input.platform} for authorization`,
      state: Math.random().toString(36).substring(2, 15)
    };
  });

export const oauthCallbackProcedure = publicProcedure
  .input(oauthCallbackInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Processing callback for ${input.platform}:`, input);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (input.error) {
      throw new AuthError(`OAuth error: ${input.error}`, input.platform);
    }
    
    if (!input.code && input.platform !== "telegram") {
      throw new ValidationError("Authorization code is required", "code");
    }
    
    if (isDryRun) {
      // Simulate successful OAuth in DRY_RUN mode
      console.log(`[OAuth] DRY_RUN mode - simulating successful connection for ${input.platform}`);
      
      const mockAccount = {
        platform: input.platform,
        handle: `@demo_${input.platform}_user`,
        displayName: `Demo ${input.platform.charAt(0).toUpperCase() + input.platform.slice(1)} User`,
        accessToken: "encrypted_mock_token",
        refreshToken: "encrypted_mock_refresh_token",
        scopes: ["read", "write"],
        status: "connected" as const,
        lastRefresh: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      
      return {
        success: true,
        message: `Successfully connected ${input.platform} account (DRY_RUN mode)`,
        account: mockAccount
      };
    }
    
    // In LIVE mode, this would:
    // 1. Exchange code for access token
    // 2. Fetch user profile
    // 3. Encrypt and store tokens
    // 4. Update social_accounts table
    
    throw new Error("LIVE OAuth not implemented - set DRY_RUN=true for demo mode");
  });

export const oauthRefreshProcedure = publicProcedure
  .input(z.object({ platform: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Refreshing tokens for ${input.platform}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[OAuth] DRY_RUN mode - simulating token refresh for ${input.platform}`);
      return {
        success: true,
        message: `Tokens refreshed for ${input.platform} (DRY_RUN mode)`,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
    }
    
    // In LIVE mode, this would refresh the actual tokens
    throw new Error("LIVE token refresh not implemented - set DRY_RUN=true for demo mode");
  });

export const oauthRevokeProcedure = publicProcedure
  .input(z.object({ platform: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Revoking tokens for ${input.platform}`);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log(`[OAuth] DRY_RUN mode - simulating token revocation for ${input.platform}`);
      return {
        success: true,
        message: `Tokens revoked for ${input.platform} (DRY_RUN mode)`
      };
    }
    
    // In LIVE mode, this would revoke the actual tokens
    throw new Error("LIVE token revocation not implemented - set DRY_RUN=true for demo mode");
  });