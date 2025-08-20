import { z } from "zod";
import { publicProcedure } from "../../create-context";
import crypto from "crypto";
import type { Webhook, NotificationHistory } from "../../../types/schemas";

// Event types for notifications
const NotificationEventSchema = z.enum([
  "content.queued",
  "content.published", 
  "content.held",
  "content.error",
  "insight.created",
  "fameScore.weeklyDelta"
]);

// Notification channel types
const NotificationChannelSchema = z.enum(["push", "email", "telegram", "webhook"]);

const sendNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  event: NotificationEventSchema.optional(),
  channels: z.array(NotificationChannelSchema).default(["push"]),
  data: z.record(z.string(), z.any()).optional(),
});

const subscribeInputSchema = z.object({
  userId: z.string(),
  pushToken: z.string().optional(),
  events: z.array(NotificationEventSchema),
  channels: z.array(NotificationChannelSchema),
});

const testNotificationInputSchema = z.object({
  userId: z.string(),
  channel: NotificationChannelSchema,
});

const webhookRegisterInputSchema = z.object({
  userId: z.string(),
  url: z.string().url(),
  secret: z.string().min(16),
  events: z.array(NotificationEventSchema),
  name: z.string().optional(),
});

const webhookListInputSchema = z.object({
  userId: z.string(),
});

const webhookDeleteInputSchema = z.object({
  userId: z.string(),
  webhookId: z.string(),
});

const scheduleNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  scheduledAt: z.date(),
  event: NotificationEventSchema.optional(),
  channels: z.array(NotificationChannelSchema).default(["push"]),
  data: z.record(z.string(), z.any()).optional(),
});

const getNotificationHistoryInputSchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(100).default(20),
});

// Mock storage for webhooks and subscriptions
let mockWebhooks: Webhook[] = [];
let mockNotificationHistory: NotificationHistory[] = [];

let mockSubscriptions: {
  userId: string;
  pushToken?: string;
  events: string[];
  channels: string[];
  createdAt: string;
}[] = [];

// Utility functions
function generateHMACSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  const sensitiveFields = ['accessToken', 'refreshToken', 'secret', 'password', 'email'];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }
  
  return masked;
}

async function sendWebhookNotification(webhook: Webhook, event: string, payload: any, attempt: number = 1): Promise<{ success: boolean; error?: string; signature?: string }> {
  const maxAttempts = 3;
  const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
  
  const webhookPayload = {
    event,
    userId: webhook.userId,
    data: maskSensitiveData(payload),
    timestamp: new Date().toISOString()
  };
  
  const payloadString = JSON.stringify(webhookPayload);
  const signature = generateHMACSignature(payloadString, webhook.secret);
  
  if (isDryRun) {
    console.log(`[Webhook] DRY_RUN - Would send to ${webhook.url}:`, { event, payload: maskSensitiveData(payload) });
    
    // Log success in dry run
    mockNotificationHistory.push({
      id: `webhook_${Date.now()}`,
      userId: webhook.userId,
      type: event,
      channel: 'webhook',
      recipient: webhook.url,
      body: payloadString,
      status: 'sent',
      createdAt: new Date(),
      sentAt: new Date()
    });
    
    return { success: true, signature };
  }
  
  try {
    // In production, this would make an actual HTTP request
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-flaneur-signature': signature,
        'User-Agent': 'Flaneur-Webhook/1.0'
      },
      body: payloadString
    });
    
    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}: ${response.statusText}`);
    }
    
    console.log(`[Webhook] Successfully sent to ${webhook.url}`);
    
    // Log success
    mockNotificationHistory.push({
      id: `webhook_${Date.now()}`,
      userId: webhook.userId,
      type: event,
      channel: 'webhook',
      recipient: webhook.url,
      body: payloadString,
      status: 'delivered',
      createdAt: new Date(),
      sentAt: new Date()
    });
    
    return { success: true, signature };
    
  } catch (error) {
    console.error(`[Webhook] Failed to send to ${webhook.url} (attempt ${attempt}/${maxAttempts}):`, error);
    
    if (attempt < maxAttempts) {
      // Exponential backoff: 1s, 5s, 15s
      const backoffMs = Math.pow(5, attempt) * 1000;
      console.log(`[Webhook] Retrying in ${backoffMs}ms`);
      
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      return sendWebhookNotification(webhook, event, payload, attempt + 1);
    } else {
      // Log final failure
      mockNotificationHistory.push({
        id: `webhook_${Date.now()}`,
        userId: webhook.userId,
        type: event,
        channel: 'webhook',
        recipient: webhook.url,
        body: payloadString,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date()
      });
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
  
  if (isDryRun) {
    console.log(`[Push] DRY_RUN - Would send push to user ${userId}:`, { title, body, data });
    return { success: true, dryRun: true };
  }
  
  // In production, this would use Expo Push Notifications
  console.log(`[Push] Sending to user ${userId}:`, { title, body, data });
  
  // Simulate push notification with batch retry
  const success = Math.random() > 0.05; // 95% success rate
  return { success, notificationId: `push_${Date.now()}` };
}

async function sendEmailNotification(userId: string, title: string, body: string, data?: any) {
  const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
  
  if (isDryRun) {
    console.log(`[Email] DRY_RUN - Would send email to user ${userId}:`, { title, body });
    return { success: true, dryRun: true };
  }
  
  // In production, this would use SMTP/Resend with i18n templates
  console.log(`[Email] Sending to user ${userId}:`, { title, body });
  
  const success = Math.random() > 0.02; // 98% success rate
  return { success, messageId: `email_${Date.now()}` };
}

async function sendTelegramNotification(userId: string, title: string, body: string, data?: any) {
  const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (isDryRun) {
    console.log(`[Telegram] DRY_RUN - Would send to user ${userId}:`, { title, body });
    return { success: true, dryRun: true };
  }
  
  if (!botToken) {
    console.warn('[Telegram] Bot token not configured');
    return { success: false, error: 'Bot token not configured' };
  }
  
  // In production, this would use Telegram Bot API
  const message = `🤖 *${title}*\n\n${body}`;
  console.log(`[Telegram] Sending to user ${userId}:`, message);
  
  const success = Math.random() > 0.03; // 97% success rate
  return { success, messageId: `telegram_${Date.now()}` };
}

async function publishNotificationEvent(event: string, payload: any) {
  console.log(`[Event] Publishing ${event}:`, maskSensitiveData(payload));
  
  // Find all subscriptions for this event
  const relevantSubscriptions = mockSubscriptions.filter(sub => 
    sub.events.includes(event)
  );
  
  const results = [];
  
  for (const subscription of relevantSubscriptions) {
    for (const channel of subscription.channels) {
      let result;
      
      switch (channel) {
        case "push":
          result = await sendPushNotification(
            subscription.userId, 
            payload.title || `Event: ${event}`,
            payload.body || JSON.stringify(payload),
            payload.data
          );
          break;
        case "email":
          result = await sendEmailNotification(
            subscription.userId,
            payload.title || `Event: ${event}`,
            payload.body || JSON.stringify(payload),
            payload.data
          );
          break;
        case "telegram":
          result = await sendTelegramNotification(
            subscription.userId,
            payload.title || `Event: ${event}`,
            payload.body || JSON.stringify(payload),
            payload.data
          );
          break;
      }
      
      results.push({ channel, userId: subscription.userId, ...result });
    }
  }
  
  // Send to webhooks
  const relevantWebhooks = mockWebhooks.filter(webhook => 
    webhook.events.includes(event) && webhook.active
  );
  
  for (const webhook of relevantWebhooks) {
    const result = await sendWebhookNotification(webhook, event, payload);
    results.push({ channel: "webhook", webhookId: webhook.id, ...result });
  }
  
  return results;
}

export const sendNotificationProcedure = publicProcedure
  .input(sendNotificationInputSchema)
  .mutation(async ({ input }) => {
    console.log('[Notifications] Sending notification:', input);

    const results = [];
    
    for (const channel of input.channels) {
      let result;
      
      switch (channel) {
        case "push":
          result = await sendPushNotification(input.userId, input.title, input.body, input.data);
          break;
        case "email":
          result = await sendEmailNotification(input.userId, input.title, input.body, input.data);
          break;
        case "telegram":
          result = await sendTelegramNotification(input.userId, input.title, input.body, input.data);
          break;
        case "webhook":
          // Webhooks are handled via event publishing
          result = { success: true, message: "Handled via event system" };
          break;
      }
      
      results.push({ channel, ...result });
    }
    
    // If this is an event-based notification, publish the event
    if (input.event) {
      const eventResults = await publishNotificationEvent(input.event, {
        title: input.title,
        body: input.body,
        data: input.data,
        userId: input.userId
      });
      results.push(...eventResults);
    }
    
    const allSuccessful = results.every(r => r && typeof r === 'object' && 'success' in r ? r.success : false);
    
    return {
      success: allSuccessful,
      results,
      message: allSuccessful ? "All notifications sent successfully" : "Some notifications failed",
    };
  });

export const subscribeNotificationsProcedure = publicProcedure
  .input(subscribeInputSchema)
  .mutation(async ({ input }) => {
    console.log('[Notifications] Subscribing user:', input);
    
    // Remove existing subscription for this user
    mockSubscriptions = mockSubscriptions.filter(sub => sub.userId !== input.userId);
    
    // Add new subscription
    mockSubscriptions.push({
      userId: input.userId,
      pushToken: input.pushToken,
      events: input.events,
      channels: input.channels,
      createdAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: "Notification subscription updated",
      subscription: {
        events: input.events,
        channels: input.channels
      }
    };
  });

export const testNotificationProcedure = publicProcedure
  .input(testNotificationInputSchema)
  .mutation(async ({ input }) => {
    console.log(`[Notifications] Testing ${input.channel} for user ${input.userId}`);
    
    const testTitle = "🧪 Test Notification";
    const testBody = "This is a test notification from Flâneur. If you received this, your notifications are working correctly!";
    
    let result;
    
    switch (input.channel) {
      case "push":
        result = await sendPushNotification(input.userId, testTitle, testBody, { test: true });
        break;
      case "email":
        result = await sendEmailNotification(input.userId, testTitle, testBody, { test: true });
        break;
      case "telegram":
        result = await sendTelegramNotification(input.userId, testTitle, testBody, { test: true });
        break;
      case "webhook":
        // Test all webhooks for this user
        const userWebhooks = mockWebhooks.filter(w => w.userId === input.userId);
        const webhookResults = [];
        
        for (const webhook of userWebhooks) {
          const webhookResult = await sendWebhookNotification(webhook, "content.published", {
            title: testTitle,
            body: testBody,
            test: true
          });
          webhookResults.push({ webhookId: webhook.id, ...webhookResult });
        }
        
        result = {
          success: webhookResults.every(r => r && typeof r === 'object' && 'success' in r ? r.success : false),
          webhooks: webhookResults
        };
        break;
    }
    
    return {
      success: result?.success || false,
      channel: input.channel,
      result,
      message: result?.success ? `Test ${input.channel} notification sent successfully` : `Failed to send test ${input.channel} notification`
    };
  });

export const webhookRegisterProcedure = publicProcedure
  .input(webhookRegisterInputSchema)
  .mutation(async ({ input }) => {
    console.log('[Webhooks] Registering webhook:', { url: input.url, events: input.events });
    
    const webhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      url: input.url,
      secret: input.secret,
      events: input.events,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockWebhooks.push(webhook);
    
    return {
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString()
      },
      message: "Webhook registered successfully"
    };
  });

export const webhookListProcedure = publicProcedure
  .input(webhookListInputSchema)
  .query(async ({ input }) => {
    console.log('[Webhooks] Listing webhooks for user:', input.userId);
    
    const userWebhooks = mockWebhooks
      .filter(w => w.userId === input.userId)
      .map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString()
      }));
    
    return {
      webhooks: userWebhooks,
      total: userWebhooks.length
    };
  });

export const webhookDeleteProcedure = publicProcedure
  .input(webhookDeleteInputSchema)
  .mutation(async ({ input }) => {
    console.log('[Webhooks] Deleting webhook:', input.webhookId);
    
    const initialLength = mockWebhooks.length;
    mockWebhooks = mockWebhooks.filter(w => !(w.id === input.webhookId && w.userId === input.userId));
    
    const deleted = mockWebhooks.length < initialLength;
    
    return {
      success: deleted,
      message: deleted ? "Webhook deleted successfully" : "Webhook not found"
    };
  });

export const scheduleNotificationProcedure = publicProcedure
  .input(scheduleNotificationInputSchema)
  .mutation(async ({ input }) => {
    console.log('Scheduling push notification:', input);

    const notificationId = `scheduled_${Date.now()}`;
    
    // Mock scheduling
    console.log(`Notification ${notificationId} scheduled for ${input.scheduledAt.toISOString()}`);
    
    return {
      success: true,
      notificationId,
      scheduledAt: input.scheduledAt.toISOString(),
      message: "Notification scheduled successfully",
    };
  });

export const getNotificationHistoryProcedure = publicProcedure
  .input(getNotificationHistoryInputSchema)
  .query(async ({ input }) => {
    console.log('Getting notification history for user:', input.userId);

    // Mock notification history
    const mockHistory = [
      {
        id: "notif_1",
        title: "🔥 Ünlüleşme Skorun 67 oldu!",
        body: "Sahne ışıkları sana dönüyor.",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "delivered" as const,
        type: "fame_progress" as const,
      },
      {
        id: "notif_2", 
        title: "📈 Haftalık Büyüme Raporu",
        body: "Bu hafta %24 engagement artışı kaydettiniz!",
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "delivered" as const,
        type: "weekly_report" as const,
      },
      {
        id: "notif_3",
        title: "⚡ Yeni İçerik Önerisi",
        body: "AI ajanınız sizin için yeni bir post hazırladı.",
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "delivered" as const,
        type: "content_suggestion" as const,
      },
    ];

    return {
      notifications: mockHistory.slice(0, input.limit),
      total: mockHistory.length,
      hasMore: mockHistory.length > input.limit,
    };
  });

export const sendFameProgressNotificationProcedure = publicProcedure
  .input(z.object({
    userId: z.string(),
    currentScore: z.number().min(0).max(100),
    previousScore: z.number().min(0).max(100),
  }))
  .mutation(async ({ input }) => {
    const improvement = input.currentScore - input.previousScore;
    
    if (improvement < 10) {
      return {
        success: false,
        message: "Score improvement not significant enough for notification",
      };
    }

    const title = "🔥 Ünlüleşme Skorun Yükseldi!";
    const body = `Ünlüleşme Skorun ${input.currentScore} oldu! Sahne ışıkları sana dönüyor.`;

    console.log('Sending fame progress notification:', { title, body, improvement });

    // Mock notification sending
    const notificationId = `fame_${Date.now()}`;
    
    return {
      success: true,
      notificationId,
      improvement,
      message: "Fame progress notification sent successfully",
    };
  });