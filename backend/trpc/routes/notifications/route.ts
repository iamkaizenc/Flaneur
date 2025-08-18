import { z } from "zod";
import { publicProcedure } from "../../create-context";

const sendNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.any()).optional(),
});

const scheduleNotificationInputSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  scheduledAt: z.date(),
  data: z.record(z.string(), z.any()).optional(),
});

const getNotificationHistoryInputSchema = z.object({
  userId: z.string(),
  limit: z.number().min(1).max(100).default(20),
});

export const sendNotificationProcedure = publicProcedure
  .input(sendNotificationInputSchema)
  .mutation(async ({ input }) => {
    console.log('Sending push notification:', input);

    // Mock notification sending
    // In production, this would integrate with Expo Push Notifications
    const notificationId = `notif_${Date.now()}`;
    
    // Simulate notification delivery
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      console.log(`Notification ${notificationId} sent successfully to user ${input.userId}`);
      return {
        success: true,
        notificationId,
        message: "Notification sent successfully",
      };
    } else {
      console.error(`Failed to send notification to user ${input.userId}`);
      return {
        success: false,
        notificationId: null,
        message: "Failed to send notification",
      };
    }
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