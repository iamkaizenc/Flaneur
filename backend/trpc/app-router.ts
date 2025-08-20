import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { 
  oauthStartProcedure, 
  oauthCallbackProcedure, 
  oauthRefreshProcedure, 
  oauthRevokeProcedure,
  oauthListAccountsProcedure,
  oauthFixProcedure
} from "./routes/oauth/route";
import { contentListProcedure, contentQueueProcedure, contentHoldProcedure, contentRetryProcedure, contentCreateProcedure, contentStatsProcedure, contentLogsProcedure } from "./routes/content/list/route";
import { insightsListProcedure } from "./routes/insights/list/route";
import { settingsGetProcedure, settingsUpdateProcedure, settingsConnectProcedure, settingsDisconnectProcedure, settingsTestNotificationProcedure, settingsGetHealthProcedure, settingsGetVersionProcedure } from "./routes/settings/route";
import { authRegisterProcedure, authLoginProcedure, authLogoutProcedure, authMeProcedure, authUpdateProfileProcedure, authUpdateEmailProcedure, authUpdatePasswordProcedure, authDeleteAccountProcedure } from "./routes/auth/route";
import { plansGetCurrentProcedure, plansListProcedure, plansUpgradeProcedure, plansDowngradeProcedure, plansGetUsageProcedure } from "./routes/plans/route";
import { cronMetricsRefreshProcedure, cronDailyRollupProcedure, cronTriggerAllProcedure, cronStatusProcedure } from "./routes/crons/route";
import { generateIdempotencyKeyProcedure, checkIdempotencyProcedure, storeIdempotentResultProcedure, publishWithIdempotencyProcedure, getIdempotencyStatsProcedure } from "./routes/idempotency/route";
import { getPostingWindowProcedure, updatePostingWindowProcedure, isWithinPostingWindowProcedure, getOptimalPostingTimesProcedure, batchConvertTimezoneProcedure } from "./routes/timezones/route";
import { getTraceLogsProcedure, addTraceLogProcedure, getTraceLogsSummaryProcedure, getSystemTraceLogsProcedure, clearOldTraceLogsProcedure } from "./routes/traces/route";
import { getAdsProcedure, trackAdImpressionProcedure, trackAdClickProcedure, getAdStatsProcedure, updateAdSettingsProcedure, getPaywallContentProcedure } from "./routes/ads/route";
import { fameScoreProcedure, fameScoreHistoryProcedure } from "./routes/fame-score/route";
import { 
  sendNotificationProcedure, 
  scheduleNotificationProcedure, 
  getNotificationHistoryProcedure, 
  sendFameProgressNotificationProcedure,
  subscribeNotificationsProcedure,
  testNotificationProcedure,
  webhookRegisterProcedure,
  webhookListProcedure,
  webhookDeleteProcedure
} from "./routes/notifications/route";
import { badgesProcedure, streakProcedure } from "./routes/badges/route";
import { weeklyChallengesProcedure, updateChallengeProcedure, claimBonusProcedure } from "./routes/challenges/route";
import { createOnboardingProcedure, getOnboardingProcedure } from "./routes/onboarding/route";
import { sponsorHubProcedure } from "./routes/sponsors/route";
import { 
  e2eConnectPlatformsProcedure, 
  e2ePublishPostsProcedure, 
  e2eIdempotencyTestProcedure, 
  e2eGrowthUpdatesProcedure, 
  e2eBadgeStreakCronProcedure, 
  e2eFullFlowProcedure 
} from "./routes/e2e-test/route";
import { 
  riskGetStatusProcedure, 
  riskCheckContentProcedure, 
  riskCreateAlertProcedure, 
  riskResolveAlertProcedure, 
  riskSimulateAlertProcedure 
} from "./routes/risk/route";
import { publishGenerateProcedure, publishBatchQueueProcedure, publishRegenerateMediaProcedure, publishGetMediaUsageProcedure, publishUploadMediaProcedure } from "./routes/publish/route";
import { mediaGenerateProcedure, mediaBatchGenerateProcedure, mediaGetCacheStatsProcedure, mediaClearCacheProcedure } from "./routes/media/route";
import { 
  queueJobProcedure,
  runNowProcedure,
  rescheduleProcedure,
  cancelJobProcedure,
  listJobsProcedure,
  getJobStatsProcedure,
  workerTickProcedure
} from "./routes/scheduler/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  oauth: createTRPCRouter({
    start: oauthStartProcedure,
    callback: oauthCallbackProcedure,
    refresh: oauthRefreshProcedure,
    revoke: oauthRevokeProcedure,
    listAccounts: oauthListAccountsProcedure,
    fix: oauthFixProcedure,
  }),
  content: createTRPCRouter({
    list: contentListProcedure,
    queue: contentQueueProcedure,
    hold: contentHoldProcedure,
    retry: contentRetryProcedure,
    create: contentCreateProcedure,
    stats: contentStatsProcedure,
    logs: contentLogsProcedure,
  }),
  insights: createTRPCRouter({
    list: insightsListProcedure,
  }),
  settings: createTRPCRouter({
    get: settingsGetProcedure,
    update: settingsUpdateProcedure,
    connect: settingsConnectProcedure,
    disconnect: settingsDisconnectProcedure,
    testNotification: settingsTestNotificationProcedure,
    health: settingsGetHealthProcedure,
    version: settingsGetVersionProcedure,
  }),
  auth: createTRPCRouter({
    register: authRegisterProcedure,
    login: authLoginProcedure,
    logout: authLogoutProcedure,
    me: authMeProcedure,
    updateProfile: authUpdateProfileProcedure,
    updateEmail: authUpdateEmailProcedure,
    updatePassword: authUpdatePasswordProcedure,
    deleteAccount: authDeleteAccountProcedure,
  }),
  plans: createTRPCRouter({
    getCurrent: plansGetCurrentProcedure,
    list: plansListProcedure,
    upgrade: plansUpgradeProcedure,
    downgrade: plansDowngradeProcedure,
    usage: plansGetUsageProcedure,
  }),
  crons: createTRPCRouter({
    metricsRefresh: cronMetricsRefreshProcedure,
    dailyRollup: cronDailyRollupProcedure,
    triggerAll: cronTriggerAllProcedure,
    status: cronStatusProcedure,
  }),
  idempotency: createTRPCRouter({
    generateKey: generateIdempotencyKeyProcedure,
    check: checkIdempotencyProcedure,
    store: storeIdempotentResultProcedure,
    publish: publishWithIdempotencyProcedure,
    stats: getIdempotencyStatsProcedure,
  }),
  timezones: createTRPCRouter({
    getPostingWindow: getPostingWindowProcedure,
    updatePostingWindow: updatePostingWindowProcedure,
    isWithinWindow: isWithinPostingWindowProcedure,
    getOptimalTimes: getOptimalPostingTimesProcedure,
    batchConvert: batchConvertTimezoneProcedure,
  }),
  traces: createTRPCRouter({
    get: getTraceLogsProcedure,
    add: addTraceLogProcedure,
    summary: getTraceLogsSummaryProcedure,
    system: getSystemTraceLogsProcedure,
    clearOld: clearOldTraceLogsProcedure,
  }),
  ads: createTRPCRouter({
    get: getAdsProcedure,
    trackImpression: trackAdImpressionProcedure,
    trackClick: trackAdClickProcedure,
    stats: getAdStatsProcedure,
    updateSettings: updateAdSettingsProcedure,
    getPaywall: getPaywallContentProcedure,
  }),
  fameScore: createTRPCRouter({
    get: fameScoreProcedure,
    history: fameScoreHistoryProcedure,
  }),
  notifications: createTRPCRouter({
    send: sendNotificationProcedure,
    schedule: scheduleNotificationProcedure,
    history: getNotificationHistoryProcedure,
    sendFameProgress: sendFameProgressNotificationProcedure,
    subscribe: subscribeNotificationsProcedure,
    test: testNotificationProcedure,
  }),
  webhooks: createTRPCRouter({
    register: webhookRegisterProcedure,
    list: webhookListProcedure,
    delete: webhookDeleteProcedure,
  }),
  badges: createTRPCRouter({
    list: badgesProcedure,
    streak: streakProcedure,
  }),
  challenges: createTRPCRouter({
    weekly: weeklyChallengesProcedure,
    update: updateChallengeProcedure,
    claimBonus: claimBonusProcedure,
  }),
  onboarding: createTRPCRouter({
    create: createOnboardingProcedure,
    get: getOnboardingProcedure,
  }),
  sponsors: createTRPCRouter({
    hub: sponsorHubProcedure,
  }),
  e2e: createTRPCRouter({
    connectPlatforms: e2eConnectPlatformsProcedure,
    publishPosts: e2ePublishPostsProcedure,
    idempotencyTest: e2eIdempotencyTestProcedure,
    growthUpdates: e2eGrowthUpdatesProcedure,
    badgeStreakCron: e2eBadgeStreakCronProcedure,
    fullFlow: e2eFullFlowProcedure,
  }),
  risk: createTRPCRouter({
    getStatus: riskGetStatusProcedure,
    checkContent: riskCheckContentProcedure,
    createAlert: riskCreateAlertProcedure,
    resolveAlert: riskResolveAlertProcedure,
    simulateAlert: riskSimulateAlertProcedure,
  }),
  publish: createTRPCRouter({
    generate: publishGenerateProcedure,
    batchQueue: publishBatchQueueProcedure,
    regenerateMedia: publishRegenerateMediaProcedure,
    getMediaUsage: publishGetMediaUsageProcedure,
    uploadMedia: publishUploadMediaProcedure,
  }),
  media: createTRPCRouter({
    generate: mediaGenerateProcedure,
    batchGenerate: mediaBatchGenerateProcedure,
    getCacheStats: mediaGetCacheStatsProcedure,
    clearCache: mediaClearCacheProcedure,
  }),
  scheduler: createTRPCRouter({
    queue: queueJobProcedure,
    runNow: runNowProcedure,
    reschedule: rescheduleProcedure,
    cancel: cancelJobProcedure,
    list: listJobsProcedure,
    stats: getJobStatsProcedure,
    workerTick: workerTickProcedure,
  }),
  ops: createTRPCRouter({
    health: publicProcedure.query(async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "Flâneur tRPC API",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        dryRun: process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1"
      };
    }),
    ready: publicProcedure.query(async () => {
      const checks = {
        trpc: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        dryRun: process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1",
        procedures: true
      };
      
      const allHealthy = Object.values(checks).every(check => check === true || typeof check === 'string');
      
      return {
        status: allHealthy ? "ready" : "not_ready",
        checks,
        overall: allHealthy
      };
    }),
    metrics: publicProcedure.query(async () => {
      return {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        trpc: {
          status: "operational",
          totalRouters: 20, // Static count for now
          totalProcedures: 100 // Static count for now
        }
      };
    })
  })
});

export type AppRouter = typeof appRouter;