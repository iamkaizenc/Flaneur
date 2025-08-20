import { z } from "zod";
import { publicProcedure } from "../../create-context";
import type { Job, ContentItem } from "../../../types/schemas";

// Mock job store - in production this would be a database
const mockJobs: Job[] = [];
const mockContent: ContentItem[] = [];

// Backoff calculation helper
function calculateBackoff(attempt: number): number {
  const backoffTimes = [60000, 300000, 900000, 3600000]; // 1m, 5m, 15m, 60m
  return backoffTimes[Math.min(attempt - 1, backoffTimes.length - 1)];
}

// Worker class for processing jobs
class JobWorker {
  private isRunning = false;
  public lastTick = new Date();
  
  async tick(): Promise<{ processed: number; errors: number; nextRun?: string }> {
    if (this.isRunning) {
      return { processed: 0, errors: 0, nextRun: "Worker already running" };
    }
    
    this.isRunning = true;
    this.lastTick = new Date();
    
    try {
      console.log('[Worker] Starting tick at', this.lastTick.toISOString());
      
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000);
      
      // Find jobs ready to run
      const readyJobs = mockJobs.filter(job => 
        job.status === 'pending' &&
        new Date(job.runAt) <= oneMinuteFromNow &&
        new Date(job.runAt) >= now
      );
      
      console.log(`[Worker] Found ${readyJobs.length} jobs ready to process`);
      
      let processed = 0;
      let errors = 0;
      
      for (const job of readyJobs) {
        try {
          await this.processJob(job);
          processed++;
        } catch (error) {
          console.error(`[Worker] Error processing job ${job.id}:`, error);
          errors++;
          
          // Update job with error
          job.status = 'failed';
          job.attempts = (job.attempts || 0) + 1;
          job.lastError = error instanceof Error ? error.message : String(error);
          job.updatedAt = new Date();
          
          // Schedule retry if under max attempts
          if (job.attempts < job.maxAttempts) {
            const backoffMs = calculateBackoff(job.attempts);
            job.nextRetryAt = new Date(Date.now() + backoffMs);
            job.status = 'pending';
            job.runAt = job.nextRetryAt;
            console.log(`[Worker] Scheduled retry for job ${job.id} in ${backoffMs}ms`);
          } else {
            console.log(`[Worker] Job ${job.id} exceeded max attempts (${job.maxAttempts})`);
          }
        }
      }
      
      const nextRun = new Date(Date.now() + 60000).toISOString();
      console.log(`[Worker] Tick completed. Processed: ${processed}, Errors: ${errors}, Next run: ${nextRun}`);
      
      return { processed, errors, nextRun };
      
    } finally {
      this.isRunning = false;
    }
  }
  
  private async processJob(job: Job): Promise<void> {
    console.log(`[Worker] Processing job ${job.id} for content ${job.contentId}`);
    
    // Update job status
    job.status = 'running';
    job.updatedAt = new Date();
    
    // Find the content item (mock)
    let contentItem = mockContent.find(c => c.id === job.contentId);
    if (!contentItem) {
      // Create mock content item for demo
      contentItem = {
        id: job.contentId,
        userId: job.userId,
        title: 'Mock Content',
        body: 'This is mock content for testing the worker system.',
        platform: 'x',
        type: 'text',
        status: 'queued',
        publishAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockContent.push(contentItem);
    }
    
    // Ensure contentItem is not undefined after this point
    if (!contentItem) {
      throw new Error(`Content item ${job.contentId} could not be created`);
    }
    
    // Check gates: plan, window, quota, guardrails
    const gateResult = await this.checkGates(contentItem, job);
    if (!gateResult.allowed) {
      // Hold the content
      contentItem.status = 'held' as any;
      contentItem.updatedAt = new Date();
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.lastError = gateResult.reason;
      
      // Log the hold
      await this.logPublishAction({
        contentId: job.contentId,
        jobId: job.id,
        platform: contentItem.platform,
        action: 'hold',
        status: 'held',
        reason: gateResult.reason,
        attempt: job.attempts + 1
      });
      
      return;
    }
    
    // Simulate publishing
    const startTime = Date.now();
    
    try {
      // Mock publisher call
      await this.mockPublish(contentItem);
      
      const latency = Date.now() - startTime;
      
      // Success
      contentItem.status = 'published' as any;
      contentItem.publishedAt = new Date();
      contentItem.publishAttempts = (contentItem.publishAttempts || 0) + 1;
      contentItem.updatedAt = new Date();
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      
      // Log the success
      await this.logPublishAction({
        contentId: job.contentId,
        jobId: job.id,
        platform: contentItem.platform,
        action: 'publish',
        status: 'published',
        attempt: job.attempts + 1,
        latency
      });
      
      console.log(`[Worker] Successfully published content ${job.contentId} (${latency}ms)`);
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Update content status
      contentItem.status = 'error' as any;
      contentItem.publishAttempts = (contentItem.publishAttempts || 0) + 1;
      contentItem.updatedAt = new Date();
      
      // Log the error
      await this.logPublishAction({
        contentId: job.contentId,
        jobId: job.id,
        platform: contentItem.platform,
        action: 'publish',
        status: 'error',
        reason: error instanceof Error ? error.message : String(error),
        attempt: job.attempts + 1,
        latency
      });
      
      throw error;
    }
  }
  
  private async checkGates(content: ContentItem, job: Job): Promise<{ allowed: boolean; reason?: string }> {
    // Check posting window
    const currentHour = new Date().getHours();
    const startHour = parseInt(process.env.PUBLISH_START_HOUR || '8');
    const endHour = parseInt(process.env.PUBLISH_END_HOUR || '22');
    
    if (currentHour < startHour || currentHour >= endHour) {
      return {
        allowed: false,
        reason: `Outside posting window. Current hour: ${currentHour}, allowed: ${startHour}-${endHour}`
      };
    }
    
    // Check daily quota (mock)
    const dailyLimits = { x: 10, instagram: 5, linkedin: 3, telegram: 10 };
    const limit = dailyLimits[content.platform as keyof typeof dailyLimits] || 5;
    const used = 2; // Mock usage
    
    if (used >= limit) {
      return {
        allowed: false,
        reason: `Daily quota exceeded for ${content.platform}: ${used}/${limit}`
      };
    }
    
    // Check guardrails
    const contentText = `${content.title} ${content.body}`.toLowerCase();
    const bannedWords = ['revolutionary', 'disruptive', 'game-changer'];
    
    for (const word of bannedWords) {
      if (contentText.includes(word.toLowerCase())) {
        return {
          allowed: false,
          reason: `Content contains banned word: '${word}'`
        };
      }
    }
    
    return { allowed: true };
  }
  
  private async mockPublish(content: ContentItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Mock publish failure - rate limit exceeded');
    }
    
    console.log(`[MockPublisher] Published to ${content.platform}: ${content.title}`);
  }
  
  private async logPublishAction(log: {
    contentId: string;
    jobId?: string;
    platform: string;
    action: string;
    status: string;
    reason?: string;
    attempt: number;
    latency?: number;
  }): Promise<void> {
    console.log('[Worker] Logging publish action:', log);
    // In production, this would write to publish_logs table
  }
}

const worker = new JobWorker();

// Queue a job
export const queueJobProcedure = publicProcedure
  .input(z.object({
    contentId: z.string(),
    runAt: z.string().datetime().optional(),
    priority: z.number().default(0)
  }))
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Queuing job for content ${input.contentId}`);
    
    const runAt = input.runAt ? new Date(input.runAt) : new Date();
    const idempotencyKey = `${input.contentId}:${runAt.toISOString()}:${Date.now()}`;
    
    // Check for existing job with same idempotency key
    const existingJob = mockJobs.find(j => j.idempotencyKey === idempotencyKey);
    if (existingJob) {
      return {
        success: true,
        message: 'Job already exists (idempotency)',
        jobId: existingJob.id,
        idempotencyKey
      };
    }
    
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId: input.contentId,
      userId: 'user-1', // Mock user
      runAt,
      attempts: 0,
      maxAttempts: 5,
      status: 'pending',
      idempotencyKey,
      priority: input.priority,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockJobs.push(job);
    
    return {
      success: true,
      message: 'Job queued successfully',
      jobId: job.id,
      runAt: job.runAt.toISOString(),
      idempotencyKey
    };
  });

// Run job immediately
export const runNowProcedure = publicProcedure
  .input(z.object({ jobId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Running job ${input.jobId} immediately`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      throw new Error(`Job ${input.jobId} not found`);
    }
    
    if (job.status !== 'pending') {
      throw new Error(`Job ${input.jobId} is not in pending status: ${job.status}`);
    }
    
    // Update run time to now
    job.runAt = new Date();
    job.updatedAt = new Date();
    
    return {
      success: true,
      message: 'Job scheduled to run immediately',
      jobId: job.id,
      runAt: job.runAt.toISOString()
    };
  });

// Reschedule job
export const rescheduleProcedure = publicProcedure
  .input(z.object({
    jobId: z.string(),
    runAt: z.string().datetime()
  }))
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Rescheduling job ${input.jobId} to ${input.runAt}`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      throw new Error(`Job ${input.jobId} not found`);
    }
    
    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new Error(`Cannot reschedule ${job.status} job`);
    }
    
    job.runAt = new Date(input.runAt);
    job.status = 'pending';
    job.updatedAt = new Date();
    
    return {
      success: true,
      message: 'Job rescheduled successfully',
      jobId: job.id,
      runAt: job.runAt.toISOString()
    };
  });

// Cancel job
export const cancelJobProcedure = publicProcedure
  .input(z.object({ jobId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Scheduler] Cancelling job ${input.jobId}`);
    
    const job = mockJobs.find(j => j.id === input.jobId);
    if (!job) {
      throw new Error(`Job ${input.jobId} not found`);
    }
    
    if (job.status === 'running') {
      throw new Error('Cannot cancel running job');
    }
    
    if (job.status === 'completed') {
      throw new Error('Cannot cancel completed job');
    }
    
    job.status = 'cancelled';
    job.updatedAt = new Date();
    
    return {
      success: true,
      message: 'Job cancelled successfully',
      jobId: job.id
    };
  });

// List jobs
export const listJobsProcedure = publicProcedure
  .input(z.object({
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
    limit: z.number().min(1).max(100).default(20)
  }))
  .query(async ({ input }) => {
    console.log('[Scheduler] Listing jobs with filters:', input);
    
    let filtered = [...mockJobs];
    
    if (input.status) {
      filtered = filtered.filter(job => job.status === input.status);
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const jobs = filtered.slice(0, input.limit);
    
    return {
      jobs: jobs.map(job => ({
        ...job,
        runAt: job.runAt.toISOString(),
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        nextRetryAt: job.nextRetryAt?.toISOString()
      })),
      total: filtered.length,
      hasMore: filtered.length > input.limit
    };
  });

// Get job statistics
export const getJobStatsProcedure = publicProcedure
  .query(async () => {
    const stats = {
      pending: mockJobs.filter(j => j.status === 'pending').length,
      running: mockJobs.filter(j => j.status === 'running').length,
      completed: mockJobs.filter(j => j.status === 'completed').length,
      failed: mockJobs.filter(j => j.status === 'failed').length,
      cancelled: mockJobs.filter(j => j.status === 'cancelled').length
    };
    
    const total = mockJobs.length;
    const successRate = total > 0 ? (stats.completed / total) * 100 : 0;
    
    return {
      stats,
      total,
      successRate: Math.round(successRate * 100) / 100,
      lastTick: worker.lastTick?.toISOString() || null
    };
  });

// Manual worker tick (for testing)
export const workerTickProcedure = publicProcedure
  .mutation(async () => {
    console.log('[Scheduler] Manual worker tick triggered');
    
    const result = await worker.tick();
    
    return {
      success: true,
      message: 'Worker tick completed',
      ...result
    };
  });

// Auto-start worker tick every minute (in production this would be a cron job)
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      await worker.tick();
    } catch (error) {
      console.error('[Scheduler] Worker tick error:', error);
    }
  }, 60000); // Every minute
  
  console.log('[Scheduler] Worker auto-tick started (every 60 seconds)');
}