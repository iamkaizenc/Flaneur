import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Mock trace logs for content items
const mockTraceLogs = new Map<string, Array<{
  id: string;
  contentId: string;
  timestamp: Date;
  status: 'queued' | 'publishing' | 'published' | 'held' | 'failed';
  message: string;
  details?: any;
  duration?: number;
  attempt?: number;
}>>();

// Initialize some mock trace logs
mockTraceLogs.set("1", [
  {
    id: "trace_1_1",
    contentId: "1",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: "queued",
    message: "Content queued for publishing",
    details: { platform: "linkedin", scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
  },
  {
    id: "trace_1_2", 
    contentId: "1",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "publishing",
    message: "Publishing to LinkedIn",
    details: { attempt: 1, idempotencyKey: "abc123def456" },
    attempt: 1
  },
  {
    id: "trace_1_3",
    contentId: "1", 
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    status: "published",
    message: "Successfully published to LinkedIn",
    details: { 
      platformPostId: "linkedin_post_123",
      metrics: { impressions: 850, likes: 32, shares: 8, comments: 5 }
    },
    duration: 2500,
    attempt: 1
  }
]);

mockTraceLogs.set("5", [
  {
    id: "trace_5_1",
    contentId: "5",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "queued",
    message: "Content queued for publishing",
    details: { platform: "linkedin", scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
  },
  {
    id: "trace_5_2",
    contentId: "5",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: "held",
    message: "Content held by guardrail",
    details: { 
      reason: "Content contains banned word: 'revolutionary'",
      riskLevel: "normal",
      guardrailTriggered: true,
      bannedWords: ["revolutionary"]
    }
  }
]);

mockTraceLogs.set("6", [
  {
    id: "trace_6_1",
    contentId: "6",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: "queued",
    message: "Content queued for publishing",
    details: { platform: "x", scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
  },
  {
    id: "trace_6_2",
    contentId: "6",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    status: "publishing",
    message: "Publishing to X (attempt 1)",
    details: { attempt: 1, idempotencyKey: "xyz789abc123" },
    attempt: 1
  },
  {
    id: "trace_6_3",
    contentId: "6",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: "failed",
    message: "Rate limit exceeded for X: 300/hour",
    details: { 
      error: "RateLimitError",
      retryAfter: 3600,
      attempt: 1
    },
    attempt: 1
  },
  {
    id: "trace_6_4",
    contentId: "6",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    status: "publishing",
    message: "Publishing to X (attempt 2)",
    details: { attempt: 2, idempotencyKey: "retry_xyz789" },
    attempt: 2
  },
  {
    id: "trace_6_5",
    contentId: "6",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    status: "failed",
    message: "Rate limit exceeded for X: 300/hour",
    details: { 
      error: "RateLimitError",
      retryAfter: 3600,
      attempt: 2
    },
    attempt: 2
  }
]);

// Get trace logs for a specific content item
export const getTraceLogsProcedure = publicProcedure
  .input(z.object({
    contentId: z.string()
  }))
  .query(async ({ input }) => {
    const logs = mockTraceLogs.get(input.contentId) || [];
    
    return {
      contentId: input.contentId,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
        // Redact sensitive information in DRY_RUN mode
        details: process.env.DRY_RUN === 'true' ? {
          ...log.details,
          accessToken: log.details?.accessToken ? '[REDACTED]' : undefined,
          refreshToken: log.details?.refreshToken ? '[REDACTED]' : undefined
        } : log.details
      })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      totalLogs: logs.length,
      lastUpdate: logs.length > 0 ? logs[logs.length - 1].timestamp.toISOString() : null
    };
  });

// Add a new trace log entry
export const addTraceLogProcedure = publicProcedure
  .input(z.object({
    contentId: z.string(),
    status: z.enum(['queued', 'publishing', 'published', 'held', 'failed']),
    message: z.string(),
    details: z.any().optional(),
    duration: z.number().optional(),
    attempt: z.number().optional()
  }))
  .mutation(async ({ input }) => {
    const logs = mockTraceLogs.get(input.contentId) || [];
    
    const newLog = {
      id: `trace_${input.contentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: input.contentId,
      timestamp: new Date(),
      status: input.status,
      message: input.message,
      details: input.details,
      duration: input.duration,
      attempt: input.attempt
    };
    
    logs.push(newLog);
    mockTraceLogs.set(input.contentId, logs);
    
    console.log(`[Trace] Added log for ${input.contentId}: ${input.status} - ${input.message}`);
    
    return {
      success: true,
      message: "Trace log added successfully",
      logId: newLog.id,
      contentId: input.contentId
    };
  });

// Get trace logs summary for multiple content items
export const getTraceLogsSummaryProcedure = publicProcedure
  .input(z.object({
    contentIds: z.array(z.string()),
    limit: z.number().min(1).max(100).default(10)
  }))
  .query(async ({ input }) => {
    const summaries = input.contentIds.map(contentId => {
      const logs = mockTraceLogs.get(contentId) || [];
      const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
      
      return {
        contentId,
        totalLogs: logs.length,
        latestStatus: latestLog?.status || 'unknown',
        latestMessage: latestLog?.message || 'No logs available',
        lastUpdate: latestLog?.timestamp.toISOString() || null,
        hasErrors: logs.some(log => log.status === 'failed'),
        attempts: Math.max(...logs.map(log => log.attempt || 0), 0)
      };
    });
    
    return {
      summaries,
      totalItems: summaries.length,
      itemsWithErrors: summaries.filter(s => s.hasErrors).length,
      itemsWithMultipleAttempts: summaries.filter(s => s.attempts > 1).length
    };
  });

// Get system-wide trace logs (admin/debug view)
export const getSystemTraceLogsProcedure = publicProcedure
  .input(z.object({
    status: z.enum(['queued', 'publishing', 'published', 'held', 'failed']).optional(),
    limit: z.number().min(1).max(100).default(50),
    since: z.string().datetime().optional()
  }))
  .query(async ({ input }) => {
    const allLogs: Array<{
      id: string;
      contentId: string;
      timestamp: string;
      status: string;
      message: string;
      details?: any;
      duration?: number;
      attempt?: number;
    }> = [];
    
    // Collect all logs from all content items
    for (const [contentId, logs] of mockTraceLogs.entries()) {
      for (const log of logs) {
        allLogs.push({
          ...log,
          timestamp: log.timestamp.toISOString()
        });
      }
    }
    
    // Filter by status if specified
    let filteredLogs = allLogs;
    if (input.status) {
      filteredLogs = allLogs.filter(log => log.status === input.status);
    }
    
    // Filter by time if specified
    if (input.since) {
      const sinceDate = new Date(input.since);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
    }
    
    // Sort by timestamp (most recent first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    const limitedLogs = filteredLogs.slice(0, input.limit);
    
    return {
      logs: limitedLogs,
      total: filteredLogs.length,
      hasMore: filteredLogs.length > input.limit,
      filters: {
        status: input.status,
        since: input.since,
        limit: input.limit
      },
      stats: {
        byStatus: {
          queued: allLogs.filter(l => l.status === 'queued').length,
          publishing: allLogs.filter(l => l.status === 'publishing').length,
          published: allLogs.filter(l => l.status === 'published').length,
          held: allLogs.filter(l => l.status === 'held').length,
          failed: allLogs.filter(l => l.status === 'failed').length
        },
        totalLogs: allLogs.length,
        uniqueContentItems: mockTraceLogs.size
      }
    };
  });

// Clear old trace logs (cleanup utility)
export const clearOldTraceLogsProcedure = publicProcedure
  .input(z.object({
    olderThanDays: z.number().min(1).max(365).default(30)
  }))
  .mutation(async ({ input }) => {
    const cutoffDate = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
    let clearedCount = 0;
    
    for (const [contentId, logs] of mockTraceLogs.entries()) {
      const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
      const removedCount = logs.length - filteredLogs.length;
      
      if (removedCount > 0) {
        mockTraceLogs.set(contentId, filteredLogs);
        clearedCount += removedCount;
      }
      
      // Remove empty entries
      if (filteredLogs.length === 0) {
        mockTraceLogs.delete(contentId);
      }
    }
    
    console.log(`[Trace] Cleared ${clearedCount} old trace logs older than ${input.olderThanDays} days`);
    
    return {
      success: true,
      message: `Cleared ${clearedCount} old trace logs`,
      clearedCount,
      cutoffDate: cutoffDate.toISOString(),
      remainingContentItems: mockTraceLogs.size
    };
  });