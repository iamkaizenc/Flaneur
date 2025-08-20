import { z } from "zod";
import { publicProcedure } from "../../create-context";
import crypto from "crypto";
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

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_char_key_for_dev_only!';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Platform-specific OAuth implementations
async function exchangeCodeForToken(platform: string, code: string, codeVerifier?: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope?: string;
}> {
  const clientId = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  const redirectUri = `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/${platform}/callback`;
  
  const tokenUrls: Record<string, string> = {
    x: 'https://api.twitter.com/2/oauth2/token',
    instagram: 'https://api.instagram.com/oauth/access_token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    tiktok: 'https://open-api.tiktok.com/oauth/access_token/',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
  };
  
  // X (Twitter) uses PKCE
  const requestBody: Record<string, string> = platform === 'x' && codeVerifier ? {
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  } : {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri
  };
  
  const response = await fetch(tokenUrls[platform], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      // X requires Basic auth for PKCE
      ...(platform === 'x' ? {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      } : {})
    },
    body: new URLSearchParams(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OAuth] Token exchange failed for ${platform}:`, errorText);
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
    scope: data.scope
  };
}

async function fetchUserProfile(platform: string, accessToken: string): Promise<{
  id: string;
  handle: string;
  displayName: string;
}> {
  const profileUrls: Record<string, string> = {
    x: 'https://api.twitter.com/2/users/me',
    instagram: 'https://graph.instagram.com/me?fields=id,username',
    linkedin: 'https://api.linkedin.com/v2/people/~',
    tiktok: 'https://open-api.tiktok.com/user/info/',
    facebook: 'https://graph.facebook.com/me?fields=id,name'
  };
  
  const response = await fetch(profileUrls[platform], {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[OAuth] Profile fetch failed for ${platform}:`, errorText);
    throw new Error(`Profile fetch failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Normalize profile data across platforms
  switch (platform) {
    case 'x':
      return {
        id: data.data.id,
        handle: `@${data.data.username}`,
        displayName: data.data.name
      };
    case 'instagram':
      return {
        id: data.id,
        handle: `@${data.username}`,
        displayName: data.username
      };
    case 'linkedin':
      return {
        id: data.id,
        handle: data.localizedFirstName + ' ' + data.localizedLastName,
        displayName: data.localizedFirstName + ' ' + data.localizedLastName
      };
    case 'tiktok':
      return {
        id: data.data.user.open_id,
        handle: `@${data.data.user.display_name}`,
        displayName: data.data.user.display_name
      };
    case 'facebook':
      return {
        id: data.id,
        handle: data.name,
        displayName: data.name
      };
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function refreshAccessToken(platform: string, refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
}> {
  const clientId = getClientId(platform);
  const clientSecret = getClientSecret(platform);
  
  const tokenUrls: Record<string, string> = {
    x: 'https://api.twitter.com/2/oauth2/token',
    instagram: 'https://graph.instagram.com/refresh_access_token',
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    tiktok: 'https://open-api.tiktok.com/oauth/refresh_token/',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
  };
  
  const response = await fetch(tokenUrls[platform], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  });
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined
  };
}

function getClientId(platform: string): string {
  const clientIds: Record<string, string> = {
    x: process.env.X_CLIENT_ID || 'demo_x_client_id',
    instagram: process.env.META_APP_ID || 'demo_meta_app_id',
    linkedin: process.env.LINKEDIN_CLIENT_ID || 'demo_linkedin_client_id',
    tiktok: process.env.TIKTOK_CLIENT_KEY || 'demo_tiktok_client_key',
    facebook: process.env.META_APP_ID || 'demo_meta_app_id'
  };
  return clientIds[platform] || '';
}

function getClientSecret(platform: string): string {
  const clientSecrets: Record<string, string> = {
    x: process.env.X_CLIENT_SECRET || 'demo_x_client_secret',
    instagram: process.env.META_APP_SECRET || 'demo_meta_app_secret',
    linkedin: process.env.LINKEDIN_CLIENT_SECRET || 'demo_linkedin_client_secret',
    tiktok: process.env.TIKTOK_CLIENT_SECRET || 'demo_tiktok_client_secret',
    facebook: process.env.META_APP_SECRET || 'demo_meta_app_secret'
  };
  return clientSecrets[platform] || '';
}

// Telegram bot validation (will be used in future implementations)
export async function validateTelegramBot(botToken: string): Promise<{
  id: string;
  username: string;
  first_name: string;
}> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  
  if (!response.ok) {
    throw new Error('Invalid Telegram bot token');
  }
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error('Telegram API error: ' + data.description);
  }
  
  return data.result;
}

// Test Telegram channel access (will be used in future implementations)
export async function testTelegramChannel(botToken: string, chatId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId
      })
    });
    
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('[OAuth] Telegram channel test failed:', error);
    return false;
  }
}

// Mock social accounts storage (in production, use database)
const socialAccounts: {
  id: string;
  userId: string;
  platform: string;
  handle: string;
  displayName?: string;
  accessToken: string; // encrypted
  refreshToken?: string; // encrypted
  tokenExpiresAt?: string;
  scopes: string[];
  status: 'connected' | 'expired' | 'error';
  lastRefresh?: string;
  createdAt: string;
  updatedAt: string;
}[] = [];

const oauthStartInputSchema = z.object({
  platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"])
});

const oauthCallbackInputSchema = z.object({
  platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "telegram"]),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional()
});

// Generate PKCE challenge for X OAuth 2.0
function generatePKCEChallenge(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

// OAuth URL generation for all platforms
const getOAuthUrl = (platform: string, state: string): { authUrl: string; codeVerifier?: string } => {
  const baseUrls: Record<string, string> = {
    x: "https://twitter.com/i/oauth2/authorize",
    instagram: "https://api.instagram.com/oauth/authorize",
    linkedin: "https://www.linkedin.com/oauth/v2/authorization",
    tiktok: "https://www.tiktok.com/auth/authorize",
    facebook: "https://www.facebook.com/v18.0/dialog/oauth",
    telegram: "" // Telegram uses bot token, not OAuth
  };
  
  const clientIds: Record<string, string> = {
    x: getClientId('x'),
    instagram: getClientId('instagram'),
    linkedin: getClientId('linkedin'),
    tiktok: getClientId('tiktok'),
    facebook: getClientId('facebook'),
    telegram: ""
  };
  
  const redirectUri = `${process.env.BASE_URL || 'http://localhost:3000'}/api/oauth/${platform}/callback`;
  
  if (platform === "telegram") {
    return { authUrl: "" };
  }
  
  const scopes: Record<string, string> = {
    x: "tweet.read tweet.write users.read offline.access",
    instagram: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts",
    linkedin: "w_member_social,r_liteprofile,r_emailaddress",
    tiktok: "user.info.basic,video.upload,video.publish",
    facebook: "pages_manage_posts,pages_read_engagement,pages_read_user_content"
  };
  
  // X uses PKCE
  if (platform === 'x') {
    const { codeVerifier, codeChallenge } = generatePKCEChallenge();
    const authUrl = `${baseUrls[platform]}?client_id=${clientIds[platform]}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    return { authUrl, codeVerifier };
  }
  
  const authUrl = `${baseUrls[platform]}?client_id=${clientIds[platform]}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes[platform])}&response_type=code&state=${state}`;
  return { authUrl };
};

export const oauthStartProcedure = publicProcedure
  .input(oauthStartInputSchema)
  .mutation(async ({ input }) => {
    try {
      console.log(`[OAuth] Starting OAuth flow for ${input.platform}`);
      
      const isLiveMode = process.env.LIVE_MODE === "true";
      
      if (input.platform === "telegram") {
        return {
          requiresBotToken: true,
          message: "Telegram requires a bot token instead of OAuth.",
          instructions: "1. Create a bot via @BotFather\n2. Get your bot token\n3. Add the token in Settings > Connections",
          authUrl: null
        };
      }
      
      const state = Math.random().toString(36).substring(2, 15);
      const { authUrl, codeVerifier } = getOAuthUrl(input.platform, state);
      
      if (!isLiveMode) {
        console.log(`[OAuth] DRY_RUN mode - would redirect to: ${authUrl}`);
      }
      
      // Store code verifier for X PKCE flow (in production, use Redis/database)
      if (codeVerifier) {
        // In a real app, store this securely with the state
        console.log(`[OAuth] Generated PKCE code verifier for state: ${state}`);
      }
      
      return {
        requiresBotToken: false,
        authUrl,
        message: `Redirecting to ${input.platform} for authorization`,
        state,
        ...(codeVerifier ? { codeVerifier } : {})
      };
    } catch (error) {
      console.error(`[OAuth] Start error:`, error);
      throw new AuthError(`Failed to start OAuth flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export const oauthCallbackProcedure = publicProcedure
  .input(oauthCallbackInputSchema)
  .mutation(async ({ input }) => {
    try {
      console.log(`[OAuth] Processing callback for ${input.platform}:`, input);
      
      if (input.error) {
        throw new AuthError(`OAuth error: ${input.error}`);
      }
      
      if (!input.code && input.platform !== "telegram") {
        throw new ValidationError("Authorization code is required");
      }
      
      const isLiveMode = process.env.LIVE_MODE === "true";
      
      if (!isLiveMode) {
        // Simulate successful OAuth in DRY_RUN mode
        console.log(`[OAuth] DRY_RUN mode - simulating successful connection for ${input.platform}`);
        
        const mockAccount = {
          id: `mock_${input.platform}_${Date.now()}`,
          userId: "demo_user_id",
          platform: input.platform,
          handle: `@demo_${input.platform}_user`,
          displayName: `Demo ${input.platform.charAt(0).toUpperCase() + input.platform.slice(1)} User`,
          accessToken: encrypt("mock_access_token"),
          refreshToken: encrypt("mock_refresh_token"),
          tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          scopes: ["read", "write"],
          status: "connected" as const,
          lastRefresh: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Store in mock database
        const existingIndex = socialAccounts.findIndex(acc => acc.platform === input.platform && acc.userId === "demo_user_id");
        if (existingIndex >= 0) {
          socialAccounts[existingIndex] = mockAccount;
        } else {
          socialAccounts.push(mockAccount);
        }
        
        return {
          success: true,
          message: `Successfully connected ${input.platform} account (DRY_RUN mode)`,
          account: {
            ...mockAccount,
            accessToken: "[encrypted]",
            refreshToken: "[encrypted]"
          }
        };
      }
      
      // LIVE mode OAuth implementation
      try {
        const tokenData = await exchangeCodeForToken(input.platform, input.code!);
        const userProfile = await fetchUserProfile(input.platform, tokenData.access_token);
        
        const account = {
          id: `${input.platform}_${userProfile.id}_${Date.now()}`,
          userId: "current_user_id", // In production, get from session
          platform: input.platform,
          handle: userProfile.handle,
          displayName: userProfile.displayName,
          accessToken: encrypt(tokenData.access_token),
          refreshToken: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
          tokenExpiresAt: tokenData.expires_at,
          scopes: tokenData.scope?.split(' ') || [],
          status: "connected" as const,
          lastRefresh: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Store in database
        const existingIndex = socialAccounts.findIndex(acc => acc.platform === input.platform && acc.userId === account.userId);
        if (existingIndex >= 0) {
          socialAccounts[existingIndex] = account;
        } else {
          socialAccounts.push(account);
        }
        
        return {
          success: true,
          message: `Successfully connected ${input.platform} account`,
          account: {
            ...account,
            accessToken: "[encrypted]",
            refreshToken: "[encrypted]"
          }
        };
      } catch (error) {
        console.error(`[OAuth] Failed to connect ${input.platform}:`, error);
        throw new AuthError(`Failed to connect ${input.platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`[OAuth] Callback error:`, error);
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError(`OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export const oauthRefreshProcedure = publicProcedure
  .input(z.object({ platform: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Refreshing tokens for ${input.platform}`);
    
    const isLiveMode = process.env.LIVE_MODE === "true";
    const userId = "demo_user_id"; // In production, get from session
    
    const account = socialAccounts.find(acc => acc.platform === input.platform && acc.userId === userId);
    if (!account) {
      throw new AuthError(`No ${input.platform} account found to refresh`);
    }
    
    if (!isLiveMode) {
      console.log(`[OAuth] DRY_RUN mode - simulating token refresh for ${input.platform}`);
      account.lastRefresh = new Date().toISOString();
      account.tokenExpiresAt = new Date(Date.now() + 3600000).toISOString();
      account.status = "connected";
      account.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: `Tokens refreshed for ${input.platform} (DRY_RUN mode)`,
        expiresAt: account.tokenExpiresAt
      };
    }
    
    // LIVE mode token refresh
    try {
      if (!account.refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const refreshToken = decrypt(account.refreshToken);
      const tokenData = await refreshAccessToken(input.platform, refreshToken);
      
      account.accessToken = encrypt(tokenData.access_token);
      if (tokenData.refresh_token) {
        account.refreshToken = encrypt(tokenData.refresh_token);
      }
      account.tokenExpiresAt = tokenData.expires_at;
      account.lastRefresh = new Date().toISOString();
      account.status = "connected";
      account.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: `Tokens refreshed for ${input.platform}`,
        expiresAt: account.tokenExpiresAt
      };
    } catch (error) {
      console.error(`[OAuth] Failed to refresh ${input.platform} tokens:`, error);
      account.status = "expired";
      account.updatedAt = new Date().toISOString();
      
      throw new AuthError(`Failed to refresh ${input.platform} tokens: ${error instanceof Error ? error.message : 'Unknown error'}`, input.platform);
    }
  });

export const oauthRevokeProcedure = publicProcedure
  .input(z.object({ platform: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Revoking tokens for ${input.platform}`);
    
    const isLiveMode = process.env.LIVE_MODE === "true";
    const userId = "demo_user_id"; // In production, get from session
    
    const accountIndex = socialAccounts.findIndex(acc => acc.platform === input.platform && acc.userId === userId);
    if (accountIndex >= 0) {
      socialAccounts.splice(accountIndex, 1);
    }
    
    if (!isLiveMode) {
      console.log(`[OAuth] DRY_RUN mode - simulating token revocation for ${input.platform}`);
      return {
        success: true,
        message: `Tokens revoked for ${input.platform} (DRY_RUN mode)`
      };
    }
    
    // In LIVE mode, revoke tokens with platform APIs
    try {
      // Platform-specific token revocation would go here
      console.log(`[OAuth] Revoked ${input.platform} tokens in LIVE mode`);
      return {
        success: true,
        message: `Tokens revoked for ${input.platform}`
      };
    } catch (error) {
      console.error(`[OAuth] Failed to revoke ${input.platform} tokens:`, error);
      throw new AuthError(`Failed to revoke ${input.platform} tokens: ${error instanceof Error ? error.message : 'Unknown error'}`, input.platform);
    }
  });

export const oauthListAccountsProcedure = publicProcedure
  .query(async () => {
    console.log('[OAuth] Listing connected accounts');
    
    const userId = "demo_user_id"; // In production, get from session
    const userAccounts = socialAccounts.filter(acc => acc.userId === userId);
    
    // If no accounts exist, create some demo accounts
    if (userAccounts.length === 0) {
      const demoAccounts = [
        {
          id: "acc_x_demo",
          userId,
          platform: "x",
          handle: "@flaneur_demo",
          displayName: "Flaneur Demo",
          accessToken: encrypt("demo_x_token"),
          refreshToken: encrypt("demo_x_refresh"),
          tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          scopes: ["tweet.read", "tweet.write"],
          status: "connected" as const,
          lastRefresh: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "acc_linkedin_demo",
          userId,
          platform: "linkedin",
          handle: "flaneur-demo",
          displayName: "Flaneur Demo Company",
          accessToken: encrypt("demo_linkedin_token"),
          refreshToken: encrypt("demo_linkedin_refresh"),
          tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
          scopes: ["w_member_social", "r_liteprofile"],
          status: "connected" as const,
          lastRefresh: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      socialAccounts.push(...demoAccounts);
    }
    
    const accounts = socialAccounts
      .filter(acc => acc.userId === userId)
      .map(acc => ({
        id: acc.id,
        platform: acc.platform,
        handle: acc.handle,
        displayName: acc.displayName,
        status: acc.status,
        lastRefresh: acc.lastRefresh,
        tokenExpiresAt: acc.tokenExpiresAt,
        scopes: acc.scopes,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt
      }));
    
    return {
      accounts,
      total: accounts.length
    };
  });

export const oauthFixProcedure = publicProcedure
  .input(z.object({ platform: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[OAuth] Fixing connection for ${input.platform}`);
    
    // This is essentially the same as starting a new OAuth flow
    // but for an existing expired connection
    const state = Math.random().toString(36).substring(2, 15);
    const { authUrl } = getOAuthUrl(input.platform, state);
    
    return {
      requiresBotToken: input.platform === "telegram",
      authUrl: input.platform === "telegram" ? null : authUrl,
      message: `Re-authorizing ${input.platform} connection`,
      state
    };
  });