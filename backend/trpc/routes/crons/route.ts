import { publicProcedure } from "../../create-context";
import { FameScoreService } from "../../../services/fame-score";

// Mock metrics data for demonstration
const mockMetrics = [
  {
    id: "1",
    accountId: "x_account_1",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    followers: 1250,
    impressions: 8500,
    engagements: 340,
    clicks: 85,
    ctr: 1.0,
    posts: 3,
    createdAt: new Date()
  },
  {
    id: "2", 
    accountId: "linkedin_account_1",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    followers: 890,
    impressions: 2100,
    engagements: 125,
    clicks: 42,
    ctr: 2.0,
    posts: 1,
    createdAt: new Date()
  }
];

const mockInsights = [
  {
    id: "insight_1",
    userId: "user_1",
    date: new Date(),
    findingType: "anomaly" as const,
    severity: "high" as const,
    title: "Engagement Spike Detected",
    description: "Your LinkedIn post received 3x more engagement than usual",
    suggestedAction: "Analyze this content style and replicate for future posts",
    pctChange: 285.7,
    usedMetrics: ["linkedin_account_1"],
    confidence: 0.92,
    createdAt: new Date()
  },
  {
    id: "insight_2", 
    userId: "user_1",
    date: new Date(),
    findingType: "opportunity" as const,
    severity: "medium" as const,
    title: "Optimal Posting Time Identified",
    description: "Posts between 2-4 PM show 40% higher engagement rates",
    suggestedAction: "Schedule more content during this window",
    pctChange: 40.2,
    usedMetrics: ["x_account_1", "linkedin_account_1"],
    confidence: 0.78,
    createdAt: new Date()
  }
];

// Cron trigger for 30-minute metrics refresh
export const cronMetricsRefreshProcedure = publicProcedure
  .mutation(async () => {
    console.log("[Cron] Starting 30-minute metrics refresh...");
    
    const startTime = Date.now();
    let refreshedAccounts = 0;
    let errors = 0;
    
    try {
      // Simulate fetching metrics from connected accounts
      const connectedAccounts = ["x_account_1", "linkedin_account_1", "instagram_account_1"];
      
      for (const accountId of connectedAccounts) {
        try {
          // Simulate API call with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          
          // Simulate rate limiting (10% chance)
          if (Math.random() < 0.1) {
            throw new Error(`Rate limit exceeded for ${accountId}`);
          }
          
          // Update mock metrics with fresh data
          const existingMetric = mockMetrics.find(m => m.accountId === accountId);
          if (existingMetric) {
            existingMetric.impressions += Math.floor(Math.random() * 100);
            existingMetric.engagements += Math.floor(Math.random() * 10);
            existingMetric.followers += Math.floor(Math.random() * 5);
          }
          
          refreshedAccounts++;
          console.log(`[Cron] Refreshed metrics for ${accountId}`);
          
        } catch (error) {
          console.error(`[Cron] Failed to refresh ${accountId}:`, error);
          errors++;
          
          // Exponential backoff for retries
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, errors)));
        }
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: "Metrics refresh completed",
        stats: {
          refreshedAccounts,
          errors,
          duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error("[Cron] Metrics refresh failed:", error);
      return {
        success: false,
        message: "Metrics refresh failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

// Cron trigger for 24-hour daily rollup
export const cronDailyRollupProcedure = publicProcedure
  .mutation(async () => {
    console.log("[Cron] Starting 24-hour daily rollup...");
    
    const startTime = Date.now();
    let processedAccounts = 0;
    let anomaliesDetected = 0;
    let fameNotificationsSent = 0;
    
    try {
      // Process daily metrics rollup
      for (const metric of mockMetrics) {
        // Calculate moving averages (7-day window)
        const historicalAvg = {
          impressions: metric.impressions * 0.85, // Simulate historical average
          engagements: metric.engagements * 0.90,
          followers: metric.followers * 0.98
        };
        
        // 3-sigma anomaly detection
        const impressionsDiff = Math.abs(metric.impressions - historicalAvg.impressions);
        const engagementsDiff = Math.abs(metric.engagements - historicalAvg.engagements);
        
        const impressionsStdDev = historicalAvg.impressions * 0.15;
        const engagementsStdDev = historicalAvg.engagements * 0.20;
        
        // Detect anomalies (3-sigma rule)
        if (impressionsDiff > 3 * impressionsStdDev || engagementsDiff > 3 * engagementsStdDev) {
          const pctChange = ((metric.impressions - historicalAvg.impressions) / historicalAvg.impressions) * 100;
          
          const anomalyInsight = {
            id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: "user_1",
            date: new Date(),
            findingType: "anomaly" as const,
            severity: "high" as const,
            title: pctChange > 0 ? "Performance Surge Detected" : "Performance Drop Alert",
            description: `${metric.accountId} shows ${Math.abs(pctChange).toFixed(1)}% ${pctChange > 0 ? 'increase' : 'decrease'} in engagement`,
            suggestedAction: pctChange > 0 
              ? "Analyze successful content patterns and replicate" 
              : "Review recent posts and adjust strategy",
            pctChange: Math.round(pctChange * 10) / 10,
            usedMetrics: [metric.accountId],
            confidence: 0.85 + Math.random() * 0.1,
            createdAt: new Date()
          };
          
          mockInsights.push(anomalyInsight);
          anomaliesDetected++;
          console.log(`[Cron] Anomaly detected for ${metric.accountId}: ${pctChange.toFixed(1)}%`);
        }
        
        // Calculate FameScore and check for progress notifications
        const engagementRate = (metric.engagements / metric.impressions) * 100;
        const followerGrowth = ((metric.followers - historicalAvg.followers) / historicalAvg.followers) * 100;
        
        const currentFameScore = FameScoreService.calculateFameScore({
          engagementRate,
          postFrequency: metric.posts * 7, // Convert daily to weekly
          followerGrowth
        });
        
        // Simulate previous week's score
        const previousFameScore = Math.max(0, currentFameScore.score - Math.floor(Math.random() * 20));
        
        if (FameScoreService.shouldSendProgressNotification(currentFameScore.score, previousFameScore)) {
          console.log(`[Cron] Sending fame progress notification: ${previousFameScore} -> ${currentFameScore.score}`);
          fameNotificationsSent++;
          
          // In production, this would call the notification service
          // await notificationService.send({
          //   userId: "user_1",
          //   title: "🔥 Ünlüleşme Skorun Yükseldi!",
          //   body: FameScoreService.getProgressNotificationText(currentFameScore.score)
          // });
        }
        
        processedAccounts++;
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: "Daily rollup completed",
        stats: {
          processedAccounts,
          anomaliesDetected,
          fameNotificationsSent,
          duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error("[Cron] Daily rollup failed:", error);
      return {
        success: false,
        message: "Daily rollup failed", 
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

// Manual trigger for both crons (dev utility)
export const cronTriggerAllProcedure = publicProcedure
  .mutation(async () => {
    console.log("[Cron] Manual trigger for all cron jobs...");
    
    try {
      // Simulate calling the procedures
      const metricsResult = { success: true, message: "Metrics refreshed", stats: { refreshedAccounts: 3, errors: 0, duration: 1500, timestamp: new Date().toISOString() } };
      const rollupResult = { success: true, message: "Rollup completed", stats: { processedAccounts: 3, anomaliesDetected: 1, duration: 800, timestamp: new Date().toISOString() } };
      
      return {
        success: true,
        message: "All cron jobs completed",
        results: {
          metricsRefresh: metricsResult,
          dailyRollup: rollupResult
        }
      };
      
    } catch (error) {
      console.error("[Cron] Manual trigger failed:", error);
      return {
        success: false,
        message: "Cron trigger failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });

// Get cron status and last run times
export const cronStatusProcedure = publicProcedure
  .query(async () => {
    return {
      metricsRefresh: {
        interval: "30 minutes",
        lastRun: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        status: "active"
      },
      dailyRollup: {
        interval: "24 hours", 
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        status: "active"
      },
      anomalyDetection: {
        enabled: true,
        threshold: "3-sigma",
        lastDetection: mockInsights.length > 0 ? mockInsights[mockInsights.length - 1].createdAt.toISOString() : null
      }
    };
  });

export { mockMetrics, mockInsights };