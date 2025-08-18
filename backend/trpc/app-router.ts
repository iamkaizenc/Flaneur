import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { 
  oauthStartProcedure, 
  oauthCallbackProcedure, 
  oauthRefreshProcedure, 
  oauthRevokeProcedure,
  oauthListAccountsProcedure,
  oauthFixProcedure
} from "./routes/oauth/route";
import { contentListProcedure, contentQueueProcedure, contentHoldProcedure, contentRetryProcedure, contentCreateProcedure, contentStatsProcedure } from "./routes/content/list/route";
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
import { sendNotificationProcedure, scheduleNotificationProcedure, getNotificationHistoryProcedure, sendFameProgressNotificationProcedure } from "./routes/notifications/route";
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
});

export type AppRouter = typeof appRouter;