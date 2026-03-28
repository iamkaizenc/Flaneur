import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Media generation types
interface MediaGenerationRequest {
  prompt: string;
  platform: "x" | "instagram" | "telegram" | "linkedin";
  size?: string;
}

interface MediaGenerationResponse {
  success: boolean;
  mediaUrl?: string;
  error?: string;
  cached?: boolean;
}

// Platform-specific media prompts
const PLATFORM_MEDIA_TEMPLATES = {
  x: {
    style: "meme or quote visual",
    format: "1024x1024",
    context: "Twitter/X social media post"
  },
  instagram: {
    style: "lifestyle/product visual",
    format: "1024x1024", 
    context: "Instagram feed post"
  },
  telegram: {
    style: "banner or announcement poster",
    format: "1024x1792",
    context: "Telegram channel announcement"
  },
  linkedin: {
    style: "corporate graphic or slide",
    format: "1024x1024",
    context: "LinkedIn professional post"
  }
};

// Simple in-memory cache for generated media
const mediaCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate cache key
function generateCacheKey(prompt: string, platform: string): string {
  const hash = Buffer.from(`${prompt}:${platform}`).toString('base64').slice(0, 16);
  return `media_${platform}_${hash}`;
}

// Clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of mediaCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      mediaCache.delete(key);
    }
  }
}

// Generate media using external API
async function generateMedia(
  prompt: string,
  platform: "x" | "instagram" | "telegram" | "linkedin"
): Promise<MediaGenerationResponse> {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(prompt, platform);
    const cached = mediaCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`[Media] Cache hit for ${platform}: ${prompt.slice(0, 50)}...`);
      return {
        success: true,
        mediaUrl: cached.url,
        cached: true
      };
    }

    // Get platform-specific template
    const template = PLATFORM_MEDIA_TEMPLATES[platform];
    
    // Enhanced prompt with platform context
    const enhancedPrompt = `Create a ${template.style} for ${template.context}. ${prompt}. Style: modern, clean, high-quality. Avoid text overlays unless specifically requested.`;

    console.log(`[Media] Generating for ${platform}: ${enhancedPrompt}`);

    // Call image generation API
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        size: template.format
      })
    });

    if (!response.ok) {
      throw new Error(`Image API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.image?.base64Data) {
      throw new Error('No image data received');
    }

    // Convert base64 to data URL (simulating CDN upload)
    const mediaUrl = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
    
    // Cache the result
    mediaCache.set(cacheKey, {
      url: mediaUrl,
      timestamp: Date.now()
    });

    // Clean expired entries periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanExpiredCache();
    }

    return {
      success: true,
      mediaUrl,
      cached: false
    };

  } catch (error) {
    console.error('[Media] Generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Media generation failed'
    };
  }
}

// Media generation procedure
export const mediaGenerateProcedure = publicProcedure
  .input(z.object({
    prompt: z.string().min(1).max(500),
    platform: z.enum(["x", "instagram", "telegram", "linkedin"]),
    size: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('[Media] Generate request:', { 
      platform: input.platform, 
      prompt: input.prompt.slice(0, 100) + '...' 
    });
    
    const result = await generateMedia(input.prompt, input.platform);
    
    return {
      success: result.success,
      mediaUrl: result.mediaUrl,
      error: result.error,
      cached: result.cached,
      platform: input.platform,
      generatedAt: new Date().toISOString()
    };
  });

// Batch media generation for multiple prompts
export const mediaBatchGenerateProcedure = publicProcedure
  .input(z.object({
    requests: z.array(z.object({
      id: z.string(),
      prompt: z.string().min(1).max(500),
      platform: z.enum(["x", "instagram", "telegram", "linkedin"])
    })).min(1).max(10)
  }))
  .mutation(async ({ input }) => {
    console.log(`[Media] Batch generate: ${input.requests.length} requests`);
    
    const results = [];
    
    // Process requests sequentially to avoid rate limits
    for (const request of input.requests) {
      try {
        const result = await generateMedia(request.prompt, request.platform);
        results.push({
          id: request.id,
          success: result.success,
          mediaUrl: result.mediaUrl,
          error: result.error,
          cached: result.cached,
          platform: request.platform
        });
        
        // Small delay between requests
        if (input.requests.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({
          id: request.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          platform: request.platform
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      message: `${successCount}/${input.requests.length} media generated`,
      results,
      stats: {
        total: input.requests.length,
        success: successCount,
        failed: input.requests.length - successCount,
        cached: results.filter(r => r.cached).length
      }
    };
  });

// Get media cache stats
export const mediaGetCacheStatsProcedure = publicProcedure
  .query(() => {
    cleanExpiredCache();
    
    return {
      totalCached: mediaCache.size,
      cacheKeys: Array.from(mediaCache.keys()),
      oldestEntry: mediaCache.size > 0 ? Math.min(...Array.from(mediaCache.values()).map(v => v.timestamp)) : null,
      newestEntry: mediaCache.size > 0 ? Math.max(...Array.from(mediaCache.values()).map(v => v.timestamp)) : null
    };
  });

// Clear media cache
export const mediaClearCacheProcedure = publicProcedure
  .mutation(() => {
    const clearedCount = mediaCache.size;
    mediaCache.clear();
    
    return {
      success: true,
      message: `Cleared ${clearedCount} cached media items`,
      clearedCount
    };
  });