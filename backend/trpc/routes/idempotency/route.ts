import { z } from "zod";
import { publicProcedure } from "../../create-context";

// In-memory store for idempotency keys (in production, use Redis or DB)
const idempotencyStore = new Map<string, {
  result: any;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}>();

// Generate idempotency key for publish operations
export const generateIdempotencyKeyProcedure = publicProcedure
  .input(z.object({
    contentId: z.string(),
    platform: z.string(),
    scheduledAt: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const key = `publish_${input.contentId}_${input.platform}_${input.scheduledAt || 'now'}`;
    const hash = Buffer.from(key).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    
    console.log(`[Idempotency] Generated key: ${hash} for ${input.contentId}`);
    
    return {
      idempotencyKey: hash,
      contentId: input.contentId,
      platform: input.platform,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiry
    };
  });

// Check if operation was already performed
export const checkIdempotencyProcedure = publicProcedure
  .input(z.object({
    idempotencyKey: z.string()
  }))
  .query(async ({ input }) => {
    const stored = idempotencyStore.get(input.idempotencyKey);
    
    if (!stored) {
      return {
        exists: false,
        status: null,
        result: null
      };
    }
    
    // Check if expired (24h TTL)
    if (Date.now() - stored.timestamp > 24 * 60 * 60 * 1000) {
      idempotencyStore.delete(input.idempotencyKey);
      return {
        exists: false,
        status: null,
        result: null
      };
    }
    
    return {
      exists: true,
      status: stored.status,
      result: stored.result,
      timestamp: new Date(stored.timestamp).toISOString()
    };
  });

// Store operation result with idempotency key
export const storeIdempotentResultProcedure = publicProcedure
  .input(z.object({
    idempotencyKey: z.string(),
    status: z.enum(['pending', 'completed', 'failed']),
    result: z.any()
  }))
  .mutation(async ({ input }) => {
    idempotencyStore.set(input.idempotencyKey, {
      result: input.result,
      timestamp: Date.now(),
      status: input.status
    });
    
    console.log(`[Idempotency] Stored result for key: ${input.idempotencyKey}, status: ${input.status}`);
    
    return {
      success: true,
      message: "Result stored successfully",
      key: input.idempotencyKey
    };
  });

// Enhanced publish with idempotency and retry logic
export const publishWithIdempotencyProcedure = publicProcedure
  .input(z.object({
    contentId: z.string(),
    platform: z.string(),
    scheduledAt: z.string().optional(),
    idempotencyKey: z.string().optional(),
    retryAttempt: z.number().default(0)
  }))
  .mutation(async ({ input }) => {
    // Generate idempotency key if not provided
    let idempotencyKey = input.idempotencyKey;
    if (!idempotencyKey) {
      const key = `publish_${input.contentId}_${input.platform}_${input.scheduledAt || 'now'}`;
      idempotencyKey = Buffer.from(key).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }
    
    // Check if already processed
    const stored = idempotencyStore.get(idempotencyKey);
    const existing = stored ? {
      exists: true,
      status: stored.status,
      result: stored.result,
      timestamp: new Date(stored.timestamp).toISOString()
    } : { exists: false, status: null, result: null };
    if (existing.exists) {
      if (existing.status === 'completed') {
        console.log(`[Publish] Idempotent response for ${input.contentId}: already completed`);
        return existing.result;
      } else if (existing.status === 'pending') {
        console.log(`[Publish] Operation already in progress for ${input.contentId}`);
        return {
          success: false,
          message: "Operation already in progress",
          idempotencyKey,
          status: 'pending'
        };
      }
    }
    
    // Mark as pending
    idempotencyStore.set(idempotencyKey, {
      result: null,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    try {
      console.log(`[Publish] Starting publish for ${input.contentId} on ${input.platform} (attempt ${input.retryAttempt + 1})`);
      
      // Simulate publish operation with potential failures
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate different failure scenarios
      const random = Math.random();
      if (random < 0.1 && input.retryAttempt < 3) {
        // Network error - retryable
        throw new Error("NetworkError: Connection timeout");
      } else if (random < 0.05) {
        // Rate limit - retryable with backoff
        throw new Error("RateLimitError: Rate limit exceeded, retry after 300s");
      } else if (random < 0.02) {
        // Unknown status - could be duplicate
        throw new Error("UnknownError: Request status unknown");
      }
      
      // Success
      const result = {
        success: true,
        message: `Content published successfully on ${input.platform}`,
        contentId: input.contentId,
        platform: input.platform,
        publishedAt: new Date().toISOString(),
        idempotencyKey,
        attempt: input.retryAttempt + 1
      };
      
      // Store successful result
      idempotencyStore.set(idempotencyKey, {
        result,
        timestamp: Date.now(),
        status: 'completed'
      });
      
      console.log(`[Publish] Success for ${input.contentId} on attempt ${input.retryAttempt + 1}`);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Publish] Failed for ${input.contentId}:`, errorMessage);
      
      // Determine if error is retryable
      const isRetryable = errorMessage.includes("NetworkError") || 
                         errorMessage.includes("RateLimitError") ||
                         errorMessage.includes("UnknownError");
      
      const failureResult = {
        success: false,
        message: errorMessage,
        contentId: input.contentId,
        platform: input.platform,
        idempotencyKey,
        attempt: input.retryAttempt + 1,
        retryable: isRetryable && input.retryAttempt < 3
      };
      
      if (!isRetryable || input.retryAttempt >= 3) {
        // Store permanent failure
        idempotencyStore.set(idempotencyKey, {
          result: failureResult,
          timestamp: Date.now(),
          status: 'failed'
        });
      } else {
        // Clear pending status for retry
        idempotencyStore.delete(idempotencyKey);
        
        // Calculate exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, input.retryAttempt), 30000);
        console.log(`[Publish] Will retry ${input.contentId} in ${backoffMs}ms`);
      }
      
      return failureResult;
    }
  });

// Get idempotency store stats (dev utility)
export const getIdempotencyStatsProcedure = publicProcedure
  .query(async () => {
    const stats = {
      totalKeys: idempotencyStore.size,
      byStatus: {
        pending: 0,
        completed: 0,
        failed: 0
      },
      oldestKey: null as string | null,
      newestKey: null as string | null
    };
    
    let oldestTime = Infinity;
    let newestTime = 0;
    
    for (const [key, value] of idempotencyStore.entries()) {
      stats.byStatus[value.status]++;
      
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        stats.oldestKey = key;
      }
      
      if (value.timestamp > newestTime) {
        newestTime = value.timestamp;
        stats.newestKey = key;
      }
    }
    
    return stats;
  });