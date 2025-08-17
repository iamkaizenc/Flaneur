import { z } from "zod";
import { publicProcedure } from "../../create-context";
import crypto from "crypto";

// Encryption utilities
function encrypt(text: string): { encrypted: string; iv: string } {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 characters long');
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted + ':' + authTag.toString('hex'),
    iv: iv.toString('hex')
  };
}

function decrypt(encryptedData: string, iv: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 characters long');
  }
  
  const [encrypted, authTag] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Error classes
class AuthError extends Error {
  constructor(message: string, public platform: string) {
    super(message);
    this.name = 'AuthError';
  }
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Mock database operations (replace with real DB)
const mockSocialAccounts = new Map();

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  displayName: string;
  encryptedTokens: string;
  tokenIv: string;
  scopes: string[];
  lastRefresh: Date;
  status: 'connected' | 'expired' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

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
      throw new AuthError(`OAuth error: ${error}`, platform);
    }
    
    if (!code) {
      throw new AuthError('Authorization code is required', platform);
    }
    
    const isDryRun = process.env.DRY_RUN === 'true';
    
    try {
      let tokenData;
      let userProfile;
      
      if (isDryRun) {
        console.log(`[OAuth] DRY_RUN: Simulating token exchange for ${platform}`);
        tokenData = {
          access_token: `mock_access_token_${platform}_${Date.now()}`,
          refresh_token: `mock_refresh_token_${platform}_${Date.now()}`,
          expires_in: 3600,
          scope: getDefaultScopes(platform).join(' ')
        };
        userProfile = {
          id: `mock_${platform}_${Date.now()}`,
          username: `mock_${platform}_user`,
          name: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`
        };
      } else {
        // Real token exchange
        tokenData = await exchangeCodeForToken(platform, code);
        userProfile = await fetchUserProfile(platform, tokenData.access_token);
      }
      
      // Encrypt tokens
      const tokensToStore = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };
      
      const { encrypted, iv } = encrypt(JSON.stringify(tokensToStore));
      
      // Create or update social account
      const accountId = `${platform}_${userProfile.id}`;
      const account: SocialAccount = {
        id: accountId,
        platform,
        handle: userProfile.username || userProfile.id,
        displayName: userProfile.name || userProfile.username,
        encryptedTokens: encrypted,
        tokenIv: iv,
        scopes: tokenData.scope?.split(' ') || getDefaultScopes(platform),
        lastRefresh: new Date(),
        status: 'connected',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in mock database
      mockSocialAccounts.set(accountId, account);
      
      console.log(`[OAuth] Successfully connected ${platform} account: ${account.handle}`);
      
      return {
        success: true,
        platform,
        account: {
          id: account.id,
          handle: account.handle,
          displayName: account.displayName,
          status: account.status,
          scopes: account.scopes,
          connectedAt: account.createdAt.toISOString()
        }
      };
    } catch (err) {
      console.error(`[OAuth] Token exchange failed for ${platform}:`, err);
      if (err instanceof AuthError || err instanceof RateLimitError || err instanceof NetworkError) {
        throw err;
      }
      throw new AuthError(`Failed to exchange authorization code for access token`, platform);
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
    throw new AuthError(`Token exchange not implemented for platform: ${platform}`, platform);
  }
  
  const clientCredentials = getClientCredentials(platform);
  if (!clientCredentials.clientId || !clientCredentials.clientSecret) {
    throw new AuthError(`Missing client credentials for ${platform}`, platform);
  }
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientCredentials.clientId,
    client_secret: clientCredentials.clientSecret,
    redirect_uri: `http://localhost:3000/oauth/${platform}/callback`
  });
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        throw new RateLimitError(`Rate limit exceeded for ${platform}`, retryAfter);
      }
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }
    
    const tokenData = await response.json();
    
    if (tokenData.error) {
      throw new AuthError(`Token exchange error: ${tokenData.error_description || tokenData.error}`, platform);
    }
    
    return tokenData;
  } catch (err) {
    if (err instanceof AuthError || err instanceof RateLimitError || err instanceof NetworkError) {
      throw err;
    }
    throw new NetworkError(`Network error during token exchange: ${(err as Error).message}`);
  }
}

async function fetchUserProfile(platform: string, accessToken: string) {
  const profileEndpoints: Record<string, string> = {
    x: 'https://api.twitter.com/2/users/me',
    instagram: 'https://graph.instagram.com/me?fields=id,username',
    linkedin: 'https://api.linkedin.com/v2/people/~',
    tiktok: 'https://open-api.tiktok.com/oauth/userinfo/',
    facebook: 'https://graph.facebook.com/me?fields=id,name'
  };
  
  const endpoint = profileEndpoints[platform];
  if (!endpoint) {
    throw new AuthError(`Profile fetch not implemented for platform: ${platform}`, platform);
  }
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        throw new RateLimitError(`Rate limit exceeded for ${platform}`, retryAfter);
      }
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }
    
    return await response.json();
  } catch (err) {
    if (err instanceof AuthError || err instanceof RateLimitError || err instanceof NetworkError) {
      throw err;
    }
    throw new NetworkError(`Network error during profile fetch: ${(err as Error).message}`);
  }
}

function getClientCredentials(platform: string) {
  const credentials: Record<string, { clientId: string; clientSecret: string }> = {
    x: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || ''
    },
    instagram: {
      clientId: process.env.INSTAGRAM_APP_ID || '',
      clientSecret: process.env.INSTAGRAM_APP_SECRET || ''
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || ''
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || ''
    }
  };
  
  return credentials[platform] || { clientId: '', clientSecret: '' };
}

function getDefaultScopes(platform: string): string[] {
  const scopes: Record<string, string[]> = {
    x: ['tweet.read', 'tweet.write', 'users.read'],
    instagram: ['user_profile', 'user_media'],
    linkedin: ['w_member_social'],
    tiktok: ['user.info.basic', 'video.list'],
    facebook: ['pages_manage_posts', 'pages_read_engagement'],
    telegram: ['bot']
  };
  
  return scopes[platform] || [];
}

// Auto-refresh tokens
export async function refreshTokenIfNeeded(accountId: string): Promise<boolean> {
  const account = mockSocialAccounts.get(accountId);
  if (!account) {
    throw new AuthError('Account not found', 'unknown');
  }
  
  try {
    const tokens = JSON.parse(decrypt(account.encryptedTokens, account.tokenIv));
    const now = Date.now();
    const expiresAt = tokens.expires_at;
    
    // Refresh if expires within 5 minutes
    if (expiresAt - now < 5 * 60 * 1000) {
      console.log(`[OAuth] Refreshing token for ${account.platform} account: ${account.handle}`);
      
      const isDryRun = process.env.DRY_RUN === 'true';
      
      if (isDryRun) {
        console.log(`[OAuth] DRY_RUN: Simulating token refresh for ${account.platform}`);
        const newTokens = {
          ...tokens,
          access_token: `refreshed_${tokens.access_token}`,
          expires_at: now + (3600 * 1000)
        };
        
        const { encrypted, iv } = encrypt(JSON.stringify(newTokens));
        account.encryptedTokens = encrypted;
        account.tokenIv = iv;
        account.lastRefresh = new Date();
        account.status = 'connected';
        
        mockSocialAccounts.set(accountId, account);
        return true;
      } else {
        // Real token refresh logic would go here
        console.log(`[OAuth] Would refresh token for ${account.platform}`);
        return false;
      }
    }
    
    return false;
  } catch (err) {
    console.error(`[OAuth] Token refresh failed for ${account.platform}:`, err);
    account.status = 'error';
    mockSocialAccounts.set(accountId, account);
    throw new AuthError('Token refresh failed', account.platform);
  }
}

// Get connected accounts
export const getConnectedAccountsProcedure = publicProcedure
  .query(async () => {
    const accounts = Array.from(mockSocialAccounts.values()).map(account => ({
      id: account.id,
      platform: account.platform,
      handle: account.handle,
      displayName: account.displayName,
      status: account.status,
      scopes: account.scopes,
      lastRefresh: account.lastRefresh.toISOString(),
      connectedAt: account.createdAt.toISOString()
    }));
    
    return { accounts };
  });

// Disconnect account
export const disconnectAccountProcedure = publicProcedure
  .input(z.object({ accountId: z.string() }))
  .mutation(async ({ input }) => {
    const { accountId } = input;
    
    const account = mockSocialAccounts.get(accountId);
    if (!account) {
      throw new AuthError('Account not found', 'unknown');
    }
    
    // In a real app, you would revoke the token with the platform
    console.log(`[OAuth] Disconnecting ${account.platform} account: ${account.handle}`);
    
    account.status = 'expired';
    account.updatedAt = new Date();
    mockSocialAccounts.set(accountId, account);
    
    return {
      success: true,
      message: `Disconnected ${account.platform} account`
    };
  });