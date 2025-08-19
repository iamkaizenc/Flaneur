import { z } from "zod";
import { publicProcedure } from "../../create-context";

// Platform schema
const PlatformSchema = z.enum([
  "x",
  "instagram", 
  "linkedin",
  "tiktok",
  "facebook",
  "telegram"
]);

// Job status types
const JobStatusSchema = z.enum(["pending", "running", "completed", "failed", "cancelled"]);

// Job schema
const JobSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  userId: z.string(),
  platform: PlatformSchema,
  runAt: z.date(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  status: JobStatusSchema,
  lastError: z.string().optional(),
  idempotencyKey: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type Job = z.infer<typeof JobSchema>;

// Input schemas
const runNowInputSchema = z.object({
  jobId: z.string(),
});

const rescheduleInputSchema = z.object({
  jobId: z.string(),
  runAt: z.date(),
});

const cancelInputSchema = z.object({
  jobId: z.string(),
});

const listJobsInputSchema = z.object({
  userId: z.string().optional(),
  status: JobStatusSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const queueJobInputSchema = z.object({
  contentId: z.string(),
  userId: z.string(),
  platform: PlatformSchema,
  runAt: z.date().optional(),
  idempotencyKey: z.string().optional(),
});

// Mock job storage
let mockJobs: Job[] = [];

// Utility functions
function generateIdempotencyKey(platform: string, contentHash: string, day: string): string {
  return `${platform}:${contentHash}:${day}`;
}

function isWithinPostingWindow(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 8 && hour <= 22; // 08:00-22:00
}

function checkPlanGates(userId: string, platform: string): { allowed: boolean; reason?: string } {
  // Mock plan checking - in production this would check user's actual plan
  // Simulate different users having different plans
  const userPlans: Record<string, "free" | "premium" | "platinum"> = {
    "user1": "free",
    "user2": "premium", 
    "user3": "platinum"
  };
  
  const mockUserPlan = userPlans[userId] || "premium";
  
  if (mockUserPlan === "free") {
    return { allowed: false, reason: "Free plan requires manual publishing" };
  }
  
  return { allowed: true };
}

function checkQuotas(userId: string, platform: string, date: Date): { allowed: boolean; reason?: string } {
  // Mock quota checking - in production this would check actual usage
  const dailyLimit = 10;
  const currentUsage = Math.floor(Math.random() * 8); // Mock current usage
  
  if (currentUsage >= dailyLimit) {
    return { allowed: false, reason: `Daily quota exceeded for ${platform} (${currentUsage}/${dailyLimit})` };
  }
  
  return { allowed: true };
}

async function executeJob(job: Job): Promise<{ success: boolean; error?: string }> {
  console.log(`[Scheduler] Executing job ${job.id} for content ${job.contentId}`);
  
  const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
  
  try {
    // Check posting window
    if (!isWithinPostingWindow(new Date())) {
      return { success: false, error: "Outside posting window (08:00-22:00)" };
    }
    
    // Check plan gates
    const planCheck = checkPlanGates(job.userId, job.platform);
    if (!planCheck.allowed) {
      return { success: false, error: planCheck.reason };
    }
    
    // Check quotas
    const quotaCheck = checkQuotas(job.userId, job.platform, job.runAt);
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.reason };
    }
    
    if (isDryRun) {
      console.log(`[Scheduler] DRY_RUN - Would publish content ${job.contentId} to ${job.platform}`);
      return { success: true };
    }
    
    // In production, this would call the actual platform adapter
    console.log(`[Scheduler] Publishing content ${job.contentId} to ${job.platform}`);
    
    // Simulate publishing with some failure rate
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      console.log(`[Scheduler] Successfully published content ${job.contentId}`);
      return { success: true };
    } else {
      throw new Error("Platform API error: Rate limit exceeded");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Scheduler] Job ${job.id} failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

function calculateBackoffDelay(attempt: number): number {
  // Exponential backoff: 1m, 5m, 15m, 1h
  const delays = [60000, 300000, 900000, 3600000]; // in milliseconds
  return delays[Math.min(attempt, delays.length - 1)];
}

// Worker function (would be called by cron)
export async function processJobs(): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log('[Scheduler] Processing pending jobs...');
  
  const now = new Date();
  const oneMinuteFromNow = new Date(now.getTime() + 60000);
  
  // Find jobs that should run now
  const jobsToRun = mockJobs.filter(job => 
    job.status === "pending" && 
    job.runAt <= oneMinuteFromNow &&
    job.runAt >= now
  );
  
  console.log(`[Scheduler] Found ${jobsToRun.length} jobs to process`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const job of jobsToRun) {
    job.status = "running";
    job.updatedAt = new Date();
    
    const result = await executeJob(job);
    
    if (result.success) {
      job.status = "completed";
      succeeded++;
      
      // Trigger notification event
      console.log(`[Scheduler] Job ${job.id} completed successfully`);
    } else {
      job.attempts++;
      job.lastError = result.error;
      
      if (job.attempts >= job.maxAttempts) {
        job.status = "failed";
        console.log(`[Scheduler] Job ${job.id} failed permanently after ${job.attempts} attempts`);
      } else {
        job.status = "pending";
        const backoffDelay = calculateBackoffDelay(job.attempts);
        job.runAt = new Date(now.getTime() + backoffDelay);
        console.log(`[Scheduler] Job ${job.id} will retry in ${backoffDelay / 1000}s (attempt ${job.attempts + 1}/${job.maxAttempts})`);
      }
      
      failed++;
    }
    
    job.updatedAt = new Date();
  }
  
  console.log(`[Scheduler] Processed ${jobsToRun.length} jobs: ${succeeded} succeeded, ${failed} failed`);
  
  return {
    processed: jobsToRun.length,
    succeeded,
    failed
  };
}

// tRPC procedures
export const queueJobProcedure = publicProcedure
  .input(queueJobInputSchema)
  .mutation(async ({ input }) => {
    console.log('[Scheduler] Queueing job:', input);
    
    const now = new Date();
    const runAt = input.runAt || now;
    
    // Generate idempotency key if not provided
    const contentHash = input.contentId.slice(-8); // Simple hash for demo
    const day = runAt.toISOString().split('T')[0];
    const idempotencyKey = input.idempotencyKey || generateIdempotencyKey(input.platform, contentHash, day);
    
    // Check for existing job with same idempotency key
    const existingJob = mockJobs.find(job => job.idempotencyKey === idempotencyKey);
    if (existingJob) {
      console.log(`[Scheduler] Job already exists with idempotency key: ${idempotencyKey}`);
      return {
        success: false,
        message: "Job already queued with this idempotency key",
        existingJobId: existingJob.id
      };
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      contentId: input.contentId,
      userId: input.userId,
      platform: input.platform,
      runAt,
      attempts: 0,
      maxAttempts: 3,
      status: "pending",
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };
    
    mockJobs.push(job);
    
    console.log(`[Scheduler] Job ${jobId} queued for ${runAt.toISOString()}`);
    
    return {
      success: true,
      job: {
        id: job.id,
        contentId: job.contentId,
        platform: job.platform,
        runAt: job.runAt.toISOString(),
        status: job.status,
        idempotencyKey: job.idempotencyKey
      },
      message: "Job queued successfully"
    };
  });

export const runNowProcedure = publicProcedure
  .input(runNowInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Running job ${input.jobId} immediately`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      return {
        success: false,
        message: "Job not found"
      };
    }
    
    if (job.status !== "pending") {
      return {
        success: false,
        message: `Job is ${job.status}, cannot run now`
      };
    }
    
    job.runAt = new Date();
    job.updatedAt = new Date();
    
    // Process this specific job
    job.status = "running";
    const result = await executeJob(job);
    
    if (result.success) {
      job.status = "completed";
    } else {
      job.attempts++;
      job.lastError = result.error;
      job.status = job.attempts >= job.maxAttempts ? "failed" : "pending";
    }
    
    job.updatedAt = new Date();
    
    return {
      success: result.success,
      job: {
        id: job.id,
        status: job.status,
        attempts: job.attempts,
        lastError: job.lastError
      },
      message: result.success ? "Job executed successfully" : `Job failed: ${result.error}`
    };
  });

export const rescheduleProcedure = publicProcedure
  .input(rescheduleInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Rescheduling job ${input.jobId} to ${input.runAt.toISOString()}`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      return {
        success: false,
        message: "Job not found"
      };
    }
    
    if (job.status === "completed") {
      return {
        success: false,
        message: "Cannot reschedule completed job"
      };
    }
    
    job.runAt = input.runAt;
    job.status = "pending";
    job.updatedAt = new Date();
    
    return {
      success: true,
      job: {
        id: job.id,
        runAt: job.runAt.toISOString(),
        status: job.status
      },
      message: "Job rescheduled successfully"
    };
  });

export const cancelJobProcedure = publicProcedure
  .input(cancelInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Cancelling job ${input.jobId}`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      return {
        success: false,
        message: "Job not found"
      };
    }
    
    if (job.status === "completed") {
      return {
        success: false,
        message: "Cannot cancel completed job"
      };
    }
    
    if (job.status === "running") {
      return {
        success: false,
        message: "Cannot cancel running job"
      };
    }
    
    job.status = "cancelled";
    job.updatedAt = new Date();
    
    return {
      success: true,
      job: {
        id: job.id,
        status: job.status
      },
      message: "Job cancelled successfully"
    };
  });

export const listJobsProcedure = publicProcedure
  .input(listJobsInputSchema)
  .query(async ({ input }) => {
    console.log('[Scheduler] Listing jobs:', input);
    
    let filteredJobs = mockJobs;
    
    if (input.userId) {
      filteredJobs = filteredJobs.filter(job => job.userId === input.userId);
    }
    
    if (input.status) {
      filteredJobs = filteredJobs.filter(job => job.status === input.status);
    }
    
    // Sort by runAt descending
    filteredJobs.sort((a, b) => b.runAt.getTime() - a.runAt.getTime());
    
    const total = filteredJobs.length;
    const jobs = filteredJobs
      .slice(input.offset, input.offset + input.limit)
      .map(job => ({
        id: job.id,
        contentId: job.contentId,
        platform: job.platform,
        runAt: job.runAt.toISOString(),
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        lastError: job.lastError,
        idempotencyKey: job.idempotencyKey,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString()
      }));
    
    return {
      jobs,
      total,
      hasMore: input.offset + input.limit < total
    };
  });

export const getJobStatsProcedure = publicProcedure
  .query(async () => {
    console.log('[Scheduler] Getting job statistics');
    
    const stats = {
      total: mockJobs.length,
      pending: mockJobs.filter(j => j.status === "pending").length,
      running: mockJobs.filter(j => j.status === "running").length,
      completed: mockJobs.filter(j => j.status === "completed").length,
      failed: mockJobs.filter(j => j.status === "failed").length,
      cancelled: mockJobs.filter(j => j.status === "cancelled").length,
    };
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const recentJobs = mockJobs.filter(j => j.updatedAt >= oneHourAgo);
    
    return {
      ...stats,
      recentActivity: {
        lastHour: recentJobs.length,
        successRate: recentJobs.length > 0 
          ? (recentJobs.filter(j => j.status === "completed").length / recentJobs.length) * 100 
          : 0
      }
    };
  });

export const workerTickProcedure = publicProcedure
  .mutation(async () => {
    console.log('[Scheduler] Manual worker tick triggered');
    
    const result = await processJobs();
    
    return {
      success: true,
      ...result,
      message: `Processed ${result.processed} jobs: ${result.succeeded} succeeded, ${result.failed} failed`
    };
  });