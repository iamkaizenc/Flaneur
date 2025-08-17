import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const contentListInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "queued", "published", "held"]).optional(),
  platform: z.string().optional(),
});

export const contentListProcedure = publicProcedure
  .input(contentListInputSchema)
  .query(async ({ input }) => {
    // Mock data for now
    const mockContent = [
      {
        id: "1",
        title: "The Art of Autonomous Marketing",
        platform: "LinkedIn",
        status: "published" as const,
        scheduledTime: "Today, 9:00 AM",
        publishedAt: new Date().toISOString(),
        preview: "Discover how Flâneur transforms social media strategy through intelligent automation...",
        publishAttempts: 1,
      },
      {
        id: "2",
        title: "Minimalist Content Strategy",
        platform: "X",
        status: "queued" as const,
        scheduledTime: "Today, 2:00 PM",
        publishedAt: null,
        preview: "5 principles of elegant social media presence with Flâneur's autonomous approach...",
        publishAttempts: 0,
      },
      {
        id: "3",
        title: "Behind the Algorithm",
        platform: "Instagram",
        status: "queued" as const,
        scheduledTime: "Today, 4:00 PM",
        publishedAt: null,
        preview: "An intimate look at Flâneur's sophisticated content creation process...",
        publishAttempts: 0,
      },
      {
        id: "4",
        title: "Weekly Insights",
        platform: "Telegram",
        status: "draft" as const,
        scheduledTime: "Tomorrow, 10:00 AM",
        publishedAt: null,
        preview: "This week's curated insights on autonomous social media management...",
        publishAttempts: 0,
      },
      {
        id: "5",
        title: "Platform Evolution",
        platform: "LinkedIn",
        status: "held" as const,
        scheduledTime: "Tomorrow, 12:00 PM",
        publishedAt: null,
        preview: "Announcing Flâneur's next-generation autonomous features...",
        publishAttempts: 2,
        error: "Content flagged by guardrail: contains banned keyword 'revolutionary'",
      },
    ];

    let filtered = mockContent;
    
    if (input.status) {
      filtered = filtered.filter(item => item.status === input.status);
    }
    
    if (input.platform) {
      filtered = filtered.filter(item => item.platform === input.platform);
    }
    
    return {
      items: filtered.slice(0, input.limit),
      total: filtered.length,
      hasMore: filtered.length > input.limit,
    };
  });

export const contentQueueProcedure = publicProcedure
  .input(z.object({ itemId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Queuing item ${input.itemId}`);
    return {
      success: true,
      message: `Content item ${input.itemId} queued for publishing`,
    };
  });

export const contentHoldProcedure = publicProcedure
  .input(z.object({ itemId: z.string(), reason: z.string().optional() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Holding item ${input.itemId}: ${input.reason || 'Manual hold'}`);
    return {
      success: true,
      message: `Content item ${input.itemId} held`,
    };
  });

export const contentRetryProcedure = publicProcedure
  .input(z.object({ itemId: z.string() }))
  .mutation(async ({ input }) => {
    console.log(`[Content] Retrying item ${input.itemId}`);
    return {
      success: true,
      message: `Content item ${input.itemId} queued for retry`,
    };
  });