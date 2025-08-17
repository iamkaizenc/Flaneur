import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Platform schema inline to avoid import issues
const PlatformSchema = z.enum([
  "x",
  "instagram", 
  "linkedin",
  "tiktok",
  "facebook",
  "telegram"
]);

// OAuth start endpoint
export const oauthStartProcedure = publicProcedure
  .input(z.object({ 
    platform: PlatformSchema,
    redirectUri: z.string().url().optional()
  }))
  .mutation(async ({ input }) => {
    const { platform, redirectUri } = input;
    
    console.log(`[OAuth] Starting OAuth flow for platform: ${platform}`);
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Platform-specific OAuth URLs
    const oauthUrls: Record<string, string> = {
      x: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/oauth/x/callback')}&scope=tweet.read%20tweet.write%20users.read&state=${state}`,
      instagram: `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/oauth/instagram/callback')}&scope=user_profile,user_media&response_type=code&state=${state}`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/oauth/linkedin/callback')}&scope=w_member_social&state=${state}`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/oauth/tiktok/callback')}&state=${state}`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri || 'http://localhost:3000/oauth/facebook/callback')}&scope=pages_manage_posts,pages_read_engagement&response_type=code&state=${state}`,
      telegram: '' // Telegram uses bot token, no OAuth needed
    };
    
    const authUrl = oauthUrls[platform];
    
    if (!authUrl && platform !== 'telegram') {
      throw new Error(`OAuth not supported for platform: ${platform}`);
    }
    
    if (platform === 'telegram') {
      return {
        success: true,
        message: 'Telegram uses bot token authentication. Please configure TELEGRAM_BOT_TOKEN in your environment.',
        requiresBotToken: true
      };
    }
    
    return {
      success: true,
      authUrl,
      state,
      platform
    };
  });

// OAuth callback endpoint
export const oauthCallbackProcedure = publicProcedure
  .input(z.object({
    platform: PlatformSchema,
    code: z.string(),
    state: z.string().optional(),
    error: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const { platform, code, error } = input;
    
    console.log(`[OAuth] Processing callback for platform: ${platform}`);
    
    if (error) {
      console.error(`[OAuth] Error from ${platform}:`, error);
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (!code) {
      throw new Error('Authorization code is required');
    }
    
    // Exchange code for access token
    try {
      const tokenData = await exchangeCodeForToken(platform, code);
      
      // In a real app, you would:
      // 1. Decrypt and store tokens securely
      // 2. Fetch user profile info
      // 3. Save to database
      // 4. Return success with account info
      
      console.log(`[OAuth] Successfully obtained tokens for ${platform}`);
      
      // Mock response for now
      return {
        success: true,
        platform,
        account: {
          id: `mock-${platform}-${Date.now()}`,
          handle: `@mock_${platform}_user`,
          displayName: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
          status: 'connected' as const,
          scopes: tokenData.scope?.split(' ') || [],
          connectedAt: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error(`[OAuth] Token exchange failed for ${platform}:`, err);
      throw new Error(`Failed to exchange authorization code for access token`);
    }
  });

async function exchangeCodeForToken(platform: string, code: string) {
  const tokenEndpoints: Record<string, string> = {
    x: 'https://api.twitter.com/2/oauth2/token',
    instagram: 'https://api.instagram.com/oauth/access_token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    tiktok: 'https://open-api.tiktok.com/oauth/access_token/',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
  };
  
  const endpoint = tokenEndpoints[platform];
  if (!endpoint) {
    throw new Error(`Token exchange not implemented for platform: ${platform}`);
  }
  
  // Platform-specific token exchange logic would go here
  // For now, return mock data
  console.log(`[OAuth] Would exchange code at ${endpoint}`);
  
  return {
    access_token: `mock_access_token_${platform}_${Date.now()}`,
    refresh_token: `mock_refresh_token_${platform}_${Date.now()}`,
    expires_in: 3600,
    scope: 'read write'
  };
}